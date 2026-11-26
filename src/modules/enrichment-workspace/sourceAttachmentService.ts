import { ANATOMY_CATALOG } from '../../data/anatomyCatalog';
import { getAll3DAssets } from '../assets-3d/asset3dDb';
import { EXPERIMENT_CATALOG } from '../assets-3d/experimentCatalog';
import { INTERACTIVE_EXPERIMENTS } from '../interactive-experiments/experiments';
import { EXPERIMENT_DEPARTMENT_LABELS } from '../interactive-experiments/types';
import { getAllBooks } from '../knowledge-library/libraryDb';
import { getAllReferences } from '../reference-center/referenceDb';
import { loadResourceHubState } from '../resource-hub/resourceHubStorage';
import {
  EnrichmentAttachmentKind,
  EnrichmentSourceAttachment,
  SourcePriorityTier,
  SyllabusTopicNode
} from '../study-mode/types';
import { getAllVisuals } from '../visual-library/visualDb';
import {
  classifyBookPriority,
  classifyReferencePriority,
  sortSourcesByPriority
} from './sourcePolicy';

export interface AttachableSourceCandidate {
  key: string;
  sourceKind: EnrichmentAttachmentKind;
  itemId: string;
  title: string;
  subtitle: string;
  url?: string;
  verified: boolean;
  relevanceScore: number;
  priorityTier: SourcePriorityTier;
  bookId?: string;
}

function tokenizeTopic(topic: SyllabusTopicNode): string[] {
  const raw = `${topic.subjectCode} ${topic.title} ${topic.keywords.join(' ')} ${topic.subtopics
    .map((s) => s.title)
    .join(' ')}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4);
  return Array.from(new Set(raw));
}

function scoreMatch(haystack: string, tokens: string[], bonus = 0): number {
  const lower = haystack.toLowerCase();
  let score = bonus;
  for (const t of tokens) {
    if (lower.includes(t)) score += 3;
  }
  return score;
}

export async function loadAttachableSourcesForTopic(
  topic: SyllabusTopicNode
): Promise<AttachableSourceCandidate[]> {
  const tokens = tokenizeTopic(topic);
  const hub = loadResourceHubState();

  const [refs, books, visuals, assets3d] = await Promise.all([
    getAllReferences().catch(() => []),
    getAllBooks().catch(() => []),
    getAllVisuals().catch(() => []),
    getAll3DAssets().catch(() => [])
  ]);

  const candidates: AttachableSourceCandidate[] = [];

  for (const r of refs) {
    const connText = (r.academicConnections || [])
      .map((c) => `${c.topicId || ''} ${c.departmentId || ''} ${c.label || ''}`)
      .join(' ');
    const codeBonus = (r.subject || '').toUpperCase().includes(topic.subjectCode.toUpperCase()) ? 4 : 0;
    const hay = `${r.title} ${r.shortTitle || ''} ${r.authors || ''} ${r.subject || ''} ${(r.tags || []).join(' ')} ${connText}`;
    candidates.push({
      key: `ref_${r.id}`,
      sourceKind: 'reference_center',
      itemId: r.id,
      title: r.shortTitle || r.title,
      subtitle: `Reference Center · ${r.authors || r.publisher || r.subject || 'Standard Reference'}`,
      url: r.officialUrl,
      verified: true,
      relevanceScore: scoreMatch(hay, tokens, codeBonus),
      priorityTier: classifyReferencePriority(r),
      bookId: r.linkedBookId
    });
  }

  for (const saved of hub.savedRecords || []) {
    const linkedMatch = saved.linkedContexts.some(
      (c) => c.topicId === topic.id || c.subjectCode === topic.subjectCode
    )
      ? 6
      : 0;
    const hubTier: SourcePriorityTier =
      saved.providerId === 'ncbi_bookshelf' || saved.providerId === 'openstax'
        ? 2
        : saved.providerId === 'pubmed' ||
          saved.providerId === 'pmc' ||
          saved.providerId === 'europepmc'
        ? 3
        : 4;
    candidates.push({
      key: `hub_${saved.id}`,
      sourceKind: 'resource_hub',
      itemId: saved.id,
      title: saved.title,
      subtitle: `Resource Hub · ${saved.providerName}`,
      url: saved.url,
      verified: saved.providerId !== 'wikipedia',
      relevanceScore: scoreMatch(`${saved.title} ${saved.summary || ''}`, tokens, linkedMatch),
      priorityTier: hubTier
    });
  }

  for (const b of books) {
    const deptBonus = b.department === topic.bookDepartment ? 4 : 0;
    const linkedRef = refs.find((r) => r.linkedBookId === b.id);
    candidates.push({
      key: `book_${b.id}`,
      sourceKind: 'knowledge_pdf',
      itemId: b.id,
      title: b.title,
      subtitle: `PDF Knowledge Library · ${b.pageCount} pages${b.authors ? ` · ${b.authors}` : ''}`,
      verified: true,
      relevanceScore: scoreMatch(`${b.title} ${b.authors || ''}`, tokens, deptBonus),
      priorityTier: classifyBookPriority(b, linkedRef),
      bookId: b.id
    });
  }

  for (const v of visuals) {
    const deptBonus = (v.departments || []).includes(topic.departmentId as never) ? 3 : 0;
    candidates.push({
      key: `vis_${v.id}`,
      sourceKind: 'visual_library',
      itemId: v.id,
      title: v.title,
      subtitle: `Visual Library · ${v.category} · ${v.sourceName}`,
      verified: true,
      relevanceScore: scoreMatch(
        `${v.title} ${v.caption || ''} ${(v.tags || []).join(' ')} ${(v.topics || []).join(' ')}`,
        tokens,
        deptBonus
      ),
      priorityTier: 2
    });
  }

  for (const a of assets3d) {
    const subjBonus = (a.subjectCodes || []).includes(topic.subjectCode) ? 5 : 0;
    candidates.push({
      key: `3d_${a.id}`,
      sourceKind: 'asset_3d',
      itemId: a.id,
      title: a.name,
      subtitle: `3D Asset Library · ${a.format.toUpperCase()} · ${a.creator}`,
      verified: true,
      relevanceScore: scoreMatch(`${a.name} ${a.description || ''} ${(a.tags || []).join(' ')}`, tokens, subjBonus),
      priorityTier: 2
    });
  }

  for (const sim of INTERACTIVE_EXPERIMENTS) {
    const subjBonus =
      sim.academicContext.subjectCode.toUpperCase().includes(topic.subjectCode.toUpperCase()) ||
      sim.academicContext.studyModeSubjectCode === topic.subjectCode
        ? 5
        : 0;
    candidates.push({
      key: `sim_${sim.id}`,
      sourceKind: 'simulation',
      itemId: sim.id,
      title: sim.title,
      subtitle: `Interactive Sim · ${EXPERIMENT_DEPARTMENT_LABELS[sim.department] || sim.department}`,
      verified: true,
      relevanceScore: scoreMatch(
        `${sim.title} ${sim.description} ${sim.scientificPrinciple} ${sim.academicContext.topic}`,
        tokens,
        subjBonus
      ),
      priorityTier: 2
    });
  }

  for (const exp of Object.values(EXPERIMENT_CATALOG)) {
    const subjBonus = exp.subjectCode === topic.subjectCode ? 5 : 0;
    candidates.push({
      key: `exp_${exp.id}`,
      sourceKind: 'experiment',
      itemId: exp.id,
      title: `${exp.code}: ${exp.title}`,
      subtitle: `Lab Experiment · ${exp.subjectCode}`,
      verified: true,
      relevanceScore: scoreMatch(`${exp.title} ${exp.setupSummary || ''}`, tokens, subjBonus),
      priorityTier: 2
    });
  }

  for (const anat of ANATOMY_CATALOG) {
    const linkedBonus = (topic.linkedStructureIds || []).includes(anat.id) ? 8 : 0;
    candidates.push({
      key: `anat_${anat.id}`,
      sourceKind: 'anatomy_catalog',
      itemId: anat.id,
      title: anat.name,
      subtitle: `Anatomy Catalog #${anat.catalogNumber} · ${anat.system}`,
      verified: true,
      relevanceScore: scoreMatch(`${anat.name} ${anat.overview || ''} ${anat.system}`, tokens, linkedBonus),
      priorityTier: 2
    });
  }

  return sortSourcesByPriority(
    candidates,
    (c) => c.priorityTier,
    (c) => c.relevanceScore
  );
}

export function candidateToAttachment(c: AttachableSourceCandidate): EnrichmentSourceAttachment {
  return {
    id: `att_${c.sourceKind}_${c.itemId}`,
    sourceKind: c.sourceKind,
    itemId: c.itemId,
    title: c.title,
    subtitle: c.subtitle,
    url: c.url,
    verified: c.verified,
    attachedAt: Date.now(),
    priorityTier: c.priorityTier,
    bookId: c.bookId
  };
}
