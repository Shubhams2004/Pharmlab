import React, { useState } from 'react';
import {
  ArrowRight,
  BookmarkCheck,
  Clock,
  ExternalLink,
  FolderPlus,
  Link2,
  NotebookPen,
  Plus,
  Trash2
} from 'lucide-react';
import { sanitizeHttpUrl } from '../resource-hub/utils';
import { PHARMACOPOEIA_DIRECTORY } from './pharmacopoeiaCatalog';
import {
  CLASSIFICATION_LABELS,
  PharmacopoeiaStudyCollection,
  PharmacopoeiaUserStore,
  UserSavedLink
} from './types';

interface PharmacopoeiaBookmarksProps {
  userStore: PharmacopoeiaUserStore;
  onSelectEntry: (entryId: string) => void;
  onToggleBookmark: (entryId: string) => Promise<void>;
  onAddCustomLink: (link: UserSavedLink) => Promise<void>;
  onDeleteCustomLink: (linkId: string) => Promise<void>;
  onCreateCollection: (col: PharmacopoeiaStudyCollection) => Promise<void>;
  onToggleEntryInCollection: (collectionId: string, entryId: string) => Promise<void>;
  onDeleteCollection: (collectionId: string) => Promise<void>;
}

export default function PharmacopoeiaBookmarks({
  userStore,
  onSelectEntry,
  onToggleBookmark,
  onAddCustomLink,
  onDeleteCustomLink,
  onCreateCollection,
  onToggleEntryInCollection,
  onDeleteCollection
}: PharmacopoeiaBookmarksProps) {
  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');

  const [linkEntryId, setLinkEntryId] = useState('pc_ip');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkCategory, setLinkCategory] = useState<UserSavedLink['category']>('monograph_portal');
  const [linkNote, setLinkNote] = useState('');

  const bookmarkedEntries = PHARMACOPOEIA_DIRECTORY.filter((e) =>
    userStore.bookmarkedIds.includes(e.id)
  );
  const recentEntries = userStore.recentlyAccessed
    .map((r) => ({
      entry: PHARMACOPOEIA_DIRECTORY.find((e) => e.id === r.entryId),
      accessedAt: r.accessedAt
    }))
    .filter((item): item is { entry: (typeof PHARMACOPOEIA_DIRECTORY)[number]; accessedAt: number } =>
      Boolean(item.entry)
    );

  const entriesWithNotes = PHARMACOPOEIA_DIRECTORY.filter(
    (e) => (userStore.notesByEntryId[e.id] || '').trim().length > 0
  );

  const handleCreateCollectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    const now = Date.now();
    await onCreateCollection({
      id: `col_${now}_${Math.random().toString(36).slice(2, 6)}`,
      name: newColName.trim(),
      description: newColDesc.trim(),
      entryIds: [],
      createdAt: now,
      updatedAt: now
    });
    setNewColName('');
    setNewColDesc('');
  };

  const handleAddLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const safe = sanitizeHttpUrl(linkUrl);
    if (!safe || !linkTitle.trim()) return;
    await onAddCustomLink({
      id: `link_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      entryId: linkEntryId,
      title: linkTitle.trim(),
      url: safe,
      category: linkCategory,
      note: linkNote.trim() || undefined,
      createdAt: Date.now()
    });
    setLinkTitle('');
    setLinkUrl('');
    setLinkNote('');
  };

  return (
    <div className="space-y-6">
      {/* Bookmarks & Recently Accessed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookmarkCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Bookmarked Compendia</span>
            </h2>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
              {bookmarkedEntries.length}
            </span>
          </div>

          {bookmarkedEntries.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Bookmark any pharmacopoeia or Martindale reference from the directory or detail page for quick revision access.
            </p>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 overflow-hidden">
              {bookmarkedEntries.map((entry) => (
                <div key={entry.id} className="p-3 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onSelectEntry(entry.id)}
                    className="min-w-0 text-left group flex-1"
                  >
                    <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                      {entry.fullName} ({entry.abbreviation})
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {CLASSIFICATION_LABELS[entry.classification]} · {entry.countryOrRegion}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleBookmark(entry.id)}
                    className="min-h-[34px] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 whitespace-nowrap"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Recently Accessed</span>
            </h2>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
              {recentEntries.length}
            </span>
          </div>

          {recentEntries.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              References you inspect will appear here with access timestamps stored locally in your browser.
            </p>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 overflow-hidden">
              {recentEntries.slice(0, 6).map(({ entry, accessedAt }) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => onSelectEntry(entry.id)}
                  className="w-full p-3 flex items-center justify-between gap-3 text-left hover:bg-white dark:hover:bg-slate-900 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {entry.fullName} ({entry.abbreviation})
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {entry.issuingOrganization}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                    {new Date(accessedAt).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Study Collections */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Study Collections</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Group pharmacopoeias and reference books by exam unit, lab practical, or regulatory focus.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateCollectionSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <input
            type="text"
            required
            value={newColName}
            onChange={(e) => setNewColName(e.target.value)}
            placeholder="New collection title (e.g., Sem I Limit Tests & Assays)"
            className="sm:col-span-4 min-h-[40px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
          />
          <input
            type="text"
            value={newColDesc}
            onChange={(e) => setNewColDesc(e.target.value)}
            placeholder="Short description (optional)"
            className="sm:col-span-6 min-h-[40px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
          />
          <button
            type="submit"
            className="sm:col-span-2 min-h-[40px] px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create</span>
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userStore.collections.map((col) => (
            <div
              key={col.id}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{col.name}</h3>
                  {col.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{col.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteCollection(col.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                  aria-label={`Delete collection ${col.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {PHARMACOPOEIA_DIRECTORY.map((entry) => {
                  const active = col.entryIds.includes(entry.id);
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => onToggleEntryInCollection(col.id, entry.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-emerald-500/50'
                      }`}
                    >
                      {entry.abbreviation}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Saved Custom Reference Links & Personal Notes Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Link2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Saved Custom Reference Links</span>
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {userStore.customLinks.length}
            </span>
          </div>

          <form onSubmit={handleAddLinkSubmit} className="space-y-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={linkEntryId}
                onChange={(e) => setLinkEntryId(e.target.value)}
                aria-label="Target pharmacopoeia"
                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              >
                {PHARMACOPOEIA_DIRECTORY.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.abbreviation} — {entry.fullName}
                  </option>
                ))}
              </select>
              <select
                value={linkCategory}
                onChange={(e) => setLinkCategory(e.target.value as UserSavedLink['category'])}
                aria-label="Link category"
                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              >
                <option value="monograph_portal">Monograph / Chapter Portal</option>
                <option value="amendment_notice">Amendment / Revision Notice</option>
                <option value="institutional_access">University Library Access</option>
                <option value="study_guide">Study Guide / Lecture Link</option>
                <option value="other">Other Official Resource</option>
              </select>
            </div>
            <input
              type="text"
              required
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              placeholder="Link title (e.g., University Library USP-NF Proxy)"
              className="w-full min-h-[38px] px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
            />
            <div className="flex gap-2">
              <input
                type="url"
                required
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 min-h-[38px] px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold whitespace-nowrap shrink-0"
              >
                Save Link
              </button>
            </div>
          </form>

          {userStore.customLinks.length > 0 && (
            <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 overflow-hidden">
              {userStore.customLinks.map((lnk) => {
                const entry = PHARMACOPOEIA_DIRECTORY.find((e) => e.id === lnk.entryId);
                const safe = sanitizeHttpUrl(lnk.url);
                return (
                  <div key={lnk.id} className="p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        {entry?.abbreviation || 'Reference'} · {lnk.category.replace('_', ' ')}
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {lnk.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {safe && (
                        <a
                          href={safe}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg text-emerald-700 dark:text-emerald-400 hover:bg-white dark:hover:bg-slate-900"
                          aria-label={`Open ${lnk.title}`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => onDeleteCustomLink(lnk.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                        aria-label={`Delete ${lnk.title}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <NotebookPen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Personal Reference Notes</span>
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {entriesWithNotes.length}
            </span>
          </div>

          {entriesWithNotes.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Open any pharmacopoeia detail workspace to record personal study notes, library call numbers, or exam reminders.
            </p>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 overflow-hidden">
              {entriesWithNotes.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => onSelectEntry(entry.id)}
                  className="w-full p-3.5 text-left hover:bg-white dark:hover:bg-slate-900 flex items-start justify-between gap-3 transition-colors"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      {entry.fullName} ({entry.abbreviation})
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {userStore.notesByEntryId[entry.id]}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
