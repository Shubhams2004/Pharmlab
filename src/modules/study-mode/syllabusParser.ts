import { pdfjsLib } from '../knowledge-library/pdfWorker';
import { createTimeoutSignal, sanitizeHttpUrl, stripMarkup } from '../resource-hub/utils';
import {
  getRecommendedSectionsForDomain,
  inferDomainForCourseCode
} from './syllabusBridge';
import {
  OnlineSyllabusCandidate,
  SyllabusProfile,
  SyllabusSubjectNode,
  SyllabusSubtopicNode,
  SyllabusTopicNode,
  SyllabusUnitNode,
  SyllabusVerificationStatus
} from './types';

export interface SyllabusMetaInput {
  course: string;
  degree: string;
  semester: string;
  university: string;
  title?: string;
  verificationStatus: SyllabusVerificationStatus;
  sourceName: string;
  sourceUrl?: string;
}

export interface OnlineSyllabusDiscoveryResult {
  candidates: OnlineSyllabusCandidate[];
  warnings: string[];
  officialPortals: Array<{
    name: string;
    url: string;
    note: string;
  }>;
}

export const OFFICIAL_SYLLABUS_PORTALS: Array<{
  name: string;
  url: string;
  note: string;
}> = [
  {
    name: 'Pharmacy Council of India (PCI) — Syllabus Portal',
    url: 'https://www.pci.nic.in/Syllabus.html',
    note: 'Official PCI B.Pharm / D.Pharm / Pharm.D syllabus PDFs. External government portals restrict direct browser CORS fetch; download PDF from PCI and import via Preview & Import below.'
  },
  {
    name: 'Savitribai Phule Pune University (SPPU) Syllabi',
    url: 'https://www.unipune.ac.in/university_files/syllabi.htm',
    note: 'University-specific pharmacy syllabi directory (download PDF and import to override or supplement PCI curriculum).'
  },
  {
    name: 'Dr. A.P.J. Abdul Kalam Technical University (AKTU)',
    url: 'https://aktu.ac.in/syllabus.html',
    note: 'Official B.Pharm semester syllabus PDFs published by AKTU.'
  },
  {
    name: 'Rajiv Gandhi University of Health Sciences (RGUHS)',
    url: 'https://www.rguhs.ac.in/',
    note: 'Official Karnataka pharmacy curriculum and ordinance documents.'
  },
  {
    name: 'Gujarat Technological University (GTU) Syllabus',
    url: 'https://syllabus.gtu.ac.in/',
    note: 'Course-code searchable B.Pharm university syllabus directory.'
  }
];

export async function extractTextFromPdfFile(file: File): Promise<{
  text: string;
  pageCount: number;
}> {
  const buffer = await file.arrayBuffer();
  const task = pdfjsLib.getDocument({
    data: new Uint8Array(buffer.slice(0)),
    verbosity: pdfjsLib.VerbosityLevel.ERRORS
  });
  const doc = await task.promise;
  try {
    const pages: string[] = [];
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      const lines: string[] = [];
      let currentLine = '';
      for (const item of content.items as Array<{ str?: string; hasEOL?: boolean }>) {
        const str = item.str || '';
        currentLine += (currentLine && str && !currentLine.endsWith(' ') ? ' ' : '') + str;
        if (item.hasEOL) {
          if (currentLine.trim()) lines.push(currentLine.trim());
          currentLine = '';
        }
      }
      if (currentLine.trim()) lines.push(currentLine.trim());
      pages.push(lines.join('\n'));
      page.cleanup();
    }
    return {
      text: pages.join('\n\n'),
      pageCount: doc.numPages
    };
  } finally {
    await doc.destroy();
  }
}

export function parseSyllabusTextToProfile(
  rawText: string,
  meta: SyllabusMetaInput
): SyllabusProfile {
  const lines = rawText
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const syllabusId = `syllabus_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const subjectBlocks: Array<{
    code: string;
    title: string;
    rawLines: string[];
  }> = [];

  const courseCodeRegex = /\b([A-Z]{2,5}\s?-?\d{3,4}[A-Z]?)\b(?:\s*[-–:]\s*(.+))?/;

  let currentBlock: { code: string; title: string; rawLines: string[] } | null = null;

  for (const line of lines) {
    const match = line.match(courseCodeRegex);
    // Avoid misidentifying URLs or page numbers as subject headings
    const looksLikeCourseHeader =
      match &&
      line.length < 130 &&
      !/^https?:/i.test(line) &&
      !/\b(page|edition|vol|isbn)\b/i.test(line);

    if (looksLikeCourseHeader && match) {
      const code = match[1].replace(/\s+/g, '');
      const rest = (match[2] || line.replace(match[1], '').replace(/^[-–:\s]+/, '')).trim();
      if (!currentBlock || currentBlock.code !== code) {
        if (currentBlock) subjectBlocks.push(currentBlock);
        currentBlock = {
          code,
          title: rest || `${code} Course Syllabus`,
          rawLines: []
        };
        continue;
      }
    }

    if (!currentBlock) {
      currentBlock = {
        code: `${meta.course.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6) || 'SUBJ'}101`,
        title: meta.title || `${meta.course} ${meta.semester} Subject`,
        rawLines: []
      };
    }
    currentBlock.rawLines.push(line);
  }
  if (currentBlock) subjectBlocks.push(currentBlock);

  const unitRegex = /^(?:unit|module|chapter)\s*[-–:]?\s*([IVX]+|\d+)\b[\s:.-]*(.*)$/i;
  const hoursRegex = /\b(\d{1,3}\s*hours?)\b/i;

  const subjects: SyllabusSubjectNode[] = subjectBlocks.map((block, bIdx) => {
    const { domainMode, departmentId, bookDepartment, defaultLabTab } = inferDomainForCourseCode(
      block.code,
      block.title
    );
    const subjectId = `${syllabusId}_s${bIdx + 1}`;
    const units: SyllabusUnitNode[] = [];
    const objectives: string[] = [];
    const references: string[] = [];

    let mode: 'units' | 'objectives' | 'references' = 'units';
    let currentUnit: {
      unitNo: string;
      title: string;
      lecturesLabel?: string;
      topicLines: string[];
    } | null = null;

    const flushUnit = () => {
      if (!currentUnit) return;
      const unitId = `${subjectId}_u_${units.length + 1}`;
      const cleanedLines = currentUnit.topicLines.filter(
        (l) => !/^detailed syllabus:?$/i.test(l) && !/^topics$/i.test(l)
      );
      const topics: SyllabusTopicNode[] = [];

      if (cleanedLines.length === 0) {
        const topicId = `${unitId}_t1`;
        topics.push({
          id: topicId,
          syllabusId,
          subjectId,
          subjectCode: block.code,
          subjectTitle: block.title,
          unitId,
          unitNo: currentUnit.unitNo,
          unitTitle: currentUnit.title,
          title: currentUnit.title,
          summary: `${currentUnit.unitNo}: ${currentUnit.title}`,
          lecturesLabel: currentUnit.lecturesLabel,
          domainMode,
          departmentId,
          bookDepartment,
          keywords: currentUnit.title
            .split(/\s+/)
            .filter((w) => w.length >= 4)
            .slice(0, 8),
          subtopics: [],
          linkedLabTab: defaultLabTab,
          recommendedSections: getRecommendedSectionsForDomain(domainMode)
        });
      } else {
        // Group bullet lines or colon-separated lines into structured topics & subtopics
        let activeTopicTitle = currentUnit.title;
        let activeSubtopics: SyllabusSubtopicNode[] = [];

        const pushTopic = () => {
          const topicId = `${unitId}_t${topics.length + 1}`;
          const summaryText =
            activeSubtopics.map((s) => s.summary || s.title).join(' · ').slice(0, 260) ||
            activeTopicTitle;
          topics.push({
            id: topicId,
            syllabusId,
            subjectId,
            subjectCode: block.code,
            subjectTitle: block.title,
            unitId,
            unitNo: currentUnit!.unitNo,
            unitTitle: currentUnit!.title,
            title: activeTopicTitle,
            summary: summaryText,
            lecturesLabel: currentUnit!.lecturesLabel,
            domainMode,
            departmentId,
            bookDepartment,
            keywords: `${activeTopicTitle} ${summaryText}`
              .replace(/[()[\].,;:•–—]/g, ' ')
              .split(/\s+/)
              .filter((w) => w.length >= 4)
              .slice(0, 10),
            subtopics: activeSubtopics,
            linkedLabTab: defaultLabTab,
            recommendedSections: getRecommendedSectionsForDomain(domainMode)
          });
          activeSubtopics = [];
        };

        for (const tLine of cleanedLines) {
          const cleanLine = tLine.replace(/^[•*-]\s*/, '').trim();
          const colonIdx = cleanLine.indexOf(':');
          const looksLikeHeading =
            cleanLine.length <= 72 &&
            !cleanLine.endsWith('.') &&
            colonIdx === -1 &&
            !/^([a-d]|[1-9])\)/.test(cleanLine) &&
            activeSubtopics.length > 0;

          if (looksLikeHeading) {
            pushTopic();
            activeTopicTitle = cleanLine;
          } else {
            const subTitle =
              colonIdx > 2 && colonIdx < 65
                ? cleanLine.slice(0, colonIdx).trim()
                : cleanLine.slice(0, 72).trim();
            activeSubtopics.push({
              id: `${unitId}_st_${activeSubtopics.length + 1}_${topics.length + 1}`,
              title: subTitle,
              summary: cleanLine,
              keywords: cleanLine
                .replace(/[()[\].,;:•–—]/g, ' ')
                .split(/\s+/)
                .filter((w) => w.length >= 4)
                .slice(0, 8)
            });
          }
        }
        pushTopic();
      }

      units.push({
        id: unitId,
        unitNo: currentUnit.unitNo,
        title: currentUnit.title,
        lecturesLabel: currentUnit.lecturesLabel,
        topics
      });
      currentUnit = null;
    };

    for (const line of block.rawLines) {
      if (/^(course\s+)?objectives?:?/i.test(line)) {
        mode = 'objectives';
        continue;
      }
      if (/^recommended\s+references|^textbooks?:?|^reference\s+books?:?/i.test(line)) {
        flushUnit();
        mode = 'references';
        continue;
      }

      const unitMatch = line.match(unitRegex);
      if (unitMatch) {
        flushUnit();
        mode = 'units';
        const hoursMatch = line.match(hoursRegex);
        const unitTitle = unitMatch[2]
          ? unitMatch[2].replace(hoursRegex, '').replace(/[-–:\s]+$/, '').trim()
          : `Unit ${unitMatch[1]}`;
        currentUnit = {
          unitNo: `Unit ${unitMatch[1].toUpperCase()}`,
          title: unitTitle || `Unit ${unitMatch[1].toUpperCase()}`,
          lecturesLabel: hoursMatch ? hoursMatch[1] : undefined,
          topicLines: []
        };
        continue;
      }

      if (mode === 'objectives') {
        if (/^course outcomes|^detailed syllabus/i.test(line)) {
          mode = 'units';
          continue;
        }
        objectives.push(line.replace(/^\d+[.)]\s*/, ''));
      } else if (mode === 'references') {
        references.push(line.replace(/^\d+[.)]\s*/, ''));
      } else {
        if (!currentUnit) {
          currentUnit = {
            unitNo: 'Unit I',
            title: `${block.title} — Core Outline`,
            topicLines: []
          };
        }
        const hm = line.match(hoursRegex);
        if (hm && line.length < 24 && !currentUnit.lecturesLabel) {
          currentUnit.lecturesLabel = hm[1];
        } else {
          currentUnit.topicLines.push(line);
        }
      }
    }

    flushUnit();

    return {
      id: subjectId,
      code: block.code,
      title: block.title,
      departmentId,
      bookDepartment,
      objectives,
      outcomes: [],
      references,
      units
    };
  });

  const now = Date.now();
  return {
    id: syllabusId,
    course: meta.course.trim() || 'B.Pharm',
    degree: meta.degree.trim() || 'Bachelor of Pharmacy',
    semester: meta.semester.trim() || 'Semester I',
    university: meta.university.trim() || 'Custom / Imported University',
    title:
      meta.title?.trim() ||
      `${meta.course} ${meta.semester} — ${meta.university}`,
    verificationStatus: meta.verificationStatus,
    sourceName: meta.sourceName.trim() || 'Imported Syllabus Document',
    sourceUrl: sanitizeHttpUrl(meta.sourceUrl) || undefined,
    accessDate: new Date().toISOString().slice(0, 10),
    isSystemOfficial: false,
    subjects,
    createdAt: now,
    updatedAt: now
  };
}

export async function searchSyllabiOnline(
  params: {
    course: string;
    semester: string;
    university: string;
    subjectHint?: string;
  },
  signal?: AbortSignal
): Promise<OnlineSyllabusDiscoveryResult> {
  const queryParts = [
    params.course,
    params.semester,
    params.university !== 'Pharmacy Council of India (PCI)' ? params.university : 'PCI',
    params.subjectHint || '',
    'pharmacy syllabus curriculum'
  ]
    .filter((x) => x.trim().length > 0)
    .join(' ');

  const warnings: string[] = [];
  const candidates: OnlineSyllabusCandidate[] = [];

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      candidates: [],
      warnings: [
        'Offline mode detected: online syllabus search is unavailable until internet connectivity returns. You can import a local PDF or paste syllabus text manually.'
      ],
      officialPortals: OFFICIAL_SYLLABUS_PORTALS
    };
  }

  // 1. OpenAlex CORS-open search for published curriculum / syllabus / B.Pharm educational works
  const { signal: oaSignal, cleanup: oaCleanup } = createTimeoutSignal(signal, 9000);
  try {
    const res = await fetch(
      `https://api.openalex.org/works?search=${encodeURIComponent(queryParts)}&per-page=6`,
      { signal: oaSignal }
    );
    if (res.ok) {
      const json = await res.json();
      const rows = (json?.results || []) as Array<Record<string, unknown>>;
      for (const row of rows) {
        const title = stripMarkup(String(row.title || ''));
        if (!title) continue;
        const primary = row.primary_location as {
          source?: { display_name?: string };
          landing_page_url?: string;
        } | null;
        const oa = row.best_oa_location as { pdf_url?: string; landing_page_url?: string } | null;
        const url =
          sanitizeHttpUrl(oa?.landing_page_url) ||
          sanitizeHttpUrl(primary?.landing_page_url) ||
          (row.doi ? `https://doi.org/${String(row.doi).replace(/^https?:\/\/doi\.org\//i, '')}` : '');
        if (!url) continue;
        candidates.push({
          id: `oa_syl_${String(row.id || title.slice(0, 16))}`,
          title,
          sourceName: 'OpenAlex Academic Index',
          sourceUrl: url,
          pdfUrl: sanitizeHttpUrl(oa?.pdf_url) || undefined,
          publisherOrUniversity: primary?.source?.display_name || 'Indexed Educational Publication',
          year: row.publication_year ? String(row.publication_year) : undefined,
          summary: 'OpenAlex-indexed curriculum or pharmacy education publication.',
          verificationHint: 'imported_syllabus',
          licenseInfo: oa?.pdf_url ? 'Open Access PDF link available' : 'External publisher record',
          corsReadablePreview: false
        });
      }
    }
  } catch (err) {
    if ((err as Error)?.name !== 'AbortError') {
      warnings.push('OpenAlex curriculum query timed out or failed.');
    }
  } finally {
    oaCleanup();
  }

  // 2. Wikiversity / Wikipedia CORS-open curriculum outline search (origin=*)
  const { signal: wikiSignal, cleanup: wikiCleanup } = createTimeoutSignal(signal, 9000);
  try {
    const wikiQuery = [params.course, params.subjectHint || 'pharmacy', params.semester]
      .filter(Boolean)
      .join(' ');
    const res = await fetch(
      `https://en.wikiversity.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        wikiQuery
      )}&srlimit=5&format=json&origin=*`,
      { signal: wikiSignal }
    );
    if (res.ok) {
      const json = await res.json();
      const hits = (json?.query?.search || []) as Array<{
        pageid?: number;
        title?: string;
        snippet?: string;
      }>;
      for (const hit of hits) {
        if (!hit.title) continue;
        candidates.push({
          id: `wv_syl_${hit.pageid || hit.title}`,
          title: hit.title,
          sourceName: 'Wikiversity Open Curriculum',
          sourceUrl: `https://en.wikiversity.org/wiki/${encodeURIComponent(
            hit.title.replace(/ /g, '_')
          )}`,
          publisherOrUniversity: 'Wikiversity (Wikimedia Foundation)',
          summary: stripMarkup(hit.snippet || 'Open educational course outline.'),
          verificationHint: 'unverified_syllabus',
          licenseInfo: 'CC BY-SA 4.0 (Community Curriculum — Verify against official university PDF)',
          corsReadablePreview: true
        });
      }
    }
  } catch (err) {
    if ((err as Error)?.name !== 'AbortError') {
      warnings.push('Wikiversity outline lookup unavailable.');
    }
  } finally {
    wikiCleanup();
  }

  return {
    candidates,
    warnings,
    officialPortals: OFFICIAL_SYLLABUS_PORTALS
  };
}

export async function fetchWikiversityPreviewText(title: string): Promise<string> {
  const { signal, cleanup } = createTimeoutSignal(undefined, 9000);
  try {
    const res = await fetch(
      `https://en.wikiversity.org/w/api.php?action=query&prop=extracts&explaintext=1&titles=${encodeURIComponent(
        title
      )}&format=json&origin=*`,
      { signal }
    );
    if (!res.ok) {
      throw new Error(`Wikiversity HTTP ${res.status}`);
    }
    const json = await res.json();
    const pages = (json?.query?.pages || {}) as Record<string, { extract?: string }>;
    const first = Object.values(pages)[0];
    return first?.extract?.trim() || '';
  } finally {
    cleanup();
  }
}
