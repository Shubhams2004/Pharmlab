import {
  DiscoverySourceFilter,
  discoverOpenAccessImages
} from '../../visual-library/openAccessDiscovery';
import { OpenAccessCandidate } from '../../visual-library/types';
import {
  ResourceProviderId,
  ResourceType,
  ScientificResourceItem
} from '../types';
import { sanitizeHttpUrl } from '../utils';
import { inferDepartmentsFromText } from './europePmcProvider';

function inferVisualResourceType(candidate: OpenAccessCandidate): ResourceType {
  const text = `${candidate.title} ${candidate.description}`.toLowerCase();
  if (/histolog|stained|section|microscop|stoma|trichome|smear|cell slide/.test(text)) {
    return 'histology_image';
  }
  if (candidate.suggestedCategory === 'anatomy' || /anatomy|organ|heart|kidney|skeleton|nerve|muscle/.test(text)) {
    return 'anatomical_diagram';
  }
  return 'scientific_illustration';
}

function mapRepoToProviderId(candidate: OpenAccessCandidate): ResourceProviderId {
  if (candidate.id.startsWith('pubchem_')) return 'pubchem';
  if (candidate.id.startsWith('gbif_')) return 'gbif';
  if (candidate.repository.toLowerCase().includes('openstax')) return 'openstax';
  return 'wikimedia';
}

export function candidateToScientificResource(
  candidate: OpenAccessCandidate,
  queryContext?: string
): ScientificResourceItem {
  const providerId = mapRepoToProviderId(candidate);
  const previewUrl = sanitizeHttpUrl(candidate.previewUrl) || undefined;
  const fullUrl = sanitizeHttpUrl(candidate.fullUrl) || undefined;
  const sourceUrl =
    sanitizeHttpUrl(candidate.sourceUrl) ||
    fullUrl ||
    previewUrl ||
    'https://commons.wikimedia.org/';

  return {
    id: candidate.id,
    providerId,
    providerName: candidate.repository,
    title: candidate.title,
    resourceType: inferVisualResourceType(candidate),
    authors: candidate.creator ? [candidate.creator] : [],
    journalOrPublisher: candidate.repository,
    publicationDate: 'Open Repository',
    year: null,
    summary: candidate.description,
    abstractText: candidate.attribution,
    sourceUrl,
    imageUrl: fullUrl,
    previewUrl,
    license: candidate.license,
    licenseUrl: sanitizeHttpUrl(candidate.licenseUrl) || undefined,
    attribution: candidate.attribution,
    isOpenAccess: true,
    isPermissiveLicense: candidate.isPermissiveLicense,
    licenseWarning: candidate.licenseWarning,
    accessType: 'open_image',
    canDirectImportVisual: Boolean(fullUrl),
    canAttemptDirectPdfImport: false,
    identifiers: {
      wikimediaPageId: candidate.id.startsWith('wm_') ? candidate.id.replace('wm_', '') : undefined,
      pubchemCid: candidate.id.startsWith('pubchem_') ? candidate.id.replace('pubchem_', '') : undefined
    },
    topics: queryContext ? [queryContext] : [],
    suggestedCategory: candidate.suggestedCategory,
    suggestedDepartments:
      candidate.suggestedDepartments.length > 0
        ? candidate.suggestedDepartments
        : inferDepartmentsFromText(`${candidate.title} ${candidate.description}`),
    mimeType: candidate.mimeType,
    width: candidate.width,
    height: candidate.height,
    relevanceScore: candidate.isPermissiveLicense ? 86 : 74
  };
}

export async function searchVisualProviders(
  query: string,
  filter: DiscoverySourceFilter = 'all'
): Promise<{ items: ScientificResourceItem[]; warnings: string[] }> {
  const { candidates, warnings } = await discoverOpenAccessImages(query, filter);
  return {
    items: candidates.map((c) => candidateToScientificResource(c, query)),
    warnings
  };
}
