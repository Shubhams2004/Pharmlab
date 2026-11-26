import {
  AuditComparisonDiff,
  CourseCoverageReport,
  CoverageAuditSnapshot,
  CoverageStatus
} from './types';

const AUDIT_HISTORY_KEY = 'pharmlab_coverage_audit_history_v1';
const MAX_SNAPSHOTS = 20;

export function createSnapshotFromCourseReport(
  course: CourseCoverageReport,
  timestamp = Date.now()
): CoverageAuditSnapshot {
  const topics = course.subjects.flatMap((s) =>
    s.units.flatMap((u) =>
      u.topics.map((t) => ({
        topicId: t.id,
        subjectCode: t.subjectCode,
        title: t.title,
        status: t.status,
        completenessPct: t.completenessPct,
        resourceCoveragePct: t.resourceCoveragePct,
        linkedResourceItems: t.totalLinkedResourceItems,
        gapCount: t.gaps.length
      }))
    )
  );

  return {
    snapshotId: `snap_${timestamp}_${Math.random().toString(36).slice(2, 6)}`,
    syllabusId: course.syllabusId,
    courseLabel: course.courseLabel,
    timestamp,
    totalSubjects: course.totalSubjects,
    totalUnits: course.totalUnits,
    totalTopics: course.totalTopics,
    totalSubtopics: course.totalSubtopics,
    overallCompletenessPct: course.overallCompletenessPct,
    overallResourceCoveragePct: course.overallResourceCoveragePct,
    statusBreakdown: { ...course.statusBreakdown },
    gapSeverityBreakdown: { ...course.gapSeverityBreakdown },
    totalLinkedResourceItems: topics.reduce((s, t) => s + t.linkedResourceItems, 0),
    subjectScores: course.subjects.map((s) => ({
      code: s.code,
      title: s.title,
      completenessPct: s.completenessPct,
      resourceCoveragePct: s.resourceCoveragePct,
      gapCount: s.gaps.length
    })),
    topics
  };
}

export function loadAuditSnapshots(): CoverageAuditSnapshot[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(AUDIT_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is CoverageAuditSnapshot => Boolean(item && item.snapshotId && item.syllabusId))
      .sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    return [];
  }
}

export function saveAuditSnapshot(snapshot: CoverageAuditSnapshot): CoverageAuditSnapshot[] {
  const existing = loadAuditSnapshots();
  const next = [snapshot, ...existing].slice(0, MAX_SNAPSHOTS);
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(AUDIT_HISTORY_KEY, JSON.stringify(next));
    } catch {
      // ignore storage quota limits
    }
  }
  return next;
}

export function clearAuditSnapshots(): CoverageAuditSnapshot[] {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(AUDIT_HISTORY_KEY);
    } catch {
      // ignore
    }
  }
  return [];
}

function isSubstantiallyReady(status: CoverageStatus): boolean {
  return status === 'complete' || status === 'substantially_complete';
}

export function compareAuditSnapshots(
  previous: CoverageAuditSnapshot,
  current: CoverageAuditSnapshot
): AuditComparisonDiff {
  const prevTopicMap = new Map(previous.topics.map((t) => [t.topicId, t]));

  const newlyCompletedTopics: AuditComparisonDiff['newlyCompletedTopics'] = [];
  const improvedTopics: AuditComparisonDiff['improvedTopics'] = [];
  const newlyIdentifiedGaps: AuditComparisonDiff['newlyIdentifiedGaps'] = [];

  for (const curTopic of current.topics) {
    const prevTopic = prevTopicMap.get(curTopic.topicId);
    if (!prevTopic) {
      if (curTopic.gapCount > 0) {
        newlyIdentifiedGaps.push({
          topicId: curTopic.topicId,
          subjectCode: curTopic.subjectCode,
          title: curTopic.title,
          previousGapCount: 0,
          currentGapCount: curTopic.gapCount
        });
      }
      continue;
    }

    if (!isSubstantiallyReady(prevTopic.status) && isSubstantiallyReady(curTopic.status)) {
      newlyCompletedTopics.push({
        topicId: curTopic.topicId,
        subjectCode: curTopic.subjectCode,
        title: curTopic.title,
        previousStatus: prevTopic.status,
        currentStatus: curTopic.status
      });
    }

    const deltaPct = curTopic.completenessPct - prevTopic.completenessPct;
    if (deltaPct >= 4 || curTopic.linkedResourceItems > prevTopic.linkedResourceItems) {
      improvedTopics.push({
        topicId: curTopic.topicId,
        subjectCode: curTopic.subjectCode,
        title: curTopic.title,
        previousPct: prevTopic.completenessPct,
        currentPct: curTopic.completenessPct,
        deltaPct
      });
    }

    if (curTopic.gapCount > prevTopic.gapCount) {
      newlyIdentifiedGaps.push({
        topicId: curTopic.topicId,
        subjectCode: curTopic.subjectCode,
        title: curTopic.title,
        previousGapCount: prevTopic.gapCount,
        currentGapCount: curTopic.gapCount
      });
    }
  }

  const prevTotalGaps = Object.values(previous.gapSeverityBreakdown).reduce((a, b) => a + b, 0);
  const curTotalGaps = Object.values(current.gapSeverityBreakdown).reduce((a, b) => a + b, 0);

  return {
    previousTimestamp: previous.timestamp,
    currentTimestamp: current.timestamp,
    completenessDeltaPct: current.overallCompletenessPct - previous.overallCompletenessPct,
    resourceCoverageDeltaPct:
      current.overallResourceCoveragePct - previous.overallResourceCoveragePct,
    newlyLinkedResourcesCount:
      current.totalLinkedResourceItems - previous.totalLinkedResourceItems,
    resolvedGapCountDelta: prevTotalGaps - curTotalGaps,
    newlyCompletedTopics,
    improvedTopics: improvedTopics.sort((a, b) => b.deltaPct - a.deltaPct),
    newlyIdentifiedGaps
  };
}
