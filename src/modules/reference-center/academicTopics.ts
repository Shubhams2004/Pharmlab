import { BookDepartmentTag } from '../knowledge-library/types';
import { AcademicConnection, AcademicEntityType } from './types';

export interface AcademicTopicNode {
  id: string;
  departmentId: BookDepartmentTag | 'pharmacology' | 'pharm_chem' | 'pharm_analysis' | 'microbiology' | 'pharm_tech';
  departmentLabel: string;
  subject: string;
  topic: string;
  subtopic: string;
  keywords: string[];
  linkedEntities: Array<{
    type: AcademicEntityType;
    label: string;
  }>;
}

export const ACADEMIC_TOPIC_TREE: AcademicTopicNode[] = [
  {
    id: 'topic_pharma_paracetamol',
    departmentId: 'pharmacology',
    departmentLabel: 'Pharmacology',
    subject: 'Autacoids & Analgesics',
    topic: 'NSAIDs',
    subtopic: 'Paracetamol — Pharmacological mechanism & metabolism',
    keywords: ['paracetamol', 'acetaminophen', 'nsaids', 'cox', 'napqi', 'analgesic', 'antipyretic'],
    linkedEntities: [
      { type: 'drug', label: 'Paracetamol (Acetaminophen)' },
      { type: 'chemical', label: 'N-acetyl-p-benzoquinone imine (NAPQI)' },
      { type: 'chemical', label: 'N-acetylcysteine (Antidote)' }
    ]
  },
  {
    id: 'topic_anatomy_cardiovascular',
    departmentId: 'anatomy',
    departmentLabel: 'Human Anatomy & Physiology',
    subject: 'BP104T / BP109P',
    topic: 'Cardiovascular Physiology',
    subtopic: 'Heart chambers, valves, cardiac cycle & ECG conduction',
    keywords: ['heart', 'cardiac', 'ecg', 'sa node', 'av node', 'cardiovascular', 'blood pressure', 'hemocytometry'],
    linkedEntities: [
      { type: 'anatomy_structure', label: 'Human Heart & Conduction System' },
      { type: 'experiment', label: 'BP109P Exp 14–15 ECG & Blood Pressure' },
      { type: 'equipment', label: 'Electrocardiograph & Sphygmomanometer' }
    ]
  },
  {
    id: 'topic_anatomy_cell_injury',
    departmentId: 'anatomy',
    departmentLabel: 'Human Anatomy & Physiology',
    subject: 'BP104T / BP109P',
    topic: 'Cellular Organization & Injury',
    subtopic: 'Eukaryotic organelles, membrane transport & cellular adaptation',
    keywords: ['cell', 'organelle', 'homeostasis', 'atrophy', 'hypertrophy', 'necrosis', 'apoptosis', 'membrane'],
    linkedEntities: [
      { type: 'anatomy_structure', label: 'Eukaryotic Cell Organelles' },
      { type: 'equipment', label: 'Compound Microscope' }
    ]
  },
  {
    id: 'topic_pharmaceutics_dosage_forms',
    departmentId: 'general_pharmacy',
    departmentLabel: 'Pharmaceutics',
    subject: 'BP102T / BP107P',
    topic: 'Compounding & Pharmaceutical Calculations',
    subtopic: 'Posology, isotonicity, alligation, syrups, ORS & suppositories',
    keywords: ['posology', 'isotonicity', 'ors', 'syrup', 'suppository', 'alligation', 'proof spirit', 'formulation'],
    linkedEntities: [
      { type: 'experiment', label: 'BP107P Formulations & Calculations' },
      { type: 'chemical', label: 'Sodium Chloride / Dextrose (Isotonicity)' },
      { type: 'equipment', label: 'Suppository Mould & Analytical Balance' }
    ]
  },
  {
    id: 'topic_inorganic_limit_tests',
    departmentId: 'inorganic',
    departmentLabel: 'Pharmaceutical Inorganic & Analytical Chemistry',
    subject: 'BP106T / BP111P',
    topic: 'Limit Tests & Impurity Control',
    subtopic: 'Arsenic (Gutzeit), Chloride, Sulphate, Iron & Heavy Metals',
    keywords: ['limit test', 'gutzeit', 'nessler', 'arsenic', 'chloride', 'sulphate', 'iron', 'impurity'],
    linkedEntities: [
      { type: 'experiment', label: 'BP111P Exp 1a–1e IP Limit Tests' },
      { type: 'equipment', label: 'Gutzeit Apparatus & Nessler Cylinder' },
      { type: 'chemical', label: 'Potassium Iodate / Barium Chloride' }
    ]
  },
  {
    id: 'topic_analysis_volumetric',
    departmentId: 'pharm_analysis',
    departmentLabel: 'Pharmaceutical Analysis',
    subject: 'BP106T / BP111P & Analysis',
    topic: 'Volumetric Titrimetry & Assay Validation',
    subtopic: 'Acid-base, non-aqueous, cerimetry, iodometry, EDTA & Volhard assays',
    keywords: ['titration', 'burette', 'assay', 'edta', 'cerimetry', 'iodometry', 'volhard', 'standardization', 'validation'],
    linkedEntities: [
      { type: 'experiment', label: 'BP111P Exp 4a–4g Volumetric Assays' },
      { type: 'equipment', label: 'Burette & Volumetric Glassware' },
      { type: 'chemical', label: 'Disodium Edetate / Potassium Permanganate' }
    ]
  },
  {
    id: 'topic_pharmacognosy_microscopy',
    departmentId: 'pharmacognosy',
    departmentLabel: 'Pharmacognosy',
    subject: 'BP105T / BP110P',
    topic: 'Quantitative & Botanical Microscopy',
    subtopic: 'Stomatal index, vein-islet, Lycopodium spore & crude drug QC',
    keywords: ['stomatal', 'trichome', 'lycopodium', 'microscopy', 'ash value', 'tulsi', 'ashwagandha', 'pharmacognosy'],
    linkedEntities: [
      { type: 'experiment', label: 'BP110P Exp 8–13 Quantitative Microscopy' },
      { type: 'equipment', label: 'Stage & Eyepiece Micrometer' },
      { type: 'drug', label: 'Ocimum tenuiflorum / Withania somnifera' }
    ]
  },
  {
    id: 'topic_python_pk',
    departmentId: 'python',
    departmentLabel: 'Pharmaceutical Data Science',
    subject: 'BP101T',
    topic: 'Pharmacokinetic & ADR Data Analysis',
    subtopic: 'Plasma concentration-time curves, bioavailability & Python/Pandas modeling',
    keywords: ['pharmacokinetics', 'bioavailability', 'plasma', 'adr', 'python', 'pandas', 'dissolution'],
    linkedEntities: [
      { type: 'experiment', label: 'BP101T Python PK & ADR Simulation' },
      { type: 'drug', label: 'Amoxicillin / Ciprofloxacin PK Datasets' }
    ]
  },
  {
    id: 'topic_psychology_counseling',
    departmentId: 'psychology',
    departmentLabel: 'Healthcare Psychology & Communication',
    subject: 'BP103T / BP108P',
    topic: 'Patient Counseling & Clinical Handover',
    subtopic: 'SPIKES protocol, SBAR handover, adherence & ethics',
    keywords: ['spikes', 'sbar', 'counseling', 'adherence', 'communication', 'psychology'],
    linkedEntities: [
      { type: 'experiment', label: 'BP108P Practical 1–5 Clinical Role-Plays' }
    ]
  },
  {
    id: 'topic_microbiology_sterility',
    departmentId: 'microbiology',
    departmentLabel: 'Pharmaceutical Microbiology',
    subject: 'Pharmaceutical Microbiology',
    topic: 'Aseptic Processing & Sterility Testing',
    subtopic: 'Sterilization validation, microbial limits & cleanroom standards',
    keywords: ['microbiology', 'sterility', 'aseptic', 'bioburden', 'endotoxin', 'gmp'],
    linkedEntities: [
      { type: 'equipment', label: 'Autoclave & Laminar Airflow Hood' }
    ]
  }
];

export const ENTITY_TYPE_LABELS: Record<AcademicEntityType, string> = {
  department: 'Department',
  subject: 'Subject',
  topic: 'Topic',
  subtopic: 'Subtopic',
  anatomy_structure: 'Anatomy Structure',
  experiment: 'Experiment / Practical',
  equipment: 'Equipment',
  chemical: 'Chemical / Reagent',
  drug: 'Drug'
};

export function createTopicConnection(node: AcademicTopicNode): AcademicConnection {
  return {
    id: `conn_${node.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    entityType: 'subtopic',
    label: `${node.departmentLabel} → ${node.topic} → ${node.subtopic}`,
    departmentId: node.departmentId,
    topicId: node.id
  };
}

export function matchTopicKeywords(text: string, contextHints: string[]): boolean {
  const hay = text.toLowerCase();
  return contextHints.some((hint) => {
    const clean = hint.trim().toLowerCase();
    return clean.length >= 3 && hay.includes(clean);
  });
}
