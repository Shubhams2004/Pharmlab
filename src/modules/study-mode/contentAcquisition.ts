import { ANATOMY_CATALOG } from '../../data/anatomyCatalog';
import {
  ENGINE_SUBTOPICS,
  ENGINE_TOPICS,
  TEXTBOOK_REFERENCES
} from '../../data/academicEngineRegistry';
import { getAllBooks, searchAllBooks } from '../knowledge-library/libraryDb';
import { getAllReferences } from '../reference-center/referenceDb';
import { discoverResearchPapers } from '../reference-center/researchDiscovery';
import { discoverScientificResources } from '../resource-hub/providers/discoverResources';
import { getAttachedResourcesForContext } from '../resource-hub/resourceHubStorage';
import { createTimeoutSignal, sanitizeHttpUrl } from '../resource-hub/utils';
import { resolveAcademicContextForVisual } from '../visual-library/academicRegistry';
import { getAllVisuals, getVisualsForContext } from '../visual-library/visualDb';
import { classifyAcquiredResourcePriority } from '../enrichment-workspace/sourcePolicy';
import { retrieveTextbookContextForTopic } from '../enrichment-workspace/textbookSearchEngine';
import {
  getAcquiredResourcesForTopic,
  saveAcquiredResourcesForTopic
} from './studyDb';
import {
  AcquiredTopicResource,
  ResourceVerificationBadge,
  SourcePriorityTier,
  StudySectionKey,
  StudyWorkflowStep,
  SyllabusTopicNode
} from './types';

export interface TopicAcquisitionBundle {
  acquiredResources: AcquiredTopicResource[];
  localPdfMatches: Array<{
    bookId: string;
    bookTitle: string;
    pageNumber: number;
    snippet: string;
    matchedTerm: string;
    chapterHeading?: string;
    priorityTier?: SourcePriorityTier;
    authors?: string;
    edition?: string;
    extractionQuality?: 'pdf_text' | 'ocr_text' | 'unsearchable';
  }>;
  connectedVisualIds: string[];
  connectedReferenceIds: string[];
  warnings: string[];
}

function buildSearchTermForTopic(topic: SyllabusTopicNode): string {
  // Choose concise scientific terms instead of overflowing search endpoints with huge titles
  const cleanTitle = topic.title
    .replace(/\b(unit|module|introduction to|basics of|study of|practical schedule)\b/gi, '')
    .replace(/[()[\]—–:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (topic.linkedStructureIds && topic.linkedStructureIds.length > 0) {
    const s = ANATOMY_CATALOG.find((item) => item.id === topic.linkedStructureIds?.[0]);
    if (s) {
      return s.name.replace(/\s*\(.*?\)\s*/g, '').trim();
    }
  }

  if (cleanTitle.length >= 4 && cleanTitle.length <= 55) {
    return cleanTitle;
  }
  const firstKeywords = topic.keywords.slice(0, 3).join(' ');
  return firstKeywords || topic.subjectTitle;
}

function mapProviderBadge(providerId: string): ResourceVerificationBadge {
  if (providerId === 'openstax' || providerId === 'ncbi_bookshelf') {
    return 'open_textbook';
  }
  if (providerId === 'europepmc' || providerId === 'pubmed' || providerId === 'pmc') {
    return 'peer_reviewed';
  }
  if (providerId === 'pubchem' || providerId === 'wikimedia' || providerId === 'gbif') {
    return 'open_textbook';
  }
  return 'encyclopedic_open';
}

function suggestSectionForResource(
  title: string,
  kind: AcquiredTopicResource['resourceKind']
): StudySectionKey {
  const lower = title.toLowerCase();
  if (kind === 'diagram') return 'anatomical_structure';
  if (/mechanism|pathway|action|kinetics/.test(lower)) return 'mechanism';
  if (/clinical|pathophysiology|disease|therapy|adverse/.test(lower)) return 'clinical_significance';
  if (/assay|formulation|drug|pharmacology|pharmaceutic|delivery/.test(lower)) {
    return 'pharmaceutical_relevance';
  }
  if (/physiology|function|transport/.test(lower)) return 'physiology';
  if (/anatomy|morphology|structure/.test(lower)) return 'anatomical_structure';
  return 'explanation';
}

async function fetchWikipediaSummaryResource(
  topic: SyllabusTopicNode,
  searchTerm: string,
  signal?: AbortSignal
): Promise<AcquiredTopicResource | null> {
  const { signal: timedSignal, cleanup } = createTimeoutSignal(signal, 8000);
  try {
    const searchRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        searchTerm
      )}&srlimit=1&format=json&origin=*`,
      { signal: timedSignal }
    );
    if (!searchRes.ok) return null;
    const searchJson = await searchRes.json();
    const topTitle = searchJson?.query?.search?.[0]?.title as string | undefined;
    if (!topTitle) return null;

    const sumRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
        topTitle.replace(/ /g, '_')
      )}`,
      { signal: timedSignal }
    );
    if (!sumRes.ok) return null;
    const sumJson = (await sumRes.json()) as {
      title?: string;
      extract?: string;
      description?: string;
      content_urls?: { desktop?: { page?: string } };
    };
    const extract = sumJson.extract?.trim();
    const pageUrl = sanitizeHttpUrl(sumJson.content_urls?.desktop?.page);
    if (!extract || !pageUrl) return null;

    return {
      id: `acq_wiki_${topic.id}_${topTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
      topicId: topic.id,
      title: `${sumJson.title || topTitle} — Reference Summary`,
      providerId: 'wikipedia',
      sourceName: 'Wikipedia (CC BY-SA 4.0 Open Encyclopedia)',
      sourceUrl: pageUrl,
      license: 'CC BY-SA 4.0 (Supplementary Open Reference — verify with official textbook)',
      accessDate: new Date().toISOString().slice(0, 10),
      verificationStatus: 'encyclopedic_open',
      resourceKind: 'open_reference',
      excerpt: extract,
      suggestedSection: 'overview',
      savedAt: Date.now()
    };
  } catch {
    return null;
  } finally {
    cleanup();
  }
}

export async function runTopicContentAcquisition(
  topic: SyllabusTopicNode,
  opts: {
    onWorkflowUpdate?: (steps: StudyWorkflowStep[]) => void;
    signal?: AbortSignal;
    customSearchTerm?: string;
  } = {}
): Promise<TopicAcquisitionBundle> {
  const steps: StudyWorkflowStep[] = [
    { id: 'discover', label: 'Discover', status: 'done', detail: topic.subjectCode },
    { id: 'identify_syllabus', label: 'Identify Syllabus', status: 'done', detail: topic.unitNo },
    { id: 'extract_topics', label: 'Extract Subjects, Units & Topics', status: 'done', detail: topic.title },
    { id: 'search_sources', label: 'Search Trusted Sources', status: 'active' },
    { id: 'collect_references', label: 'Collect Available References', status: 'pending' },
    { id: 'organize_content', label: 'Organize Academic Content', status: 'pending' },
    { id: 'connect_media', label: 'Connect Visuals, PDFs & References', status: 'pending' },
    { id: 'prepare_material', label: 'Prepare Study Material', status: 'pending' },
    { id: 'connect_exam', label: 'Connect Exam Questions', status: 'pending' },
    { id: 'ready', label: 'Make Available in Study Mode', status: 'pending' }
  ];

  const emit = () => opts.onWorkflowUpdate?.(steps.map((s) => ({ ...s })));
  emit();

  const searchTerm = (opts.customSearchTerm || buildSearchTermForTopic(topic)).trim();
  const warnings: string[] = [];
  const collected: AcquiredTopicResource[] = [];
  const accessDate = new Date().toISOString().slice(0, 10);

  // Step 4 & 5: Search Trusted Online Sources (reusing Resource Hub + Reference Center providers)
  try {
    const [hubRes, paperRes, wikiRes] = await Promise.all([
      discoverScientificResources(
        searchTerm,
        {
          providers: ['ncbi_bookshelf', 'openstax', 'europepmc', 'pubmed', 'pmc', 'wikimedia'],
          sortMode: 'relevance'
        },
        opts.signal
      ),
      discoverResearchPapers(searchTerm, 'all', opts.signal).catch(() => ({
        candidates: [],
        errors: [],
        queriedSources: []
      })),
      fetchWikipediaSummaryResource(topic, searchTerm, opts.signal)
    ]);

    warnings.push(...hubRes.warnings);

    if (wikiRes) {
      collected.push(wikiRes);
    }

    for (const item of hubRes.items.slice(0, 12)) {
      const resourceKind: AcquiredTopicResource['resourceKind'] =
        item.resourceType === 'textbook' || item.providerId === 'ncbi_bookshelf' || item.providerId === 'openstax'
          ? 'textbook_chapter'
          : item.resourceType === 'anatomical_diagram' ||
            item.resourceType === 'histology_image' ||
            item.resourceType === 'scientific_illustration'
          ? 'diagram'
          : item.resourceType === 'review_article'
          ? 'review_article'
          : 'research_paper';

      collected.push({
        id: `acq_${topic.id}_${item.id}`,
        topicId: topic.id,
        title: item.title,
        providerId: item.providerId,
        sourceName: item.providerName,
        sourceUrl: item.sourceUrl,
        pdfUrl: item.pdfUrl,
        imageUrl: item.imageUrl || item.previewUrl,
        authors: item.authors.join(', '),
        publisherOrJournal: item.journalOrPublisher,
        publicationDate: item.publicationDate,
        license: item.license,
        accessDate,
        verificationStatus: mapProviderBadge(item.providerId),
        resourceKind,
        excerpt: item.abstractText || item.summary,
        suggestedSection: suggestSectionForResource(item.title, resourceKind),
        savedAt: Date.now()
      });
    }

    for (const cand of paperRes.candidates.slice(0, 6)) {
      const exists = collected.some(
        (c) =>
          c.sourceUrl === cand.externalUrl ||
          c.title.toLowerCase() === cand.title.toLowerCase()
      );
      if (exists) continue;
      collected.push({
        id: `acq_${topic.id}_${cand.id}`,
        topicId: topic.id,
        title: cand.title,
        providerId: cand.source.toLowerCase().replace(/\s+/g, '_'),
        sourceName: cand.source,
        sourceUrl: cand.externalUrl,
        pdfUrl: cand.oaPdfUrl,
        authors: cand.authors,
        publisherOrJournal: cand.journal,
        publicationDate: cand.publicationYear,
        license: cand.licenseInfo,
        accessDate,
        verificationStatus: 'peer_reviewed',
        resourceKind: 'research_paper',
        excerpt: cand.abstract,
        suggestedSection: suggestSectionForResource(cand.title, 'research_paper'),
        savedAt: Date.now()
      });
    }
  } catch (err) {
    if ((err as Error)?.name !== 'AbortError') {
      warnings.push(
        err instanceof Error ? err.message : 'External academic source discovery returned an error.'
      );
    }
  }

  steps[3].status = 'done';
  steps[4].status = 'done';
  steps[4].detail = `${collected.length} references found`;
  steps[5].status = 'done';
  steps[6].status = 'active';
  emit();

  // Step 6 & 7: Connect existing Visual Library, PDF Knowledge Library & Reference Center
  const localPdfMatches: TopicAcquisitionBundle['localPdfMatches'] = [];
  const connectedVisualIds = new Set<string>();
  const connectedReferenceIds = new Set<string>();

  try {
    const [books, visuals, centerRefs] = await Promise.all([
      getAllBooks(),
      getAllVisuals(),
      getAllReferences()
    ]);

    // Connect PDF pages via Textbook-First Verification Search Engine
    const tbBundle = await retrieveTextbookContextForTopic(topic).catch(() => null);
    if (tbBundle && tbBundle.hits.length > 0) {
      for (const hit of tbBundle.hits.slice(0, 6)) {
        localPdfMatches.push({
          bookId: hit.bookId,
          bookTitle: hit.bookTitle,
          pageNumber: hit.pageNumber,
          snippet: hit.passageExcerpt,
          matchedTerm: hit.primaryMatchedTerm,
          chapterHeading: hit.chapterHeading,
          priorityTier: hit.priorityTier,
          authors: hit.authors,
          edition: hit.edition,
          extractionQuality: hit.extractionQuality
        });
      }
    } else {
      const termsToSearch = Array.from(
        new Set([searchTerm, ...topic.keywords.slice(0, 2)].filter((t) => t.length >= 3))
      );
      for (const term of termsToSearch) {
        const results = await searchAllBooks(term, topic.bookDepartment, 2).catch(() => []);
        const fallbackResults =
          results.length > 0 ? results : await searchAllBooks(term, undefined, 2).catch(() => []);
        for (const hit of fallbackResults.slice(0, 4)) {
          const m = hit.matches[0];
          if (!m) continue;
          localPdfMatches.push({
            bookId: hit.book.id,
            bookTitle: hit.book.title,
            pageNumber: m.pageNumber,
            snippet: `${m.beforeContext}${m.matchedText}${m.afterContext}`,
            matchedTerm: term
          });
        }
        if (localPdfMatches.length >= 4) break;
      }
    }
    if (tbBundle?.readiness.limitationNotices.length) {
      warnings.push(...tbBundle.readiness.limitationNotices);
    }

    // Connect Visuals
    const contextVisuals = await getVisualsForContext({
      department: topic.departmentId === 'python' ? 'python' : topic.departmentId,
      topic: searchTerm
    }).catch(() => []);
    for (const v of contextVisuals.slice(0, 4)) {
      connectedVisualIds.add(v.id);
    }
    if (topic.linkedStructureIds) {
      for (const sId of topic.linkedStructureIds) {
        const struct = ANATOMY_CATALOG.find((item) => item.id === sId);
        struct?.visualIds.forEach((vid) => connectedVisualIds.add(vid));
      }
    }
    if (topic.linkedEngineTopicId && ENGINE_TOPICS[topic.linkedEngineTopicId]) {
      for (const subId of ENGINE_TOPICS[topic.linkedEngineTopicId].subtopicIds) {
        ENGINE_SUBTOPICS[subId]?.visualIds.forEach((vid) => connectedVisualIds.add(vid));
      }
    }
    for (const vis of visuals) {
      const ctx = resolveAcademicContextForVisual(vis);
      const hay = `${vis.title} ${vis.topics.join(' ')} ${ctx.annotations
        .map((a) => a.label)
        .join(' ')}`.toLowerCase();
      if (hay.includes(searchTerm.toLowerCase())) {
        connectedVisualIds.add(vis.id);
      }
      if (connectedVisualIds.size >= 6) break;
    }

    // Connect Reference Center items
    const topicLower = `${topic.subjectCode} ${topic.title} ${topic.keywords.join(' ')}`.toLowerCase();
    for (const ref of centerRefs) {
      const hay = `${ref.title} ${ref.subject} ${ref.description} ${ref.tags.join(' ')}`.toLowerCase();
      const hit =
        topic.keywords.some((k) => k.length >= 4 && hay.includes(k.toLowerCase())) ||
        (topic.departmentId === 'anatomy' && hay.includes('anatomy')) ||
        (topic.departmentId === 'inorganic' && (hay.includes('analysis') || ref.shortTitle === 'IP')) ||
        (topic.departmentId === 'general_pharmacy' && (hay.includes('pharmaceutics') || ref.shortTitle === 'IP')) ||
        (topic.departmentId === 'pharmacognosy' && hay.includes('pharmacognosy')) ||
        hay.includes(searchTerm.toLowerCase());
      if (hit) {
        connectedReferenceIds.add(ref.id);
      }
      if (topicLower.includes('indian pharmacopoeia') && ref.shortTitle === 'IP') {
        connectedReferenceIds.add(ref.id);
      }
    }

    // Also include saved Resource Hub items already tagged for this department
    const savedHub = getAttachedResourcesForContext({
      departmentId: topic.departmentId === 'python' ? 'python' : topic.departmentId
    });
    for (const rec of savedHub.slice(0, 3)) {
      const r = rec.resource;
      if (!collected.some((c) => c.sourceUrl === r.sourceUrl)) {
        collected.push({
          id: `acq_hub_${topic.id}_${rec.id}`,
          topicId: topic.id,
          title: r.title,
          providerId: r.providerId,
          sourceName: `${r.providerName} (Saved in Resource Hub)`,
          sourceUrl: r.sourceUrl,
          pdfUrl: r.pdfUrl,
          authors: r.authors.join(', '),
          publisherOrJournal: r.journalOrPublisher,
          publicationDate: r.publicationDate,
          license: r.license,
          accessDate,
          verificationStatus: mapProviderBadge(r.providerId),
          resourceKind: 'open_reference',
          excerpt: r.abstractText || r.summary,
          suggestedSection: 'references',
          savedAt: Date.now()
        });
      }
    }

    if (books.length === 0) {
      // Non-fatal informational note handled cleanly in UI
    }
  } catch (err) {
    warnings.push(err instanceof Error ? err.message : 'Local library connection warning.');
  }

  // Persist deduplicated acquired resources for offline revisit
  if (collected.length > 0) {
    const existing = await getAcquiredResourcesForTopic(topic.id);
    const seenUrls = new Set(existing.map((e) => e.sourceUrl));
    const novel = collected.filter((c) => !seenUrls.has(c.sourceUrl));
    if (novel.length > 0) {
      await saveAcquiredResourcesForTopic(novel);
    }
  }

  const finalStored = (await getAcquiredResourcesForTopic(topic.id)).sort(
    (a, b) =>
      classifyAcquiredResourcePriority(a) - classifyAcquiredResourcePriority(b) ||
      b.savedAt - a.savedAt
  );

  steps[6].status = 'done';
  steps[7].status = 'done';
  steps[8].status = 'done';
  steps[9].status = 'done';
  emit();

  return {
    acquiredResources: finalStored,
    localPdfMatches: localPdfMatches.slice(0, 6),
    connectedVisualIds: Array.from(connectedVisualIds),
    connectedReferenceIds: Array.from(connectedReferenceIds),
    warnings: Array.from(new Set(warnings))
  };
}

export function getBuiltInReferenceMatchesForTopic(topic: SyllabusTopicNode) {
  const hay = `${topic.title} ${topic.summary} ${topic.keywords.join(' ')}`.toLowerCase();
  return Object.values(TEXTBOOK_REFERENCES).filter((tb) =>
    tb.topicKeywords.some((kw) => hay.includes(kw.toLowerCase()))
  );
}
