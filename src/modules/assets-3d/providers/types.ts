import {
  Asset3DCategory,
  Discovered3DCandidate,
  ModelFormat,
  Provider3DId,
  ProviderAuthRequirement,
  ProviderCorsSupport
} from '../types';

export interface Provider3DMeta {
  id: Provider3DId;
  name: string;
  shortName: string;
  websiteUrl: string;
  policySummary: string;
  supportsLiveApi: boolean;
  authRequirement: ProviderAuthRequirement;
  corsSupport: ProviderCorsSupport;
  supportedFormats: ModelFormat[];
  domainsCovered: string[];
}

export interface ProviderSearchParams {
  query: string;
  category?: 'all' | Asset3DCategory;
  limit?: number;
  signal?: AbortSignal;
}

export interface ProviderSearchResult {
  candidates: Discovered3DCandidate[];
  warning?: string;
}

export interface Asset3DProviderAdapter {
  meta: Provider3DMeta;
  search: (params: ProviderSearchParams) => Promise<ProviderSearchResult>;
}
