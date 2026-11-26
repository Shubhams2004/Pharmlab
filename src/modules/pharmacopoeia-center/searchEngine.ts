import { getBookPages } from '../knowledge-library/libraryDb';
import { searchBookPages } from '../knowledge-library/searchEngine';
import { LibraryBookMeta } from '../knowledge-library/types';
import { PharmacopoeiaProfileMeta, ReferenceItem } from '../reference-center/types';
import {
  ANALYTICAL_TEST_FACETS,
  PHARMACOPOEIA_DIRECTORY,
  STANDARD_CATEGORY_FACETS
} from './pharmacopoeiaCatalog';
import {
  AnalyticalTestCategoryId,
  CLASSIFICATION_LABELS,
  DEPARTMENT_LABELS,
  ORIGIN_LABELS,
  PharmacopoeiaDepartmentKey,
  PharmacopoeiaDirectoryEntry,
  PharmacopoeiaUserStore,
  SearchResultOrigin,
  StandardCategoryId,
  UnifiedPharmacopoeiaSearchResult
} from './types';

export interface PharmacopoeiaSearchOptions {
  query: string;
  originFilter?: SearchResultOrigin | 'all';
  entryIdFilter?: string | 'all';
  departmentFilter?: PharmacopoeiaDepartmentKey | 'all';
  analyticalTestFilter?: AnalyticalTestCategoryId | 'all';
  standardCategoryFilter?: StandardCategoryId | 'all';
  userStore: PharmacopoeiaUserStore;
  books: LibraryBookMeta[];
  referenceItems: ReferenceItem[];
  referenceProfiles: PharmacopoeiaProfileMeta[];
}

export async function runUnifiedPharmacopoeiaSearch(
  opts: PharmacopoeiaSearchOptions
): Promise<UnifiedPharmacopoeiaSearchResult[]> {
  const rawQuery = opts.query.trim();
  const q = rawQuery.toLowerCase();
  const tokens = q.split(/\s+/).filter((t) => t.length >= 2);
  const results: UnifiedPharmacopoeiaSearchResult[] = [];

  const matchesFacets = (entry: PharmacopoeiaDirectoryEntry): boolean => {
    if (opts.entryIdFilter && opts.entryIdFilter !== 'all' && entry.id !== opts.entryIdFilter) {
      return false;
    }
    if (
      opts.departmentFilter &&
      opts.departmentFilter !== 'all' &&
      !entry.relevantDepartments.includes(opts.departmentFilter)
    ) {
      return false;
    }
    if (
      opts.analyticalTestFilter &&
      opts.analyticalTestFilter !== 'all' &&
      !entry.analyticalTestCategories.includes(opts.analyticalTestFilter)
    ) {
      return false;
    }
    if (
      opts.standardCategoryFilter &&
      opts.standardCategoryFilter !== 'all' &&
      !entry.standardCategories.includes(opts.standardCategoryFilter)
    ) {
      return false;
    }
    return true;
  };

  const scoreText = (haystack: string): number => {
    if (!q) return 40;
    const low = haystack.toLowerCase();
    if (low === q) return 100;
    if (low.includes(q)) return 85;
    if (tokens.length === 0) return 0;
    const hits = tokens.filter((t) => low.includes(t)).length;
    return hits > 0 ? Math.round((hits / tokens.length) * 65) : 0;
  };

  // 1. LOCAL PHARMALAB METADATA (Directory, Facets, User Notes, Edition Records, Linked Reference Profiles)
  if (!opts.originFilter || opts.originFilter === 'all' || opts.originFilter === 'local_metadata') {
    for (const entry of PHARMACOPOEIA_DIRECTORY) {
      if (!matchesFacets(entry)) continue;

      const userNote = opts.userStore.notesByEntryId[entry.id] || '';
      const linkedRef = opts.referenceItems.find((r) => r.id === entry.linkedReferenceCenterId);
      const linkedProfile = opts.referenceProfiles.find(
        (p) => p.referenceId === entry.linkedReferenceCenterId
      );
      const sectionLinkText = (linkedProfile?.sectionLinks || [])
        .map((l) => `${l.title} ${l.note || ''}`)
        .join(' ');
      const editionText = opts.userStore.editionRecords
        .filter((er) => er.entryId === entry.id)
        .map((er) => `${er.title} ${er.identifier} ${er.notes}`)
        .join(' ');

      const haystack = [
        entry.abbreviation,
        entry.fullName,
        entry.countryOrRegion,
        entry.issuingOrganization,
        entry.description,
        entry.purpose,
        entry.scope,
        entry.syllabusRelevance.join(' '),
        entry.searchableKeywords.join(' '),
        entry.relevantDepartments.map((d) => DEPARTMENT_LABELS[d]).join(' '),
        userNote,
        sectionLinkText,
        editionText
      ].join(' ');

      const score = scoreText(haystack);
      if (score > 0) {
        results.push({
          id: `local_dir_${entry.id}`,
          origin: 'local_metadata',
          originLabel: ORIGIN_LABELS.local_metadata,
          entryId: entry.id,
          entryAbbreviation: entry.abbreviation,
          title: `${entry.fullName} (${entry.abbreviation})`,
          subtitle: `${CLASSIFICATION_LABELS[entry.classification]} · ${entry.issuingOrganization}`,
          snippet:
            userNote && q && userNote.toLowerCase().includes(q)
              ? `Personal Note Match: ${userNote.slice(0, 180)}`
              : entry.scope,
          accessType: entry.contentAccessType,
          externalUrl: entry.officialWebsite,
          bookId: linkedRef?.linkedBookId,
          matchedTopics: entry.syllabusRelevance.slice(0, 2),
          relevanceScore: score + (entry.abbreviation.toLowerCase() === q ? 20 : 0)
        });
      }

      // Also surface user-recorded edition/amendment matches individually when querying
      if (q.length >= 2) {
        for (const rec of opts.userStore.editionRecords.filter((er) => er.entryId === entry.id)) {
          const recScore = scoreText(`${rec.title} ${rec.identifier} ${rec.notes} ${rec.sourceLabel}`);
          if (recScore > 0) {
            results.push({
              id: `local_edition_${rec.id}`,
              origin: 'local_metadata',
              originLabel: ORIGIN_LABELS.local_metadata,
              entryId: entry.id,
              entryAbbreviation: entry.abbreviation,
              title: `${entry.abbreviation} · ${rec.title} (${rec.identifier})`,
              subtitle: `User-Recorded ${rec.recordKind.replace('_', ' ')} · ${rec.sourceLabel}`,
              snippet: rec.notes || 'Recorded edition/amendment log entry.',
              accessType: entry.contentAccessType,
              externalUrl: rec.sourceUrl || entry.officialNoticesUrl,
              relevanceScore: recScore + 5
            });
          }
        }
      }
    }

    // Analytical test facets & standard category facets (local educational taxonomy)
    if (q.length >= 2 || opts.analyticalTestFilter !== 'all') {
      for (const facet of ANALYTICAL_TEST_FACETS) {
        if (opts.analyticalTestFilter && opts.analyticalTestFilter !== 'all' && facet.id !== opts.analyticalTestFilter) {
          continue;
        }
        if (
          opts.departmentFilter &&
          opts.departmentFilter !== 'all' &&
          !facet.relevantDepartments.includes(opts.departmentFilter)
        ) {
          continue;
        }
        if (
          opts.entryIdFilter &&
          opts.entryIdFilter !== 'all' &&
          !facet.pharmacopoeiaIds.includes(opts.entryIdFilter)
        ) {
          continue;
        }
        const score = scoreText(`${facet.title} ${facet.summary} ${facet.typicalMethods.join(' ')}`);
        if (score > 0) {
          results.push({
            id: `local_test_${facet.id}`,
            origin: 'local_metadata',
            originLabel: ORIGIN_LABELS.local_metadata,
            title: `Analytical Test Category: ${facet.title}`,
            subtitle: `Methods: ${facet.typicalMethods.slice(0, 3).join(' · ')}`,
            snippet: facet.summary,
            accessType: 'public',
            relevanceScore: score
          });
        }
      }
    }

    if (q.length >= 2 || opts.standardCategoryFilter !== 'all') {
      for (const std of STANDARD_CATEGORY_FACETS) {
        if (
          opts.standardCategoryFilter &&
          opts.standardCategoryFilter !== 'all' &&
          std.id !== opts.standardCategoryFilter
        ) {
          continue;
        }
        if (
          opts.entryIdFilter &&
          opts.entryIdFilter !== 'all' &&
          !std.pharmacopoeiaIds.includes(opts.entryIdFilter)
        ) {
          continue;
        }
        const score = scoreText(`${std.title} ${std.summary} ${std.examples.join(' ')}`);
        if (score > 0) {
          results.push({
            id: `local_std_${std.id}`,
            origin: 'local_metadata',
            originLabel: ORIGIN_LABELS.local_metadata,
            title: `Specification Category: ${std.title}`,
            subtitle: `Common Examples: ${std.examples.slice(0, 3).join(' · ')}`,
            snippet: std.summary,
            accessType: 'public',
            relevanceScore: score
          });
        }
      }
    }
  }

  // 2. IMPORTED REFERENCE FILES (Knowledge Library PDFs & Reference Center Linked Books)
  if (
    (!opts.originFilter || opts.originFilter === 'all' || opts.originFilter === 'imported_reference_file') &&
    opts.books.length > 0
  ) {
    const entryLinkedBookMap = new Map<string, PharmacopoeiaDirectoryEntry>();
    for (const entry of PHARMACOPOEIA_DIRECTORY) {
      if (!entry.linkedReferenceCenterId) continue;
      const ref = opts.referenceItems.find((r) => r.id === entry.linkedReferenceCenterId);
      if (ref?.linkedBookId) {
        entryLinkedBookMap.set(ref.linkedBookId, entry);
      }
    }

    for (const book of opts.books) {
      const linkedEntry = entryLinkedBookMap.get(book.id);
      if (opts.entryIdFilter && opts.entryIdFilter !== 'all') {
        if (!linkedEntry || linkedEntry.id !== opts.entryIdFilter) {
          // Also check if book title mentions the abbreviation
          const selectedEntry = PHARMACOPOEIA_DIRECTORY.find((e) => e.id === opts.entryIdFilter);
          if (
            !selectedEntry ||
            !`${book.title} ${book.department}`.toLowerCase().includes(selectedEntry.abbreviation.toLowerCase())
          ) {
            continue;
          }
        }
      }

      if (!q) {
        results.push({
          id: `pdf_meta_${book.id}`,
          origin: 'imported_reference_file',
          originLabel: ORIGIN_LABELS.imported_reference_file,
          entryId: linkedEntry?.id,
          entryAbbreviation: linkedEntry?.abbreviation,
          title: book.title,
          subtitle: `Imported PDF · ${book.pageCount} pages · ${book.department}`,
          snippet: book.hasSearchableText
            ? 'Full-text indexed locally in Knowledge Library.'
            : 'Uploaded PDF metadata available locally.',
          accessType: 'public',
          bookId: book.id,
          pageNumber: book.lastReadPage || 1,
          relevanceScore: linkedEntry ? 75 : 45
        });
        continue;
      }

      const titleScore = scoreText(`${book.title} ${book.authors || ''} ${book.department}`);
      let addedPageHit = false;

      if (book.hasSearchableText && q.length >= 2) {
        try {
          const pages = await getBookPages(book.id);
          const matches = searchBookPages(pages, rawQuery, 2);
          for (const m of matches) {
            addedPageHit = true;
            results.push({
              id: `pdf_page_${book.id}_${m.pageNumber}`,
              origin: 'imported_reference_file',
              originLabel: ORIGIN_LABELS.imported_reference_file,
              entryId: linkedEntry?.id,
              entryAbbreviation: linkedEntry?.abbreviation,
              title: `${book.title} · Page ${m.pageNumber}`,
              subtitle: linkedEntry
                ? `Linked to ${linkedEntry.abbreviation} · Local PDF Match`
                : `Imported Reference PDF · ${book.department}`,
              snippet: `${m.beforeContext}${m.matchedText}${m.afterContext}`.trim(),
              accessType: 'public',
              bookId: book.id,
              pageNumber: m.pageNumber,
              relevanceScore: 92
            });
          }
        } catch {
          // ignore page read failure
        }
      }

      if (!addedPageHit && titleScore > 0) {
        results.push({
          id: `pdf_title_${book.id}`,
          origin: 'imported_reference_file',
          originLabel: ORIGIN_LABELS.imported_reference_file,
          entryId: linkedEntry?.id,
          entryAbbreviation: linkedEntry?.abbreviation,
          title: book.title,
          subtitle: `Imported PDF · ${book.pageCount} pages`,
          snippet: 'Matched imported reference document title or subject metadata.',
          accessType: 'public',
          bookId: book.id,
          pageNumber: book.lastReadPage || 1,
          relevanceScore: titleScore
        });
      }
    }
  }

  // 3. PUBLICLY ACCESSIBLE OFFICIAL SOURCES & 4. EXTERNAL OFFICIAL PORTALS
  for (const entry of PHARMACOPOEIA_DIRECTORY) {
    if (!matchesFacets(entry)) continue;

    const isPublic = entry.contentAccessType === 'public';
    const origin: SearchResultOrigin = isPublic
      ? 'public_official_source'
      : 'external_official_portal';

    if (opts.originFilter && opts.originFilter !== 'all' && opts.originFilter !== origin) {
      continue;
    }

    // Surface official portals either when query matches or when browsing a specific query for drug/monograph lookup
    const portalScore = q
      ? Math.max(
          scoreText(`${entry.fullName} ${entry.abbreviation} ${entry.issuingOrganization} ${entry.scope}`),
          q.length >= 2 ? 42 : 0
        )
      : 50;

    if (portalScore <= 0) continue;

    const primaryCompendiumLink =
      entry.officialLinks.find((l) => l.kind === 'compendium') || entry.officialLinks[0];

    results.push({
      id: `portal_${entry.id}`,
      origin,
      originLabel: ORIGIN_LABELS[origin],
      entryId: entry.id,
      entryAbbreviation: entry.abbreviation,
      title: isPublic
        ? `Verify / Search ${entry.abbreviation} via Public Official Portal`
        : `Look up "${rawQuery || entry.abbreviation}" on Official ${entry.abbreviation} Portal`,
      subtitle: `${entry.issuingOrganization} · ${primaryCompendiumLink?.label || 'Official Website'}`,
      snippet: isPublic
        ? `${entry.onlineAccessibilityStatus} External official site hosts authoritative texts directly.`
        : `${entry.accessLimitations} PharmaLab routes you directly to the official portal rather than copying restricted texts.`,
      accessType: entry.contentAccessType,
      externalUrl: primaryCompendiumLink?.url || entry.officialWebsite,
      relevanceScore: portalScore - (isPublic ? 2 : 12)
    });
  }

  // Sort highest relevance first, preserving clear deterministic order
  return results.sort((a, b) => b.relevanceScore - a.relevanceScore || a.title.localeCompare(b.title));
}

export interface ComparisonMatrixCell {
  entry: PharmacopoeiaDirectoryEntry;
  classificationLabel: string;
  availabilityStatus: string;
  accessTypeLabel: string;
  editionMetadata: string;
  linkedLocalPdfCount: number;
  officialPortalUrl: string;
  officialNoticesUrl: string;
  comparisonNote: string;
  coversSelectedFocus: boolean | null;
}

export function buildPharmacopoeiaComparisonMatrix(params: {
  selectedEntryIds: string[];
  focusQuery: string;
  userStore: PharmacopoeiaUserStore;
  books: LibraryBookMeta[];
  referenceItems: ReferenceItem[];
}): ComparisonMatrixCell[] {
  const focus = params.focusQuery.trim().toLowerCase();

  return params.selectedEntryIds
    .map((id) => PHARMACOPOEIA_DIRECTORY.find((e) => e.id === id))
    .filter((entry): entry is PharmacopoeiaDirectoryEntry => Boolean(entry))
    .map((entry) => {
      const userEditions = params.userStore.editionRecords.filter((r) => r.entryId === entry.id);
      const latestUserEdition = userEditions[0];
      const linkedRef = params.referenceItems.find((r) => r.id === entry.linkedReferenceCenterId);
      const linkedBooks = params.books.filter(
        (b) =>
          b.id === linkedRef?.linkedBookId ||
          b.title.toLowerCase().includes(entry.abbreviation.toLowerCase())
      );

      const editionMetadata = latestUserEdition
        ? `${latestUserEdition.title} (${latestUserEdition.identifier})${
            latestUserEdition.effectiveOrPublishedDate
              ? ` · ${latestUserEdition.effectiveOrPublishedDate}`
              : ''
          }`
        : entry.verifiedEditionSummary;

      let coversSelectedFocus: boolean | null = null;
      if (focus.length >= 2) {
        const scopeHay = [
          entry.scope,
          entry.description,
          entry.searchableKeywords.join(' '),
          entry.syllabusRelevance.join(' ')
        ]
          .join(' ')
          .toLowerCase();
        coversSelectedFocus = scopeHay.includes(focus);
      }

      return {
        entry,
        classificationLabel: CLASSIFICATION_LABELS[entry.classification],
        availabilityStatus: entry.onlineAccessibilityStatus,
        accessTypeLabel:
          entry.contentAccessType === 'public'
            ? 'Publicly accessible online'
            : entry.contentAccessType === 'subscription'
            ? 'Subscription / licensed portal'
            : entry.contentAccessType === 'licensed'
            ? 'Licensed / print & registered portal'
            : 'Restricted / regional access',
        editionMetadata,
        linkedLocalPdfCount: linkedBooks.length,
        officialPortalUrl: entry.officialWebsite,
        officialNoticesUrl: entry.officialNoticesUrl,
        comparisonNote: params.userStore.comparisonNotesByKey[entry.id] || '',
        coversSelectedFocus
      };
    });
}
