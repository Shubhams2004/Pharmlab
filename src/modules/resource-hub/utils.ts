import {
  ResourceType,
  ScientificResourceItem,
  PublicationDateWindow,
  VisualDiscoveryCategoryId
} from './types';
import { VisualCategory } from '../visual-library/types';

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  textbook: 'Textbooks',
  research_paper: 'Research papers',
  review_article: 'Review articles',
  anatomical_diagram: 'Anatomical diagrams',
  histology_image: 'Histology images',
  scientific_illustration: 'Scientific illustrations',
  medical_reference: 'Medical references',
  educational_material: 'Educational materials'
};

export const ALL_RESOURCE_TYPES: ResourceType[] = [
  'textbook',
  'research_paper',
  'review_article',
  'anatomical_diagram',
  'histology_image',
  'scientific_illustration',
  'medical_reference',
  'educational_material'
];

export interface VisualDiscoveryCategoryMeta {
  id: VisualDiscoveryCategoryId;
  label: string;
  defaultQuery: string;
  queryBoost: string;
  visualCategory: VisualCategory;
}

export const VISUAL_DISCOVERY_CATEGORIES: VisualDiscoveryCategoryMeta[] = [
  {
    id: 'all',
    label: 'All Scientific Visuals',
    defaultQuery: 'Human nephron anatomy',
    queryBoost: '',
    visualCategory: 'anatomy'
  },
  {
    id: 'human_anatomy',
    label: 'Human anatomy',
    defaultQuery: 'Human heart anatomy',
    queryBoost: 'human anatomy diagram',
    visualCategory: 'anatomy'
  },
  {
    id: 'organ_systems',
    label: 'Organ systems',
    defaultQuery: 'Human urinary system',
    queryBoost: 'organ system anatomy',
    visualCategory: 'anatomy'
  },
  {
    id: 'histology',
    label: 'Histology',
    defaultQuery: 'Epithelial tissue histology',
    queryBoost: 'histology stained section',
    visualCategory: 'microscopy'
  },
  {
    id: 'microscopy',
    label: 'Microscopy',
    defaultQuery: 'Plant stomata microscopy',
    queryBoost: 'microscopy micrograph',
    visualCategory: 'microscopy'
  },
  {
    id: 'cells',
    label: 'Cells',
    defaultQuery: 'Eukaryotic cell organelles',
    queryBoost: 'cell biology organelle diagram',
    visualCategory: 'anatomy'
  },
  {
    id: 'microorganisms',
    label: 'Microorganisms',
    defaultQuery: 'Gram positive bacteria cell wall',
    queryBoost: 'microorganism bacteria microscopy',
    visualCategory: 'clinical'
  },
  {
    id: 'pharmaceutical_sciences',
    label: 'Pharmaceutical sciences',
    defaultQuery: 'Tablet dissolution pharmaceutical',
    queryBoost: 'pharmaceutical compounding dosage',
    visualCategory: 'clinical'
  },
  {
    id: 'chemical_structures',
    label: 'Chemical structures',
    defaultQuery: 'Aspirin',
    queryBoost: 'chemical structure molecule',
    visualCategory: 'chemistry'
  },
  {
    id: 'scientific_instruments',
    label: 'Scientific instruments',
    defaultQuery: 'Compound light microscope',
    queryBoost: 'laboratory apparatus instrument',
    visualCategory: 'apparatus'
  },
  {
    id: 'pathology',
    label: 'Pathology',
    defaultQuery: 'Glomerulonephritis pathology',
    queryBoost: 'pathology histopathology',
    visualCategory: 'clinical'
  },
  {
    id: 'physiology',
    label: 'Physiology',
    defaultQuery: 'Cardiac cycle ECG physiology',
    queryBoost: 'physiology mechanism diagram',
    visualCategory: 'anatomy'
  }
];

export const DISCOVER_SEARCH_SUGGESTIONS: string[] = [
  'Nephron filtration',
  'Cardiac conduction system',
  'Acetylsalicylic acid COX inhibition',
  'Anatomy and Physiology',
  'Peptidoglycan beta-lactam',
  'Withania somnifera',
  'Acid base titration burette',
  'Glomerular filtration rate'
];

export function sanitizeHttpUrl(raw?: string | null): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function stripMarkup(raw?: string | null): string {
  if (!raw) return '';
  if (typeof DOMParser !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(raw, 'text/html');
      return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
    } catch {
      // fall back to regex cleanup
    }
  }
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractYear(dateInput?: string | number | null): number | null {
  if (typeof dateInput === 'number' && Number.isFinite(dateInput)) {
    return dateInput >= 1800 && dateInput <= 2100 ? dateInput : null;
  }
  if (!dateInput || typeof dateInput !== 'string') return null;
  const match = dateInput.match(/\b(19|20)\d{2}\b/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return parsed >= 1900 && parsed <= 2100 ? parsed : null;
}

export function matchesDateWindow(
  year: number | null | undefined,
  window: PublicationDateWindow
): boolean {
  if (window === 'all') return true;
  if (!year) return false;
  const currentYear = new Date().getFullYear();
  if (window === '1y') return year >= currentYear - 1;
  if (window === '5y') return year >= currentYear - 5;
  if (window === '10y') return year >= currentYear - 10;
  return true;
}

export function buildCanonicalResourceKey(item: ScientificResourceItem): string {
  const { identifiers, sourceUrl, title, providerId } = item;
  if (identifiers.doi) return `doi:${identifiers.doi.toLowerCase().trim()}`;
  if (identifiers.pmid) return `pmid:${identifiers.pmid.trim()}`;
  if (identifiers.pmcid) return `pmcid:${identifiers.pmcid.toUpperCase().trim()}`;
  if (identifiers.nbkId) return `nbk:${identifiers.nbkId.toUpperCase().trim()}`;
  if (identifiers.openStaxSlug) return `openstax:${identifiers.openStaxSlug.toLowerCase().trim()}`;
  if (identifiers.wikimediaPageId) return `wm:${identifiers.wikimediaPageId}`;
  if (identifiers.pubchemCid) return `pubchem:${identifiers.pubchemCid}`;
  const cleanUrl = sanitizeHttpUrl(sourceUrl);
  if (cleanUrl) return `url:${cleanUrl.toLowerCase()}`;
  return `title:${providerId}:${title.toLowerCase().replace(/\s+/g, ' ').trim()}`;
}

export function formatAuthorsLine(authors: string[], max = 3): string {
  if (!authors || authors.length === 0) return 'Author / Contributor listed at source';
  if (authors.length <= max) return authors.join(', ');
  return `${authors.slice(0, max).join(', ')} et al.`;
}

export function createTimeoutSignal(
  externalSignal?: AbortSignal,
  timeoutMs = 12000
): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(new Error('Request timed out'));
  }, timeoutMs);

  const onExternalAbort = () => {
    controller.abort(externalSignal?.reason);
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort(externalSignal.reason);
    } else {
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timer);
      if (externalSignal) {
        externalSignal.removeEventListener('abort', onExternalAbort);
      }
    }
  };
}
