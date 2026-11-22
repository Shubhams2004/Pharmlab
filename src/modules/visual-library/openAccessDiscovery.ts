import { DepartmentId, OpenAccessCandidate, VisualCategory } from './types';

export type DiscoverySourceFilter = 'all' | 'wikimedia' | 'openstax' | 'pubchem' | 'gbif';

function stripHtml(raw: string | undefined): string {
  if (!raw) return '';
  if (typeof DOMParser !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(raw, 'text/html');
      return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
    } catch {
      // fallback regex below
    }
  }
  return raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function classifyLicense(shortNameRaw: string): {
  license: string;
  isPermissive: boolean;
  warning?: string;
} {
  const clean = shortNameRaw.trim() || 'License unspecified';
  const lower = clean.toLowerCase();

  if (
    lower.includes('cc0') ||
    lower.includes('public domain') ||
    lower === 'pd' ||
    lower.includes('pd-')
  ) {
    return { license: clean, isPermissive: true };
  }

  if (
    (lower.includes('cc by') || lower.includes('cc-by')) &&
    !lower.includes('nc') &&
    !lower.includes('nd')
  ) {
    return { license: clean, isPermissive: true };
  }

  if (lower.includes('gfdl')) {
    return { license: clean, isPermissive: true };
  }

  if (lower.includes('nc') || lower.includes('nd')) {
    return {
      license: clean,
      isPermissive: false,
      warning: 'Restricted license (Non-Commercial or No-Derivatives). Verify terms before redistribution.'
    };
  }

  return {
    license: clean,
    isPermissive: false,
    warning: 'License terms must be verified on the original source page before reuse.'
  };
}

function inferCategoryAndDepartments(text: string): {
  category: VisualCategory;
  departments: DepartmentId[];
} {
  const lower = text.toLowerCase();
  if (/heart|cardiac|ventricle|aorta|neuron|skeleton|kidney|cell|organ|anatomy|skin/.test(lower)) {
    return { category: 'anatomy', departments: ['anatomy'] };
  }
  if (/microscop|stoma|trichome|histolog|erythrocyte|leukocyte|blood smear/.test(lower)) {
    return { category: 'microscopy', departments: ['anatomy', 'pharmacognosy'] };
  }
  if (/burette|titration|flask|beaker|apparatus|nessler|pipette|mortar/.test(lower)) {
    return { category: 'apparatus', departments: ['inorganic', 'general_pharmacy'] };
  }
  if (/plant|leaf|flower|botan|ocimum|curcuma|withania|ashwagandha|herbarium/.test(lower)) {
    return { category: 'botany', departments: ['pharmacognosy'] };
  }
  if (/molecule|structure|chemical|acid|oxide|benzene|drug/.test(lower)) {
    return { category: 'chemistry', departments: ['inorganic', 'general_pharmacy'] };
  }
  return { category: 'clinical', departments: ['general_pharmacy', 'anatomy'] };
}

async function searchWikimediaCommons(
  query: string,
  openStaxOnly: boolean,
  limit = 10
): Promise<OpenAccessCandidate[]> {
  const searchTerm = openStaxOnly
    ? `OpenStax ${query}`
    : `${query} filetype:bitmap|drawing`;

  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrnamespace: '6',
    gsrsearch: searchTerm,
    gsrlimit: String(limit),
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size|mime',
    iiurlwidth: '800',
    format: 'json',
    origin: '*'
  });

  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Wikimedia Commons returned status ${res.status}`);
  }

  const json = await res.json();
  const pages = Object.values(json?.query?.pages || {}) as Array<{
    pageid: number;
    title: string;
    imageinfo?: Array<{
      url: string;
      thumburl?: string;
      descriptionurl?: string;
      width?: number;
      height?: number;
      mime?: string;
      extmetadata?: Record<string, { value?: string }>;
    }>;
  }>;

  const candidates: OpenAccessCandidate[] = [];
  const allowedMimes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);

  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info || !info.url) continue;
    const mime = (info.mime || '').toLowerCase();
    if (!allowedMimes.has(mime)) continue;

    const meta = info.extmetadata || {};
    const rawTitle = stripHtml(meta.ObjectName?.value) || page.title.replace(/^File:/i, '').replace(/\.[^.]+$/, '').replace(/_/g, ' ');
    const description =
      stripHtml(meta.ImageDescription?.value).slice(0, 260) ||
      'Open-access scientific figure from Wikimedia Commons.';
    const creator = stripHtml(meta.Artist?.value).slice(0, 120) || 'Wikimedia Commons Contributor';
    const rawLicense = stripHtml(meta.LicenseShortName?.value) || 'Check source license';
    const licenseUrl = meta.LicenseUrl?.value;
    const credit = stripHtml(meta.Credit?.value);

    const { license, isPermissive, warning } = classifyLicense(rawLicense);
    const inferred = inferCategoryAndDepartments(`${rawTitle} ${description} ${query}`);
    const isOpenStax =
      openStaxOnly ||
      `${rawTitle} ${description} ${creator} ${credit}`.toLowerCase().includes('openstax');

    candidates.push({
      id: `wm_${page.pageid}`,
      repository: isOpenStax ? 'OpenStax (Wikimedia)' : 'Wikimedia Commons',
      title: rawTitle,
      description,
      previewUrl: info.thumburl || info.url,
      fullUrl: info.url,
      sourceUrl: info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
      creator,
      license,
      licenseUrl,
      attribution: `${rawTitle} by ${creator} (${license}) via ${isOpenStax ? 'OpenStax / Wikimedia Commons' : 'Wikimedia Commons'}`,
      isPermissiveLicense: isPermissive,
      licenseWarning: warning,
      mimeType: mime,
      width: info.width,
      height: info.height,
      suggestedCategory: inferred.category,
      suggestedDepartments: inferred.departments
    });
  }

  return candidates;
}

async function searchPubChemCompound(query: string): Promise<OpenAccessCandidate[]> {
  const cleanName = query.trim();
  if (cleanName.length < 2) return [];

  const encoded = encodeURIComponent(cleanName);
  const propUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encoded}/property/IUPACName,MolecularFormula,MolecularWeight/JSON`;

  const res = await fetch(propUrl);
  if (!res.ok) return [];

  const json = await res.json();
  const prop = json?.PropertyTable?.Properties?.[0] as
    | {
        CID: number;
        IUPACName?: string;
        MolecularFormula?: string;
        MolecularWeight?: string;
      }
    | undefined;

  if (!prop?.CID) return [];

  const imageUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${prop.CID}/PNG?image_size=large`;
  const sourceUrl = `https://pubchem.ncbi.nlm.nih.gov/compound/${prop.CID}`;

  return [
    {
      id: `pubchem_${prop.CID}`,
      repository: 'PubChem (NIH)',
      title: `${cleanName} — 2D Chemical Structure (CID ${prop.CID})`,
      description: `Formula: ${prop.MolecularFormula || 'N/A'} · MW: ${prop.MolecularWeight || 'N/A'} g/mol · IUPAC: ${prop.IUPACName || 'N/A'}`,
      previewUrl: imageUrl,
      fullUrl: imageUrl,
      sourceUrl,
      creator: 'National Center for Biotechnology Information (NCBI / NIH)',
      license: 'Public Domain (US Government Work)',
      attribution: `PubChem Compound Summary CID ${prop.CID}, National Library of Medicine (Public Domain)`,
      isPermissiveLicense: true,
      mimeType: 'image/png',
      width: 600,
      height: 600,
      suggestedCategory: 'chemistry',
      suggestedDepartments: ['inorganic', 'general_pharmacy', 'pharmacognosy']
    }
  ];
}

async function searchGbifBotanical(query: string, limit = 6): Promise<OpenAccessCandidate[]> {
  const params = new URLSearchParams({
    mediaType: 'StillImage',
    q: query.trim(),
    limit: String(limit)
  });

  const res = await fetch(`https://api.gbif.org/v1/occurrence/search?${params.toString()}`);
  if (!res.ok) return [];

  const json = await res.json();
  const records = (json?.results || []) as Array<{
    key: number;
    scientificName?: string;
    vernacularName?: string;
    family?: string;
    license?: string;
    rightsHolder?: string;
    recordedBy?: string;
    media?: Array<{
      type?: string;
      format?: string;
      identifier?: string;
      creator?: string;
      license?: string;
      rightsHolder?: string;
    }>;
  }>;

  const candidates: OpenAccessCandidate[] = [];

  for (const rec of records) {
    const media = rec.media?.find(
      (m) => m.identifier && (!m.type || m.type === 'StillImage')
    );
    if (!media?.identifier) continue;

    const rawLicense = media.license || rec.license || 'CC BY 4.0';
    const { license, isPermissive, warning } = classifyLicense(
      rawLicense.replace('http://creativecommons.org/licenses/', 'CC ').replace('/4.0/', ' 4.0')
    );
    const creator =
      media.creator || media.rightsHolder || rec.rightsHolder || rec.recordedBy || 'GBIF Observer';
    const title = rec.scientificName || rec.vernacularName || query;

    candidates.push({
      id: `gbif_${rec.key}`,
      repository: 'GBIF Botanical',
      title,
      description: `Botanical / herbarium specimen${rec.family ? ` (${rec.family})` : ''} indexed via Global Biodiversity Information Facility.`,
      previewUrl: media.identifier,
      fullUrl: media.identifier,
      sourceUrl: `https://www.gbif.org/occurrence/${rec.key}`,
      creator,
      license,
      attribution: `${title} by ${creator} (${license}) via GBIF Occurrence #${rec.key}`,
      isPermissiveLicense: isPermissive,
      licenseWarning: warning,
      mimeType: media.format || 'image/jpeg',
      suggestedCategory: 'botany',
      suggestedDepartments: ['pharmacognosy']
    });
  }

  return candidates;
}

export const DISCOVERY_SUGGESTIONS = [
  'Human heart anatomy',
  'OpenStax nephron kidney',
  'Diacytic stomata leaf epidermis',
  'Volumetric burette titration',
  'Neubauer hemocytometer grid',
  'Ocimum tenuiflorum',
  'Aspirin',
  'Curcumin'
];

export async function discoverOpenAccessImages(
  query: string,
  source: DiscoverySourceFilter
): Promise<{ candidates: OpenAccessCandidate[]; warnings: string[] }> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { candidates: [], warnings: [] };
  }

  const warnings: string[] = [];
  const tasks: Array<Promise<OpenAccessCandidate[]>> = [];

  if (source === 'all' || source === 'wikimedia') {
    tasks.push(
      searchWikimediaCommons(trimmed, false, source === 'wikimedia' ? 12 : 8).catch((e) => {
        warnings.push(`Wikimedia Commons: ${e instanceof Error ? e.message : 'unavailable'}`);
        return [];
      })
    );
  }

  if (source === 'openstax' || source === 'all') {
    tasks.push(
      searchWikimediaCommons(trimmed, true, source === 'openstax' ? 12 : 4).catch((e) => {
        warnings.push(`OpenStax repository: ${e instanceof Error ? e.message : 'unavailable'}`);
        return [];
      })
    );
  }

  if (source === 'pubchem' || (source === 'all' && !/\s{2,}/.test(trimmed))) {
    tasks.push(
      searchPubChemCompound(trimmed).catch(() => [])
    );
  }

  if (source === 'gbif') {
    tasks.push(
      searchGbifBotanical(trimmed, 8).catch((e) => {
        warnings.push(`GBIF repository: ${e instanceof Error ? e.message : 'unavailable'}`);
        return [];
      })
    );
  }

  const settled = await Promise.all(tasks);
  const seenUrls = new Set<string>();
  const combined: OpenAccessCandidate[] = [];

  for (const list of settled) {
    for (const item of list) {
      if (seenUrls.has(item.fullUrl)) continue;
      seenUrls.add(item.fullUrl);
      combined.push(item);
    }
  }

  return { candidates: combined, warnings };
}
