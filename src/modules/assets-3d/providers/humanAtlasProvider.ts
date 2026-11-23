import { sanitizeHttpUrl } from '../../resource-hub/utils';
import { Discovered3DCandidate } from '../types';
import { PROVIDER_3D_BY_ID } from './registry';
import { Asset3DProviderAdapter, ProviderSearchParams, ProviderSearchResult } from './types';
import { computeQueryRelevance } from './utils';

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
  cornea: ['eye'],
  retina: ['eye'],
  digestive: ['mouth', 'small intestine', 'large intestine', 'liver', 'pancreas'],
  gi: ['small intestine', 'large intestine', 'mouth'],
  gut: ['small intestine', 'large intestine'],
  colon: ['large intestine'],
  immune: ['lymph node', 'spleen', 'thymus', 'palatine tonsil'],
  lymphatic: ['lymph node', 'spleen', 'thymus', 'palatine tonsil'],
  reproductive: ['uterus', 'ovary', 'fallopian', 'prostate', 'placenta', 'mammary'],
  skeletal: ['pelvis', 'sternum', 'manubrium', 'knee', 'intervertebral'],
  bone: ['pelvis', 'sternum', 'manubrium', 'knee', 'intervertebral'],
  tissue: ['adipose', 'blood', 'lymph', 'skin'],
  organ: ['heart', 'brain', 'kidney', 'liver', 'lung', 'spleen', 'pancreas'],
  anatomy: ['heart', 'brain', 'kidney', 'liver', 'lung', 'spleen', 'pancreas']
};

export async function searchHumanAtlas3D(
  params: ProviderSearchParams
): Promise<ProviderSearchResult> {
  const { query, limit = 12, signal } = params;
  if (!cachedHraOrgans) {
    const res = await fetch('https://apps.humanatlas.io/api/v1/reference-organs', { signal });
    if (!res.ok) {
      throw new Error(`Human Reference Atlas returned HTTP ${res.status}.`);
    }
    const json = await res.json();
    if (!Array.isArray(json)) {
      throw new Error('Unexpected response format from Human Reference Atlas API.');
    }
    cachedHraOrgans = json;
  }

  const clean = query.trim().toLowerCase();
  const tokens = clean.split(/[\s,/-]+/).filter((t) => t.length >= 2);
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
      if (label === clean) score += 12;
      if (hay.includes(clean)) score += 7;
      for (const term of expandedTerms) {
        if (label.includes(term)) score += 5;
        else if (hay.includes(term)) score += 2.5;
      }
      return { organ: o, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const candidates: Discovered3DCandidate[] = scored.map(({ organ, score }, idx) => {
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
    const title = `Human ${niceLabel}${sexLabel}`;
    const isBoneOrTissue = /pelvis|sternum|knee|intervertebral|adipose|vasculature|skin/i.test(
      rawLabel
    );

    return {
      id: `hra_${idx}_${(organ['@id'] || glbUrl).replace(/[^a-zA-Z0-9]/g, '').slice(-16)}`,
      providerId: 'human_atlas_3d',
      providerName: 'NIH / HuBMAP Human Reference Atlas',
      title,
      description: `Official Visible Human 3D anatomical reference model.${dims} Self-contained multi-mesh GLB ready for 1-click import.`,
      creator: 'HuBMAP / Indiana University / NIH Visible Human',
      sourceUrl: sanitizeHttpUrl(organ.reference_organ || organ['@id']) || 'https://humanatlas.io',
      directFileUrl: glbUrl,
      format: 'glb',
      license: 'CC BY 4.0',
      attribution: 'Human Reference Atlas (HuBMAP Consortium, CC BY 4.0)',
      usageRestrictions:
        'CC BY 4.0: Free for academic and educational use with attribution to the HuBMAP Human Reference Atlas.',
      downloadPolicy: 'direct_cors',
      downloadNotice: '1-click direct GLB import & live 3D preview supported (CORS-open NIH/HuBMAP CDN).',
      suggestedCategory: isBoneOrTissue ? 'anatomy' : 'organ',
      suggestedDepartment: 'anatomy',
      relevanceScore: Math.max(score, computeQueryRelevance(query, [{ text: title, weight: 4 }])),
      publishedAt: organ.creation_date,
      tags: ['Human Reference Atlas', 'GLB', 'Anatomy', organ.sex || 'Reference Organ'].filter(
        Boolean
      )
    };
  });

  return { candidates };
}

export const humanAtlasProvider: Asset3DProviderAdapter = {
  meta: PROVIDER_3D_BY_ID.human_atlas_3d,
  search: searchHumanAtlas3D
};
