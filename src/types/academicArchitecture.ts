import { DepartmentId } from '../modules/visual-library/types';

export interface AcademicTopic {
  id: string;
  unit: string;
  title: string;
  summary: string;
  keyConcepts: string[];
  linkedTab?: string;
}

export interface AcademicExperimentRef {
  id: string;
  code: string;
  title: string;
  tab: string;
}

export interface AcademicEquipmentRef {
  id: string;
  name: string;
  purpose: string;
  visualId?: string;
  visualQuery?: string;
}

export interface DepartmentWorkspaceMeta {
  id: 'anatomy' | 'inorganic' | 'general_pharmacy' | 'pharmacognosy' | 'psychology' | 'python' | 'pandas';
  departmentGroupId: 'anatomy' | 'inorganic' | 'general_pharmacy' | 'pharmacognosy' | 'psychology' | 'python';
  visualDepartmentId: DepartmentId;
  code: string;
  title: string;
  shortLabel: string;
  category: 'bio' | 'chem' | 'humanities' | 'data';
  overview: string;
  practicalCountLabel: string;
  theorySummary: string;
  tabs: Array<{ id: string; label: string }>;
  defaultTab: string;
  topics: AcademicTopic[];
  experiments: AcademicExperimentRef[];
  equipment: AcademicEquipmentRef[];
}

export const DEPARTMENT_WORKSPACES: Record<string, DepartmentWorkspaceMeta> = {
  anatomy: {
    id: 'anatomy',
    departmentGroupId: 'anatomy',
    visualDepartmentId: 'anatomy',
    code: 'BP104T / BP109P',
    title: 'Human Anatomy, Physiology & Pathophysiology I',
    shortLabel: 'Anatomy & Physiology',
    category: 'bio',
    overview:
      'Annotated organ systems, histology, osteology (80 axial + 126 appendicular bones), hemocytometry, ECG waveforms, and Units I–V pathophysiology.',
    practicalCountLabel: '60-Structure Catalog · 17 Practicals · 8 Diagrams · Units I–V',
    theorySummary: 'Cell physiology, tissues, integumentary, skeletal, nervous, special senses & cardiovascular system.',
    defaultTab: 'explorer',
    tabs: [
      { id: 'explorer', label: 'Anatomy Explorer (60)' },
      { id: 'practice', label: 'Identification Practice' },
      { id: 'diagrams', label: 'Diagrams & Plates' },
      { id: 'theory', label: 'Theory (Units I–V)' },
      { id: 'hematology', label: 'Hematology Bench' },
      { id: 'microscopy', label: 'Cell & Histology' },
      { id: 'bones', label: 'Osteology & Joints' },
      { id: 'cardio', label: 'ECG & Blood Pressure' },
      { id: 'cases', label: 'Clinical Case Files' }
    ],
    topics: [
      {
        id: 'anat_u1',
        unit: 'Unit I',
        title: 'Cellular Organization & Membrane Transport',
        summary: 'Eukaryotic organelles, phospholipid bilayer, Na⁺/K⁺ ATPase, homeostasis & tissue types.',
        keyConcepts: ['Organelles', 'Active Transport', 'Epithelial & Connective Tissues'],
        linkedTab: 'diagrams'
      },
      {
        id: 'anat_u2',
        unit: 'Unit II',
        title: 'Integumentary & Skeletal Systems',
        summary: 'Epidermal/dermal layers, thermoregulation, axial vs appendicular bone anatomy & synovial joints.',
        keyConcepts: ['Epidermis Layers', 'Axial (80)', 'Appendicular (126)'],
        linkedTab: 'bones'
      },
      {
        id: 'anat_u3',
        unit: 'Unit III',
        title: 'Blood & Hematopoietic Physiology',
        summary: 'Erythropoiesis, hemoglobin, WBC differential, ABO/Rh compatibility & coagulation cascade.',
        keyConcepts: ['Neubauer Count', 'DLC', 'Hemoglobin & ESR'],
        linkedTab: 'hematology'
      },
      {
        id: 'anat_u4',
        unit: 'Unit IV',
        title: 'Nervous System & Special Senses',
        summary: 'Action potential propagation, cranial nerves I–XII, retina optics & cochlear mechanotransduction.',
        keyConcepts: ['Action Potential', '12 Cranial Nerves', 'Eye & Ear'],
        linkedTab: 'theory'
      },
      {
        id: 'anat_u5',
        unit: 'Unit V',
        title: 'Cardiovascular & Renal Physiology',
        summary: 'Cardiac conduction (SA/AV/Purkinje), Wiggers cycle, ECG intervals, nephron GFR & tubular reabsorption.',
        keyConcepts: ['Heart Conduction', 'ECG P-QRS-T', 'Nephron GFR'],
        linkedTab: 'cardio'
      }
    ],
    experiments: [
      { id: 'bp109p_microscope', code: 'Exp 1', title: 'Compound Microscopy & Micrometry', tab: 'microscopy' },
      { id: 'bp109p_bones', code: 'Exp 4–5', title: 'Axial & Appendicular Osteology', tab: 'bones' },
      { id: 'bp109p_heme', code: 'Exp 6–13', title: 'Hemocytometry, DLC, Hb & Blood Grouping', tab: 'hematology' },
      { id: 'bp109p_ecg', code: 'Exp 14–15', title: 'ECG Rhythm & Blood Pressure Recording', tab: 'cardio' }
    ],
    equipment: [
      {
        id: 'eq_microscope',
        name: 'Compound Light Microscope',
        purpose: 'Cellular histology & hemocytometer grid counting (4× to 100× oil immersion)',
        visualId: 'builtin_compound_microscope'
      },
      {
        id: 'eq_neubauer',
        name: 'Neubauer Hemocytometer Chamber',
        purpose: 'Quantitative WBC, RBC & platelet enumeration per mm³ of blood',
        visualQuery: 'neubauer hemocytometer'
      }
    ]
  },
  inorganic: {
    id: 'inorganic',
    departmentGroupId: 'inorganic',
    visualDepartmentId: 'inorganic',
    code: 'BP106T / BP111P',
    title: 'Pharmaceutical Inorganic & Analytical Chemistry',
    shortLabel: 'Inorganic Chemistry',
    category: 'chem',
    overview:
      'Pharmacopoeial limit tests (Cl⁻, SO₄²⁻, Fe, Pb, As), live volumetric burette titrations, primary standards, buffers, stoichiometric preparations, and radiopharmaceuticals.',
    practicalCountLabel: '18 Practicals · 6 Apparatus Diagrams · Units I–V Theory',
    theorySummary: 'Pharmacopoeial impurities, acid-base/redox/complexometric assays, buffers & radiopharmaceuticals.',
    defaultTab: 'diagrams',
    tabs: [
      { id: 'diagrams', label: 'Apparatus Diagrams' },
      { id: 'theory', label: 'Theory (Units I–V)' },
      { id: 'titration', label: 'Volumetric Burette' },
      { id: 'limit_tests', label: 'Limit Tests' },
      { id: 'preparations', label: 'Inorganic Preps' },
      { id: 'purity', label: 'Purity & Swelling' }
    ],
    topics: [
      {
        id: 'inorg_u1',
        unit: 'Unit I',
        title: 'Pharmacopoeias, Impurities & Limit Tests',
        summary: 'Sources of impurities in pharmaceuticals and IP limit tests using Nessler cylinders & Gutzeit apparatus.',
        keyConcepts: ['Gutzeit Arsenic', 'Nessler Cylinder', 'Errors & Precision'],
        linkedTab: 'limit_tests'
      },
      {
        id: 'inorg_u2',
        unit: 'Unit II',
        title: 'Acids, Bases, Buffers & Gastrointestinal Agents',
        summary: 'Henderson-Hasselbalch buffers, isotonicity, antacids (ANC), acidifiers & cathartics.',
        keyConcepts: ['Buffer Capacity', 'Antacid ANC', 'Electrolyte Replenishers'],
        linkedTab: 'theory'
      },
      {
        id: 'inorg_u3',
        unit: 'Unit III',
        title: 'Volumetric & Gravimetric Analysis',
        summary: 'Acid-base neutralization curves, redox (KMnO₄, Cerimetry, Iodometry), EDTA complexometry & Volhard assays.',
        keyConcepts: ['Primary Standards', 'Titration Curves', 'Indicators'],
        linkedTab: 'titration'
      },
      {
        id: 'inorg_u4',
        unit: 'Unit IV',
        title: 'Radiopharmaceuticals & Heavy Metals',
        summary: 'Alpha/Beta/Gamma decay kinetics, half-life shielding (ALARA), diagnostic isotopes (Tc-99m, I-131) & antidotes.',
        keyConcepts: ['Tc-99m', 'ALARA Shielding', 'Chelating Antidotes'],
        linkedTab: 'diagrams'
      },
      {
        id: 'inorg_u5',
        unit: 'Unit V',
        title: 'Inorganic Preparations & Medicinal Gases',
        summary: 'Stoichiometric synthesis of Alum, Al(OH)₃ gel, Ferrous Sulphate & Magnesium Sulphate; O₂, N₂O, CO₂.',
        keyConcepts: ['Stoichiometric Yield', 'Medicinal Gases', 'KIO₃ Purity Assay'],
        linkedTab: 'preparations'
      }
    ],
    experiments: [
      { id: 'bp111p_lim', code: 'Exp 1a–1e', title: 'IP Limit Tests (Cl⁻, SO₄²⁻, Fe, Pb, As)', tab: 'limit_tests' },
      { id: 'bp111p_prep', code: 'Exp 2a–2d', title: 'Inorganic Preparations & Yield Scaler', tab: 'preparations' },
      { id: 'bp111p_pur', code: 'Exp 3a–3c', title: 'Bentonite Swelling, ANC & KIO₃ Purity', tab: 'purity' },
      { id: 'bp111p_tit', code: 'Exp 4a–4g', title: 'Live Volumetric Burette Standardization', tab: 'titration' }
    ],
    equipment: [
      {
        id: 'eq_gutzeit',
        name: 'Gutzeit Arsenic Apparatus',
        purpose: 'IP Limit Test for Arsenic (AsH₃ reduction & HgCl₂ paper stain)',
        visualId: 'builtin_gutzeit_apparatus'
      },
      {
        id: 'eq_apparatus',
        name: 'Volumetric Glassware & Nessler Comparator',
        purpose: '50 mL graduated burette, Erlenmeyer titration flask & Nessler cylinders',
        visualId: 'builtin_chemistry_apparatus'
      }
    ]
  },
  general_pharmacy: {
    id: 'general_pharmacy',
    departmentGroupId: 'general_pharmacy',
    visualDepartmentId: 'pharmaceutics',
    code: 'BP102T / BP107P',
    title: 'Pharmaceutics (General Pharmacy & Compounding)',
    shortLabel: 'Pharmaceutics',
    category: 'chem',
    overview:
      '15 official IP/BPC/WHO extemporaneous formulations with batch scaling, pediatric posology, proof spirit, alligation, displacement value & isotonicity calculators.',
    practicalCountLabel: '15 Formulations · 6 Calculators · Units I–V Theory',
    theorySummary: 'Dosage forms, prescription handling, posology, powders, monophasic/biphasic liquids & suppositories.',
    defaultTab: 'experiments',
    tabs: [
      { id: 'experiments', label: 'Compounding Bench' },
      { id: 'theory', label: 'Theory (Units I–V)' },
      { id: 'posology_proof', label: 'Posology & Proof' },
      { id: 'alligation', label: 'Alligation' },
      { id: 'alcohol', label: 'Alcohol Dilution' },
      { id: 'suppository', label: 'Suppository DV' },
      { id: 'isotonicity', label: 'Isotonicity' },
      { id: 'prescription', label: 'Prescription & Latin' },
      { id: 'compendium', label: 'Compendia' }
    ],
    topics: [
      {
        id: 'pharm_u1',
        unit: 'Unit I',
        title: 'History of Pharmacy & Pharmacopoeias',
        summary: 'Evolution of IP, BP, USP, dosage form classification, prescription parts & dispensing ethics.',
        keyConcepts: ['Indian Pharmacopoeia', 'Prescription Latin', 'Dosage Forms'],
        linkedTab: 'theory'
      },
      {
        id: 'pharm_u2',
        unit: 'Unit II',
        title: 'Pharmaceutical Calculations & Posology',
        summary: 'Imperial/Metric conversions, Young/Dilling/Clark/Fried pediatric dosing, Proof Spirit & alligation.',
        keyConcepts: ['Pediatric Posology', 'Proof Spirit', 'Alligation Alternate'],
        linkedTab: 'posology_proof'
      },
      {
        id: 'pharm_u3',
        unit: 'Unit III',
        title: 'Powders & Monophasic Liquid Dosage Forms',
        summary: 'Simple/compound powders, effervescent granules, syrups, elixirs, gargles & throat paints.',
        keyConcepts: ['Eutectic Mixtures', 'Syrup IP (66.7%)', 'Aromatic Waters'],
        linkedTab: 'experiments'
      },
      {
        id: 'pharm_u4',
        unit: 'Unit IV',
        title: 'Biphasic Liquids: Suspensions & Emulsions',
        summary: 'Flocculated vs deflocculated suspensions, HLB scale, o/w vs w/o identification & stability.',
        keyConcepts: ['HLB Scale', 'Stokes Law', 'Dry/Wet Gum Method'],
        linkedTab: 'theory'
      },
      {
        id: 'pharm_u5',
        unit: 'Unit V',
        title: 'Suppositories & Semisolid Bases',
        summary: 'Displacement value calculations, cocoa butter/PEG bases, ointments, pastes & gels.',
        keyConcepts: ['Displacement Value', 'NaCl Equivalent (E-value)', 'Bases'],
        linkedTab: 'suppository'
      }
    ],
    experiments: [
      { id: 'bp107p_bench', code: 'Exp 2–15', title: '15 IP/BPC/WHO Compounding Formulations', tab: 'experiments' },
      { id: 'bp107p_pos', code: 'Calc 1–2', title: 'Pediatric Posology & Proof Spirit', tab: 'posology_proof' },
      { id: 'bp107p_allig', code: 'Calc 3–4', title: 'Alligation & Alcohol Dilution', tab: 'alligation' },
      { id: 'bp107p_supp', code: 'Calc 5–6', title: 'Suppository Displacement & Isotonicity', tab: 'suppository' }
    ],
    equipment: [
      {
        id: 'eq_mortar',
        name: 'Porcelain Mortar & Pestle / Ointment Slab',
        purpose: 'Trituration, geometric dilution & levigation during compounding',
        visualQuery: 'pharmacy compounding'
      }
    ]
  },
  pharmacognosy: {
    id: 'pharmacognosy',
    departmentGroupId: 'pharmacognosy',
    visualDepartmentId: 'pharmacognosy',
    code: 'BP105T / BP110P',
    title: 'Introduction to Pharmacognosy & Phytochemistry',
    shortLabel: 'Pharmacognosy',
    category: 'bio',
    overview:
      'Quantitative microscopy (stomatal index, vein-islet, micrometry, Lycopodium spore purity), 20 Unit V crude drugs, physicochemical QC, and voucher builder.',
    practicalCountLabel: '14 Practicals · 20 Medicinal Plants · Units I–V Theory',
    theorySummary: 'Crude drug classification, cultivation/GACP, plant tissue microscopy, WHO/AYUSH & Unit V monographs.',
    defaultTab: 'leaf_constants',
    tabs: [
      { id: 'leaf_constants', label: 'Micrometry & Index' },
      { id: 'theory', label: 'Theory (Units I–V)' },
      { id: 'morphology', label: '20 Plants Morphology' },
      { id: 'powder', label: 'Powder Microscopy' },
      { id: 'physicochemical', label: 'Physicochemical QC' },
      { id: 'voucher', label: 'Voucher Builder' }
    ],
    topics: [
      {
        id: 'cog_u1',
        unit: 'Unit I',
        title: 'Scope & Classification of Crude Drugs',
        summary: 'Alphabetical, taxonomic, morphological, chemical & pharmacological crude drug classification.',
        keyConcepts: ['Organized vs Unorganized', 'Pharmacognosy Scope', 'Adulteration'],
        linkedTab: 'theory'
      },
      {
        id: 'cog_u2',
        unit: 'Unit II',
        title: 'Cultivation, Collection & GACP',
        summary: 'Factors affecting secondary metabolites, polyploidy, mutation, drying & storage.',
        keyConcepts: ['WHO GACP', 'Harvest Timing', 'Drying & Storage'],
        linkedTab: 'theory'
      },
      {
        id: 'cog_u3',
        unit: 'Unit III',
        title: 'Quantitative Microscopy & Evaluation',
        summary: 'Stomatal number/index, vein-islet/termination, palisade ratio & Lycopodium spore purity.',
        keyConcepts: ['Stomatal Index Formula', 'Stage Micrometer', 'Lycopodium (94,000/mg)'],
        linkedTab: 'leaf_constants'
      },
      {
        id: 'cog_u4',
        unit: 'Unit IV',
        title: 'Traditional Medicine & Ash/Extractive QC',
        summary: 'Ayurveda, Siddha, Unani, Homeopathy principles; ash values, moisture LOD & swelling factor.',
        keyConcepts: ['Total & Acid-Insoluble Ash', 'Swelling Factor', 'Herbarium Voucher'],
        linkedTab: 'physicochemical'
      },
      {
        id: 'cog_u5',
        unit: 'Unit V',
        title: '20 Official Medicinal Plant Monographs',
        summary: 'Botanical source, family, active constituents & therapeutic applications across 20 core plants.',
        keyConcepts: ['Tulsi', 'Ashwagandha', 'Arjuna & Amla'],
        linkedTab: 'morphology'
      }
    ],
    experiments: [
      { id: 'bp110p_leaf', code: 'Exp 8–13', title: 'Stomatal Index, Vein-Islet, Micrometry & Lycopodium', tab: 'leaf_constants' },
      { id: 'bp110p_morph', code: 'Exp 1–5', title: 'Plant Morphology & Powder Microscopy', tab: 'morphology' },
      { id: 'bp110p_qc', code: 'Exp 6–11', title: 'Moisture, Swelling, Ash & Voucher Label', tab: 'physicochemical' }
    ],
    equipment: [
      {
        id: 'eq_botanical_scope',
        name: 'Compound Microscope + Camera Lucida / Stage Micrometer',
        purpose: 'Measurement of trichomes, starch grains, calcium oxalate crystals & stomatal index',
        visualId: 'builtin_botanical_microscopy'
      }
    ]
  },
  psychology: {
    id: 'psychology',
    departmentGroupId: 'psychology',
    visualDepartmentId: 'psychology',
    code: 'BP103T / BP108P',
    title: 'Healthcare Psychology & Communication Skills',
    shortLabel: 'Psychology & Comm.',
    category: 'humanities',
    overview:
      'SPIKES breaking-bad-news simulator, chronic-care adherence role-plays, SBAR clinical handover generator, case vignettes, IEC builder & reflection logs.',
    practicalCountLabel: '5 Practicals · Role-Plays · Units I–V Theory',
    theorySummary: 'Health Belief Model, Transtheoretical Model, CBT, therapeutic empathy, crisis PFA & ethics.',
    defaultTab: 'roleplay',
    tabs: [
      { id: 'roleplay', label: 'Clinical Role-Plays' },
      { id: 'cases', label: 'Case Vignettes' },
      { id: 'peer', label: 'Paraphrasing & SBAR' },
      { id: 'community', label: 'Community IEC' },
      { id: 'journal', label: 'Reflection Logs' },
      { id: 'theory', label: 'Theory (Units I–V)' }
    ],
    topics: [
      {
        id: 'psy_u1',
        unit: 'Unit I',
        title: 'Psychology in Pharmacy & Behavior Models',
        summary: 'Health Belief Model (HBM), Transtheoretical Stages of Change & medication adherence barriers.',
        keyConcepts: ['Health Belief Model', 'Stages of Change', 'Adherence'],
        linkedTab: 'theory'
      },
      {
        id: 'psy_u2',
        unit: 'Unit II',
        title: 'Therapeutic Communication & SPIKES',
        summary: 'Active listening, SOLER posture, motivational interviewing & breaking bad news safely.',
        keyConcepts: ['SPIKES Protocol', 'Motivational Interviewing', 'Empathy'],
        linkedTab: 'roleplay'
      },
      {
        id: 'psy_u3',
        unit: 'Unit III',
        title: 'Interprofessional Handover & SBAR',
        summary: 'Structured Situation-Background-Assessment-Recommendation communication & IEC materials.',
        keyConcepts: ['SBAR Handover', 'Patient Literacy', 'IEC Leaflets'],
        linkedTab: 'peer'
      },
      {
        id: 'psy_u4',
        unit: 'Unit IV',
        title: 'Stress, Crisis PFA & Burnout Prevention',
        summary: 'Psychological First Aid (Look, Listen, Link), cognitive distortions & reflective practice.',
        keyConcepts: ['Psychological First Aid', 'Gibbs Reflection', 'CBT Reframing'],
        linkedTab: 'journal'
      }
    ],
    experiments: [
      { id: 'bp108p_rp', code: 'Exp 1–3', title: 'SPIKES, Chronic Counseling & Crisis PFA Role-Plays', tab: 'roleplay' },
      { id: 'bp108p_sbar', code: 'Exp 4', title: 'SBAR Clinical Handover & IEC Builder', tab: 'peer' },
      { id: 'bp108p_ref', code: 'Exp 5', title: 'Structured Gibbs Reflection Journal', tab: 'journal' }
    ],
    equipment: []
  },
  python: {
    id: 'python',
    departmentGroupId: 'python',
    visualDepartmentId: 'python',
    code: 'BP101T',
    title: 'Computer Applications & Python Fundamentals',
    shortLabel: 'Python Fundamentals',
    category: 'data',
    overview:
      'Browser-native Pyodide Python execution console alongside offline pharmaceutical algorithms (BMI, pediatric dosing, NumPy QC tolerances) and Units I–V reference.',
    practicalCountLabel: 'Live Pyodide Console · Dosage Algorithms · Units I–V',
    theorySummary: 'Python syntax, control flow, functions, NumPy arrays & pharmaceutical computation.',
    defaultTab: 'unit1-2',
    tabs: [
      { id: 'unit1-2', label: 'Unit I & II: Syntax & BMI' },
      { id: 'unit3', label: 'Unit III: NumPy QC' },
      { id: 'unit4', label: 'Unit IV: Pandas ADRs' },
      { id: 'unit5', label: 'Unit V: Pharma Plots' },
      { id: 'practical5', label: 'Practical 5: Arrhenius' },
      { id: 'sandbox', label: 'Custom Sandbox' }
    ],
    topics: [
      {
        id: 'py_u1',
        unit: 'Unit I–II',
        title: 'Python Basics, Data Types & Control Flow',
        summary: 'Variables, loops, conditionals & pharmaceutical calculation functions (BMI, CrCl, dosing).',
        keyConcepts: ['Variables & Loops', 'Dosage Functions', 'Input Validation'],
        linkedTab: 'unit1-2'
      },
      {
        id: 'py_u3',
        unit: 'Unit III',
        title: 'Lists, Dictionaries & NumPy QC Arrays',
        summary: 'Batch tablet weight variation, standard deviation, assay %RSD & list comprehensions.',
        keyConcepts: ['Dictionaries', 'NumPy Arrays', 'Batch QC Stats'],
        linkedTab: 'unit3'
      }
    ],
    experiments: [
      { id: 'bp101t_ide', code: 'Lab 1–5', title: 'Interactive Pharmaceutical Python Console', tab: 'unit1-2' }
    ],
    equipment: []
  },
  pandas: {
    id: 'pandas',
    departmentGroupId: 'python',
    visualDepartmentId: 'python',
    code: 'BP101T (Unit IV–V)',
    title: 'Pharmaceutical Data Science: Pandas & PK Visualization',
    shortLabel: 'Pandas & PK Plots',
    category: 'data',
    overview:
      'Interactive Pandas DataFrame operations (df.info, describe, groupby, query filters) and SVG pharmacokinetic & dissolution visualization plots.',
    practicalCountLabel: 'PK Curves · ADR Analytics · Dissolution Plots',
    theorySummary: 'Tabular clinical datasets, aggregation, AUC/Cmax comparisons & drug dissolution visualization.',
    defaultTab: 'pk',
    tabs: [
      { id: 'pk', label: 'PK & DataFrames' }
    ],
    topics: [
      {
        id: 'pd_u4',
        unit: 'Unit IV',
        title: 'Pandas DataFrames for ADR & Clinical Datasets',
        summary: 'Inspecting schemas with df.info(), summary statistics, filtering & adverse drug reaction grouping.',
        keyConcepts: ['df.info() & describe()', 'GroupBy ADRs', 'Data Filtering'],
        linkedTab: 'pk'
      },
      {
        id: 'pd_u5',
        unit: 'Unit V',
        title: 'Pharmacokinetic & Dissolution Plotting',
        summary: 'Oral vs IV plasma concentration-time profiles (Cmax, Tmax, AUC) and tablet dissolution curves.',
        keyConcepts: ['Oral vs IV PK Curve', 'Cmax & Tmax', 'Dissolution %'],
        linkedTab: 'pk'
      }
    ],
    experiments: [
      { id: 'bp101t_pk', code: 'Lab 5–6', title: 'PK Curves & Clinical Dataset Analyzer', tab: 'pk' }
    ],
    equipment: []
  }
};

export const CORE_DEPARTMENT_CARDS: DepartmentWorkspaceMeta[] = [
  DEPARTMENT_WORKSPACES.anatomy,
  DEPARTMENT_WORKSPACES.inorganic,
  DEPARTMENT_WORKSPACES.general_pharmacy,
  DEPARTMENT_WORKSPACES.pharmacognosy,
  DEPARTMENT_WORKSPACES.psychology,
  DEPARTMENT_WORKSPACES.python
];
