import {
  ExamQuestionCategory,
  ExamQuestionItem,
  ExamQuestionPaper,
  ExamQuestionSourceType,
  SyllabusSubjectNode,
  SyllabusTopicNode,
  TopicExamEvidence,
  TopicImportanceLabel
} from './types';

export const EXAM_CATEGORY_LABELS: Record<ExamQuestionCategory, string> = {
  mcq: 'MCQ',
  short_answer: 'Short Answer',
  long_answer: 'Long Answer',
  definition: 'Definition',
  comparison: 'Comparison / Difference',
  mechanism: 'Mechanism / Pathway',
  diagram_based: 'Diagram-Based',
  numerical: 'Numerical / Calculation',
  practical_viva: 'Practical / Viva'
};

export const EXAM_SOURCE_LABELS: Record<ExamQuestionSourceType, string> = {
  actual_previous_year: 'Actual Previous-Year University Paper',
  repeated_across_papers: 'Repeated Across Verified Papers',
  reference_based: 'Reference-Based Exam Question',
  practice_question: 'Practice Question'
};

export const IMPORTANCE_LABEL_TEXT: Record<TopicImportanceLabel, string> = {
  frequently_asked: 'Observed Frequently in Verified Papers',
  repeated_in_previous_papers: 'Repeated Across >=2 Verified Papers',
  syllabus_priority: 'Core Syllabus Priority',
  conceptually_important: 'Conceptually Important',
  practice_recommended: 'Practice Recommended'
};

function normalizePromptTokens(text: string): Set<string> {
  const stop = new Set([
    'what',
    'which',
    'define',
    'explain',
    'describe',
    'write',
    'short',
    'note',
    'notes',
    'detail',
    'with',
    'neat',
    'diagram',
    'label',
    'labeled',
    'labelled',
    'difference',
    'between',
    'discuss',
    'classify',
    'principle',
    'procedure',
    'various',
    'give',
    'list',
    'mention',
    'their',
    'about',
    'from',
    'into'
  ]);
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stop.has(w));
  return new Set(tokens);
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  a.forEach((tok) => {
    if (b.has(tok)) intersection++;
  });
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function classifyQuestionCategory(prompt: string, hasOptions = false): ExamQuestionCategory {
  if (hasOptions) return 'mcq';
  const lower = prompt.toLowerCase();
  if (/^define\b|\bdefinition\b|\bwhat is meant by\b/.test(lower)) return 'definition';
  if (/\bdifferentiate\b|\bdistinguish\b|\bcompare\b|\bdifference between\b|\bcontrast\b/.test(lower)) {
    return 'comparison';
  }
  if (/\bdiagram\b|\bsketch\b|\bdraw and label\b|\blabeled\b|\blabelled\b|\bapparatus\b/.test(lower)) {
    return 'diagram_based';
  }
  if (/\bcalculate\b|\bnumerical\b|\bdetermine the dose\b|\bmolarity\b|\bnormality\b|\bproof spirit\b|\balligation\b|\bisotonic\b|\bdisplacement value\b|\bstomatal index\b/.test(lower)) {
    return 'numerical';
  }
  if (/\bviva\b|\bpractical\b|\bstandardization of\b|\bassay of\b|\blimit test procedure\b/.test(lower)) {
    return 'practical_viva';
  }
  if (/\bmechanism\b|\bpathway\b|\bconduction\b|\bfiltration\b|\bphysiological\b|\bregulation\b|\bpharmacological action\b/.test(lower)) {
    return 'mechanism';
  }
  if (/\bdetail\b|\b10\s*m\b|\b10 marks\b|\belaborate\b|\bcomprehensive\b|\blong answer\b/.test(lower)) {
    return 'long_answer';
  }
  return 'short_answer';
}

export function parseQuestionPaperText(
  rawText: string,
  opts: {
    paperId: string;
    paperTitle: string;
    subjectCode: string;
    university: string;
    examSession: string;
    isVerifiedOfficialPaper: boolean;
    syllabusSubjects?: SyllabusSubjectNode[];
  }
): ExamQuestionItem[] {
  const lines = rawText
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const subject = opts.syllabusSubjects?.find(
    (s) => s.code.toUpperCase() === opts.subjectCode.toUpperCase()
  );

  const rawQuestions: Array<{ prompt: string; marks?: number; options?: string[] }> = [];
  const qStartRegex = /^(?:Q\.?\s*\d+[a-z]?|\d+\s*[.)]|\([a-z]\)|[a-z]\))\s+(.+)/i;
  const optionRegex = /^(?:\(([A-Da-d])\)|([A-Da-d])[.)])\s+(.+)/;
  const marksRegex = /(?:\(|\[)?\s*(\d{1,2})\s*(?:M|Marks?|marks?)\s*(?:\)|\])?/i;

  let current: { prompt: string; marks?: number; options: string[] } | null = null;

  for (const line of lines) {
    // Skip obvious exam header metadata lines
    if (
      /^(seat no|time:|max\.?\s*marks|total marks|instructions|note:|n\.b\.|b\.pharm|semester|date:)/i.test(
        line
      ) &&
      line.length < 90
    ) {
      continue;
    }

    const optMatch = line.match(optionRegex);
    if (optMatch && current && current.options.length < 5) {
      current.options.push(optMatch[3].trim());
      continue;
    }

    const qMatch = line.match(qStartRegex);
    if (qMatch) {
      if (current && current.prompt.length >= 10) {
        rawQuestions.push({
          prompt: current.prompt,
          marks: current.marks,
          options: current.options.length >= 2 ? current.options : undefined
        });
      }
      let text = qMatch[1].trim();
      const mMatch = text.match(marksRegex);
      let marks: number | undefined;
      if (mMatch) {
        const val = Number(mMatch[1]);
        if (val >= 1 && val <= 20) marks = val;
        text = text.replace(marksRegex, '').replace(/\s+/g, ' ').trim();
      }
      current = { prompt: text, marks, options: [] };
    } else if (current) {
      const mMatch = line.match(marksRegex);
      if (mMatch && !current.marks) {
        const val = Number(mMatch[1]);
        if (val >= 1 && val <= 20) current.marks = val;
      }
      current.prompt = `${current.prompt} ${line.replace(marksRegex, '').trim()}`.trim();
    } else if (line.length > 18) {
      const mMatch = line.match(marksRegex);
      let marks: number | undefined;
      let clean = line;
      if (mMatch) {
        const val = Number(mMatch[1]);
        if (val >= 1 && val <= 20) marks = val;
        clean = line.replace(marksRegex, '').trim();
      }
      current = { prompt: clean, marks, options: [] };
    }
  }

  if (current && current.prompt.length >= 10) {
    rawQuestions.push({
      prompt: current.prompt,
      marks: current.marks,
      options: current.options.length >= 2 ? current.options : undefined
    });
  }

  const allTopics: SyllabusTopicNode[] = subject
    ? subject.units.flatMap((u) => u.topics)
    : [];

  return rawQuestions.map((rq, idx) => {
    const tokens = normalizePromptTokens(rq.prompt);
    let bestTopic: SyllabusTopicNode | undefined;
    let bestScore = 0;

    for (const topic of allTopics) {
      const topicTokens = normalizePromptTokens(
        `${topic.title} ${topic.unitTitle} ${topic.keywords.join(' ')} ${topic.subtopics
          .map((st) => st.title)
          .join(' ')}`
      );
      let overlap = 0;
      tokens.forEach((t) => {
        if (topicTokens.has(t)) overlap++;
      });
      if (overlap > bestScore) {
        bestScore = overlap;
        bestTopic = topic;
      }
    }

    let category = classifyQuestionCategory(rq.prompt, Boolean(rq.options));
    if (rq.marks && rq.marks >= 8 && category === 'short_answer') {
      category = 'long_answer';
    } else if (rq.marks && rq.marks <= 2 && category === 'short_answer') {
      category = 'definition';
    }

    const sourceType: ExamQuestionSourceType = opts.isVerifiedOfficialPaper
      ? 'actual_previous_year'
      : 'practice_question';

    return {
      id: `q_imp_${opts.paperId}_${idx + 1}`,
      subjectCode: opts.subjectCode,
      unitNo: bestTopic?.unitNo,
      topicId: bestTopic?.id,
      topicTitle: bestTopic?.title || `${opts.subjectCode} Imported Question`,
      category,
      sourceType,
      prompt: rq.prompt,
      options: rq.options,
      answerGuidance: opts.isVerifiedOfficialPaper
        ? `Imported from ${opts.university} (${opts.examSession}). Consult standard syllabus textbooks and topic notes in Study Mode to structure key definitions, steps, and labeled diagrams.`
        : `Imported from unverified practice sheet (${opts.paperTitle}). Verify alignment with your official university question bank.`,
      marks: rq.marks,
      paperId: opts.paperId,
      university: opts.university,
      examYear: opts.examSession,
      sourceAttribution: `${opts.university} · ${opts.paperTitle} (${opts.examSession})`,
      createdAt: Date.now() + idx
    };
  });
}

export function detectRepeatedQuestionsAcrossPapers(
  incomingQuestions: ExamQuestionItem[],
  existingQuestions: ExamQuestionItem[],
  paperRefLabel: string
): {
  processedIncoming: ExamQuestionItem[];
  updatedExisting: ExamQuestionItem[];
} {
  const existingVerified = existingQuestions.filter(
    (q) => q.sourceType === 'actual_previous_year' || q.sourceType === 'repeated_across_papers'
  );

  const updatedExistingMap = new Map<string, ExamQuestionItem>();
  const processedIncoming = incomingQuestions.map((inc) => {
    if (inc.sourceType !== 'actual_previous_year') return inc;
    const incTokens = normalizePromptTokens(inc.prompt);
    const matchedPapers = new Set<string>([paperRefLabel]);

    for (const ex of existingVerified) {
      if (ex.paperId && ex.paperId === inc.paperId) continue;
      if (ex.subjectCode !== inc.subjectCode) continue;
      const exTokens = normalizePromptTokens(ex.prompt);
      const sim = jaccardSimilarity(incTokens, exTokens);
      if (sim >= 0.5) {
        const exLabel = ex.examYear ? `${ex.university || ''} (${ex.examYear})`.trim() : ex.sourceAttribution;
        matchedPapers.add(exLabel);
        const existingRefs = new Set(ex.repeatedPaperRefs || [exLabel]);
        existingRefs.add(paperRefLabel);
        updatedExistingMap.set(ex.id, {
          ...ex,
          sourceType: 'repeated_across_papers',
          repeatedPaperRefs: Array.from(existingRefs)
        });
      }
    }

    if (matchedPapers.size >= 2) {
      return {
        ...inc,
        sourceType: 'repeated_across_papers' as const,
        repeatedPaperRefs: Array.from(matchedPapers)
      };
    }
    return inc;
  });

  return {
    processedIncoming,
    updatedExisting: Array.from(updatedExistingMap.values())
  };
}

export interface ExamIntelligenceReport {
  verifiedPaperCount: number;
  verifiedQuestionCount: number;
  repeatedClustersCount: number;
  hasSufficientEvidenceForPatterns: boolean;
  limitationBanner: string;
  unitDistribution: Array<{
    unitNo: string;
    totalQuestions: number;
    verifiedPaperQuestions: number;
    repeatedQuestions: number;
    observedMarksSum: number | null;
  }>;
  categoryDistribution: Array<{
    category: ExamQuestionCategory;
    label: string;
    count: number;
  }>;
  repeatedQuestions: ExamQuestionItem[];
}

export function computeExamIntelligence(
  subjectCode: string,
  allQuestions: ExamQuestionItem[],
  allPapers: ExamQuestionPaper[]
): ExamIntelligenceReport {
  const subjectQuestions = allQuestions.filter(
    (q) => q.subjectCode.toUpperCase() === subjectCode.toUpperCase()
  );
  const verifiedPapers = allPapers.filter(
    (p) =>
      p.isVerifiedOfficialPaper &&
      p.courseCode.toUpperCase() === subjectCode.toUpperCase()
  );

  const verifiedQuestions = subjectQuestions.filter(
    (q) => q.sourceType === 'actual_previous_year' || q.sourceType === 'repeated_across_papers'
  );
  const repeatedQuestions = subjectQuestions.filter(
    (q) => q.sourceType === 'repeated_across_papers'
  );

  const unitMap = new Map<
    string,
    {
      unitNo: string;
      totalQuestions: number;
      verifiedPaperQuestions: number;
      repeatedQuestions: number;
      marksValues: number[];
    }
  >();

  for (const q of subjectQuestions) {
    const key = q.unitNo || 'General / Cross-Unit';
    const cur = unitMap.get(key) || {
      unitNo: key,
      totalQuestions: 0,
      verifiedPaperQuestions: 0,
      repeatedQuestions: 0,
      marksValues: []
    };
    cur.totalQuestions += 1;
    if (q.sourceType === 'actual_previous_year' || q.sourceType === 'repeated_across_papers') {
      cur.verifiedPaperQuestions += 1;
    }
    if (q.sourceType === 'repeated_across_papers') {
      cur.repeatedQuestions += 1;
    }
    if (typeof q.marks === 'number' && q.marks > 0) {
      cur.marksValues.push(q.marks);
    }
    unitMap.set(key, cur);
  }

  const unitDistribution = Array.from(unitMap.values()).map((u) => ({
    unitNo: u.unitNo,
    totalQuestions: u.totalQuestions,
    verifiedPaperQuestions: u.verifiedPaperQuestions,
    repeatedQuestions: u.repeatedQuestions,
    observedMarksSum:
      u.marksValues.length > 0 ? u.marksValues.reduce((sum, v) => sum + v, 0) : null
  }));

  const catCounts = new Map<ExamQuestionCategory, number>();
  for (const q of subjectQuestions) {
    catCounts.set(q.category, (catCounts.get(q.category) || 0) + 1);
  }
  const categoryDistribution = (Object.keys(EXAM_CATEGORY_LABELS) as ExamQuestionCategory[])
    .map((cat) => ({
      category: cat,
      label: EXAM_CATEGORY_LABELS[cat],
      count: catCounts.get(cat) || 0
    }))
    .filter((entry) => entry.count > 0);

  const hasSufficientEvidenceForPatterns = verifiedPapers.length >= 2;
  const limitationBanner = hasSufficientEvidenceForPatterns
    ? `Evidence derived from ${verifiedPapers.length} imported verified ${subjectCode} university question papers (${verifiedQuestions.length} verified exam questions).`
    : verifiedPapers.length === 1
    ? `Only 1 verified ${subjectCode} question paper is imported (${verifiedQuestions.length} questions). Cross-paper repetition and multi-year frequency patterns require at least 2 imported verified university papers.`
    : `No verified previous-year ${subjectCode} university question papers have been imported yet. Showing verified curriculum reference-based and practice questions only — import 2+ previous-year papers above to compute real exam frequency and repetition evidence.`;

  return {
    verifiedPaperCount: verifiedPapers.length,
    verifiedQuestionCount: verifiedQuestions.length,
    repeatedClustersCount: repeatedQuestions.length,
    hasSufficientEvidenceForPatterns,
    limitationBanner,
    unitDistribution,
    categoryDistribution,
    repeatedQuestions
  };
}

export function getTopicExamEvidence(
  topic: SyllabusTopicNode,
  allQuestions: ExamQuestionItem[],
  allPapers: ExamQuestionPaper[]
): TopicExamEvidence {
  const verifiedPapers = allPapers.filter(
    (p) =>
      p.isVerifiedOfficialPaper &&
      p.courseCode.toUpperCase() === topic.subjectCode.toUpperCase()
  );

  const topicQuestions = matchQuestionsToTopic(topic, allQuestions);
  const verifiedTopicQs = topicQuestions.filter(
    (q) => q.sourceType === 'actual_previous_year' || q.sourceType === 'repeated_across_papers'
  );
  const repeatedQs = topicQuestions.filter((q) => q.sourceType === 'repeated_across_papers');
  const paperIds = new Set(verifiedTopicQs.map((q) => q.paperId).filter(Boolean));
  const observedMarks = verifiedTopicQs
    .map((q) => q.marks)
    .filter((m): m is number => typeof m === 'number' && m > 0);
  const marksTotalObserved =
    observedMarks.length > 0 ? observedMarks.reduce((a, b) => a + b, 0) : null;
  const questionFormatsObserved = Array.from(new Set(topicQuestions.map((q) => q.category)));

  const labels: TopicImportanceLabel[] = [];
  if (repeatedQs.length > 0) labels.push('repeated_in_previous_papers');
  if (verifiedPapers.length >= 2 && paperIds.size >= 2) {
    labels.push('frequently_asked');
  }
  if (topic.lecturesLabel || topic.subtopics.length >= 3) {
    labels.push('syllabus_priority');
  }
  if (topic.linkedEngineTopicId || (topic.linkedStructureIds && topic.linkedStructureIds.length > 0)) {
    labels.push('conceptually_important');
  }
  if (topicQuestions.length > 0) {
    labels.push('practice_recommended');
  }

  return {
    topicId: topic.id,
    verifiedPaperAppearanceCount: paperIds.size,
    totalVerifiedPaperQuestions: verifiedTopicQs.length,
    repeatedQuestionsCount: repeatedQs.length,
    marksTotalObserved,
    questionFormatsObserved,
    labels: Array.from(new Set(labels)),
    analysisLimited: verifiedPapers.length < 2,
    limitationReason:
      verifiedPapers.length < 2
        ? 'Insufficient verified previous-year papers (<2 imported for this subject) to claim exam frequency.'
        : `Observed across ${paperIds.size} of ${verifiedPapers.length} verified papers.`
  };
}

export function matchQuestionsToTopic(
  topic: SyllabusTopicNode,
  allQuestions: ExamQuestionItem[]
): ExamQuestionItem[] {
  const topicKeywords = new Set([
    ...topic.keywords.map((k) => k.toLowerCase()),
    ...topic.title
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 4)
  ]);

  return allQuestions.filter((q) => {
    if (q.topicId && q.topicId === topic.id) return true;
    if (q.subjectCode.toUpperCase() !== topic.subjectCode.toUpperCase()) return false;
    if (q.unitNo && q.unitNo.toLowerCase() === topic.unitNo.toLowerCase()) {
      const hay = `${q.prompt} ${q.topicTitle}`.toLowerCase();
      let matchCount = 0;
      topicKeywords.forEach((kw) => {
        if (hay.includes(kw)) matchCount++;
      });
      if (matchCount >= 1) return true;
    }
    const hay = `${q.prompt} ${q.topicTitle}`.toLowerCase();
    let hits = 0;
    topicKeywords.forEach((kw) => {
      if (hay.includes(kw)) hits++;
    });
    return hits >= 2;
  });
}

// Verified Curriculum Reference-Based & Practice Questions Bank
// STRICTLY labeled 'reference_based' or 'practice_question' — NEVER fabricated as 'actual_previous_year'
export const CURATED_REFERENCE_QUESTIONS: ExamQuestionItem[] = [
  // BP104T — Anatomy & Physiology (including Kidney/Nephron, Heart, Cell/Tissue, Blood)
  {
    id: 'ref_bp104t_nephron_mcq_1',
    subjectCode: 'BP104T',
    unitNo: 'Anatomy Engine',
    topicTitle: 'Kidney & Nephron — Ultrafiltration, Tubular Transport & Drug Clearance',
    category: 'mcq',
    sourceType: 'reference_based',
    prompt:
      'Where do loop diuretics such as furosemide inhibit the Na⁺–K⁺–2Cl⁻ (NKCC2) symporter along the nephron?',
    options: [
      'Proximal convoluted tubule (PCT)',
      'Thick ascending limb of the Loop of Henle',
      'Early distal convoluted tubule (DCT)',
      'Cortical collecting duct'
    ],
    correctOptionIndex: 1,
    answerGuidance:
      'Furosemide acts on the luminal Na⁺–K⁺–2Cl⁻ cotransporter (NKCC2) in the thick ascending limb of the Loop of Henle, abolishing the corticomedullary osmotic gradient and markedly increasing Na⁺/water excretion.',
    marks: 1,
    sourceAttribution: 'Reference-Based · Tortora & Guyton Renal Physiology',
    createdAt: 1732300001001
  },
  {
    id: 'ref_bp104t_nephron_def_1',
    subjectCode: 'BP104T',
    unitNo: 'Anatomy Engine',
    topicTitle: 'Kidney & Nephron — Ultrafiltration, Tubular Transport & Drug Clearance',
    category: 'definition',
    sourceType: 'reference_based',
    prompt: 'Define Glomerular Filtration Rate (GFR) and state its normal physiological range in a healthy adult.',
    answerGuidance:
      'GFR is the total volume of plasma ultrafiltrate formed by all nephrons of both kidneys per minute. Normal physiological GFR in a healthy young adult averages ~125 mL/min (~180 L/day).',
    marks: 2,
    sourceAttribution: 'Reference-Based · Guyton & Hall Textbook of Medical Physiology',
    createdAt: 1732300001002
  },
  {
    id: 'ref_bp104t_nephron_mech_1',
    subjectCode: 'BP104T',
    unitNo: 'Anatomy Engine',
    topicTitle: 'Kidney & Nephron — Ultrafiltration, Tubular Transport & Drug Clearance',
    category: 'mechanism',
    sourceType: 'reference_based',
    prompt:
      'Explain the Starling forces governing net filtration pressure (NFP) across the glomerular filtration membrane.',
    answerGuidance:
      'Net Filtration Pressure NFP = GBHP − (CHP + BCOP) ≈ 55 − (15 + 30) = +10 mmHg, where Glomerular Blood Hydrostatic Pressure (GBHP ≈ 55 mmHg) promotes filtration while Capsular Hydrostatic Pressure (CHP ≈ 15 mmHg) and Blood Colloid Osmotic Pressure (BCOP ≈ 30 mmHg) oppose filtration.',
    marks: 5,
    sourceAttribution: 'Reference-Based · Tortora Principles of Anatomy & Physiology',
    createdAt: 1732300001003
  },
  {
    id: 'ref_bp104t_nephron_diag_1',
    subjectCode: 'BP104T',
    unitNo: 'Anatomy Engine',
    topicTitle: 'Kidney & Nephron — Ultrafiltration, Tubular Transport & Drug Clearance',
    category: 'diagram_based',
    sourceType: 'practice_question',
    prompt:
      'Draw a neat labeled diagram of a nephron and trace the sequential tubular transport roles of PCT, Loop of Henle, DCT, and Collecting Duct.',
    answerGuidance:
      'Label: Afferent & efferent arterioles, Glomerulus, Bowman’s capsule, Proximal Convoluted Tubule (~65% obligatory Na⁺/H₂O + glucose reabsorption & OAT/OCT drug secretion), Descending & Ascending Loop of Henle (countercurrent concentration), Distal Convoluted Tubule (Na⁺/Cl⁻ cotransport & macula densa), and Collecting Duct (ADH-regulated aquaporins).',
    marks: 10,
    sourceAttribution: 'Practice Question · BP104T / Visual Library Nephron Plate',
    createdAt: 1732300001004
  },
  {
    id: 'ref_bp104t_cell_comp_1',
    subjectCode: 'BP104T',
    unitNo: 'Unit I',
    topicTitle: 'Introduction to Human Body & Cellular Level of Organization',
    category: 'comparison',
    sourceType: 'reference_based',
    prompt:
      'Compare active transport and facilitated diffusion across the plasma membrane with respect to energy requirement, concentration gradient, and saturation.',
    answerGuidance:
      'Facilitated diffusion moves solutes down their electrochemical gradient without direct ATP expenditure (saturable carrier/channel mediated). Active transport moves solutes against their gradient, requires cellular energy (primary ATP hydrolysis e.g. Na⁺/K⁺-ATPase, or secondary ion-gradient coupling), and exhibits carrier saturation.',
    marks: 5,
    sourceAttribution: 'Reference-Based · BP104T Unit I Syllabus & Tortora',
    createdAt: 1732300001005
  },
  {
    id: 'ref_bp104t_cvs_long_1',
    subjectCode: 'BP104T',
    unitNo: 'Unit V',
    topicTitle: 'Cardiovascular System',
    category: 'long_answer',
    sourceType: 'reference_based',
    prompt:
      'Describe the conducting system of the human heart and correlate it with the waves of a normal Lead-II electrocardiogram (ECG).',
    answerGuidance:
      'Trace impulse generation at the SA node (pacemaker, 70–80 bpm) → internodal pathways → AV node (~0.1 s delay enabling ventricular filling) → Bundle of His → Right & Left Bundle Branches → Purkinje fibers. Correlate P wave (atrial depolarization), QRS complex (ventricular depolarization), and T wave (ventricular repolarization).',
    marks: 10,
    sourceAttribution: 'Reference-Based · BP104T Unit V Syllabus',
    createdAt: 1732300001006
  },
  {
    id: 'ref_bp104t_blood_viva_1',
    subjectCode: 'BP109P',
    unitNo: 'Practicals',
    topicTitle: 'Human Anatomy, Physiology & Pathophysiology — Practical Schedule',
    category: 'practical_viva',
    sourceType: 'reference_based',
    prompt:
      'Why is Hayem’s fluid used as the diluting solution for manual RBC counting in Neubauer’s hemocytometer?',
    answerGuidance:
      'Hayem’s fluid is isotonic to prevent RBC lysis (NaCl and Na₂SO₄ maintain isotonicity and prevent rouleaux formation) while HgCl₂ acts as a preservative/antifungal agent.',
    marks: 2,
    sourceAttribution: 'Reference-Based · BP109P Experiment 9 & Sembulingam',
    createdAt: 1732300001007
  },

  // BP106T / BP111P — Pharmaceutical Inorganic & Analytical Chemistry
  {
    id: 'ref_bp106t_limittest_viva_1',
    subjectCode: 'BP106T',
    unitNo: 'Unit I',
    topicTitle: 'Impurities in Pharmaceutical Substances & Pharmacopoeial Limit Tests',
    category: 'short_answer',
    sourceType: 'reference_based',
    prompt:
      'Explain the role of nitric acid in the IP Limit Test for Chlorides and citric acid in the IP Limit Test for Iron.',
    answerGuidance:
      'In the Chloride limit test, dilute HNO₃ provides an acidic medium that prevents precipitation of other silver salts (e.g. Ag₂CO₃, Ag₃PO₄) and enhances AgCl opalescence. In the Iron limit test, citric acid complexes iron so that iron does not precipitate as ferric hydroxide when the solution is made alkaline with ammonia, permitting formation of the soluble purple ferrous-thioglycollate complex.',
    marks: 5,
    sourceAttribution: 'Reference-Based · Indian Pharmacopoeia & BP106T Unit I',
    createdAt: 1732300001008
  },
  {
    id: 'ref_bp106t_arsenic_diag_1',
    subjectCode: 'BP106T',
    unitNo: 'Unit I',
    topicTitle: 'Impurities in Pharmaceutical Substances & Pharmacopoeial Limit Tests',
    category: 'diagram_based',
    sourceType: 'practice_question',
    prompt:
      'Sketch the Gutzeit apparatus used in the IP Limit Test for Arsenic and label the function of lead-acetate cotton wool and mercuric chloride paper.',
    answerGuidance:
      'Label wide-mouth 120 mL bottle, glass tube (6.5 mm internal diameter) with lower lateral hole, lead-acetate cotton plug (traps interfering H₂S gas), and upper clamped mercuric chloride paper (reacts with AsH₃ gas to produce a quantitative yellow-brown stain compared against a 1 mL standard arsenic solution).',
    marks: 5,
    sourceAttribution: 'Practice Question · BP106T Unit I / BP111P Exp 1e',
    createdAt: 1732300001009
  },
  {
    id: 'ref_bp106t_buffers_num_1',
    subjectCode: 'BP106T',
    unitNo: 'Unit III',
    topicTitle: 'Acids, Bases and Buffers; Major Extra and Intracellular Electrolytes',
    category: 'numerical',
    sourceType: 'practice_question',
    prompt:
      'Using the Henderson–Hasselbalch equation, calculate the pH of an acetate buffer containing 0.1 M acetic acid (pKa = 4.76) and 0.1 M sodium acetate.',
    answerGuidance:
      'pH = pKa + log([Salt]/[Acid]) = 4.76 + log(0.1 / 0.1) = 4.76 + 0 = 4.76.',
    marks: 2,
    sourceAttribution: 'Practice Question · BP106T Unit III Buffers',
    createdAt: 1732300001010
  },

  // BP102T / BP107P — General Pharmacy
  {
    id: 'ref_bp102t_posology_num_1',
    subjectCode: 'BP102T',
    unitNo: 'Unit II',
    topicTitle: 'Posology & Pediatric Dose Calculations',
    category: 'numerical',
    sourceType: 'reference_based',
    prompt:
      'If the adult dose of a drug is 500 mg, calculate the pediatric dose for a 4-year-old child using Young’s formula and Dilling’s formula.',
    answerGuidance:
      'Young’s formula: Child dose = [Age / (Age + 12)] × Adult dose = (4 / 16) × 500 = 125 mg. Dilling’s formula: Child dose = (Age / 20) × Adult dose = (4 / 20) × 500 = 100 mg.',
    marks: 5,
    sourceAttribution: 'Reference-Based · BP102T Unit II Posology & Remington',
    createdAt: 1732300001011
  },
  {
    id: 'ref_bp102t_emulsion_comp_1',
    subjectCode: 'BP102T',
    unitNo: 'Unit IV',
    topicTitle: 'Biphasic Liquid Dosage Forms: Suspensions and Emulsions',
    category: 'comparison',
    sourceType: 'reference_based',
    prompt:
      'Distinguish between flocculated and deflocculated suspensions with reference to sedimentation rate, supernatant clarity, and cake formation.',
    answerGuidance:
      'Flocculated suspensions form loose porous aggregates that settle rapidly, leave a clear supernatant, and redisperse easily without forming a hard cake. Deflocculated suspensions settle slowly as discrete particles, have a turbid supernatant during settling, and gradually form a compact hard cake difficult to redisperse.',
    marks: 5,
    sourceAttribution: 'Reference-Based · BP102T Unit IV & Aulton Pharmaceutics',
    createdAt: 1732300001012
  },

  // BP105T / BP110P — Pharmacognosy
  {
    id: 'ref_bp105t_stomata_num_1',
    subjectCode: 'BP105T',
    unitNo: 'Unit III',
    topicTitle: 'Quality Control of Crude Drugs of Natural Origin',
    category: 'numerical',
    sourceType: 'reference_based',
    prompt:
      'In a leaf epidermis field under microscopy, 24 stomata and 96 epidermal cells are counted. Calculate the Stomatal Index (I).',
    answerGuidance:
      'Stomatal Index I = [S / (E + S)] × 100 = [24 / (96 + 24)] × 100 = (24 / 120) × 100 = 20.0%.',
    marks: 2,
    sourceAttribution: 'Reference-Based · BP110P Experiment 8 & Kokate Pharmacognosy',
    createdAt: 1732300001013
  },
  {
    id: 'ref_bp105t_eval_short_1',
    subjectCode: 'BP105T',
    unitNo: 'Unit III',
    topicTitle: 'Quality Control of Crude Drugs of Natural Origin',
    category: 'short_answer',
    sourceType: 'reference_based',
    prompt:
      'Define total ash, acid-insoluble ash, and water-soluble ash in pharmacognostic evaluation of crude drugs.',
    answerGuidance:
      'Total ash measures total inorganic physiological + non-physiological residue after incineration; acid-insoluble ash quantifies siliceous earthy contamination (sand/soil) insoluble in dilute HCl; water-soluble ash indicates water-soluble inorganic salts and helps detect exhausted crude drugs.',
    marks: 5,
    sourceAttribution: 'Reference-Based · BP105T Unit III & Trease & Evans',
    createdAt: 1732300001014
  },

  // BP103T — Healthcare Psychology & Communication
  {
    id: 'ref_bp103t_spikes_short_1',
    subjectCode: 'BP103T',
    unitNo: 'Unit II',
    topicTitle: 'Therapeutic Communication, Patient Counseling & Clinical Handover',
    category: 'short_answer',
    sourceType: 'reference_based',
    prompt: 'Outline the six sequential steps of the SPIKES protocol for delivering serious clinical news.',
    answerGuidance:
      'S — Setting up the interview (privacy, seating); P — Assessing patient Perception; I — Obtaining patient Invitation; K — Giving Knowledge and information clearly; E — Addressing Emotions with empathy; S — Strategy and Summary.',
    marks: 5,
    sourceAttribution: 'Reference-Based · BP103T / BP108P Clinical Communication Practicals',
    createdAt: 1732300001015
  },

  // BP101T — Python & Pharmaceutical Data Science
  {
    id: 'ref_bp101t_python_mcq_1',
    subjectCode: 'BP101T',
    unitNo: 'Unit IV',
    topicTitle: 'Data Analysis using Pandas and Pharmacokinetic Visualization',
    category: 'mcq',
    sourceType: 'practice_question',
    prompt:
      'Which Pandas method calculates summary descriptive statistics (count, mean, std, min, quartiles, max) for numerical columns in a clinical PK DataFrame?',
    options: ['df.summary()', 'df.describe()', 'df.aggregate_all()', 'df.stats()'],
    correctOptionIndex: 1,
    answerGuidance:
      'df.describe() outputs count, mean, standard deviation, minimum, 25th/50th/75th percentiles, and maximum for numeric columns.',
    marks: 1,
    sourceAttribution: 'Practice Question · BP101T Unit IV Pandas Syllabus',
    createdAt: 1732300001016
  }
];
