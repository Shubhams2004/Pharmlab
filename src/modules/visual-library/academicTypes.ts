import { DepartmentId, VisualCategory } from './types';

export type AcademicDomain =
  | 'anatomy'
  | 'pharmacology'
  | 'equipment'
  | 'chemistry'
  | 'microbiology'
  | 'histology_microscopy'
  | 'formulation'
  | 'clinical';

export type ContentProvenanceStatus =
  | 'verified-curriculum'
  | 'partial-metadata'
  | 'user-contributed'
  | 'unverified';

export type AcademicTabId =
  | 'overview'
  | 'structure'
  | 'function'
  | 'mechanism'
  | 'clinical'
  | 'pharmaceutical'
  | 'exam_notes'
  | 'references';

export interface AcademicIdentification {
  primaryName: string;
  scientificOrChemicalName?: string;
  commonNames?: string[];
  classification?: string;
  taxonomyOrCode?: string;
  formulaOrIupac?: string;
}

export interface AcademicReference {
  title: string;
  sourceType: 'textbook' | 'pharmacopoeia' | 'open-access' | 'curriculum';
  citation: string;
  url?: string;
  reliabilityNote?: string;
}

export interface InteractiveAnnotation {
  id: string;
  label: string;
  shortCode?: string;
  /** Percentage from left edge of image (0-100) */
  xPercent: number;
  /** Percentage from top edge of image (0-100) */
  yPercent: number;
  /** Optional bounding region in percentage coordinates for region highlighting */
  regionBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  definition: string;
  location?: string;
  functionRole: string;
  physiologicalOrClinicalImportance?: string;
  pharmaceuticalRelevance?: string;
  sourceNote?: string;
  isUserAdded?: boolean;
}

export interface AcademicAssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface RelatedPharmaLabLink {
  id: string;
  moduleId: string;
  tab?: string | null;
  label: string;
  kind: 'department' | 'topic' | 'experiment' | 'simulator' | 'calculator' | 'case_study';
  description: string;
}

export interface AcademicSubjectResource {
  id: string;
  domain: AcademicDomain;
  defaultCategory: VisualCategory;
  departments: DepartmentId[];
  identification: AcademicIdentification;
  definition?: string;
  introduction?: string;
  classificationDetails?: Array<{ label: string; detail: string }>;
  locationOrOrigin?: string;
  structureSummary?: string;
  components?: Array<{ name: string; description: string }>;
  functions?: string[];
  physiologicalRole?: string;
  associatedOrgansOrSystems?: string[];
  mechanism?: {
    title: string;
    summary: string;
    steps?: string[];
  };
  equipmentProfile?: {
    principle: string;
    construction: string;
    workingMechanism: string;
    advantages: string[];
    limitations: string[];
    maintenanceAndSafety: string[];
  };
  chemistryProfile?: {
    molecularStructureSummary: string;
    functionalGroups: string[];
    physicochemicalProperties: string[];
    reactionMechanism?: string;
  };
  pharmacologyProfile?: {
    drugClass: string;
    mechanismOfAction: string;
    pharmacologicalEffects: string[];
    therapeuticUses: string[];
    adverseEffects: string[];
    contraindications: string[];
  };
  microbiologyProfile?: {
    morphology: string;
    characteristics: string[];
    pathogenicity: string;
    laboratorySignificance: string;
  };
  histologyProfile?: {
    tissueOrSpecimen: string;
    structuralCharacteristics: string[];
    importantRegions: string[];
    normalVsAbnormal?: {
      normal: string;
      abnormal: string;
    };
  };
  clinicalSignificance?: string[];
  pharmaceuticalSignificance?: string[];
  applications?: string[];
  associatedDiseases?: Array<{ name: string; summary: string }>;
  importantCharacteristics?: string[];
  examKeyPoints?: string[];
  mcqs?: AcademicAssessmentQuestion[];
  relatedTopics?: string[];
  relatedSubjectIds?: string[];
  pharmaLabLinks?: RelatedPharmaLabLink[];
  equipmentNames?: string[];
  drugNames?: string[];
  diseaseNames?: string[];
  textbookKeywords: string[];
  searchKeywords: string[];
  annotations?: InteractiveAnnotation[];
  references: AcademicReference[];
  contentStatus: ContentProvenanceStatus;
  accuracyNotes: string;
}

export interface AcademicCompletenessReport {
  availableSections: string[];
  missingSections: string[];
  completenessPercent: number;
  hasVerifiedAnnotations: boolean;
}

export interface ResolvedAcademicContext {
  subjectId?: string;
  domain: AcademicDomain;
  identification: AcademicIdentification;
  definition?: string;
  introduction?: string;
  classificationDetails?: Array<{ label: string; detail: string }>;
  locationOrOrigin?: string;
  structureSummary?: string;
  components?: Array<{ name: string; description: string }>;
  functions?: string[];
  physiologicalRole?: string;
  associatedOrgansOrSystems?: string[];
  mechanism?: AcademicSubjectResource['mechanism'];
  equipmentProfile?: AcademicSubjectResource['equipmentProfile'];
  chemistryProfile?: AcademicSubjectResource['chemistryProfile'];
  pharmacologyProfile?: AcademicSubjectResource['pharmacologyProfile'];
  microbiologyProfile?: AcademicSubjectResource['microbiologyProfile'];
  histologyProfile?: AcademicSubjectResource['histologyProfile'];
  clinicalSignificance?: string[];
  pharmaceuticalSignificance?: string[];
  applications?: string[];
  associatedDiseases?: Array<{ name: string; summary: string }>;
  importantCharacteristics?: string[];
  examKeyPoints?: string[];
  mcqs?: AcademicAssessmentQuestion[];
  relatedTopics?: string[];
  relatedSubjectIds?: string[];
  pharmaLabLinks: RelatedPharmaLabLink[];
  equipmentNames: string[];
  drugNames: string[];
  diseaseNames: string[];
  textbookKeywords: string[];
  annotations: InteractiveAnnotation[];
  references: AcademicReference[];
  contentStatus: ContentProvenanceStatus;
  accuracyNotes: string;
  completeness: AcademicCompletenessReport;
  availableTabs: Array<{ id: AcademicTabId; label: string }>;
}

export interface UserAcademicEnrichment {
  domain?: AcademicDomain;
  scientificOrChemicalName?: string;
  definition?: string;
  introduction?: string;
  classification?: string;
  locationOrOrigin?: string;
  structureSummary?: string;
  functionsText?: string;
  mechanismSummary?: string;
  clinicalSignificanceText?: string;
  pharmaceuticalSignificanceText?: string;
  examKeyPointsText?: string;
  referenceCitation?: string;
  updatedAt?: number;
}

export const ACADEMIC_DOMAIN_LABELS: Record<AcademicDomain, string> = {
  anatomy: 'Anatomy & Physiology',
  pharmacology: 'Pharmacology & Therapeutics',
  equipment: 'Pharmaceutical & Analytical Equipment',
  chemistry: 'Chemistry & Molecular Structures',
  microbiology: 'Microbiology & Cell Envelope',
  histology_microscopy: 'Histology & Microscopy',
  formulation: 'Pharmaceutics & Formulations',
  clinical: 'Clinical & Healthcare'
};
