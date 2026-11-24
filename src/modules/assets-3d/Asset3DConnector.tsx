import React, { useCallback, useEffect, useState } from 'react';
import { Box, ChevronRight, Globe, Link2, Upload } from 'lucide-react';
import { useLibraryNavigation } from '../../context/LibraryNavigationContext';
import Asset3DLibraryPickerModal from './Asset3DLibraryPickerModal';
import Asset3DUploadModal, { Asset3DInitialContext } from './Asset3DUploadModal';
import ModelViewerModal from './ModelViewerModal';
import { get3DAssetsForContext, getCustom3DCategories } from './asset3dDb';
import {
  Asset3DCategory,
  Asset3DItem,
  BPharmDepartmentId,
  Custom3DCategory,
  get3DCategoryLabel,
  mapWorkspaceDeptToBPharmDept
} from './types';

interface Asset3DConnectorProps {
  workspaceDepartment?: string;
  departmentId?: BPharmDepartmentId;
  subjectCode?: string;
  subjectTitle?: string;
  unitNo?: string;
  topicId?: string;
  topicTitle?: string;
  experimentId?: string;
  experimentTitle?: string;
  structureId?: string;
  structureName?: string;
  defaultSearchQuery?: string;
  defaultCategory?: Asset3DCategory;
  title?: string;
  subtitle?: string;
}

export default function Asset3DConnector({
  workspaceDepartment,
  departmentId,
  subjectCode,
  subjectTitle,
  unitNo,
  topicId,
  topicTitle,
  experimentId,
  experimentTitle,
  structureId,
  structureName,
  defaultSearchQuery,
  defaultCategory = 'anatomy',
  title = 'Interactive 3D Models & Apparatus',
  subtitle
}: Asset3DConnectorProps) {
  const { openAsset3DEngine } = useLibraryNavigation();

  const resolvedDept: BPharmDepartmentId =
    departmentId || mapWorkspaceDeptToBPharmDept(workspaceDepartment);

  const [assets, setAssets] = useState<Asset3DItem[]>([]);
  const [customCategories, setCustomCategories] = useState<Custom3DCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerAsset, setViewerAsset] = useState<Asset3DItem | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    setCustomCategories(getCustom3DCategories());
    try {
      const hits = await get3DAssetsForContext({
        departmentId: resolvedDept,
        subjectCode,
        topicId,
        structureId,
        experimentId,
        query: defaultSearchQuery || structureName || topicTitle || experimentTitle
      });
      setAssets(hits.slice(0, 6));
    } catch {
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, [
    resolvedDept,
    subjectCode,
    topicId,
    structureId,
    experimentId,
    defaultSearchQuery,
    structureName,
    topicTitle,
    experimentTitle
  ]);

  useEffect(() => {
    void loadMatches();
  }, [loadMatches]);

  const initialUploadContext: Asset3DInitialContext = {
    departmentId: resolvedDept,
    course: 'B.Pharm',
    subjectCode,
    subjectTitle,
    unitNo,
    topicId,
    topicTitle,
    experimentId,
    experimentTitle,
    structureId,
    structureName,
    defaultTitle: structureName || topicTitle || experimentTitle || '',
    defaultCategory
  };

  const discoverQuery =
    defaultSearchQuery || structureName || topicTitle || experimentTitle || 'pharmacy apparatus';

  return (
    <section
      aria-label={title}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5 min-w-0">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Box className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              {title} ({assets.length})
            </span>
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="min-h-[34px] px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1"
          >
            <Link2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Link from Library</span>
          </button>

          <button
            type="button"
            onClick={() =>
              openAsset3DEngine({
                tab: 'discover',
                query: discoverQuery,
                department: resolvedDept
              })
            }
            className="min-h-[34px] px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Discover 3D</span>
          </button>

          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="min-h-[34px] px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Attach GLB / STL</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-16 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800" />
      ) : assets.length === 0 ? (
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
          <span>
            No real 3D model is linked to{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {structureName || topicTitle || experimentTitle || 'this subject'}
            </strong>{' '}
            yet. Link an existing model from your 3D Library, import an open-source asset, or upload a local file.
          </span>
          <button
            type="button"
            onClick={() =>
              openAsset3DEngine({
                tab: 'library',
                department: resolvedDept
              })
            }
            className="text-emerald-700 dark:text-emerald-400 font-semibold whitespace-nowrap inline-flex items-center gap-0.5 hover:underline"
          >
            <span>Open 3D Library</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {assets.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setViewerAsset(item)}
              className="group p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 flex items-center gap-3 text-left transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                {item.thumbnailDataUrl || item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailDataUrl || item.thumbnailUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Box className="w-5 h-5 text-emerald-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                  {item.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {item.format.toUpperCase()} · {get3DCategoryLabel(item.category, customCategories)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <ModelViewerModal
        asset={viewerAsset}
        onClose={() => setViewerAsset(null)}
        onAssetUpdated={(updated) => {
          setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        }}
        onAssetDeleted={(id) => {
          setAssets((prev) => prev.filter((a) => a.id !== id));
        }}
      />

      <Asset3DLibraryPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onLinked={() => void loadMatches()}
        departmentId={resolvedDept}
        course="B.Pharm"
        subjectCode={subjectCode}
        subjectTitle={subjectTitle}
        unitNo={unitNo}
        topicId={topicId}
        topicTitle={topicTitle}
        experimentId={experimentId}
        experimentTitle={experimentTitle}
        structureId={structureId}
        structureName={structureName}
        linkedAssetIds={assets.map((a) => a.id)}
      />

      <Asset3DUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSaved={() => void loadMatches()}
        initialContext={initialUploadContext}
      />
    </section>
  );
}
