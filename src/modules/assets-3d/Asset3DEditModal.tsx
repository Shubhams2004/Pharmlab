import React, { useEffect, useState } from 'react';
import { FolderPlus, Loader2, Plus, Save, Tag, X } from 'lucide-react';
import {
  getCustom3DCategories,
  getMerged3DCategoryOptions,
  saveCustom3DCategory,
  update3DAssetMeta
} from './asset3dDb';
import {
  ALL_BPHARM_DEPARTMENTS,
  Asset3DCategory,
  Asset3DItem,
  BPHARM_DEPARTMENT_LABELS,
  BPharmDepartmentId,
  Custom3DCategory
} from './types';

interface Asset3DEditModalProps {
  asset: Asset3DItem | null;
  allAssets?: Asset3DItem[];
  onClose: () => void;
  onUpdated: (updated: Asset3DItem) => void;
  onCategoriesChanged?: (categories: Custom3DCategory[]) => void;
}

export default function Asset3DEditModal({
  asset,
  allAssets = [],
  onClose,
  onUpdated,
  onCategoriesChanged
}: Asset3DEditModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Asset3DCategory>('anatomy');
  const [customCategories, setCustomCategories] = useState<Custom3DCategory[]>([]);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);

  const [departments, setDepartments] = useState<BPharmDepartmentId[]>(['anatomy']);
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');

  const [creator, setCreator] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [license, setLicense] = useState('');
  const [attribution, setAttribution] = useState('');
  const [usageRestrictions, setUsageRestrictions] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!asset) return;
    setCustomCategories(getCustom3DCategories());
    setName(asset.name);
    setDescription(asset.description);
    setCategory(asset.category);
    setDepartments(asset.departments.length > 0 ? asset.departments : ['anatomy']);
    setTags(asset.tags || []);
    setTagDraft('');
    setCreator(asset.creator || '');
    setSourceName(asset.sourceName || '');
    setSourceUrl(asset.sourceUrl || '');
    setLicense(asset.license || '');
    setAttribution(asset.attribution || '');
    setUsageRestrictions(asset.usageRestrictions || '');
    setShowNewCategory(false);
    setNewCategoryInput('');
    setErrorMsg(null);
  }, [asset]);

  if (!asset) return null;

  const categoryOptions = getMerged3DCategoryOptions(allAssets, customCategories);

  const toggleDept = (dept: BPharmDepartmentId) => {
    setDepartments((prev) =>
      prev.includes(dept) ? (prev.length > 1 ? prev.filter((d) => d !== dept) : prev) : [...prev, dept]
    );
  };

  const handleAddTags = () => {
    const incoming = tagDraft
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (incoming.length === 0) return;
    setTags((prev) => {
      const existingLower = new Set(prev.map((t) => t.toLowerCase()));
      const additions = incoming.filter((t) => !existingLower.has(t.toLowerCase()));
      return [...prev, ...additions];
    });
    setTagDraft('');
  };

  const handleCreateCustomCategory = () => {
    if (!newCategoryInput.trim()) return;
    try {
      const created = saveCustom3DCategory(newCategoryInput);
      const refreshed = getCustom3DCategories();
      setCustomCategories(refreshed);
      onCategoriesChanged?.(refreshed);
      setCategory(created.id);
      setNewCategoryInput('');
      setShowNewCategory(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to create category.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!name.trim()) {
      setErrorMsg('Asset name is required.');
      return;
    }

    // Flush any pending typed tag before saving
    let finalTags = [...tags];
    if (tagDraft.trim()) {
      const extra = tagDraft
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const lower = new Set(finalTags.map((t) => t.toLowerCase()));
      for (const t of extra) {
        if (!lower.has(t.toLowerCase())) {
          finalTags.push(t);
          lower.add(t.toLowerCase());
        }
      }
    }

    setSaving(true);
    try {
      const updated = await update3DAssetMeta(asset.id, {
        name: name.trim(),
        description: description.trim(),
        category,
        departments,
        tags: finalTags,
        creator: creator.trim() || 'User Provided',
        sourceName: sourceName.trim() || asset.sourceName,
        sourceUrl: sourceUrl.trim() || undefined,
        license: license.trim() || 'Unspecified',
        attribution:
          attribution.trim() ||
          `${creator.trim() || 'User Provided'} (${license.trim() || 'Unspecified'})`,
        usageRestrictions: usageRestrictions.trim()
      });
      if (updated) {
        onUpdated(updated);
        onClose();
      } else {
        setErrorMsg('Asset record could not be found in IndexedDB.');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to update metadata.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[55] bg-slate-950/80 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`Edit metadata for ${asset.name}`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Rename &amp; Edit Asset Metadata
            </p>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white truncate">
              {asset.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            aria-label="Close edit modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs sm:text-sm">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-xs text-rose-700 dark:text-rose-200">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Asset Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full min-h-[40px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Scientific Category
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewCategory((v) => !v)}
                  className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                >
                  <FolderPlus className="w-3 h-3" />
                  <span>{showNewCategory ? 'Cancel' : 'New Category'}</span>
                </button>
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Asset3DCategory)}
                className="w-full min-h-[40px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
              >
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                    {c.isCustom ? ' (Custom)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {showNewCategory && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-emerald-500/40 flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateCustomCategory();
                  }
                }}
                placeholder="e.g. Excipient Crystals, Surgical Instruments..."
                className="flex-1 min-w-[200px] min-h-[36px] px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleCreateCustomCategory}
                className="min-h-[36px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create &amp; Select</span>
              </button>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Scientific Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white leading-relaxed"
            />
          </div>

          {/* Tags editor */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Tags ({tags.length})</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTags();
                  }
                }}
                placeholder="Add tags (comma-separated or press Enter)"
                className="flex-1 min-h-[38px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddTags}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
              >
                Add Tag
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                      className="text-slate-400 hover:text-rose-500"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Departments */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Scientific Domains / B.Pharm Departments ({departments.length})
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_BPHARM_DEPARTMENTS.map((dept) => {
                const active = departments.includes(dept);
                return (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => toggleDept(dept)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      active
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {BPHARM_DEPARTMENT_LABELS[dept]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Source & Licensing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Creator / Author
              </label>
              <input
                type="text"
                value={creator}
                onChange={(e) => setCreator(e.target.value)}
                className="w-full min-h-[38px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Source / Provider
              </label>
              <input
                type="text"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                className="w-full min-h-[38px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                License
              </label>
              <input
                type="text"
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                className="w-full min-h-[38px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Original Source URL
              </label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="w-full min-h-[38px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Attribution Text
              </label>
              <input
                type="text"
                value={attribution}
                onChange={(e) => setAttribution(e.target.value)}
                className="w-full min-h-[38px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Usage Restrictions / Academic Notes
              </label>
              <input
                type="text"
                value={usageRestrictions}
                onChange={(e) => setUsageRestrictions(e.target.value)}
                className="w-full min-h-[38px] px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[38px] px-5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
