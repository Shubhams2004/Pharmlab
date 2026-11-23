import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Box,
  Check,
  Clock,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  FolderOpen,
  FolderPlus,
  Globe,
  Info,
  Library,
  Link2,
  Loader2,
  Plus,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X
} from 'lucide-react';
import { useLibraryNavigation } from '../../context/LibraryNavigationContext';
import PdfReader from '../knowledge-library/PdfReader';
import { getAllBooks, saveBookPackage } from '../knowledge-library/libraryDb';
import { processPdfFile } from '../knowledge-library/pdfExtractor';
import {
  BookDepartmentTag,
  LibraryBookMeta,
  ProcessingProgress
} from '../knowledge-library/types';
import { sanitizeHttpUrl } from '../resource-hub/utils';
import PharmacopoeiaWorkspace from './PharmacopoeiaWorkspace';
import ReferenceDetailModal from './ReferenceDetailModal';
import {
  addAcademicConnection,
  addPharmacopoeiaSectionLink,
  createCollection,
  deleteCollection,
  deleteReference,
  findDuplicateReference,
  findExistingLibraryBookForFile,
  getAllCollections,
  getAllPharmacopoeiaProfiles,
  getAllReferences,
  linkPdfToReference,
  markReferenceOpened,
  removeAcademicConnection,
  removePharmacopoeiaSectionLink,
  renameCollection,
  toggleBookmark,
  toggleCollectionMembership,
  unlinkPdfFromReference,
  updateReference,
  upsertReference
} from './referenceDb';
import {
  discoverResearchPapers,
  DiscoverySourceFilter,
  tryFetchOpenAccessPdf
} from './researchDiscovery';
import {
  ACCESS_STATUS_LABELS,
  AcademicConnection,
  COLLECTION_TYPE_LABELS,
  CustomCollection,
  PharmacopoeiaProfileMeta,
  PharmacopoeiaSectionLink,
  ReferenceCollectionType,
  ReferenceItem,
  ReferenceNavSection,
  ResearchDiscoveryCandidate,
  STANDARD_CATEGORIES,
  TEXTBOOK_SUBJECTS,
  UnifiedSearchHit
} from './types';
import { runUnifiedReferenceSearch } from './unifiedSearch';

export interface ReferenceCenterJumpTarget {
  section?: ReferenceNavSection | null;
  referenceId?: string | null;
  query?: string | null;
  nonce: number;
}

interface ReferenceCenterModuleProps {
  jumpTarget?: ReferenceCenterJumpTarget;
}

type MyLibrarySubTab =
  | 'my_references'
  | 'recently_opened'
  | 'bookmarked'
  | 'imported_docs'
  | 'external_resources'
  | 'recently_read'
  | 'collections'
  | 'subject_categories';

const NAV_TABS: Array<{ id: ReferenceNavSection; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'pharmacopoeias', label: 'Pharmacopoeias' },
  { id: 'textbooks', label: 'Textbooks' },
  { id: 'handbooks', label: 'Handbooks' },
  { id: 'standards', label: 'Standards & Guidelines' },
  { id: 'research', label: 'Research & Publications' },
  { id: 'my_library', label: 'My Library' }
];

const QUICK_UNIFIED_QUERIES = [
  'Paracetamol',
  'Indian Pharmacopoeia',
  'Tortora',
  'Stability testing',
  'Titrimetry',
  'Bioavailability'
];

function mapReferenceToBookDept(ref: ReferenceItem): BookDepartmentTag {
  const s = ref.subject.toLowerCase();
  if (s.includes('anatomy') || s.includes('physiology')) return 'anatomy';
  if (s.includes('pharmaceutics') || s.includes('technology')) return 'general_pharmacy';
  if (s.includes('inorganic') || s.includes('analysis')) return 'inorganic';
  if (s.includes('pharmacognosy')) return 'pharmacognosy';
  if (s.includes('psychology')) return 'psychology';
  if (s.includes('python') || s.includes('data')) return 'python';
  return 'all';
}

export default function ReferenceCenterModule({ jumpTarget }: ReferenceCenterModuleProps) {
  const { setWorkspaceSection, recordActivity, openAsset3DEngine } = useLibraryNavigation();

  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [collections, setCollections] = useState<CustomCollection[]>([]);
  const [pharmaProfiles, setPharmaProfiles] = useState<PharmacopoeiaProfileMeta[]>([]);
  const [books, setBooks] = useState<LibraryBookMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerNotice, setBannerNotice] = useState<{
    type: 'info' | 'warning' | 'error';
    message: string;
  } | null>(null);

  const [activeNav, setActiveNav] = useState<ReferenceNavSection>('overview');
  const [activePharmaId, setActivePharmaId] = useState<string | null>(null);

  // Unified Search state
  const [unifiedQuery, setUnifiedQuery] = useState('');
  const [unifiedCollectionFilter, setUnifiedCollectionFilter] = useState<
    ReferenceCollectionType | 'all'
  >('all');
  const [unifiedHits, setUnifiedHits] = useState<UnifiedSearchHit[]>([]);
  const [searchingUnified, setSearchingUnified] = useState(false);

  // Textbooks / Handbooks / Standards filters
  const [textbookSubjectFilter, setTextbookSubjectFilter] = useState<string>('all');
  const [standardCategoryFilter, setStandardCategoryFilter] = useState<string>('all');
  const [standardAuthorityFilter, setStandardAuthorityFilter] = useState<string>('all');

  // Research Discovery & Saved Papers state
  const [researchSubTab, setResearchSubTab] = useState<'discover' | 'saved'>('discover');
  const [researchQuery, setResearchQuery] = useState('Paracetamol pharmacokinetics bioavailability');
  const [researchSource, setResearchSource] = useState<DiscoverySourceFilter>('all');
  const [discoveryResults, setDiscoveryResults] = useState<ResearchDiscoveryCandidate[]>([]);
  const [discoveryErrors, setDiscoveryErrors] = useState<
    Array<{ source: string; message: string }>
  >([]);
  const [discovering, setDiscovering] = useState(false);
  const [fetchingOaId, setFetchingOaId] = useState<string | null>(null);

  // My Library Resource Management state
  const [myLibTab, setMyLibTab] = useState<MyLibrarySubTab>('my_references');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('all');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editingColName, setEditingColName] = useState('');

  // Inline PDF Reader state
  const [readerState, setReaderState] = useState<{
    book: LibraryBookMeta;
    pageNumber?: number;
    searchQuery?: string;
    nonce: number;
  } | null>(null);

  // Modal state
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    mode: 'view' | 'create';
    collectionType: ReferenceCollectionType;
    referenceId: string | null;
    initialTab: 'details' | 'pdf' | 'topics';
  }>({
    isOpen: false,
    mode: 'view',
    collectionType: 'textbook',
    referenceId: null,
    initialTab: 'details'
  });

  // PDF Import progress
  const [importingForId, setImportingForId] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<ProcessingProgress | null>(null);
  const quickUploadRef = useRef<HTMLInputElement | null>(null);
  const [pendingUploadRef, setPendingUploadRef] = useState<ReferenceItem | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [refs, cols, profiles, storedBooks] = await Promise.all([
        getAllReferences(),
        getAllCollections(),
        getAllPharmacopoeiaProfiles(),
        getAllBooks()
      ]);
      setReferences(refs);
      setCollections(cols);
      setPharmaProfiles(profiles);
      setBooks(storedBooks);
    } catch (err) {
      setBannerNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to load Reference Center storage.'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const appliedJumpNonceRef = useRef<number>(0);

  // Apply external jump target (e.g. from ResourceConnector or CommandPalette) once per nonce
  useEffect(() => {
    if (!jumpTarget || jumpTarget.nonce === 0) return;
    if (jumpTarget.referenceId && references.length === 0) return;
    if (appliedJumpNonceRef.current === jumpTarget.nonce) return;
    appliedJumpNonceRef.current = jumpTarget.nonce;

    setReaderState(null);
    if (jumpTarget.query) {
      setUnifiedQuery(jumpTarget.query);
    }
    if (jumpTarget.referenceId) {
      const target = references.find((r) => r.id === jumpTarget.referenceId);
      if (target?.collectionType === 'pharmacopoeia') {
        setActiveNav('pharmacopoeias');
        setActivePharmaId(target.id);
      } else if (target) {
        setActiveNav(
          target.collectionType === 'textbook'
            ? 'textbooks'
            : target.collectionType === 'handbook'
              ? 'handbooks'
              : target.collectionType === 'standard'
                ? 'standards'
                : 'research'
        );
        setDetailModal({
          isOpen: true,
          mode: 'view',
          collectionType: target.collectionType,
          referenceId: target.id,
          initialTab: 'details'
        });
      }
      return;
    }
    if (jumpTarget.section) {
      setActiveNav(jumpTarget.section);
      setActivePharmaId(null);
    }
  }, [jumpTarget?.nonce, jumpTarget?.referenceId, jumpTarget?.section, jumpTarget?.query, references]);

  // Keep workspace header breadcrumb synced
  useEffect(() => {
    if (readerState) return;
    const activeTabLabel = NAV_TABS.find((t) => t.id === activeNav)?.label || 'Overview';
    const pharma = activePharmaId ? references.find((r) => r.id === activePharmaId) : null;
    setWorkspaceSection(
      'Pharmaceutical Reference Center',
      pharma ? pharma.shortTitle || pharma.title : activeTabLabel
    );
  }, [activeNav, activePharmaId, readerState, references, setWorkspaceSection]);

  // Unified Search execution
  useEffect(() => {
    let cancelled = false;
    const q = unifiedQuery.trim();
    if (q.length < 2) {
      setUnifiedHits([]);
      setSearchingUnified(false);
      return;
    }

    setSearchingUnified(true);
    const timer = window.setTimeout(() => {
      runUnifiedReferenceSearch(q, references, pharmaProfiles, {
        collectionFilter: unifiedCollectionFilter
      })
        .then((hits) => {
          if (!cancelled) setUnifiedHits(hits);
        })
        .catch(() => {
          if (!cancelled) setUnifiedHits([]);
        })
        .finally(() => {
          if (!cancelled) setSearchingUnified(false);
        });
    }, 140);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [unifiedQuery, unifiedCollectionFilter, references, pharmaProfiles]);

  const bookMap = useMemo(() => new Map(books.map((b) => [b.id, b])), [books]);

  const handleOpenReference = useCallback(
    async (ref: ReferenceItem) => {
      const updated = await markReferenceOpened(ref.id);
      if (updated) {
        setReferences((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      }
      recordActivity({
        key: `ref:${ref.id}`,
        kind: 'department',
        title: ref.shortTitle || ref.title,
        subtitle: `${COLLECTION_TYPE_LABELS[ref.collectionType]} · ${ref.subject}`,
        moduleId: 'reference_center'
      });

      if (ref.collectionType === 'pharmacopoeia') {
        setActiveNav('pharmacopoeias');
        setActivePharmaId(ref.id);
      } else {
        setDetailModal({
          isOpen: true,
          mode: 'view',
          collectionType: ref.collectionType,
          referenceId: ref.id,
          initialTab: 'details'
        });
      }
    },
    [recordActivity]
  );

  const handleOpenPdfReader = useCallback(
    (book: LibraryBookMeta, pageNumber?: number, searchQuery?: string) => {
      recordActivity({
        key: `book:${book.id}`,
        kind: 'book',
        title: book.title,
        subtitle: `Page ${pageNumber || book.lastReadPage || 1} of ${book.pageCount}`,
        moduleId: 'reference_center',
        bookId: book.id,
        pageNumber: pageNumber || book.lastReadPage || 1
      });
      setReaderState({
        book,
        pageNumber: pageNumber || book.lastReadPage || 1,
        searchQuery,
        nonce: Date.now()
      });
    },
    [recordActivity]
  );

  const handleImportPdfForReference = useCallback(
    async (ref: ReferenceItem, file: File) => {
      setBannerNotice(null);
      setImportingForId(ref.id);
      setImportProgress({
        stage: 'reading',
        currentPage: 0,
        totalPages: 0,
        percent: 5,
        message: `Checking local library for "${file.name}"...`
      });

      try {
        // Zero duplicate storage: reuse existing Knowledge Library PDF if identical filename & byte size
        const existingBook = await findExistingLibraryBookForFile(file);
        let bookIdToLink: string;

        if (existingBook) {
          bookIdToLink = existingBook.id;
          setBannerNotice({
            type: 'info',
            message: `Linked existing Knowledge Library PDF "${existingBook.title}" without storing a duplicate copy.`
          });
        } else {
          const docCategory =
            ref.collectionType === 'research'
              ? 'research'
              : ref.collectionType === 'standard' || ref.collectionType === 'pharmacopoeia'
                ? 'manual'
                : 'textbook';
          const pkg = await processPdfFile(
            file,
            docCategory,
            (p) => setImportProgress(p),
            mapReferenceToBookDept(ref)
          );
          await saveBookPackage(pkg.meta, pkg.fileBuffer, pkg.pages);
          setBooks((prev) => [pkg.meta, ...prev]);
          bookIdToLink = pkg.meta.id;
          setBannerNotice({
            type: 'info',
            message: `Indexed "${pkg.meta.title}" (${pkg.meta.pageCount} pages) locally and linked to "${ref.title}".`
          });
        }

        const updatedRef = await linkPdfToReference(ref.id, bookIdToLink);
        if (updatedRef) {
          setReferences((prev) => prev.map((r) => (r.id === updatedRef.id ? updatedRef : r)));
        }
      } catch (err) {
        setBannerNotice({
          type: 'error',
          message: err instanceof Error ? err.message : 'Failed to import PDF document.'
        });
      } finally {
        setImportingForId(null);
        setImportProgress(null);
      }
    },
    []
  );

  const handleLinkExistingBook = useCallback(async (refId: string, bookId: string) => {
    const updated = await linkPdfToReference(refId, bookId);
    if (updated) {
      setReferences((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    }
  }, []);

  const handleUnlinkBook = useCallback(async (refId: string) => {
    const updated = await unlinkPdfFromReference(refId);
    if (updated) {
      setReferences((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    }
  }, []);

  const handleUpdateReference = useCallback(
    async (id: string, patch: Partial<ReferenceItem>) => {
      const updated = await updateReference(id, patch);
      if (updated) {
        setReferences((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      }
    },
    []
  );

  const handleCreateReference = useCallback(async (item: ReferenceItem) => {
    const { saved, duplicateOf } = await upsertReference(item);
    if (duplicateOf) {
      setBannerNotice({
        type: 'warning',
        message: `"${duplicateOf.title}" is already present in your Reference Center (duplicate prevented).`
      });
      return duplicateOf;
    }
    setReferences((prev) => [saved, ...prev]);
    setBannerNotice({
      type: 'info',
      message: `Added "${saved.title}" to Reference Center.`
    });
    return saved;
  }, []);

  const handleDeleteReference = useCallback(async (id: string) => {
    await deleteReference(id);
    setReferences((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleToggleBookmark = useCallback(async (id: string) => {
    const updated = await toggleBookmark(id);
    if (updated) {
      setReferences((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    }
  }, []);

  const handleToggleCollection = useCallback(async (refId: string, colId: string) => {
    const updated = await toggleCollectionMembership(refId, colId);
    if (updated) {
      setReferences((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    }
  }, []);

  const handleAddConnection = useCallback(async (refId: string, conn: AcademicConnection) => {
    const updated = await addAcademicConnection(refId, conn);
    if (updated) {
      setReferences((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    }
  }, []);

  const handleRemoveConnection = useCallback(async (refId: string, connId: string) => {
    const updated = await removeAcademicConnection(refId, connId);
    if (updated) {
      setReferences((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    }
  }, []);

  const handleAddSectionLink = useCallback(
    async (refId: string, link: PharmacopoeiaSectionLink) => {
      const updated = await addPharmacopoeiaSectionLink(refId, link);
      if (updated) {
        setPharmaProfiles((prev) =>
          prev.map((p) => (p.referenceId === updated.referenceId ? updated : p))
        );
      }
    },
    []
  );

  const handleRemoveSectionLink = useCallback(async (refId: string, linkId: string) => {
    const updated = await removePharmacopoeiaSectionLink(refId, linkId);
    if (updated) {
      setPharmaProfiles((prev) =>
        prev.map((p) => (p.referenceId === updated.referenceId ? updated : p))
      );
    }
  }, []);

  // Research Paper Discovery & Save
  const runResearchDiscovery = useCallback(
    async (overrideQuery?: string) => {
      const q = (overrideQuery ?? researchQuery).trim();
      if (q.length < 2) return;
      setDiscovering(true);
      setDiscoveryErrors([]);
      try {
        const res = await discoverResearchPapers(q, researchSource);
        setDiscoveryResults(res.candidates);
        setDiscoveryErrors(res.errors);
      } catch (err) {
        setDiscoveryErrors([
          {
            source: 'Discovery',
            message: err instanceof Error ? err.message : 'Unable to query repositories.'
          }
        ]);
      } finally {
        setDiscovering(false);
      }
    },
    [researchQuery, researchSource]
  );

  const handleSaveResearchCandidate = useCallback(
    async (cand: ResearchDiscoveryCandidate, withOaPdfAttempt = false) => {
      const newRef: ReferenceItem = {
        id: `res_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        collectionType: 'research',
        title: cand.title,
        authors: cand.authors,
        issuingAuthority: cand.journal,
        publicationYear: cand.publicationYear,
        subject: 'Pharmaceutical Research & Literature',
        documentType: cand.isOpenAccess ? 'Open-Access Article' : 'Indexed Publication',
        description: cand.abstract
          ? cand.abstract.slice(0, 220) + (cand.abstract.length > 220 ? '…' : '')
          : `${cand.journal}${cand.publicationYear ? ` (${cand.publicationYear})` : ''}`,
        abstract: cand.abstract,
        sourceName: cand.source,
        accessStatus: cand.isOpenAccess ? 'open_access_portal' : 'licensed_external',
        licenseInfo: cand.licenseInfo,
        externalUrl: cand.externalUrl,
        pdfUrl: cand.oaPdfUrl,
        doi: cand.doi,
        pmid: cand.pmid,
        pmcid: cand.pmcid,
        tags: [cand.source, cand.journal, ...(cand.isOpenAccess ? ['Open Access'] : [])].filter(
          Boolean
        ),
        bookmarked: false,
        customCollectionIds: ['col_research_project'],
        academicConnections: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastOpenedAt: null
      };

      const { saved, duplicateOf } = await upsertReference(newRef);
      if (!duplicateOf) {
        setReferences((prev) => [saved, ...prev]);
        setBannerNotice({
          type: 'info',
          message: `Saved "${saved.title}" to Research & Publications.`
        });
      } else {
        setBannerNotice({
          type: 'warning',
          message: `"${duplicateOf.title}" is already saved in your Reference Center.`
        });
      }

      if (withOaPdfAttempt && cand.oaPdfUrl) {
        setFetchingOaId(cand.id);
        try {
          const pdfFile = await tryFetchOpenAccessPdf(cand.oaPdfUrl, cand.title);
          await handleImportPdfForReference(saved, pdfFile);
        } catch (err) {
          setBannerNotice({
            type: 'warning',
            message:
              err instanceof Error
                ? err.message
                : 'Open-access PDF could not be fetched directly; use the official OA link and upload the PDF manually.'
          });
        } finally {
          setFetchingOaId(null);
        }
      }
    },
    [handleImportPdfForReference]
  );

  // Derived Collections
  const pharmacopoeias = useMemo(
    () => references.filter((r) => r.collectionType === 'pharmacopoeia'),
    [references]
  );
  const textbooks = useMemo(
    () => references.filter((r) => r.collectionType === 'textbook'),
    [references]
  );
  const handbooks = useMemo(
    () => references.filter((r) => r.collectionType === 'handbook'),
    [references]
  );
  const standards = useMemo(
    () => references.filter((r) => r.collectionType === 'standard'),
    [references]
  );
  const researchPapers = useMemo(
    () => references.filter((r) => r.collectionType === 'research'),
    [references]
  );

  const textbookGroups = useMemo(() => {
    const filtered =
      textbookSubjectFilter === 'all'
        ? textbooks
        : textbooks.filter((t) => t.subject === textbookSubjectFilter);

    const map = new Map<string, ReferenceItem[]>();
    for (const s of TEXTBOOK_SUBJECTS) {
      map.set(s, []);
    }
    for (const item of filtered) {
      const arr = map.get(item.subject) || [];
      arr.push(item);
      map.set(item.subject, arr);
    }
    return Array.from(map.entries()).filter(([, items]) => items.length > 0);
  }, [textbooks, textbookSubjectFilter]);

  const standardAuthorities = useMemo(() => {
    const set = new Set<string>();
    standards.forEach((s) => {
      if (s.issuingAuthority) set.add(s.issuingAuthority);
    });
    return Array.from(set).sort();
  }, [standards]);

  const filteredStandards = useMemo(() => {
    return standards.filter((s) => {
      const matchCat =
        standardCategoryFilter === 'all' ||
        s.subCategory === standardCategoryFilter ||
        s.tags.some((t) => t.toLowerCase() === standardCategoryFilter.toLowerCase());
      const matchAuth =
        standardAuthorityFilter === 'all' || s.issuingAuthority === standardAuthorityFilter;
      return matchCat && matchAuth;
    });
  }, [standards, standardCategoryFilter, standardAuthorityFilter]);

  const recentlyOpenedRefs = useMemo(
    () =>
      [...references]
        .filter((r) => Boolean(r.lastOpenedAt))
        .sort((a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0)),
    [references]
  );
  const bookmarkedRefs = useMemo(
    () => references.filter((r) => r.bookmarked),
    [references]
  );
  const externalRefs = useMemo(
    () => references.filter((r) => Boolean(r.externalUrl)),
    [references]
  );
  const unlinkedBooks = useMemo(() => {
    const linkedIds = new Set(references.map((r) => r.linkedBookId).filter(Boolean));
    return books.filter((b) => !linkedIds.has(b.id));
  }, [books, references]);

  const activeModalRef = useMemo(
    () =>
      detailModal.referenceId
        ? references.find((r) => r.id === detailModal.referenceId) || null
        : null,
    [detailModal.referenceId, references]
  );

  const handleReaderBack = useCallback(() => {
    setReaderState(null);
    loadAll();
  }, [loadAll]);

  const handleBookProgressChange = useCallback((bookId: string, page: number) => {
    setBooks((prev) =>
      prev.map((b) =>
        b.id === bookId
          ? { ...b, lastReadPage: page, lastOpenedAt: Date.now() }
          : b
      )
    );
  }, []);

  const handleBookMetaChange = useCallback((updated: LibraryBookMeta) => {
    setBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  }, []);

  // If user launched the inline PDF Reader from Reference Center
  if (readerState) {
    return (
      <div className="space-y-4">
        <PdfReader
          book={readerState.book}
          initialPage={readerState.pageNumber}
          initialSearchQuery={readerState.searchQuery}
          jumpNonce={readerState.nonce}
          onBack={handleReaderBack}
          onBookProgressChange={handleBookProgressChange}
          onBookMetaChange={handleBookMetaChange}
        />
      </div>
    );
  }

  const activePharmaRef = activePharmaId
    ? references.find((r) => r.id === activePharmaId) || null
    : null;
  const activePharmaProfile = activePharmaId
    ? pharmaProfiles.find((p) => p.referenceId === activePharmaId) || null
    : null;

  const renderReferenceCard = (item: ReferenceItem) => {
    const linkedBook = item.linkedBookId ? bookMap.get(item.linkedBookId) || null : null;
    const safeUrl = sanitizeHttpUrl(item.externalUrl);
    const colNames = collections
      .filter((c) => item.customCollectionIds.includes(c.id))
      .map((c) => c.name);

    return (
      <article
        key={item.id}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-sm dark:shadow-none transition-colors"
      >
        <div className="space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {COLLECTION_TYPE_LABELS[item.collectionType]}
                </span>
                <span> · </span>
                <span>{item.subject}</span>
                {item.publicationYear ? ` · ${item.publicationYear}` : ''}
              </p>
              <button
                type="button"
                onClick={() => handleOpenReference(item)}
                className="text-left group block w-full mt-1"
              >
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                  {item.title}
                </h3>
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleToggleBookmark(item.id)}
              className={`p-2 rounded-lg border shrink-0 transition-colors ${
                item.bookmarked
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              aria-label={item.bookmarked ? 'Remove bookmark' : 'Bookmark reference'}
            >
              {item.bookmarked ? (
                <BookmarkCheck className="w-4 h-4" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>
          </div>

          {(item.authors || item.issuingAuthority) && (
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
              {item.authors || item.issuingAuthority}
              {item.edition ? ` · ${item.edition}` : ''}
            </p>
          )}

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
            {item.description}
          </p>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {ACCESS_STATUS_LABELS[item.accessStatus]}
            </span>
            {linkedBook
              ? ` · Linked PDF (${linkedBook.pageCount} pp., p. ${linkedBook.lastReadPage || 1})`
              : ''}
            {item.academicConnections.length > 0
              ? ` · ${item.academicConnections.length} linked topics`
              : ''}
            {colNames.length > 0 ? ` · ${colNames.join(', ')}` : ''}
          </p>
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {linkedBook ? (
              <button
                type="button"
                onClick={() => handleOpenPdfReader(linkedBook, linkedBook.lastReadPage || 1)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold whitespace-nowrap"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Read PDF</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setPendingUploadRef(item);
                  quickUploadRef.current?.click();
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Import PDF</span>
              </button>
            )}

            {safeUrl && (
              <a
                href={safeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Source</span>
              </a>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleOpenReference(item)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-semibold text-emerald-700 dark:text-emerald-300 whitespace-nowrap"
          >
            <span>{item.collectionType === 'pharmacopoeia' ? 'Open Workspace' : 'Details'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </article>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Shared hidden file input for 1-click PDF attachment */}
      <input
        ref={quickUploadRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f && pendingUploadRef) {
            handleImportPdfForReference(pendingUploadRef, f);
            setPendingUploadRef(null);
          }
        }}
      />

      {/* Module Header & Unified Search Console */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm dark:shadow-none">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              PharmaLab P1.6 · Browser-Local Pharmaceutical Knowledge &amp; Standards Workspace
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Pharmaceutical Reference Center
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
              Centralized catalog and local PDF workspace for Pharmacopoeias, Reference Textbooks, Handbooks, Official Regulatory Standards, and Peer-Reviewed Research — with zero fabricated data and zero external AI.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => openAsset3DEngine({ query: unifiedQuery.trim() || undefined })}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold whitespace-nowrap"
            >
              <Box className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>3D Asset Engine</span>
            </button>
            <button
              type="button"
              onClick={() =>
                setDetailModal({
                  isOpen: true,
                  mode: 'create',
                  collectionType:
                    activeNav === 'handbooks'
                      ? 'handbook'
                      : activeNav === 'standards'
                        ? 'standard'
                        : 'textbook',
                  referenceId: null,
                  initialTab: 'details'
                })
              }
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Reference</span>
            </button>
          </div>
        </div>

        {/* Unified Search Bar across All Collections + Indexed PDFs */}
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={unifiedQuery}
                onChange={(e) => setUnifiedQuery(e.target.value)}
                placeholder="Unified search across Pharmacopoeias, Textbooks, Standards, Research & imported PDFs (e.g. Paracetamol)..."
                className="w-full min-h-[44px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-9 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
              {unifiedQuery && (
                <button
                  type="button"
                  onClick={() => setUnifiedQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  aria-label="Clear unified search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <select
              value={unifiedCollectionFilter}
              onChange={(e) =>
                setUnifiedCollectionFilter(e.target.value as ReferenceCollectionType | 'all')
              }
              aria-label="Filter unified search by collection"
              className="sm:w-52 min-h-[44px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Collections + PDFs</option>
              <option value="pharmacopoeia">Pharmacopoeias</option>
              <option value="textbook">Textbooks</option>
              <option value="handbook">Handbooks</option>
              <option value="standard">Standards &amp; Guidelines</option>
              <option value="research">Research &amp; Publications</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium mr-1">Try:</span>
            {QUICK_UNIFIED_QUERIES.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setUnifiedQuery(term)}
                className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-slate-700 dark:text-slate-300 font-medium transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav
          aria-label="Reference Center collections"
          className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
        >
          {NAV_TABS.map((tab) => {
            const active = activeNav === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveNav(tab.id);
                  if (tab.id !== 'pharmacopoeias') setActivePharmaId(null);
                }}
                className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </section>

      {/* Status / Duplicate / Import Banner */}
      {bannerNotice && (
        <div
          className={`rounded-xl p-3.5 border flex items-center justify-between gap-3 text-xs sm:text-sm ${
            bannerNotice.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/40 text-rose-700 dark:text-rose-200'
              : bannerNotice.type === 'warning'
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-800 dark:text-amber-200'
                : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-200'
          }`}
        >
          <span className="font-medium">{bannerNotice.message}</span>
          <button
            type="button"
            onClick={() => setBannerNotice(null)}
            className="p-1 opacity-70 hover:opacity-100"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {importingForId && importProgress && (
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/40 space-y-2 text-xs">
          <div className="flex justify-between font-semibold text-emerald-700 dark:text-emerald-300 tabular-nums">
            <span>{importProgress.message}</span>
            <span>{importProgress.percent}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all"
              style={{ width: `${importProgress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Unified Search Results Panel (shown whenever query >= 2 chars) */}
      {unifiedQuery.trim().length >= 2 && (
        <section className="bg-white dark:bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 space-y-4 shadow-sm dark:shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="space-y-0.5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Unified Search Results for &ldquo;{unifiedQuery.trim()}&rdquo;
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Matches verified solely against real metadata, academic topic links, section notes, and locally indexed PDF pages.
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
              {searchingUnified ? 'Searching...' : `${unifiedHits.length} results`}
            </span>
          </div>

          {searchingUnified ? (
            <div className="py-8 flex items-center justify-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Scanning references, pharmacopoeia sections, and indexed PDFs...</span>
            </div>
          ) : unifiedHits.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                No indexed matches found for &ldquo;{unifiedQuery.trim()}&rdquo;.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Import relevant textbook or pharmacopoeia PDFs, or search Research &amp; Publications to discover peer-reviewed literature.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveNav('research');
                  setResearchSubTab('discover');
                  setResearchQuery(unifiedQuery.trim());
                  runResearchDiscovery(unifiedQuery.trim());
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold mt-1"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Search Europe PMC, Crossref &amp; OpenAlex</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {unifiedHits.slice(0, 25).map((hit) => (
                <div
                  key={hit.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      {hit.resourceTypeLabel}
                      <span className="text-slate-400"> · </span>
                      <span className="text-slate-600 dark:text-slate-300">{hit.sourceLabel}</span>
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {hit.title}
                    </p>
                    {hit.snippet && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                        {hit.snippet}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {hit.book && hit.pageNumber && (
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenPdfReader(hit.book!, hit.pageNumber, unifiedQuery.trim())
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold whitespace-nowrap"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Open p. {hit.pageNumber}</span>
                      </button>
                    )}
                    {!hit.book && hit.referenceId && (
                      <button
                        type="button"
                        onClick={() => {
                          const ref = references.find((r) => r.id === hit.referenceId);
                          if (ref) handleOpenReference(ref);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {hit.externalUrl && (
                      <a
                        href={sanitizeHttpUrl(hit.externalUrl) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {loading ? (
        <div className="py-16 flex items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          <span>Loading Pharmaceutical Reference Center...</span>
        </div>
      ) : (
        <>
          {/* 1. OVERVIEW TAB */}
          {activeNav === 'overview' && (
            <div className="space-y-6">
              {/* Compact Metrics Strip */}
              <section className="grid grid-cols-2 lg:grid-cols-5 border-y border-slate-200 dark:border-slate-800 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden">
                {[
                  { label: 'Pharmacopoeias', val: pharmacopoeias.length, tab: 'pharmacopoeias' as const },
                  { label: 'Textbooks', val: textbooks.length, tab: 'textbooks' as const },
                  { label: 'Handbooks', val: handbooks.length, tab: 'handbooks' as const },
                  { label: 'Standards', val: standards.length, tab: 'standards' as const },
                  { label: 'Saved Papers', val: researchPapers.length, tab: 'research' as const }
                ].map((stat) => (
                  <button
                    key={stat.label}
                    type="button"
                    onClick={() => setActiveNav(stat.tab)}
                    className="p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {stat.label}
                    </p>
                    <p className="font-display text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
                      {stat.val}
                    </p>
                  </button>
                ))}
              </section>

              {/* Continue Reading & Recently Opened */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3.5 shadow-sm dark:shadow-none">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Continue Reading (Local PDFs)</span>
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveNav('my_library');
                        setMyLibTab('imported_docs');
                      }}
                      className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      All PDFs ({books.length})
                    </button>
                  </div>
                  {books.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 py-3">
                      Import any textbook, pharmacopoeia, or guideline PDF to read with Table of Contents navigation, full-book search, highlights, and bookmarks.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {books.slice(0, 3).map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => handleOpenPdfReader(b, b.lastReadPage || 1)}
                          className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 flex items-center justify-between gap-3 text-left transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {b.title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                              Page {b.lastReadPage || 1} of {b.pageCount} (
                              {Math.round(((b.lastReadPage || 1) / Math.max(1, b.pageCount)) * 100)}
                              %)
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </section>

                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3.5 shadow-sm dark:shadow-none">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Recently Opened &amp; Bookmarked</span>
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveNav('my_library');
                        setMyLibTab('bookmarked');
                      }}
                      className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Bookmarks ({bookmarkedRefs.length})
                    </button>
                  </div>

                  {recentlyOpenedRefs.length === 0 && bookmarkedRefs.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 py-3">
                      Pharmacopoeias, textbooks, standards, or papers you inspect or bookmark will appear here for quick access.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {(recentlyOpenedRefs.length > 0 ? recentlyOpenedRefs : bookmarkedRefs)
                        .slice(0, 4)
                        .map((ref) => (
                          <button
                            key={ref.id}
                            type="button"
                            onClick={() => handleOpenReference(ref)}
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 flex items-center justify-between gap-3 text-left transition-colors"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                {ref.title}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {COLLECTION_TYPE_LABELS[ref.collectionType]} · {ref.subject}
                              </p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                          </button>
                        ))}
                    </div>
                  )}
                </section>
              </div>

              {/* Pharmacopoeias Quick Grid */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Official Pharmacopoeia Workspaces
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveNav('pharmacopoeias')}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Open Pharmacopoeias
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pharmacopoeias.map(renderReferenceCard)}
                </div>
              </section>

              {/* Custom Collections */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Study Collections
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveNav('my_library');
                      setMyLibTab('collections');
                    }}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Manage Collections
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {collections.map((col) => {
                    const count = references.filter((r) =>
                      r.customCollectionIds.includes(col.id)
                    ).length;
                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => {
                          setSelectedCollectionId(col.id);
                          setActiveNav('my_library');
                          setMyLibTab('collections');
                        }}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-left space-y-1.5 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {col.name}
                          </span>
                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                            {count} items
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {col.description || 'Custom study collection'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {/* 2. PHARMACOPOEIAS TAB */}
          {activeNav === 'pharmacopoeias' && (
            activePharmaRef && activePharmaProfile ? (
              <PharmacopoeiaWorkspace
                reference={activePharmaRef}
                profile={activePharmaProfile}
                books={books}
                collections={collections}
                onBack={() => setActivePharmaId(null)}
                onOpenReader={handleOpenPdfReader}
                onImportPdfForReference={handleImportPdfForReference}
                onLinkExistingBook={handleLinkExistingBook}
                onUnlinkBook={handleUnlinkBook}
                onUpdateReference={handleUpdateReference}
                onToggleBookmark={handleToggleBookmark}
                onToggleCollection={handleToggleCollection}
                onAddSectionLink={handleAddSectionLink}
                onRemoveSectionLink={handleRemoveSectionLink}
                onOpenConnectionsEditor={(ref) =>
                  setDetailModal({
                    isOpen: true,
                    mode: 'view',
                    collectionType: 'pharmacopoeia',
                    referenceId: ref.id,
                    initialTab: 'topics'
                  })
                }
                importingForId={importingForId}
                importProgress={importProgress}
              />
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
                  <Scale className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Select any official Pharmacopoeia below to open its 12-section Compendial Workspace, verify publishing authority &amp; access status, attach an authorized PDF copy, or connect pharmaceutical subjects and educational notes.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {pharmacopoeias.map(renderReferenceCard)}
                </div>
              </div>
            )
          )}

          {/* 3. TEXTBOOKS TAB */}
          {activeNav === 'textbooks' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
                  <select
                    value={textbookSubjectFilter}
                    onChange={(e) => setTextbookSubjectFilter(e.target.value)}
                    aria-label="Filter textbooks by subject"
                    className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200"
                  >
                    <option value="all">All Subjects ({textbooks.length})</option>
                    {TEXTBOOK_SUBJECTS.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setDetailModal({
                      isOpen: true,
                      mode: 'create',
                      collectionType: 'textbook',
                      referenceId: null,
                      initialTab: 'details'
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Custom Textbook</span>
                </button>
              </div>

              {textbookGroups.map(([subjectName, items]) => (
                <section key={subjectName} className="space-y-3">
                  <div className="flex items-baseline justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {subjectName}
                    </h2>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                      {items.length} {items.length === 1 ? 'textbook' : 'textbooks'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map(renderReferenceCard)}
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* 4. HANDBOOKS TAB */}
          {activeNav === 'handbooks' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Pharmaceutical Handbooks &amp; Compendia
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Excipient compatibility, drug reference, toxicology profiles, and essential medicines handbooks.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setDetailModal({
                      isOpen: true,
                      mode: 'create',
                      collectionType: 'handbook',
                      referenceId: null,
                      initialTab: 'details'
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Handbook</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {handbooks.map(renderReferenceCard)}
              </div>
            </div>
          )}

          {/* 5. STANDARDS & GUIDELINES TAB */}
          {activeNav === 'standards' && (
            <div className="space-y-5">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Regulatory Standards &amp; Official Guidelines
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Filter across WHO, ICH, OECD, CDSCO, US FDA, EMA, GMP, GLP, GCP, Validation, and Stability categories.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setDetailModal({
                        isOpen: true,
                        mode: 'create',
                        collectionType: 'standard',
                        referenceId: null,
                        initialTab: 'details'
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Standard / Guideline</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <select
                    value={standardCategoryFilter}
                    onChange={(e) => setStandardCategoryFilter(e.target.value)}
                    aria-label="Filter by standard category"
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value="all">All Standard Categories (12)</option>
                    {STANDARD_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  <select
                    value={standardAuthorityFilter}
                    onChange={(e) => setStandardAuthorityFilter(e.target.value)}
                    aria-label="Filter by issuing authority"
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value="all">All Issuing Authorities</option>
                    {standardAuthorities.map((auth) => (
                      <option key={auth} value={auth}>
                        {auth}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredStandards.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                  No standards matched this filter combination. Reset filters or add a local guideline PDF.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredStandards.map(renderReferenceCard)}
                </div>
              )}
            </div>
          )}

          {/* 6. RESEARCH & PUBLICATIONS TAB */}
          {activeNav === 'research' && (
            <div className="space-y-5">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setResearchSubTab('discover')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        researchSubTab === 'discover'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Discover Literature (Europe PMC · Crossref · OpenAlex)
                    </button>
                    <button
                      type="button"
                      onClick={() => setResearchSubTab('saved')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors tabular-nums ${
                        researchSubTab === 'saved'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Saved Publications ({researchPapers.length})
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setDetailModal({
                        isOpen: true,
                        mode: 'create',
                        collectionType: 'research',
                        referenceId: null,
                        initialTab: 'details'
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Add Paper Manually</span>
                  </button>
                </div>

                {researchSubTab === 'discover' && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      runResearchDiscovery();
                    }}
                    className="flex flex-col sm:flex-row gap-2"
                  >
                    <input
                      type="text"
                      value={researchQuery}
                      onChange={(e) => setResearchQuery(e.target.value)}
                      placeholder="Search pharmacology, pharmacokinetics, assay validation, paracetamol, excipients..."
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
                    />
                    <select
                      value={researchSource}
                      onChange={(e) => setResearchSource(e.target.value as DiscoverySourceFilter)}
                      className="sm:w-44 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200"
                    >
                      <option value="all">All 3 Repositories</option>
                      <option value="Europe PMC">Europe PMC</option>
                      <option value="Crossref">Crossref</option>
                      <option value="OpenAlex">OpenAlex</option>
                    </select>
                    <button
                      type="submit"
                      disabled={discovering || researchQuery.trim().length < 2}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold whitespace-nowrap shrink-0"
                    >
                      {discovering ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      <span>Search Papers</span>
                    </button>
                  </form>
                )}
              </div>

              {researchSubTab === 'discover' ? (
                <div className="space-y-4">
                  {discoveryErrors.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 space-y-1">
                      {discoveryErrors.map((e, i) => (
                        <p key={i}>
                          <strong>{e.source}:</strong> {e.message}
                        </p>
                      ))}
                    </div>
                  )}

                  {discoveryResults.length === 0 && !discovering ? (
                    <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Live Scientific Literature Discovery
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                        Query Europe PMC, Crossref, and OpenAlex directly from your browser. Choose papers explicitly to save into your Reference Center, link them to pharmacopoeias or topics, or import permitted open-access PDFs.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {discoveryResults.map((cand) => {
                        const alreadySaved = findDuplicateReference(
                          { title: cand.title, doi: cand.doi, externalUrl: cand.externalUrl },
                          references
                        );
                        return (
                          <article
                            key={cand.id}
                            className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                {cand.source}
                                <span className="text-slate-400"> · </span>
                                <span className="text-slate-600 dark:text-slate-300">
                                  {cand.journal}
                                  {cand.publicationYear ? ` (${cand.publicationYear})` : ''}
                                </span>
                              </span>
                              <span
                                className={`font-semibold ${
                                  cand.isOpenAccess
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-slate-500 dark:text-slate-400'
                                }`}
                              >
                                {cand.isOpenAccess ? 'Open Access' : 'Metadata / Publisher Link'}
                              </span>
                            </div>

                            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                              {cand.title}
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {cand.authors}
                              {cand.doi ? ` · DOI: ${cand.doi}` : ''}
                              {cand.pmcid ? ` · ${cand.pmcid}` : ''}
                            </p>

                            {cand.abstract && (
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                                {cand.abstract}
                              </p>
                            )}

                            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  disabled={Boolean(alreadySaved)}
                                  onClick={() => handleSaveResearchCandidate(cand, false)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>
                                    {alreadySaved ? 'Saved in Reference Center' : 'Save to Reference Center'}
                                  </span>
                                </button>

                                {cand.oaPdfUrl && !alreadySaved?.linkedBookId && (
                                  <button
                                    type="button"
                                    disabled={fetchingOaId === cand.id}
                                    onClick={() => handleSaveResearchCandidate(cand, true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200"
                                  >
                                    {fetchingOaId === cand.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    )}
                                    <span>Save &amp; Try OA PDF Import</span>
                                  </button>
                                )}
                              </div>

                              <a
                                href={sanitizeHttpUrl(cand.externalUrl) || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Open Official Source</span>
                              </a>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : researchPapers.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    No Saved Research Publications Yet
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Switch to &ldquo;Discover Literature&rdquo; to save papers from Europe PMC, Crossref, or OpenAlex, or add an article manually.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {researchPapers.map(renderReferenceCard)}
                </div>
              )}
            </div>
          )}

          {/* 7. MY LIBRARY (RESOURCE MANAGEMENT) TAB */}
          {activeNav === 'my_library' && (
            <div className="space-y-5">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap gap-1.5">
                {[
                  { id: 'my_references', label: `My References (${references.length})` },
                  { id: 'recently_opened', label: `Recently Opened (${recentlyOpenedRefs.length})` },
                  { id: 'bookmarked', label: `Bookmarked (${bookmarkedRefs.length})` },
                  { id: 'imported_docs', label: `Imported Documents (${books.length})` },
                  { id: 'external_resources', label: `External Portals (${externalRefs.length})` },
                  { id: 'recently_read', label: `Recently Read (${books.length})` },
                  { id: 'collections', label: `Collections (${collections.length})` },
                  { id: 'subject_categories', label: 'Subject Categories' }
                ].map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setMyLibTab(sub.id as MyLibrarySubTab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      myLibTab === sub.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>

              {myLibTab === 'my_references' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {references.map(renderReferenceCard)}
                </div>
              )}

              {myLibTab === 'recently_opened' &&
                (recentlyOpenedRefs.length === 0 ? (
                  <p className="text-xs text-slate-500 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                    No references opened yet in this workspace.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recentlyOpenedRefs.map(renderReferenceCard)}
                  </div>
                ))}

              {myLibTab === 'bookmarked' &&
                (bookmarkedRefs.length === 0 ? (
                  <p className="text-xs text-slate-500 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                    Click the bookmark icon on any Pharmacopoeia, Textbook, Handbook, Standard, or Research Paper to pin it here.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bookmarkedRefs.map(renderReferenceCard)}
                  </div>
                ))}

              {(myLibTab === 'imported_docs' || myLibTab === 'recently_read') && (
                <div className="space-y-4">
                  {books.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                      No local PDFs imported yet. Attach a PDF to any Textbook or Pharmacopoeia, or import from Knowledge Library.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {books.map((book) => {
                        const linkedTo = references.find((r) => r.linkedBookId === book.id);
                        return (
                          <div
                            key={book.id}
                            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                {linkedTo
                                  ? `Linked to ${COLLECTION_TYPE_LABELS[linkedTo.collectionType]}: ${
                                      linkedTo.shortTitle || linkedTo.title
                                    }`
                                  : 'Unlinked Knowledge Library PDF'}
                              </p>
                              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                {book.title}
                              </h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                                Page {book.lastReadPage || 1} of {book.pageCount} ·{' '}
                                {book.searchablePagesCount} searchable pages
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                              <button
                                type="button"
                                onClick={() => handleOpenPdfReader(book, book.lastReadPage || 1)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>Open Reader</span>
                              </button>

                              {!linkedTo && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCreateReference({
                                      id: `ref_pdf_${book.id}`,
                                      collectionType:
                                        book.category === 'research' ? 'research' : 'textbook',
                                      title: book.title,
                                      subject: 'Pharmaceutical Sciences',
                                      description: `Imported local PDF (${book.fileName}, ${book.pageCount} pages).`,
                                      sourceName: 'Local Knowledge Library',
                                      accessStatus: 'imported_local',
                                      licenseInfo: 'Personal local PDF stored in IndexedDB.',
                                      linkedBookId: book.id,
                                      tags: [book.category],
                                      bookmarked: false,
                                      customCollectionIds: [],
                                      academicConnections: [],
                                      createdAt: Date.now(),
                                      updatedAt: Date.now(),
                                      lastOpenedAt: book.lastOpenedAt
                                    })
                                  }
                                  className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                                >
                                  Register as Reference
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {unlinkedBooks.length > 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {unlinkedBooks.length} Knowledge Library PDF(s) are available for direct reading or linking without duplicating storage.
                    </p>
                  )}
                </div>
              )}

              {myLibTab === 'external_resources' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {externalRefs.map(renderReferenceCard)}
                </div>
              )}

              {myLibTab === 'collections' && (
                <div className="space-y-5">
                  {/* Create Collection Form */}
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!newCollectionName.trim()) return;
                      const created = await createCollection(newCollectionName, newCollectionDesc);
                      setCollections((prev) => [...prev, created]);
                      setSelectedCollectionId(created.id);
                      setNewCollectionName('');
                      setNewCollectionDesc('');
                    }}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs"
                  >
                    <input
                      type="text"
                      required
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      placeholder="New collection name (e.g. Semester II Prep)"
                      className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={newCollectionDesc}
                      onChange={(e) => setNewCollectionDesc(e.target.value)}
                      placeholder="Short description (optional)"
                      className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                    >
                      <FolderPlus className="w-4 h-4" />
                      <span>Create Collection</span>
                    </button>
                  </form>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCollectionId('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        selectedCollectionId === 'all'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      All Collections
                    </button>
                    {collections.map((col) => (
                      <div key={col.id} className="inline-flex items-center gap-1">
                        {editingColId === col.id ? (
                          <form
                            onSubmit={async (e) => {
                              e.preventDefault();
                              const updated = await renameCollection(col.id, editingColName);
                              if (updated) {
                                setCollections((prev) =>
                                  prev.map((c) => (c.id === updated.id ? updated : c))
                                );
                              }
                              setEditingColId(null);
                            }}
                            className="inline-flex items-center gap-1"
                          >
                            <input
                              type="text"
                              value={editingColName}
                              onChange={(e) => setEditingColName(e.target.value)}
                              className="px-2 py-1 rounded-lg border border-emerald-500 bg-white dark:bg-slate-950 text-xs"
                            />
                            <button
                              type="submit"
                              className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-xs"
                            >
                              Save
                            </button>
                          </form>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setSelectedCollectionId(col.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                                selectedCollectionId === col.id
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {col.name}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingColId(col.id);
                                setEditingColName(col.name);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                              aria-label={`Rename ${col.name}`}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {!col.isDefault && (
                              <button
                                type="button"
                                onClick={async () => {
                                  await deleteCollection(col.id);
                                  setCollections((prev) => prev.filter((c) => c.id !== col.id));
                                  if (selectedCollectionId === col.id) setSelectedCollectionId('all');
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600"
                                aria-label={`Delete ${col.name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(selectedCollectionId === 'all'
                      ? references.filter((r) => r.customCollectionIds.length > 0)
                      : references.filter((r) =>
                          r.customCollectionIds.includes(selectedCollectionId)
                        )
                    ).map(renderReferenceCard)}
                  </div>
                </div>
              )}

              {myLibTab === 'subject_categories' && (
                <div className="space-y-4">
                  {Array.from(
                    references.reduce((acc, r) => {
                      const arr = acc.get(r.subject) || [];
                      arr.push(r);
                      acc.set(r.subject, arr);
                      return acc;
                    }, new Map<string, ReferenceItem[]>())
                  ).map(([sub, items]) => (
                    <section key={sub} className="space-y-3">
                      <div className="flex items-baseline justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">{sub}</h3>
                        <span className="text-xs text-slate-500 tabular-nums">
                          {items.length} resources
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {items.map(renderReferenceCard)}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Detail / Create / Edit Modal */}
      <ReferenceDetailModal
        isOpen={detailModal.isOpen}
        mode={detailModal.mode}
        initialCollectionType={detailModal.collectionType}
        reference={activeModalRef}
        allReferences={references}
        books={books}
        collections={collections}
        initialTab={detailModal.initialTab}
        onClose={() => setDetailModal((prev) => ({ ...prev, isOpen: false }))}
        onCreateReference={handleCreateReference}
        onUpdateReference={handleUpdateReference}
        onDeleteReference={handleDeleteReference}
        onToggleBookmark={handleToggleBookmark}
        onToggleCollection={handleToggleCollection}
        onAddConnection={handleAddConnection}
        onRemoveConnection={handleRemoveConnection}
        onImportPdfForReference={handleImportPdfForReference}
        onLinkExistingBook={handleLinkExistingBook}
        onUnlinkBook={handleUnlinkBook}
        onOpenReader={handleOpenPdfReader}
        importingForId={importingForId}
        importProgress={importProgress}
      />
    </div>
  );
}
