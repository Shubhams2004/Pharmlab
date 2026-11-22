import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  ChevronRight,
  Eye,
  FileText,
  Images,
  Loader2,
  Search,
  Upload
} from 'lucide-react';
import { useLibraryNavigation } from '../context/LibraryNavigationContext';
import { getAllBooks, searchAllBooks } from '../modules/knowledge-library/libraryDb';
import {
  BookDepartmentTag,
  CrossBookSearchResult,
  LibraryBookMeta
} from '../modules/knowledge-library/types';
import ImageViewerModal from '../modules/visual-library/ImageViewerModal';
import VisualThumbnail from '../modules/visual-library/VisualThumbnail';
import { resolveAcademicContextForVisual } from '../modules/visual-library/academicRegistry';
import { ACADEMIC_DOMAIN_LABELS } from '../modules/visual-library/academicTypes';
import {
  CATEGORY_LABELS,
  DepartmentId,
  VisualMediaItem
} from '../modules/visual-library/types';
import {
  deleteVisual,
  getAllVisuals,
  getVisualsForContext
} from '../modules/visual-library/visualDb';

interface ResourceConnectorProps {
  department: DepartmentId;
  topic?: string;
  experiment?: string;
  equipment?: string;
  defaultSearchQuery?: string;
  title?: string;
}

export default function ResourceConnector({
  department,
  topic,
  experiment,
  equipment,
  defaultSearchQuery = '',
  title = 'Linked Visuals & Textbook References'
}: ResourceConnectorProps) {
  const { openKnowledgeLibrary, openVisualLibrary } = useLibraryNavigation();

  const [visuals, setVisuals] = useState<VisualMediaItem[]>([]);
  const [allVisuals, setAllVisuals] = useState<VisualMediaItem[]>([]);
  const [viewerItem, setViewerItem] = useState<VisualMediaItem | null>(null);
  const [loadingVisuals, setLoadingVisuals] = useState(true);

  const [books, setBooks] = useState<LibraryBookMeta[]>([]);
  const [query, setQuery] = useState(defaultSearchQuery);
  const [textResults, setTextResults] = useState<CrossBookSearchResult[]>([]);
  const [searchingBooks, setSearchingBooks] = useState(false);

  useEffect(() => {
    setQuery(defaultSearchQuery);
  }, [defaultSearchQuery]);

  useEffect(() => {
    let cancelled = false;
    setLoadingVisuals(true);
    Promise.all([
      getVisualsForContext({ department, topic, experiment, equipment }),
      getAllVisuals(),
      getAllBooks()
    ])
      .then(([contextItems, completeVisuals, storedBooks]) => {
        if (cancelled) return;
        setVisuals(contextItems.slice(0, 4));
        setAllVisuals(completeVisuals);
        setBooks(storedBooks);
      })
      .catch(() => {
        if (!cancelled) {
          setVisuals([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingVisuals(false);
      });

    return () => {
      cancelled = true;
    };
  }, [department, topic, experiment, equipment]);

  useEffect(() => {
    let cancelled = false;
    const trimmed = query.trim();
    if (trimmed.length < 2 || books.every((b) => !b.hasSearchableText)) {
      setTextResults([]);
      setSearchingBooks(false);
      return;
    }

    setSearchingBooks(true);
    searchAllBooks(trimmed, department as BookDepartmentTag, 2)
      .then((res) => {
        if (!cancelled) setTextResults(res);
      })
      .catch(() => {
        if (!cancelled) setTextResults([]);
      })
      .finally(() => {
        if (!cancelled) setSearchingBooks(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query, department, books]);

  const deptBooks = books.filter(
    (b) => b.department === department || b.department === 'all' || !b.department
  );

  return (
    <section
      aria-label={title}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm dark:shadow-none"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            Connected Reference Workspace
          </p>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {title}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => openVisualLibrary({ department })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
          >
            <Images className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Visual Library</span>
          </button>
          <button
            type="button"
            onClick={() => openKnowledgeLibrary()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Knowledge Library</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Linked Visual Library Plates */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Related Scientific Visuals ({visuals.length})
            </span>
            <button
              type="button"
              onClick={() => openVisualLibrary({ department, query: topic })}
              className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
            >
              <span>Explore All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loadingVisuals ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="h-24 rounded-xl bg-slate-100 dark:bg-slate-950 animate-pulse"
                />
              ))}
            </div>
          ) : visuals.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between gap-3">
              <span>No custom visuals tagged for this topic yet.</span>
              <button
                type="button"
                onClick={() => openVisualLibrary({ department })}
                className="text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap hover:underline"
              >
                Add Image
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {visuals.map((item) => {
                const ctx = resolveAcademicContextForVisual(item);
                const pinCount = ctx.annotations.length;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setViewerItem(item)}
                    className="group flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-colors text-left"
                  >
                    <VisualThumbnail
                      item={item}
                      className="w-16 h-12 rounded-lg shrink-0"
                      imgClassName="w-full h-full object-contain p-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {ACADEMIC_DOMAIN_LABELS[ctx.domain].split(' & ')[0]}
                        {pinCount > 0 ? ` · ${pinCount} Pins` : ` · ${CATEGORY_LABELS[item.category]}`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Textbook Search & Direct PDF Page Jump */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Uploaded Textbook Passages ({books.length}{' '}
              {books.length === 1 ? 'book' : 'books'})
            </span>
            {deptBooks.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  openKnowledgeLibrary({
                    bookId: deptBooks[0].id,
                    pageNumber: deptBooks[0].lastReadPage || 1
                  })
                }
                className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium hover:underline truncate max-w-[190px]"
              >
                <FileText className="w-3 h-3 shrink-0" />
                <span className="truncate">{deptBooks[0].title}</span>
              </button>
            )}
          </div>

          {books.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Upload a pharmaceutical textbook PDF in Knowledge Library to search passages for{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {query || topic || 'this topic'}
                </strong>{' '}
                directly from this bench.
              </div>
              <button
                type="button"
                onClick={() => openKnowledgeLibrary()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold whitespace-nowrap shrink-0"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload PDF</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search uploaded PDFs for this experiment or concept..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {searchingBooks ? (
                <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  <span>Searching indexed textbook pages...</span>
                </div>
              ) : textResults.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {textResults.slice(0, 3).map(({ book, matches }) => {
                    const top = matches[0];
                    return (
                      <div
                        key={`${book.id}_${top.pageNumber}`}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {book.title}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              openKnowledgeLibrary({
                                bookId: book.id,
                                pageNumber: top.pageNumber,
                                searchQuery: query
                              })
                            }
                            className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap hover:underline shrink-0"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Open Page {top.pageNumber}</span>
                          </button>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {top.beforeContext}
                          <mark className="bg-amber-300/60 dark:bg-amber-500/35 text-slate-900 dark:text-amber-100 px-0.5 rounded font-semibold">
                            {top.matchedText}
                          </mark>
                          {top.afterContext}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 py-1">
                  {query.trim().length < 2
                    ? 'Enter at least 2 characters to search across your uploaded PDFs.'
                    : `No passages matched "${query}" in your uploaded textbooks.`}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <ImageViewerModal
        item={viewerItem}
        allVisuals={allVisuals}
        onClose={() => setViewerItem(null)}
        onSelectVisual={(item) => setViewerItem(item)}
        onUpdated={(updated) => {
          setAllVisuals((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
          setVisuals((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
        }}
        onDelete={async (id) => {
          await deleteVisual(id);
          setAllVisuals((prev) => prev.filter((v) => v.id !== id));
          setVisuals((prev) => prev.filter((v) => v.id !== id));
        }}
      />
    </section>
  );
}
