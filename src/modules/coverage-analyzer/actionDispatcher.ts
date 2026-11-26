import { useLibraryNavigation } from '../../context/LibraryNavigationContext';
import { BPharmDepartmentId } from '../assets-3d/types';
import { GapActionRoute } from './types';

type NavApi = ReturnType<typeof useLibraryNavigation>;

export function dispatchGapAction(route: GapActionRoute, nav: NavApi): void {
  const p = route.params || {};
  switch (route.targetModule) {
    case 'study_mode':
      nav.openStudyMode({
        syllabusId: p.syllabusId ?? null,
        subjectCode: p.subjectCode ?? null,
        topicId: p.topicId ?? null,
        view: p.view ?? 'study'
      });
      return;
    case 'enrichment_workspace':
      nav.openEnrichmentWorkspace({
        syllabusId: p.syllabusId ?? null,
        subjectCode: p.subjectCode ?? null,
        topicId: p.topicId ?? null,
        sectionKey: p.sectionKey ?? null,
        returnTo: 'coverage_analyzer'
      });
      return;
    case 'reference_center':
      nav.openReferenceCenter({
        section: 'overview',
        query: p.query ?? null
      });
      return;
    case 'resource_hub':
      nav.openResourceHub({
        query: p.query ?? null
      });
      return;
    case 'knowledge_library':
      nav.openKnowledgeLibrary({
        searchQuery: p.query ?? null
      });
      return;
    case 'visual_library':
      nav.openVisualLibrary({
        department: p.department ?? null,
        category: p.category ?? null,
        query: p.query ?? null
      });
      return;
    case 'assets_3d':
      nav.openAsset3DEngine({
        tab: 'library',
        department: (p.department as BPharmDepartmentId) ?? null,
        query: p.query ?? null
      });
      return;
    case 'explorer_3d':
      nav.openAcademicExplorer({
        subjectCode: p.subjectCode ?? null,
        topicId: p.topicId ?? null,
        assetId: p.assetId ?? null
      });
      return;
    case 'interactive_experiments':
      nav.openInteractiveExperiments({
        experimentId: p.experimentId ?? null
      });
      return;
    case 'syllabus':
      nav.navigateToModule('syllabus');
      return;
    case 'department_lab':
      nav.navigateToModule(p.department || 'general_pharmacy', p.tab ?? null, {
        structureId: p.structureId ?? null
      });
      return;
  }
}
