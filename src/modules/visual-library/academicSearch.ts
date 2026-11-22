import { ACADEMIC_SUBJECTS, resolveAcademicContextForVisual } from './academicRegistry';
import {
  AcademicSubjectResource,
  InteractiveAnnotation,
  RelatedPharmaLabLink
} from './academicTypes';
import { VisualMediaItem } from './types';

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'by',
  'for',
  'from',
  'in',
  'into',
  'is',
  'of',
  'on',
  'or',
  'the',
  'to',
  'with'
]);

export function tokenizeAcademicQuery(raw: string): {
  phrase: string;
  tokens: string[];
} {
  const phrase = raw.trim().toLowerCase();
  const tokens = phrase
    .split(/[^a-z0-9⁺⁻₀-₉]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));
  return { phrase, tokens };
}

function scoreFieldMatch(
  text: string,
  phrase: string,
  tokens: string[],
  phraseWeight: number,
  tokenWeight: number
): number {
  if (!text) return 0;
  const lower = text.toLowerCase();
  if (phrase && lower.includes(phrase)) {
    return phraseWeight;
  }
  if (tokens.length === 0) return 0;
  let hits = 0;
  for (const t of tokens) {
    if (lower.includes(t)) hits += 1;
  }
  if (hits === 0) return 0;
  // Bonus when all meaningful tokens appear
  const allBonus = hits === tokens.length ? tokenWeight : 0;
  return hits * tokenWeight + allBonus;
}

export interface AcademicVisualSearchHit {
  item: VisualMediaItem;
  score: number;
  matchedReasons: string[];
}

export interface AcademicTopicSearchHit {
  subject: AcademicSubjectResource;
  linkedVisual: VisualMediaItem | null;
  score: number;
  matchedOn: string;
}

export interface AcademicStructureSearchHit {
  annotation: InteractiveAnnotation;
  subject: AcademicSubjectResource | null;
  visual: VisualMediaItem;
  score: number;
}

export interface AcademicEquipmentSearchHit {
  name: string;
  visual: VisualMediaItem;
  experiments: string[];
  score: number;
}

export interface AcademicResourceSearchHit {
  link: RelatedPharmaLabLink;
  sourceLabel: string;
  score: number;
}

export interface AcademicSearchResults {
  images: AcademicVisualSearchHit[];
  topics: AcademicTopicSearchHit[];
  structures: AcademicStructureSearchHit[];
  equipment: AcademicEquipmentSearchHit[];
  resources: AcademicResourceSearchHit[];
}

export function runAcademicSearch(
  rawQuery: string,
  visuals: VisualMediaItem[]
): AcademicSearchResults {
  const { phrase, tokens } = tokenizeAcademicQuery(rawQuery);
  if (!phrase) {
    return {
      images: visuals.map((item) => ({ item, score: 1, matchedReasons: [] })),
      topics: [],
      structures: [],
      equipment: [],
      resources: []
    };
  }

  // 1. Score Visuals (using image fields + linked/enriched academic context)
  const images: AcademicVisualSearchHit[] = [];
  for (const item of visuals) {
    const ctx = resolveAcademicContextForVisual(item);
    let score = 0;
    const reasons: string[] = [];

    const titleScore = scoreFieldMatch(item.title, phrase, tokens, 40, 14);
    if (titleScore > 0) {
      score += titleScore;
      reasons.push('Title');
    }

    const sciScore = scoreFieldMatch(
      [
        ctx.identification.scientificOrChemicalName || '',
        ...(ctx.identification.commonNames || []),
        ctx.identification.formulaOrIupac || ''
      ].join(' '),
      phrase,
      tokens,
      36,
      12
    );
    if (sciScore > 0) {
      score += sciScore;
      reasons.push('Scientific Name');
    }

    const defScore = scoreFieldMatch(
      [ctx.definition || '', ctx.introduction || '', item.caption, item.description].join(' '),
      phrase,
      tokens,
      24,
      8
    );
    if (defScore > 0) {
      score += defScore;
      reasons.push('Definition & Overview');
    }

    const fnMechScore = scoreFieldMatch(
      [
        ...(ctx.functions || []),
        ctx.physiologicalRole || '',
        ctx.mechanism?.summary || '',
        ...(ctx.mechanism?.steps || []),
        ctx.equipmentProfile?.principle || '',
        ctx.equipmentProfile?.workingMechanism || '',
        ctx.pharmacologyProfile?.mechanismOfAction || '',
        ctx.chemistryProfile?.reactionMechanism || ''
      ].join(' '),
      phrase,
      tokens,
      28,
      10
    );
    if (fnMechScore > 0) {
      score += fnMechScore;
      reasons.push('Function & Mechanism');
    }

    const structScore = scoreFieldMatch(
      [
        ctx.structureSummary || '',
        ...(ctx.components || []).map((c) => `${c.name} ${c.description}`),
        ...ctx.annotations.map((a) => `${a.label} ${a.definition} ${a.functionRole}`)
      ].join(' '),
      phrase,
      tokens,
      28,
      10
    );
    if (structScore > 0) {
      score += structScore;
      reasons.push('Structure & Components');
    }

    const clinicalPharmaScore = scoreFieldMatch(
      [
        ...(ctx.clinicalSignificance || []),
        ...(ctx.pharmaceuticalSignificance || []),
        ...(ctx.applications || []),
        ...(ctx.associatedDiseases || []).map((d) => `${d.name} ${d.summary}`),
        ...ctx.drugNames,
        ...ctx.diseaseNames,
        ...(ctx.pharmacologyProfile?.therapeuticUses || []),
        ...(ctx.pharmacologyProfile?.adverseEffects || [])
      ].join(' '),
      phrase,
      tokens,
      26,
      9
    );
    if (clinicalPharmaScore > 0) {
      score += clinicalPharmaScore;
      reasons.push('Clinical / Pharmaceutical Use');
    }

    const kwScore = scoreFieldMatch(
      [
        ...item.topics,
        ...item.tags,
        ...item.experiments,
        ...item.equipment,
        ...ctx.textbookKeywords,
        ...(item.subjectId && ACADEMIC_SUBJECTS[item.subjectId]
          ? ACADEMIC_SUBJECTS[item.subjectId].searchKeywords
          : [])
      ].join(' '),
      phrase,
      tokens,
      22,
      8
    );
    if (kwScore > 0) {
      score += kwScore;
      if (reasons.length === 0) reasons.push('Keywords');
    }

    // Require either a full phrase match OR at least one meaningful token match
    if (score > 0) {
      images.push({ item, score, matchedReasons: reasons.slice(0, 3) });
    }
  }
  images.sort((a, b) => b.score - a.score);

  // 2. Score Reusable Academic Topics
  const topics: AcademicTopicSearchHit[] = [];
  for (const subject of Object.values(ACADEMIC_SUBJECTS)) {
    const linkedVisual = visuals.find((v) => v.subjectId === subject.id) || null;
    const primaryHit = scoreFieldMatch(
      `${subject.identification.primaryName} ${subject.identification.scientificOrChemicalName || ''} ${(subject.identification.commonNames || []).join(' ')}`,
      phrase,
      tokens,
      36,
      12
    );
    const bodyHit = scoreFieldMatch(
      [
        subject.definition || '',
        ...(subject.functions || []),
        subject.mechanism?.summary || '',
        ...(subject.components || []).map((c) => `${c.name} ${c.description}`),
        ...(subject.annotations || []).map((a) => `${a.label} ${a.definition}`),
        ...(subject.searchKeywords || []),
        ...(subject.drugNames || []),
        ...(subject.diseaseNames || [])
      ].join(' '),
      phrase,
      tokens,
      26,
      9
    );
    const total = primaryHit + bodyHit;
    if (total > 0) {
      topics.push({
        subject,
        linkedVisual,
        score: total,
        matchedOn:
          primaryHit >= bodyHit
            ? subject.identification.classification || 'Scientific Identification'
            : 'Functions, Mechanism & Keywords'
      });
    }
  }
  topics.sort((a, b) => b.score - a.score);

  // 3. Score Interactive Structures / Components
  const structures: AcademicStructureSearchHit[] = [];
  const seenAnn = new Set<string>();
  for (const item of visuals) {
    const ctx = resolveAcademicContextForVisual(item);
    const subj = item.subjectId ? ACADEMIC_SUBJECTS[item.subjectId] || null : null;
    for (const ann of ctx.annotations) {
      const key = `${item.id}_${ann.id}`;
      if (seenAnn.has(key)) continue;
      const s = scoreFieldMatch(
        `${ann.label} ${ann.definition} ${ann.location || ''} ${ann.functionRole} ${ann.physiologicalOrClinicalImportance || ''}`,
        phrase,
        tokens,
        34,
        11
      );
      if (s > 0) {
        seenAnn.add(key);
        structures.push({ annotation: ann, subject: subj, visual: item, score: s });
      }
    }
  }
  structures.sort((a, b) => b.score - a.score);

  // 4. Score Equipment
  const equipmentMap = new Map<string, AcademicEquipmentSearchHit>();
  for (const item of visuals) {
    const ctx = resolveAcademicContextForVisual(item);
    for (const eq of ctx.equipmentNames) {
      const s = scoreFieldMatch(
        `${eq} ${ctx.equipmentProfile?.principle || ''} ${item.title}`,
        phrase,
        tokens,
        30,
        10
      );
      if (s > 0 && !equipmentMap.has(eq.toLowerCase())) {
        equipmentMap.set(eq.toLowerCase(), {
          name: eq,
          visual: item,
          experiments: item.experiments,
          score: s
        });
      }
    }
  }
  const equipment = Array.from(equipmentMap.values()).sort((a, b) => b.score - a.score);

  // 5. Score Related Academic Resources (PharmaLab curriculum links)
  const resourcesMap = new Map<string, AcademicResourceSearchHit>();
  for (const subject of Object.values(ACADEMIC_SUBJECTS)) {
    for (const link of subject.pharmaLabLinks || []) {
      const s = scoreFieldMatch(
        `${link.label} ${link.description} ${subject.identification.primaryName} ${subject.searchKeywords.join(' ')}`,
        phrase,
        tokens,
        28,
        9
      );
      if (s > 0 && !resourcesMap.has(link.id)) {
        resourcesMap.set(link.id, {
          link,
          sourceLabel: subject.identification.primaryName,
          score: s
        });
      }
    }
  }
  const resources = Array.from(resourcesMap.values()).sort((a, b) => b.score - a.score);

  return {
    images,
    topics,
    structures: structures.slice(0, 12),
    equipment: equipment.slice(0, 8),
    resources: resources.slice(0, 8)
  };
}
