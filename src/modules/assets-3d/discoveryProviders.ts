import { sanitizeHttpUrl } from '../resource-hub/utils';
import {
  detectModelFormatFromName,
  Discovered3DCandidate,
  formatBytes,
  ModelFormat,
  Provider3DId
} from './types';

export interface Provider3DMeta {
  id: Provider3DId;
  name: string;
  shortName: string;
  websiteUrl: string;
  policySummary: string;
  supportsLiveApi: boolean;
}

export const PROVIDER_3D_REGISTRY: Provider3DMeta[] = [
  {
    id: 'human_atlas_3d',
    name: 'NIH / HuBMAP Human Reference Atlas',
    shortName: 'Human Atlas (GLB)',
    websiteUrl: 'https://humanatlas.io',
    policySummary:
      '81 official Visible Human anatomical organ GLB models (CC-BY 4.0). 1-click direct import into PharmaLab.',
    supportsLiveApi: true
  },
  {
    id: 'pubchem_3d',
    name: 'NCBI PubChem 3D Conformers',
    shortName: 'PubChem 3D',
    websiteUrl: 'https://pubchem.ncbi.nlm.nih.gov',
    policySummary:
      'CORS-open NIH chemical database. 1-click import of real 3D drug molecule conformers (.sdf) & structural previews.',
    supportsLiveApi: true
  },
  {
    id: 'rcsb_pdb',
    name: 'RCSB Protein Data Bank (PDB)',
    shortName: 'RCSB PDB',
    websiteUrl: 'https://www.rcsb.org',
    policySummary:
      'CORS-open macromolecular 3D archive. 1-click import of real enzymes, receptors, proteins & DNA (.pdb).',
    supportsLiveApi: true
  },
  {
    id: 'wikimedia_3d',
    name: 'Wikimedia Commons 3D Archive',
    shortName: 'Wikimedia 3D',
    websiteUrl: 'https://commons.wikimedia.org',
    policySummary:
      'CORS-open repository (BodyParts3D, Visible Human, scientific STL/OBJ/PLY) with 1-click direct import <= 35 MB.',
    supportsLiveApi: true
  },
  {
    id: 'smithsonian_3d',
    name: 'Smithsonian Open Access 3D (CC0)',
    shortName: 'Smithsonian 3D',
    websiteUrl: 'https://3d.si.edu',
    policySummary:
      'CC0 museum & anatomical specimens. Direct GLB resolved via 3d-api.si.edu when available (public DEMO_KEY rate-limited).',
    supportsLiveApi: true
  },
  {
    id: 'sketchfab_public',
    name: 'Sketchfab Public Downloadable 3D Search',
    shortName: 'Sketchfab',
    websiteUrl: 'https://sketchfab.com',
    policySummary:
      'Public v3 catalog search. Download .GLB or .ZIP while signed in on Sketchfab, then drop the .ZIP/.GLB into PharmaLab.',
    supportsLiveApi: true
  },
  {
    id: 'nih_3d_portal',
    name: 'NIH 3D Biomedical & Molecular Exchange',
    shortName: 'NIH 3D',
    websiteUrl: 'https://3d.nih.gov',
    policySummary:
      'External portal launcher (no public unauthenticated REST search API). Download .ZIP/.STL/.GLB from 3d.nih.gov and upload locally.',
    supportsLiveApi: false
  }
];

function stripHtml(raw: string | undefined): string {
  if (!raw) return '';
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

const MAX_DIRECT_IMPORT_BYTES = 35 * 1024 * 1024;

// ==================== 1. NIH / HuBMAP HUMAN REFERENCE ATLAS (GLB) ====================

interface HraOrganRecord {
  '@id'?: string;
  label?: string;
  sex?: string;
  representation_of?: string;
  reference_organ?: string;
  creation_date?: string;
  x_dimension?: number;
  y_dimension?: number;
  z_dimension?: number;
  object?: {
    file?: string;
    file_format?: string;
    file_subpath?: string;
  };
}

let cachedHraOrgans: HraOrganRecord[] | null = null;

const HRA_SYNONYMS: Record<string, string[]> = {
  cardiac: ['heart'],
  cardiovascular: ['heart', 'blood vasculature'],
  vessel: ['blood vasculature'],
  artery: ['blood vasculature'],
  vein: ['blood vasculature'],
  renal: ['kidney', 'renal pelvis', 'ureter', 'urinary bladder'],
  nephron: ['kidney'],
  urinary: ['kidney', 'ureter', 'urinary bladder'],
  hepatic: ['liver'],
  pulmonary: ['lung', 'bronchus', 'trachea', 'larynx'],
  respiratory: ['lung', 'bronchus', 'trachea', 'larynx'],
  cerebral: ['brain', 'spinal cord'],
  neural: ['brain', 'spinal cord'],
  nervous: ['brain', 'spinal cord'],
  ocular: ['eye'],
  digestive: ['mouth', 'small intestine', 'large intestine', 'liver', 'pancreas'],
  gi: ['small intestine', 'large intestine', 'mouth'],
  gut: ['small intestine', 'large intestine'],
  colon: ['large intestine'],
  immune: ['lymph node', 'spleen', 'thymus', 'palatine tonsil'],
  lymphatic: ['lymph node', 'spleen', 'thymus', 'palatine tonsil'],
  reproductive: ['uterus', 'ovary', 'fallopian', 'prostate', 'placenta', 'mammary'],
  skeletal: ['pelvis', 'sternum', 'manubrium', 'knee', 'intervertebral'],
  bone: ['pelvis', 'sternum', 'manubrium', 'knee', 'intervertebral'],
  anatomy: ['heart', 'brain', 'kidney', 'liver', 'lung', 'spleen', 'pancreas']
};

async function searchHumanAtlas3D(
  query: string,
  signal?: AbortSignal
): Promise<{ candidates: Discovered3DCandidate[]; warning?: string }> {
  if (!cachedHraOrgans) {
    const res = await fetch('https://apps.humanatlas.io/api/v1/reference-organs', { signal });
    if (!res.ok) {
      throw new Error(`Human Reference Atlas returned HTTP ${res.status}.`);
    }
    const json = await res.json();
    cachedHraOrgans = Array.isArray(json) ? json : [];
  }

  const clean = query.trim().toLowerCase();
  const tokens = clean.split(/\s+/).filter((t) => t.length >= 2);
  const expandedTerms = new Set<string>(tokens);
  for (const t of tokens) {
    const syns = HRA_SYNONYMS[t];
    if (syns) syns.forEach((s) => expandedTerms.add(s));
  }

  const scored = cachedHraOrgans
    .filter((o) => o.object?.file && /\.glb(\?|$)/i.test(o.object.file))
    .map((o) => {
      const label = (o.label || '').toLowerCase();
      const subpath = (o.object?.file_subpath || '').toLowerCase().replace(/_/g, ' ');
      const sex = (o.sex || '').toLowerCase();
      const hay = `${label} ${subpath} ${sex}`;
      let score = 0;
      if (label === clean) score += 10;
      if (hay.includes(clean)) score += 6;
      for (const term of expandedTerms) {
        if (label.includes(term)) score += 4;
        else if (hay.includes(term)) score += 2;
      }
      return { organ: o, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const candidates: Discovered3DCandidate[] = scored.map(({ organ }, idx) => {
    const rawLabel = organ.label || 'Anatomical Organ';
    const niceLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
    const sexLabel = organ.sex ? ` (${organ.sex})` : '';
    const glbUrl = organ.object!.file!;
    const dims =
      organ.x_dimension && organ.y_dimension && organ.z_dimension
        ? ` Dimensions: ${organ.x_dimension.toFixed(0)} × ${organ.y_dimension.toFixed(
            0
          )} × ${organ.z_dimension.toFixed(0)} mm.`
        : '';

    return {
      id: `hra_${idx}_${(organ['@id'] || glbUrl).replace(/[^a-zA-Z0-9]/g, '').slice(-16)}`,
      providerId: 'human_atlas_3d',
      providerName: 'NIH / HuBMAP Human Reference Atlas',
      title: `Human ${niceLabel}${sexLabel}`,
      description: `Official Visible Human 3D anatomical reference organ.${dims} Self-contained multi-mesh GLB ready for 1-click import.`,
      creator: 'HuBMAP / Indiana University / NIH Visible Human',
      sourceUrl: sanitizeHttpUrl(organ.reference_organ || organ['@id']) || 'https://humanatlas.io',
      directFileUrl: glbUrl,
      format: 'glb',
      license: 'CC BY 4.0',
      attribution: 'Human Reference Atlas (HuBMAP Consortium, CC BY 4.0)',
      usageRestrictions:
        'CC BY 4.0: Free for academic and educational use with attribution to the HuBMAP Human Reference Atlas.',
      downloadPolicy: 'direct_cors',
      downloadNotice: '1-click direct GLB import supported (CORS-open NIH/HuBMAP CDN).',
      suggestedCategory: 'organ',
      suggestedDepartment: 'anatomy',
      tags: ['Human Reference Atlas', 'GLB', 'Anatomy', organ.sex || 'Reference Organ'].filter(
        Boolean
      )
    };
  });

  return { candidates };
}

// ==================== 2. NCBI PUBCHEM 3D MOLECULES (.SDF) ====================

async function searchPubChem3D(
  query: string,
  signal?: AbortSignal
): Promise<{ candidates: Discovered3DCandidate[]; warning?: string }> {
  const clean = query.trim();
  const namesToTry = new Set<string>([clean]);

  try {
    const autoRes = await fetch(
      `https://pubchem.ncbi.nlm.nih.gov/rest/autocomplete/compound/${encodeURIComponent(
        clean
      )}/json?limit=5`,
      { signal }
    );
    if (autoRes.ok) {
      const autoJson = await autoRes.json();
      const terms: string[] = autoJson?.dictionary_terms?.compound || [];
      terms.slice(0, 5).forEach((t) => namesToTry.add(t));
    }
  } catch {
    // fallback to direct name lookup
  }

  const cidsSeen = new Set<number>();
  const candidates: Discovered3DCandidate[] = [];

  await Promise.all(
    Array.from(namesToTry)
      .slice(0, 5)
      .map(async (term) => {
        try {
          const propUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(
            term
          )}/property/Title,MolecularFormula,MolecularWeight,IUPACName/JSON`;
          const res = await fetch(propUrl, { signal });
          if (!res.ok) return;
          const json = await res.json();
          const props = json?.PropertyTable?.Properties || [];
          for (const p of props.slice(0, 2) as Array<{
            CID?: number;
            Title?: string;
            MolecularFormula?: string;
            MolecularWeight?: string;
            IUPACName?: string;
          }>) {
            if (!p.CID || cidsSeen.has(p.CID)) continue;
            cidsSeen.add(p.CID);
            const title = p.Title || term;
            candidates.push({
              id: `pubchem_${p.CID}`,
              providerId: 'pubchem_3d',
              providerName: 'NCBI PubChem 3D',
              title: `${title} (${p.MolecularFormula || '3D Conformer'})`,
              description: `${p.IUPACName ? `IUPAC: ${p.IUPACName}. ` : ''}${
                p.MolecularWeight ? `MW: ${p.MolecularWeight} g/mol.` : ''
              } Real 3D conformer coordinates from NCBI PubChem.`,
              previewUrl: `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${p.CID}/PNG?image_size=300x300`,
              creator: `PubChem CID ${p.CID} (NCBI/NIH)`,
              sourceUrl: `https://pubchem.ncbi.nlm.nih.gov/compound/${p.CID}`,
              directFileUrl: `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${p.CID}/SDF?record_type=3d`,
              format: 'sdf',
              license: 'Public Domain (NCBI / U.S. Government)',
              attribution: `NCBI PubChem Compound CID ${p.CID}`,
              usageRestrictions:
                'Public domain chemical data. Note: very large polymers or inorganic salts without 3D conformers may not have a 3D SDF record.',
              downloadPolicy: 'direct_cors',
              downloadNotice:
                '1-click direct 3D conformer (.SDF) import with interactive CPK atoms & bonds.',
              suggestedCategory: 'molecule',
              suggestedDepartment: 'pharmaceutical_chemistry',
              tags: ['PubChem 3D', 'SDF', p.MolecularFormula || 'Molecule'].filter(Boolean)
            });
          }
        } catch {
          // ignore individual miss
        }
      })
  );

  return { candidates: candidates.slice(0, 8) };
}

// ==================== 3. RCSB PROTEIN DATA BANK (.PDB) ====================

async function searchRcsbPdb3D(
  query: string,
  signal?: AbortSignal
): Promise<{ candidates: Discovered3DCandidate[]; warning?: string }> {
  const clean = query.trim();
  const searchPayload = {
    query: {
      type: 'terminal',
      service: 'full_text',
      parameters: { value: clean }
    },
    return_type: 'entry',
    request_options: {
      paginate: { start: 0, rows: 5 }
    }
  };

  const searchRes = await fetch(
    `https://search.rcsb.org/rcsbsearch/v2/query?json=${encodeURIComponent(
      JSON.stringify(searchPayload)
    )}`,
    { signal }
  );

  if (searchRes.status === 204) {
    return { candidates: [] };
  }
  if (!searchRes.ok) {
    throw new Error(`RCSB PDB search returned HTTP ${searchRes.status}.`);
  }

  const searchJson = await searchRes.json();
  const hits: Array<{ identifier?: string }> = Array.isArray(searchJson?.result_set)
    ? searchJson.result_set
    : [];

  const candidates: Discovered3DCandidate[] = [];
  await Promise.all(
    hits.slice(0, 5).map(async (hit) => {
      const pdbId = hit.identifier?.trim();
      if (!pdbId) return;
      try {
        const entryRes = await fetch(`https://data.rcsb.org/rest/v1/core/entry/${pdbId}`, {
          signal
        });
        if (!entryRes.ok) return;
        const entry = await entryRes.json();
        const title = entry?.struct?.title || `PDB Structure ${pdbId}`;
        const method = entry?.exptl?.[0]?.method || 'Experimental Structure';
        const resAng = entry?.rcsb_entry_info?.resolution_combined?.[0];
        const authors = Array.isArray(entry?.audit_author)
          ? entry.audit_author
              .slice(0, 2)
              .map((a: { name?: string }) => a.name)
              .filter(Boolean)
              .join(', ')
          : 'RCSB PDB Contributors';

        candidates.push({
          id: `rcsb_${pdbId}`,
          providerId: 'rcsb_pdb',
          providerName: 'RCSB Protein Data Bank',
          title: `${pdbId}: ${title}`,
          description: `${method}${resAng ? ` · ${resAng.toFixed(2)} Å resolution` : ''}. Macromolecular 3D atomic coordinate file.`,
          creator: authors || `RCSB PDB (${pdbId})`,
          sourceUrl: `https://www.rcsb.org/structure/${pdbId}`,
          directFileUrl: `https://files.rcsb.org/download/${pdbId}.pdb`,
          format: 'pdb',
          license: 'CC0 1.0 Public Domain (PDB Archive)',
          attribution: `RCSB Protein Data Bank ID ${pdbId}`,
          usageRestrictions: 'CC0 open macromolecular structural biology data.',
          downloadPolicy: 'direct_cors',
          downloadNotice: '1-click direct .PDB macromolecule import (CORS-open RCSB archive).',
          suggestedCategory: 'molecule',
          suggestedDepartment: 'biotechnology',
          tags: ['RCSB PDB', 'Protein / Receptor', pdbId]
        });
      } catch {
        // ignore entry fetch failure
      }
    })
  );

  return { candidates };
}

// ==================== 4. WIKIMEDIA COMMONS 3D ARCHIVE ====================

async function queryWikimedia3D(
  gsrsearch: string,
  signal?: AbortSignal
): Promise<Discovered3DCandidate[]> {
  const url =
    `https://commons.wikimedia.org/w/api.php?action=query&generator=search` +
    `&gsrsearch=${encodeURIComponent(gsrsearch)}` +
    `&gsrnamespace=6&gsrlimit=12&prop=imageinfo` +
    `&iiprop=url|mime|extmetadata|size|mediatype&iiurlwidth=320&format=json&origin=*`;

  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`Wikimedia Commons returned HTTP ${res.status}.`);
  }
  const data = await res.json();
  const pages = data?.query?.pages ? Object.values(data.query.pages) : [];

  const candidates: Discovered3DCandidate[] = [];
  for (const page of pages as Array<{
    pageid?: number;
    title?: string;
    imageinfo?: Array<{
      url?: string;
      thumburl?: string;
      descriptionurl?: string;
      size?: number;
      mime?: string;
      extmetadata?: Record<string, { value?: string }>;
    }>;
  }>) {
    const info = page.imageinfo?.[0];
    if (!info?.url) continue;
    const fileUrl = sanitizeHttpUrl(info.url.split('?')[0]) || info.url;
    const format = detectModelFormatFromName(fileUrl) || detectModelFormatFromName(page.title || '');
    if (!format) continue;

    const ext = info.extmetadata || {};
    const title = stripHtml(ext.ObjectName?.value) || (page.title || '').replace(/^File:/, '');
    const description =
      stripHtml(ext.ImageDescription?.value) || 'Open-access 3D scientific model on Wikimedia Commons.';
    const creator = stripHtml(ext.Artist?.value) || 'Wikimedia Commons Contributor';
    const license = stripHtml(ext.LicenseShortName?.value) || 'Check source page';
    const byteSize = typeof info.size === 'number' ? info.size : undefined;
    const tooLarge = Boolean(byteSize && byteSize > MAX_DIRECT_IMPORT_BYTES);
    const isMultiFileGltf = format === 'gltf';
    const directImportOk = !tooLarge && !isMultiFileGltf;

    candidates.push({
      id: `wiki3d_${page.pageid || title}`,
      providerId: 'wikimedia_3d',
      providerName: 'Wikimedia Commons 3D',
      title,
      description: description.slice(0, 260),
      previewUrl: sanitizeHttpUrl(info.thumburl),
      creator,
      sourceUrl: sanitizeHttpUrl(info.descriptionurl) || 'https://commons.wikimedia.org',
      directFileUrl: directImportOk ? info.url : undefined,
      format,
      byteSize,
      license,
      attribution: `${creator} via Wikimedia Commons (${license})`,
      usageRestrictions:
        'Verify specific attribution and ShareAlike terms on the Wikimedia Commons file page before redistribution.',
      downloadPolicy: directImportOk ? 'direct_cors' : 'portal_browse_only',
      downloadNotice: isMultiFileGltf
        ? 'Split .gltf files often reference external .bin/textures; download archive from source or prefer .glb/.stl.'
        : tooLarge
        ? `File size (${formatBytes(byteSize)}) exceeds the 35 MB browser direct-import limit. Open source to download locally.`
        : `1-click direct CORS import supported (${format.toUpperCase()} · ${formatBytes(byteSize)}).`,
      suggestedCategory: 'anatomy',
      suggestedDepartment: 'anatomy',
      tags: ['Wikimedia Commons', format.toUpperCase()]
    });
  }
  return candidates;
}

async function searchWikimedia3D(
  query: string,
  signal?: AbortSignal
): Promise<{ candidates: Discovered3DCandidate[]; warning?: string }> {
  const clean = query.trim();
  // MediaWiki CirrusSearch matches extensions reliably via `intitle:.stl <query>`
  let candidates = await queryWikimedia3D(`intitle:.stl ${clean}`, signal);
  if (candidates.length < 3) {
    const broader = await queryWikimedia3D(`stl ${clean}`, signal);
    const seen = new Set(candidates.map((c) => c.id));
    for (const item of broader) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        candidates.push(item);
      }
    }
  }
  return { candidates };
}

// ==================== 5. SMITHSONIAN OPEN ACCESS 3D ====================

async function resolveSmithsonianSvxGlb(svxUrl: string, signal?: AbortSignal): Promise<string | undefined> {
  try {
    const res = await fetch(svxUrl, { signal });
    if (!res.ok) return undefined;
    const svx = await res.json();
    const derivatives: Array<{
      usage?: string;
      quality?: string;
      assets?: Array<{ uri?: string; type?: string }>;
    }> = svx?.models?.[0]?.derivatives || [];

    const preferredQualities = ['Medium', 'Low', 'Thumb', 'High'];
    for (const q of preferredQualities) {
      const deriv = derivatives.find((d) => d.quality === q || d.usage === 'Web3D');
      const asset = deriv?.assets?.find((a) => /\.glb(\?|$)/i.test(a.uri || ''));
      if (asset?.uri) {
        return new URL(asset.uri, svxUrl).toString();
      }
    }
    for (const deriv of derivatives) {
      const asset = deriv.assets?.find((a) => /\.glb(\?|$)/i.test(a.uri || ''));
      if (asset?.uri) {
        return new URL(asset.uri, svxUrl).toString();
      }
    }
  } catch {
    // ignore svx parse error
  }
  return undefined;
}

async function searchSmithsonian3D(
  query: string,
  signal?: AbortSignal
): Promise<{ candidates: Discovered3DCandidate[]; warning?: string }> {
  const url = `https://api.si.edu/openaccess/api/v1.0/search?q=${encodeURIComponent(
    query.trim()
  )}&fq=${encodeURIComponent('online_media_type:"3D models"')}&rows=8&api_key=DEMO_KEY`;

  const res = await fetch(url, { signal });
  if (res.status === 429) {
    return {
      candidates: [],
      warning:
        'Smithsonian Open Access DEMO_KEY rate limit temporarily reached. Other 3D sources remain active, or browse 3d.si.edu and paste a record URL in Upload -> Fetch URL.'
    };
  }
  if (!res.ok) {
    throw new Error(`Smithsonian Open Access API returned HTTP ${res.status}.`);
  }

  const data = await res.json();
  const rows = Array.isArray(data?.response?.rows) ? data.response.rows : [];

  const candidates = await Promise.all(
    rows.map(
      async (row: {
        id: string;
        title?: string;
        unitCode?: string;
        content?: {
          descriptiveNonRepeating?: {
            data_source?: string;
            record_link?: string;
            online_media?: {
              media?: Array<{
                type?: string;
                thumbnail?: string;
                content?: string;
                idsId?: string;
                resources?: Array<{ label?: string; url?: string }>;
              }>;
            };
          };
        };
      }) => {
        const desc = row.content?.descriptiveNonRepeating || {};
        const mediaList = desc.online_media?.media || [];
        const firstThumb = mediaList.find((m) => m.thumbnail)?.thumbnail;

        let glbUrl: string | undefined;
        for (const m of mediaList) {
          const resHit = (m.resources || []).find((r) =>
            /\.(glb|gltf|stl|obj)(\?|$)/i.test(r.url || '')
          );
          if (resHit?.url) {
            glbUrl = sanitizeHttpUrl(resHit.url);
            break;
          }
          const contentStr = m.content || '';
          if (contentStr.includes('3d_package:')) {
            const pkgMatch = contentStr.match(/3d_package:[a-zA-Z0-9-]+/);
            if (pkgMatch) {
              glbUrl = await resolveSmithsonianSvxGlb(
                `https://3d-api.si.edu/content/document/${pkgMatch[0]}/scene.svx.json`,
                signal
              );
              if (glbUrl) break;
            }
          }
        }

        const sourceName = desc.data_source || `Smithsonian (${row.unitCode || 'SI'})`;
        const recordUrl =
          sanitizeHttpUrl(desc.record_link) ||
          `https://3d.si.edu/search?query=${encodeURIComponent(row.title || query)}`;
        const format = glbUrl ? detectModelFormatFromName(glbUrl) || 'glb' : undefined;

        return {
          id: `si3d_${row.id}`,
          providerId: 'smithsonian_3d' as const,
          providerName: 'Smithsonian Open Access 3D',
          title: row.title || 'Smithsonian 3D Specimen',
          description: `Digitized CC0 specimen from ${sourceName}.`,
          previewUrl: sanitizeHttpUrl(firstThumb),
          creator: sourceName,
          sourceUrl: recordUrl,
          directFileUrl: glbUrl,
          format,
          license: 'CC0 1.0 Public Domain Dedication',
          attribution: `${sourceName} · Smithsonian Open Access (CC0)`,
          usageRestrictions:
            'Smithsonian CC0 items allow unrestricted educational use.',
          downloadPolicy: glbUrl ? ('direct_cors' as const) : ('portal_browse_only' as const),
          downloadNotice: glbUrl
            ? '1-click direct GLB import resolved via Smithsonian 3D Voyager CDN.'
            : 'Open Smithsonian 3D record to download the GLB/ZIP bundle from 3d.si.edu, then upload it here.',
          tags: ['Smithsonian CC0', row.unitCode || 'Collection'].filter(Boolean)
        } satisfies Discovered3DCandidate;
      }
    )
  );

  return { candidates };
}

// ==================== 6. SKETCHFAB PUBLIC CATALOG v3 ====================

async function searchSketchfabPublic(
  query: string,
  signal?: AbortSignal
): Promise<{ candidates: Discovered3DCandidate[]; warning?: string }> {
  const url = `https://api.sketchfab.com/v3/search?type=models&downloadable=true&q=${encodeURIComponent(
    query.trim()
  )}&count=10`;

  const res = await fetch(url, { signal });
  if (res.status === 429) {
    return {
      candidates: [],
      warning: 'Sketchfab public search rate limit reached. Wait a moment and retry.'
    };
  }
  if (!res.ok) {
    throw new Error(`Sketchfab API returned HTTP ${res.status}.`);
  }

  const data = await res.json();
  const rows = Array.isArray(data?.results) ? data.results : [];

  const candidates: Discovered3DCandidate[] = rows.map(
    (m: {
      uid: string;
      name?: string;
      description?: string;
      viewerUrl?: string;
      vertexCount?: number;
      faceCount?: number;
      user?: { displayName?: string; profileUrl?: string };
      license?: { label?: string; fullName?: string };
      thumbnails?: { images?: Array<{ url?: string; width?: number }> };
      tags?: Array<{ name?: string }>;
    }) => {
      const images = Array.isArray(m.thumbnails?.images) ? m.thumbnails!.images! : [];
      const sortedImgs = [...images].sort((a, b) => (a.width || 0) - (b.width || 0));
      const pickedThumb =
        sortedImgs.find((img) => (img.width || 0) >= 380)?.url ||
        sortedImgs[sortedImgs.length - 1]?.url;

      const creator = m.user?.displayName || 'Sketchfab Creator';
      const license = m.license?.label || m.license?.fullName || 'Sketchfab Download License';

      return {
        id: `skfb_${m.uid}`,
        providerId: 'sketchfab_public',
        providerName: 'Sketchfab Public 3D',
        title: m.name || 'Untitled 3D Model',
        description:
          stripHtml(m.description)?.slice(0, 240) ||
          'Downloadable 3D model indexed on Sketchfab.',
        previewUrl: sanitizeHttpUrl(pickedThumb),
        creator,
        creatorUrl: sanitizeHttpUrl(m.user?.profileUrl),
        sourceUrl: sanitizeHttpUrl(m.viewerUrl) || `https://sketchfab.com/3d-models/${m.uid}`,
        format: 'glb' as ModelFormat,
        license,
        attribution: `${creator} via Sketchfab (${license})`,
        usageRestrictions:
          'Automated downloads via Sketchfab API require OAuth sign-in. Download the .GLB or .ZIP archive on Sketchfab and upload it directly into PharmaLab.',
        downloadPolicy: 'portal_login_required',
        downloadNotice:
          'Open on Sketchfab (free sign-in), click Download (.GLB or .ZIP), then upload the downloaded file or .ZIP archive here.',
        vertexCount: typeof m.vertexCount === 'number' ? m.vertexCount : undefined,
        faceCount: typeof m.faceCount === 'number' ? m.faceCount : undefined,
        tags: (m.tags || [])
          .map((t) => t.name || '')
          .filter(Boolean)
          .slice(0, 5)
      };
    }
  );

  return { candidates };
}

// ==================== COMBINED DISCOVERY PIPELINE ====================

export async function discoverScientific3DAssets(
  query: string,
  providerFilter: 'all' | Provider3DId = 'all',
  signal?: AbortSignal
): Promise<{
  candidates: Discovered3DCandidate[];
  warnings: string[];
}> {
  const clean = query.trim();
  if (clean.length < 2) {
    return { candidates: [], warnings: [] };
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      candidates: [],
      warnings: [
        'Offline mode detected. Connect to the internet to search Human Reference Atlas, PubChem 3D, RCSB PDB, Wikimedia Commons, Smithsonian, and Sketchfab.'
      ]
    };
  }

  const warnings: string[] = [];
  const tasks: Array<Promise<{ candidates: Discovered3DCandidate[]; warning?: string }>> = [];

  const shouldRun = (id: Provider3DId) => providerFilter === 'all' || providerFilter === id;

  if (shouldRun('human_atlas_3d')) {
    tasks.push(
      searchHumanAtlas3D(clean, signal).catch((err) => ({
        candidates: [],
        warning: `Human Reference Atlas: ${err instanceof Error ? err.message : 'Request failed.'}`
      }))
    );
  }
  if (shouldRun('pubchem_3d')) {
    tasks.push(
      searchPubChem3D(clean, signal).catch((err) => ({
        candidates: [],
        warning: `PubChem 3D: ${err instanceof Error ? err.message : 'Request failed.'}`
      }))
    );
  }
  if (shouldRun('rcsb_pdb')) {
    tasks.push(
      searchRcsbPdb3D(clean, signal).catch((err) => ({
        candidates: [],
        warning: `RCSB PDB: ${err instanceof Error ? err.message : 'Request failed.'}`
      }))
    );
  }
  if (shouldRun('wikimedia_3d')) {
    tasks.push(
      searchWikimedia3D(clean, signal).catch((err) => ({
        candidates: [],
        warning: `Wikimedia 3D: ${err instanceof Error ? err.message : 'Request failed.'}`
      }))
    );
  }
  if (shouldRun('smithsonian_3d')) {
    tasks.push(
      searchSmithsonian3D(clean, signal).catch((err) => ({
        candidates: [],
        warning: `Smithsonian 3D: ${err instanceof Error ? err.message : 'Request failed.'}`
      }))
    );
  }
  if (shouldRun('sketchfab_public')) {
    tasks.push(
      searchSketchfabPublic(clean, signal).catch((err) => ({
        candidates: [],
        warning: `Sketchfab: ${err instanceof Error ? err.message : 'Request failed.'}`
      }))
    );
  }

  const settled = await Promise.all(tasks);
  const combined: Discovered3DCandidate[] = [];
  for (const res of settled) {
    if (res.warning) warnings.push(res.warning);
    combined.push(...res.candidates);
  }

  // Prioritize 1-click direct CORS importable models first
  combined.sort((a, b) => {
    const score = (c: Discovered3DCandidate) =>
      c.downloadPolicy === 'direct_cors' ? 2 : c.downloadPolicy === 'portal_login_required' ? 1 : 0;
    return score(b) - score(a);
  });

  return { candidates: combined, warnings };
}

// ==================== SMART WEBSITE URL RESOLVER & BINARY FETCHER ====================

async function resolveWebsiteUrlToDirect3D(
  inputUrl: string
): Promise<{ fetchUrl: string; hintFileName?: string; hintFormat?: ModelFormat }> {
  const urlObj = new URL(inputUrl);
  const host = urlObj.hostname.toLowerCase();

  // 1. Sketchfab webpage cannot be fetched cross-origin without user OAuth download
  if (host.includes('sketchfab.com')) {
    throw new Error(
      'Sketchfab requires downloading while signed in. Open the Sketchfab model page, click Download (.GLB or .ZIP archive), then drop that downloaded file into "Upload Local File".'
    );
  }

  // 2. NIH 3D webpage -> inform user cleanly
  if (host === '3d.nih.gov') {
    throw new Error(
      'NIH 3D model pages bundle files behind dynamic downloads. Download the .STL / .GLB / .ZIP from 3d.nih.gov and upload it locally via "Upload Local File".'
    );
  }

  // 3. Wikimedia Commons File: page -> resolve real upload.wikimedia.org binary via MediaWiki API
  if (host.includes('commons.wikimedia.org') && urlObj.pathname.includes('/wiki/File:')) {
    const fileTitle = decodeURIComponent(urlObj.pathname.split('/wiki/')[1]);
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(
      fileTitle
    )}&prop=imageinfo&iiprop=url|size&format=json&origin=*`;
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error('Unable to resolve Wikimedia Commons File URL.');
    const json = await res.json();
    const page = Object.values(json?.query?.pages || {})[0] as {
      imageinfo?: Array<{ url?: string }>;
    };
    const rawUrl = page?.imageinfo?.[0]?.url;
    if (!rawUrl) {
      throw new Error('Could not locate raw 3D file URL on this Wikimedia Commons page.');
    }
    return { fetchUrl: rawUrl, hintFileName: fileTitle.replace(/^File:/i, '') };
  }

  // 4. GitHub /blob/ URL -> raw.githubusercontent.com
  if (host === 'github.com' && urlObj.pathname.includes('/blob/')) {
    const parts = urlObj.pathname.split('/').filter(Boolean);
    const blobIdx = parts.indexOf('blob');
    if (blobIdx >= 2 && parts.length > blobIdx + 2) {
      const owner = parts[0];
      const repo = parts[1];
      const rest = parts.slice(blobIdx + 1).join('/');
      return {
        fetchUrl: `https://raw.githubusercontent.com/${owner}/${repo}/${rest}`
      };
    }
  }

  // 5. PubChem compound webpage -> direct 3D SDF conformer
  if (host.includes('pubchem.ncbi.nlm.nih.gov') && urlObj.pathname.includes('/compound/')) {
    const slug = decodeURIComponent(urlObj.pathname.split('/compound/')[1].split('/')[0]);
    if (slug) {
      const isCid = /^\d+$/.test(slug);
      const endpoint = isCid ? `cid/${slug}` : `name/${encodeURIComponent(slug)}`;
      return {
        fetchUrl: `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/${endpoint}/SDF?record_type=3d`,
        hintFileName: `${slug}.sdf`,
        hintFormat: 'sdf'
      };
    }
  }

  // 6. RCSB PDB structure webpage -> direct .pdb download
  if (host.includes('rcsb.org') && urlObj.pathname.includes('/structure/')) {
    const pdbId = urlObj.pathname.split('/structure/')[1].split('/')[0].trim().toUpperCase();
    if (/^[A-Z0-9]{4}$/.test(pdbId)) {
      return {
        fetchUrl: `https://files.rcsb.org/download/${pdbId}.pdb`,
        hintFileName: `${pdbId}.pdb`,
        hintFormat: 'pdb'
      };
    }
  }

  // 7. Smithsonian 3D object URL or .svx.json -> resolve GLB derivative via 3d-api.si.edu
  if (host.includes('3d.si.edu') || inputUrl.endsWith('.svx.json')) {
    const pkgMatch = inputUrl.match(/3d_package:[a-zA-Z0-9-]+/);
    const svxUrl = inputUrl.endsWith('.svx.json')
      ? inputUrl
      : pkgMatch
      ? `https://3d-api.si.edu/content/document/${pkgMatch[0]}/scene.svx.json`
      : null;
    if (svxUrl) {
      const glb = await resolveSmithsonianSvxGlb(svxUrl);
      if (glb) {
        return { fetchUrl: glb, hintFormat: 'glb' };
      }
    }
  }

  return { fetchUrl: inputUrl };
}

function sniffFormatFromBytes(buffer: ArrayBuffer): ModelFormat | null {
  const bytes = new Uint8Array(buffer.slice(0, 512));
  // glTF binary magic 'glTF' (0x67 0x6C 0x54 0x46)
  if (bytes.length >= 4 && bytes[0] === 0x67 && bytes[1] === 0x6c && bytes[2] === 0x54 && bytes[3] === 0x46) {
    return 'glb';
  }
  // ZIP magic 'PK\x03\x04'
  if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
    return 'zip';
  }
  const headText = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  const trimmed = headText.trimStart();
  if (trimmed.startsWith('{') && headText.includes('"asset"')) return 'gltf';
  if (trimmed.startsWith('ply')) return 'ply';
  if (/^(HEADER|ATOM\s|HETATM|COMPND|TITLE\s)/m.test(headText)) return 'pdb';
  if (headText.includes('V2000') || headText.includes('V3000')) return 'sdf';
  if (trimmed.startsWith('solid ')) return 'stl';
  return null;
}

export async function fetchRemote3DBinary(
  url: string,
  fallbackFileName = 'model.glb',
  expectedFormat?: ModelFormat
): Promise<{
  buffer: ArrayBuffer;
  format: ModelFormat;
  fileName: string;
  byteSize: number;
  mimeType: string;
}> {
  const safe = sanitizeHttpUrl(url);
  if (!safe) {
    throw new Error('Invalid or unsupported URL protocol. Enter a valid https:// URL.');
  }

  const resolved = await resolveWebsiteUrlToDirect3D(safe);

  let res: Response;
  try {
    res = await fetch(resolved.fetchUrl);
  } catch {
    throw new Error(
      'Cross-origin download blocked (CORS) or server unreachable. Download the .GLB/.STL/.ZIP file in your browser and drop it into "Upload Local File".'
    );
  }

  if (!res.ok) {
    throw new Error(
      `Remote server responded with HTTP ${res.status}. Download the file manually and upload it locally.`
    );
  }

  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  if (contentType.includes('text/html')) {
    throw new Error(
      'This webpage returned HTML instead of a 3D model file. Open the page, download the .GLB / .STL / .ZIP bundle, and upload it locally.'
    );
  }

  const buffer = await res.arrayBuffer();
  if (buffer.byteLength === 0) {
    throw new Error('Downloaded 3D file was empty (0 bytes).');
  }
  if (buffer.byteLength > 45 * 1024 * 1024) {
    throw new Error(
      `File is ${formatBytes(buffer.byteLength)}, exceeding the 45 MB browser IndexedDB limit.`
    );
  }

  const disp = res.headers.get('content-disposition') || '';
  const dispMatch = disp.match(/filename\*?=(?:UTF-8'')?["']?([^"';\n]+)/i);
  const rawName =
    dispMatch?.[1]?.trim() ||
    resolved.hintFileName ||
    resolved.fetchUrl.split('?')[0].split('/').pop() ||
    fallbackFileName;

  let decodedName = rawName;
  try {
    decodedName = decodeURIComponent(rawName);
  } catch {
    decodedName = rawName;
  }

  const detected =
    detectModelFormatFromName(decodedName) ||
    resolved.hintFormat ||
    expectedFormat ||
    sniffFormatFromBytes(buffer) ||
    detectModelFormatFromName(fallbackFileName);

  if (!detected) {
    throw new Error(
      'Unable to confirm a supported 3D format (.glb, .gltf, .stl, .obj, .ply, .zip, .pdb, .sdf) from this URL.'
    );
  }

  const finalName = detectModelFormatFromName(decodedName)
    ? decodedName
    : `${decodedName.replace(/\.[^.]+$/, '') || 'model'}.${detected}`;

  return {
    buffer,
    format: detected,
    fileName: finalName,
    byteSize: buffer.byteLength,
    mimeType: contentType || 'application/octet-stream'
  };
}
