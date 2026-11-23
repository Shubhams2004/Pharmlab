import { ANATOMY_CATALOG } from '../../data/anatomyCatalog';
import { ENGINE_SUBTOPICS, ENGINE_TOPICS } from '../../data/academicEngineRegistry';
import { SYLLABUS_COURSES, SyllabusCourse } from '../../data/bpharmSem1Syllabus';
import { BookDepartmentTag } from '../knowledge-library/types';
import { DepartmentId } from '../visual-library/types';
import {
  LearningDomainMode,
  StudySectionKey,
  SyllabusProfile,
  SyllabusSubjectNode,
  SyllabusSubtopicNode,
  SyllabusTopicNode,
  SyllabusUnitNode
} from './types';

export const OFFICIAL_BPHARM_SEM1_SYLLABUS_ID = 'syllabus_official_bpharm_sem1';

const DOMAIN_SECTIONS: Record<LearningDomainMode, StudySectionKey[]> = {
  anatomy_physiology: [
    'overview',
    'anatomical_structure',
    'components',
    'functions',
    'physiology',
    'clinical_significance',
    'pharmaceutical_relevance',
    'exam_essentials',
    'references'
  ],
  chemistry_analysis: [
    'overview',
    'definition',
    'fundamentals',
    'mechanism',
    'explanation',
    'examples',
    'pharmaceutical_relevance',
    'important_concepts',
    'exam_essentials',
    'references'
  ],
  pharmaceutics: [
    'overview',
    'definition',
    'classification',
    'components',
    'explanation',
    'advantages_limitations',
    'applications',
    'pharmaceutical_relevance',
    'exam_essentials',
    'references'
  ],
  pharmacognosy: [
    'overview',
    'definition',
    'classification',
    'components',
    'explanation',
    'examples',
    'applications',
    'pharmaceutical_relevance',
    'exam_essentials',
    'references'
  ],
  psychology_comm: [
    'overview',
    'introduction',
    'fundamentals',
    'explanation',
    'applications',
    'clinical_significance',
    'important_concepts',
    'exam_essentials',
    'references'
  ],
  computing_pk: [
    'overview',
    'fundamentals',
    'explanation',
    'examples',
    'applications',
    'pharmaceutical_relevance',
    'important_concepts',
    'exam_essentials',
    'references'
  ],
  general: [
    'overview',
    'introduction',
    'fundamentals',
    'explanation',
    'examples',
    'applications',
    'important_concepts',
    'exam_essentials',
    'references'
  ]
};

export function getRecommendedSectionsForDomain(domain: LearningDomainMode): StudySectionKey[] {
  return DOMAIN_SECTIONS[domain] || DOMAIN_SECTIONS.general;
}

export function inferDomainForCourseCode(code: string, title = ''): {
  domainMode: LearningDomainMode;
  departmentId: DepartmentId | 'python';
  bookDepartment: BookDepartmentTag;
  defaultLabTab?: string;
} {
  const combined = `${code} ${title}`.toLowerCase();
  if (combined.includes('bp104') || combined.includes('bp109') || combined.includes('anatomy')) {
    return {
      domainMode: 'anatomy_physiology',
      departmentId: 'anatomy',
      bookDepartment: 'anatomy',
      defaultLabTab: 'explorer'
    };
  }
  if (
    combined.includes('bp106') ||
    combined.includes('bp111') ||
    combined.includes('inorganic') ||
    combined.includes('analytical')
  ) {
    return {
      domainMode: 'chemistry_analysis',
      departmentId: 'inorganic',
      bookDepartment: 'inorganic',
      defaultLabTab: 'limit_tests'
    };
  }
  if (
    combined.includes('bp102') ||
    combined.includes('bp107') ||
    combined.includes('pharmacy') ||
    combined.includes('pharmaceutics')
  ) {
    return {
      domainMode: 'pharmaceutics',
      departmentId: 'general_pharmacy',
      bookDepartment: 'general_pharmacy',
      defaultLabTab: 'experiments'
    };
  }
  if (combined.includes('bp105') || combined.includes('bp110') || combined.includes('pharmacognosy')) {
    return {
      domainMode: 'pharmacognosy',
      departmentId: 'pharmacognosy',
      bookDepartment: 'pharmacognosy',
      defaultLabTab: 'leaf_constants'
    };
  }
  if (combined.includes('bp103') || combined.includes('bp108') || combined.includes('psychology')) {
    return {
      domainMode: 'psychology_comm',
      departmentId: 'psychology',
      bookDepartment: 'psychology',
      defaultLabTab: 'roleplay'
    };
  }
  if (combined.includes('bp101') || combined.includes('python') || combined.includes('pandas')) {
    return {
      domainMode: 'computing_pk',
      departmentId: 'python',
      bookDepartment: 'python',
      defaultLabTab: 'unit1-2'
    };
  }
  return {
    domainMode: 'general',
    departmentId: 'general_pharmacy',
    bookDepartment: 'all'
  };
}

function matchAnatomyStructuresForText(text: string): string[] {
  const lower = text.toLowerCase();
  const matched: string[] = [];
  for (const s of ANATOMY_CATALOG) {
    const cleanName = s.name.replace(/\s*\(.*?\)\s*/g, '').toLowerCase();
    if (cleanName.length >= 4 && lower.includes(cleanName)) {
      matched.push(s.id);
    } else if (s.alternateNames.some((alt) => alt.length >= 4 && lower.includes(alt.toLowerCase()))) {
      matched.push(s.id);
    }
    if (matched.length >= 8) break;
  }
  if ((lower.includes('kidney') || lower.includes('urinary') || lower.includes('nephron')) && !matched.includes('anat_11_right_kidney')) {
    matched.unshift('anat_11_right_kidney', 'anat_12_left_kidney');
  }
  if ((lower.includes('cardiovascular') || lower.includes('heart') || lower.includes('ecg')) && !matched.includes('anat_03_heart')) {
    matched.unshift('anat_03_heart', 'anat_60_heart_valves');
  }
  if ((lower.includes('blood') || lower.includes('haem') || lower.includes('hemopoiesis')) && !matched.includes('anat_52_blood')) {
    matched.unshift('anat_52_blood', 'anat_43_bone_marrow');
  }
  return Array.from(new Set(matched)).slice(0, 8);
}

function matchEngineTopicId(courseCode: string, unitNo: string, text: string): string | undefined {
  const lower = text.toLowerCase();
  if (courseCode.startsWith('BP104') || courseCode.startsWith('BP109')) {
    if (lower.includes('cardiovascular') || lower.includes('heart')) return 'topic_cardiovascular_system';
    if (lower.includes('nervous') || lower.includes('special senses')) return 'topic_nervous_system';
    if (lower.includes('blood') || lower.includes('lymphatic') || lower.includes('inflammation')) return 'topic_lymphatic_system';
    if (lower.includes('skeletal') || lower.includes('joints') || lower.includes('integumentary')) return 'topic_musculoskeletal_system';
    if (lower.includes('cell') || lower.includes('tissue')) return 'topic_tissues';
    if (unitNo === 'IV') return 'topic_sensory_organs';
  }
  if (courseCode.startsWith('BP106') || courseCode.startsWith('BP111')) return 'topic_limit_tests';
  if (courseCode.startsWith('BP102') || courseCode.startsWith('BP107')) return 'topic_compounding';
  if (courseCode.startsWith('BP105') || courseCode.startsWith('BP110')) return 'topic_botanical_microscopy';
  if (courseCode.startsWith('BP103') || courseCode.startsWith('BP108')) return 'topic_clinical_counseling';
  if (courseCode.startsWith('BP101')) return 'topic_pk_modeling';
  return undefined;
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'introduction',
    'definition',
    'scope',
    'basic',
    'general',
    'methods',
    'principles',
    'study',
    'including',
    'related',
    'systems',
    'structure',
    'functions',
    'types',
    'preparation',
    'using',
    'following',
    'various',
    'pharmaceutical',
    'pharmacy'
  ]);
  const tokens = text
    .replace(/[()[\].,;:•–—*/]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 4 && !stopWords.has(w.toLowerCase()));
  return Array.from(new Set(tokens)).slice(0, 10);
}

function buildSubtopicsFromSection(
  topicId: string,
  sectionHeading: string | undefined,
  paragraphs: string[] | undefined,
  bullets: string[] | undefined,
  courseCode: string
): SyllabusSubtopicNode[] {
  const out: SyllabusSubtopicNode[] = [];
  if (bullets && bullets.length > 0) {
    bullets.forEach((b, idx) => {
      const colonIdx = b.indexOf(':');
      const shortTitle =
        colonIdx > 3 && colonIdx < 68 ? b.slice(0, colonIdx).trim() : b.slice(0, 72).trim();
      const matchedStructs = courseCode.startsWith('BP104') ? matchAnatomyStructuresForText(b) : [];
      out.push({
        id: `${topicId}_sub_${idx + 1}`,
        title: shortTitle,
        summary: b,
        keywords: extractKeywords(b),
        linkedStructureId: matchedStructs[0]
      });
    });
    return out;
  }

  if (paragraphs && paragraphs.length > 0) {
    paragraphs.forEach((p, idx) => {
      const matchedStructs = courseCode.startsWith('BP104') ? matchAnatomyStructuresForText(p) : [];
      const firstSentence = p.split(/[.]/)[0]?.trim() || sectionHeading || `Part ${idx + 1}`;
      out.push({
        id: `${topicId}_sub_${idx + 1}`,
        title:
          sectionHeading && idx === 0
            ? sectionHeading
            : firstSentence.slice(0, 76) + (firstSentence.length > 76 ? '…' : ''),
        summary: p,
        keywords: extractKeywords(`${sectionHeading || ''} ${p}`),
        linkedStructureId: matchedStructs[0]
      });
    });
  }
  return out;
}

function buildCourseSubjectNode(course: SyllabusCourse, syllabusId: string): SyllabusSubjectNode {
  const { domainMode, departmentId, bookDepartment, defaultLabTab } = inferDomainForCourseCode(
    course.courseCode,
    course.courseTitle
  );
  const subjectId = `${syllabusId}_${course.courseCode}`;
  const units: SyllabusUnitNode[] = [];

  if (course.kind === 'theory' && course.units) {
    for (const u of course.units) {
      const unitId = `${subjectId}_unit_${u.unitNo}`;
      const unitHeading =
        u.title ||
        u.sections.find((s) => s.heading)?.heading ||
        `Unit ${u.unitNo}`;
      const topics: SyllabusTopicNode[] = [];

      // If a unit has multiple distinct named headings (e.g. BP104T or BP106T), expose each heading as a focused Topic!
      const namedSections = u.sections.filter((s) => Boolean(s.heading));
      if (namedSections.length > 1) {
        namedSections.forEach((sec, sIdx) => {
          const topicTitle = sec.heading || unitHeading;
          const fullText = [
            topicTitle,
            ...(sec.paragraphs || []),
            ...(sec.bullets || [])
          ].join(' ');
          const topicId = `${unitId}_t${sIdx + 1}`;
          const linkedStructs =
            departmentId === 'anatomy' ? matchAnatomyStructuresForText(fullText) : [];
          const engineTopicId = matchEngineTopicId(course.courseCode, u.unitNo, fullText);
          const subtopics = buildSubtopicsFromSection(
            topicId,
            sec.heading,
            sec.paragraphs,
            sec.bullets,
            course.courseCode
          );

          // Special Renal / Nephron link in Anatomy Unit III / V or Urinary reference
          if (
            course.courseCode === 'BP104T' &&
            u.unitNo === 'V' &&
            ENGINE_SUBTOPICS.subtopic_nephron
          ) {
            // keep cardiovascular linked structures
          }

          topics.push({
            id: topicId,
            syllabusId,
            subjectId,
            subjectCode: course.courseCode,
            subjectTitle: course.courseTitle,
            unitId,
            unitNo: `Unit ${u.unitNo}`,
            unitTitle: unitHeading,
            title: topicTitle,
            summary: (sec.paragraphs?.[0] || sec.bullets?.[0] || topicTitle).slice(0, 260),
            lecturesLabel: u.lectures,
            domainMode,
            departmentId,
            bookDepartment,
            keywords: extractKeywords(fullText),
            subtopics,
            linkedEngineTopicId: engineTopicId,
            linkedStructureIds: linkedStructs,
            linkedLabTab:
              (engineTopicId && ENGINE_TOPICS[engineTopicId]?.linkedTab) || defaultLabTab,
            recommendedSections: getRecommendedSectionsForDomain(domainMode)
          });
        });
      } else {
        const sec = u.sections[0] || {};
        const topicTitle = u.title || sec.heading || unitHeading;
        const fullText = [
          topicTitle,
          ...(u.sections.flatMap((s) => s.paragraphs || [])),
          ...(u.sections.flatMap((s) => s.bullets || []))
        ].join(' ');
        const topicId = `${unitId}_t1`;
        const linkedStructs =
          departmentId === 'anatomy' ? matchAnatomyStructuresForText(fullText) : [];
        const engineTopicId = matchEngineTopicId(course.courseCode, u.unitNo, fullText);

        topics.push({
          id: topicId,
          syllabusId,
          subjectId,
          subjectCode: course.courseCode,
          subjectTitle: course.courseTitle,
          unitId,
          unitNo: `Unit ${u.unitNo}`,
          unitTitle: unitHeading,
          title: topicTitle,
          summary: (sec.paragraphs?.[0] || sec.bullets?.join(' · ') || topicTitle).slice(0, 260),
          lecturesLabel: u.lectures,
          domainMode,
          departmentId,
          bookDepartment,
          keywords: extractKeywords(fullText),
          subtopics: buildSubtopicsFromSection(
            topicId,
            topicTitle,
            u.sections.flatMap((s) => s.paragraphs || []),
            u.sections.flatMap((s) => s.bullets || []),
            course.courseCode
          ),
          linkedEngineTopicId: engineTopicId,
          linkedStructureIds: linkedStructs,
          linkedLabTab:
            (engineTopicId && ENGINE_TOPICS[engineTopicId]?.linkedTab) || defaultLabTab,
          recommendedSections: getRecommendedSectionsForDomain(domainMode)
        });
      }

      units.push({
        id: unitId,
        unitNo: `Unit ${u.unitNo}`,
        title: unitHeading,
        lecturesLabel: u.lectures,
        topics
      });
    }
  } else if (course.kind === 'practical' && course.practicalBlocks) {
    const unitId = `${subjectId}_practicals`;
    const items = course.practicalBlocks.flatMap((b) => b.items || []);
    const fullText = items
      .map((i) => `${i.title} ${i.description || ''} ${(i.subItems || []).join(' ')}`)
      .join(' ');
    const topicId = `${unitId}_t1`;
    const linkedStructs =
      departmentId === 'anatomy' ? matchAnatomyStructuresForText(fullText) : [];
    const engineTopicId = matchEngineTopicId(course.courseCode, 'Practical', fullText);

    const subtopics: SyllabusSubtopicNode[] = items.map((item, idx) => ({
      id: `${topicId}_p${idx + 1}`,
      title: `${item.number ? `${item.number} ` : ''}${item.title}`,
      summary: item.description || (item.subItems ? item.subItems.join('; ') : item.title),
      keywords: extractKeywords(
        `${item.title} ${item.description || ''} ${(item.subItems || []).join(' ')}`
      )
    }));

    units.push({
      id: unitId,
      unitNo: 'Practicals',
      title: course.practicalHeading || 'List of practical',
      lecturesLabel: `${course.maxHours} Hours`,
      topics: [
        {
          id: topicId,
          syllabusId,
          subjectId,
          subjectCode: course.courseCode,
          subjectTitle: course.courseTitle,
          unitId,
          unitNo: 'Practicals',
          unitTitle: course.practicalHeading || 'List of practical',
          title: `${course.courseTitle} — Practical Schedule`,
          summary:
            course.practicalIntro ||
            course.practicalSubtitle ||
            `${items.length} structured laboratory experiments & exercises.`,
          lecturesLabel: `${course.maxHours} Hours`,
          domainMode,
          departmentId,
          bookDepartment,
          keywords: extractKeywords(fullText),
          subtopics,
          linkedEngineTopicId: engineTopicId,
          linkedStructureIds: linkedStructs,
          linkedLabTab: defaultLabTab,
          recommendedSections: getRecommendedSectionsForDomain(domainMode)
        }
      ]
    });
  }

  // Append Renal / Urinary System cross-linked topic from Academic Engine under BP104T
  // when not explicitly listed in Semester I BP104T so the Kidney -> Nephron learning workspace is directly accessible
  if (course.courseCode === 'BP104T') {
    const renalSub = ENGINE_SUBTOPICS.subtopic_nephron;
    const renalTopicId = `${subjectId}_engine_urinary_nephron`;
    units.push({
      id: `${subjectId}_unit_engine_renal`,
      unitNo: 'Anatomy Engine',
      title: 'Urinary System & Nephron (Academic Engine Module)',
      lecturesLabel: 'Supplemental Module',
      topics: [
        {
          id: renalTopicId,
          syllabusId,
          subjectId,
          subjectCode: course.courseCode,
          subjectTitle: course.courseTitle,
          unitId: `${subjectId}_unit_engine_renal`,
          unitNo: 'Anatomy Engine',
          unitTitle: 'Urinary System & Nephron',
          title: 'Kidney & Nephron — Ultrafiltration, Tubular Transport & Drug Clearance',
          summary: renalSub.summary,
          domainMode: 'anatomy_physiology',
          departmentId: 'anatomy',
          bookDepartment: 'anatomy',
          keywords: ['kidney', 'nephron', 'glomerulus', 'renal', 'filtration', 'diuretics', 'urinary'],
          subtopics: [
            {
              id: `${renalTopicId}_sub_1`,
              title: 'Renal Corpuscle & Glomerular Filtration (GFR)',
              summary: renalSub.structureNotes,
              keywords: ['glomerulus', 'bowman', 'gfr'],
              linkedStructureId: 'anat_11_right_kidney',
              linkedSubtopicId: 'subtopic_nephron'
            },
            {
              id: `${renalTopicId}_sub_2`,
              title: 'Tubular Reabsorption, Secretion & Diuretic Targets',
              summary: renalSub.physiologyNotes,
              keywords: ['pct', 'loop of henle', 'dct', 'diuretic'],
              linkedStructureId: 'anat_12_left_kidney',
              linkedSubtopicId: 'subtopic_nephron'
            }
          ],
          linkedEngineTopicId: 'topic_urinary_system',
          linkedStructureIds: [
            'anat_11_right_kidney',
            'anat_12_left_kidney',
            'anat_13_right_ureter',
            'anat_15_urinary_bladder'
          ],
          linkedLabTab: 'explorer',
          recommendedSections: getRecommendedSectionsForDomain('anatomy_physiology')
        }
      ]
    });
  }

  return {
    id: subjectId,
    code: course.courseCode,
    title: course.courseTitle,
    courseType: course.courseType,
    credits: course.credit,
    hoursLabel: `${course.maxHours} hrs (${course.hoursPerWeek.L}-${course.hoursPerWeek.T}-${course.hoursPerWeek.P})`,
    departmentId,
    bookDepartment,
    objectives: course.objectives,
    outcomes: course.outcomes.map((o) => ({ no: o.coNo, statement: o.statement })),
    references: course.references,
    units
  };
}

export function buildOfficialBPharmSem1Profile(): SyllabusProfile {
  const now = 1732300000000;
  return {
    id: OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
    course: 'B.Pharm',
    degree: 'Bachelor of Pharmacy',
    semester: 'Semester I',
    university: 'Pharmacy Council of India (PCI) / Official Syllabus PDF',
    title: 'B.Pharm Semester I (BP101T–BP111P) — Official Syllabus',
    verificationStatus: 'official_syllabus',
    sourceName: 'Uploaded Official B.Pharm Syllabus PDF (Pages 38–65)',
    sourceUrl: '/syllabus/bpharm-sem1-syllabus.pdf',
    accessDate: '2026-11-23',
    isSystemOfficial: true,
    subjects: SYLLABUS_COURSES.map((c) => buildCourseSubjectNode(c, OFFICIAL_BPHARM_SEM1_SYLLABUS_ID)),
    createdAt: now,
    updatedAt: now
  };
}
