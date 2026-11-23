export { PROVIDER_3D_REGISTRY, PROVIDER_3D_BY_ID } from './providers/registry';
export type { Provider3DMeta, Asset3DProviderAdapter, ProviderSearchParams, ProviderSearchResult } from './providers/types';
export {
  discoverScientific3DAssets,
  sortAndFilterDiscovered3D
} from './providers/discoverAssets';
export type { Discover3DOptions, Discover3DResponse } from './providers/discoverAssets';
export {
  fetchRemote3DBinary,
  preflightRemote3DAsset,
  resolveWebsiteUrlToDirect3D
} from './providers/importAsset';
export type {
  Fetched3DBinary,
  FetchRemote3DOptions,
  Remote3DPreflightResult,
  Resolved3DUrl
} from './providers/importAsset';
export {
  MAX_DIRECT_IMPORT_BYTES,
  LARGE_ASSET_WARNING_BYTES,
  SAFE_AUTO_PREVIEW_BYTES,
  SUPPORTED_IMPORT_FORMATS,
  isSupportedModelFormat,
  sniffFormatFromBytes,
  inferScientificCategoryAndDept
} from './providers/utils';
