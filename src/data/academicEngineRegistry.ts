import {
  AnatomicalCategoryMeta,
  EngineDepartment,
  EngineSubject,
  EngineSubtopic,
  EngineTopic,
  TextbookReferenceEntity
} from '../types/academicEngine';

export const ANATOMY_CATEGORIES: AnatomicalCategoryMeta[] = [
  {
    id: 'cardiovascular',
    label: 'Cardiovascular System',
    shortLabel: 'Cardiovascular',
    description: 'Heart, conduction pathways, valves, great vessels, microcirculation, and blood.',
    topicId: 'topic_cardiovascular_system'
  },
  {
    id: 'nervous',
    label: 'Nervous System',
    shortLabel: 'Nervous',
    description: 'Central and peripheral neural structures, autonomic division, and neuromuscular junction.',
    topicId: 'topic_nervous_system'
  },
  {
    id: 'respiratory',
    label: 'Respiratory System',
    shortLabel: 'Respiratory',
    description: 'Conducting airways, lungs, and alveolar-capillary gas exchange unit.',
    topicId: 'topic_respiratory_system'
  },
  {
    id: 'digestive',
    label: 'Digestive System',
    shortLabel: 'Digestive',
    description: 'Alimentary tract, hepatobiliary organs, pancreas, and salivary glands.',
    topicId: 'topic_digestive_system'
  },
  {
    id: 'urinary',
    label: 'Urinary System',
    shortLabel: 'Urinary',
    description: 'Kidneys, nephron segments, glomerulus, ureters, and lower urinary tract.',
    topicId: 'topic_urinary_system'
  },
  {
    id: 'endocrine',
    label: 'Endocrine System',
    shortLabel: 'Endocrine',
    description: 'Pituitary, thyroid, parathyroid, adrenal, pineal, and endocrine pancreatic/gonadal axes.',
    topicId: 'topic_endocrine_system'
  },
  {
    id: 'lymphatic',
    label: 'Lymphatic & Immune System',
    shortLabel: 'Lymphatic',
    description: 'Thymus, tonsils, lymph nodes, spleen, bone marrow hematopoiesis, and GALT (appendix).',
    topicId: 'topic_lymphatic_system'
  },
  {
    id: 'sensory',
    label: 'Sensory Organs',
    shortLabel: 'Sensory',
    description: 'Eyes, cornea, retina, ears, skin cutaneous receptors, and olfactory/gustatory chemoreception.',
    topicId: 'topic_sensory_organs'
  },
  {
    id: 'musculoskeletal',
    label: 'Musculoskeletal System',
    shortLabel: 'Musculoskeletal',
    description: 'Bone tissue, cartilage, tendons, ligaments, skeletal/smooth/cardiac muscle, and diaphragm.',
    topicId: 'topic_musculoskeletal_system'
  },
  {
    id: 'tissues',
    label: 'Tissues',
    shortLabel: 'Tissues',
    description: 'Epithelial, connective, adipose, cartilage, bone, blood, muscular, and nervous tissues.',
    topicId: 'topic_tissues'
  }
];

export const TEXTBOOK_REFERENCES: Record<string, TextbookReferenceEntity> = {
  tb_tortora: {
    id: 'tb_tortora',
    title: 'Principles of Anatomy and Physiology',
    authors: 'Tortora, G. J., & Derrickson, B.',
    editionNote: 'Standard PCI BP104T Reference Textbook',
    scopeNote: 'Comprehensive structural anatomy, organ systems, histology, and physiological mechanisms.',
    departments: ['dept_anatomy'],
    topicKeywords: ['anatomy', 'physiology', 'nephron', 'heart', 'kidney', 'tissues', 'skeleton', 'nervous']
  },
  tb_ross_wilson: {
    id: 'tb_ross_wilson',
    title: 'Ross & Wilson Anatomy and Physiology in Health and Illness',
    authors: 'Waugh, A., & Grant, A.',
    editionNote: 'Core Pharmacy & Allied Health Textbook',
    scopeNote: 'Clear anatomical cross-sections, organ functions, and common pathophysiological correlations.',
    departments: ['dept_anatomy'],
    topicKeywords: ['anatomy', 'heart', 'lungs', 'digestive', 'endocrine', 'lymphatic', 'skin']
  },
  tb_guyton: {
    id: 'tb_guyton',
    title: 'Textbook of Medical Physiology',
    authors: 'Hall, J. E. (Guyton & Hall)',
    editionNote: 'Physiology & Mechanism Reference',
    scopeNote: 'Detailed renal filtration, Starling forces, cardiac conduction, action potentials, and endocrine regulation.',
    departments: ['dept_anatomy', 'dept_pharmaceutics'],
    topicKeywords: ['gfr', 'nephron', 'cardiac cycle', 'ecg', 'action potential', 'hormones', 'alveoli']
  },
  tb_sembulingam: {
    id: 'tb_sembulingam',
    title: 'Essentials of Medical Physiology',
    authors: 'Sembulingam, K., & Sembulingam, P.',
    editionNote: 'B.Pharm Exam-Oriented Reference',
    scopeNote: 'Hematology counts, ESR, blood grouping, renal physiology, and concise exam points.',
    departments: ['dept_anatomy'],
    topicKeywords: ['blood', 'rbc', 'wbc', 'hemoglobin', 'esr', 'kidney', 'nephron']
  }
};

export const ENGINE_DEPARTMENTS: Record<string, EngineDepartment> = {
  dept_anatomy: {
    id: 'dept_anatomy',
    moduleId: 'anatomy',
    code: 'BP104T / BP109P',
    title: 'Human Anatomy, Physiology & Pathophysiology',
    shortLabel: 'Anatomy & Physiology',
    overview: 'Normalized structural biology, 60-entry anatomical catalog, Units I–V physiology, and interactive bench practicals.',
    subjectIds: ['subj_body_systems', 'subj_cellular_tissue_biology']
  },
  dept_inorganic: {
    id: 'dept_inorganic',
    moduleId: 'inorganic',
    code: 'BP106T / BP111P',
    title: 'Pharmaceutical Inorganic & Analytical Chemistry',
    shortLabel: 'Inorganic Chemistry',
    overview: 'Pharmacopoeial limit tests, volumetric standardization, buffers, and radiopharmaceuticals.',
    subjectIds: ['subj_analytical_inorganic']
  },
  dept_pharmaceutics: {
    id: 'dept_pharmaceutics',
    moduleId: 'general_pharmacy',
    code: 'BP102T / BP107P',
    title: 'Pharmaceutics & General Pharmacy',
    shortLabel: 'Pharmaceutics',
    overview: 'Extemporaneous compounding, posology, isotonicity, and monophasic/biphasic dosage forms.',
    subjectIds: ['subj_dosage_forms']
  },
  dept_pharmacognosy: {
    id: 'dept_pharmacognosy',
    moduleId: 'pharmacognosy',
    code: 'BP105T / BP110P',
    title: 'Pharmacognosy & Phytochemistry',
    shortLabel: 'Pharmacognosy',
    overview: 'Quantitative leaf microscopy, crude drug monographs, and physicochemical quality control.',
    subjectIds: ['subj_crude_drugs']
  },
  dept_psychology: {
    id: 'dept_psychology',
    moduleId: 'psychology',
    code: 'BP103T / BP108P',
    title: 'Healthcare Psychology & Communication',
    shortLabel: 'Psychology & Comm.',
    overview: 'Therapeutic communication, SPIKES, SBAR handover, and health behavior models.',
    subjectIds: ['subj_health_communication']
  },
  dept_python: {
    id: 'dept_python',
    moduleId: 'python',
    code: 'BP101T',
    title: 'Computer Applications & Pharmaceutical Data Science',
    shortLabel: 'Python & PK Data',
    overview: 'Browser Python console, dosage algorithms, and Pandas pharmacokinetic visualization.',
    subjectIds: ['subj_pharma_computing']
  }
};

export const ENGINE_SUBJECTS: Record<string, EngineSubject> = {
  subj_body_systems: {
    id: 'subj_body_systems',
    departmentId: 'dept_anatomy',
    title: 'Human Body Systems',
    description: 'Organ-system anatomy, physiology, and clinical pharmacy correlations across all 9 major organ-system divisions plus histology.',
    topicIds: [
      'topic_cardiovascular_system',
      'topic_nervous_system',
      'topic_respiratory_system',
      'topic_digestive_system',
      'topic_urinary_system',
      'topic_endocrine_system',
      'topic_lymphatic_system',
      'topic_sensory_organs',
      'topic_musculoskeletal_system'
    ]
  },
  subj_cellular_tissue_biology: {
    id: 'subj_cellular_tissue_biology',
    departmentId: 'dept_anatomy',
    title: 'Cellular Organization & Primary Tissues',
    description: 'Eukaryotic cell ultrastructure, membrane transport, blood elements, and the four primary tissues.',
    topicIds: ['topic_tissues']
  },
  subj_analytical_inorganic: {
    id: 'subj_analytical_inorganic',
    departmentId: 'dept_inorganic',
    title: 'Pharmacopoeial Analysis & Buffers',
    description: 'Impurity limit tests and volumetric standardization.',
    topicIds: ['topic_limit_tests']
  },
  subj_dosage_forms: {
    id: 'subj_dosage_forms',
    departmentId: 'dept_pharmaceutics',
    title: 'Dosage Forms & Pharmaceutical Calculations',
    description: 'Posology, alligation, isotonicity, and compounding.',
    topicIds: ['topic_compounding']
  },
  subj_crude_drugs: {
    id: 'subj_crude_drugs',
    departmentId: 'dept_pharmacognosy',
    title: 'Botanical Microscopy & Crude Drug Evaluation',
    description: 'Stomatal index, trichomes, calcium oxalate crystals, and plant monographs.',
    topicIds: ['topic_botanical_microscopy']
  },
  subj_health_communication: {
    id: 'subj_health_communication',
    departmentId: 'dept_psychology',
    title: 'Clinical Counseling & Adherence',
    description: 'SPIKES, SBAR, and patient medication adherence frameworks.',
    topicIds: ['topic_clinical_counseling']
  },
  subj_pharma_computing: {
    id: 'subj_pharma_computing',
    departmentId: 'dept_python',
    title: 'Pharmacokinetic & QC Computing',
    description: 'Python scripts and Pandas plasma concentration-time visualization.',
    topicIds: ['topic_pk_modeling']
  }
};

export const ENGINE_TOPICS: Record<string, EngineTopic> = {
  topic_cardiovascular_system: {
    id: 'topic_cardiovascular_system',
    departmentId: 'dept_anatomy',
    subjectId: 'subj_body_systems',
    categoryId: 'cardiovascular',
    unitLabel: 'Unit V · CVS',
    title: 'Cardiovascular System',
    summary: 'Cardiac chambers, heart valves, SA/AV conduction, arterial/venous hemodynamics, and formed blood elements.',
    subtopicIds: ['subtopic_heart_chambers', 'subtopic_cardiac_conduction'],
    linkedTab: 'cardio'
  },
  topic_nervous_system: {
    id: 'topic_nervous_system',
    departmentId: 'dept_anatomy',
    subjectId: 'subj_body_systems',
    categoryId: 'nervous',
    unitLabel: 'Unit IV · CNS/ANS',
    title: 'Nervous System',
    summary: 'Cerebrum, cerebellum, brainstem, hypothalamus, spinal cord, action potentials, ANS, and neuromuscular junction.',
    subtopicIds: [],
    linkedTab: 'theory'
  },
  topic_respiratory_system: {
    id: 'topic_respiratory_system',
    departmentId: 'dept_anatomy',
    subjectId: 'subj_body_systems',
    categoryId: 'respiratory',
    unitLabel: 'Body Systems',
    title: 'Respiratory System',
    summary: 'Upper airways, tracheobronchial smooth muscle, pulmonary surfactant, and alveolar gas exchange.',
    subtopicIds: []
  },
  topic_digestive_system: {
    id: 'topic_digestive_system',
    departmentId: 'dept_anatomy',
    subjectId: 'subj_body_systems',
    categoryId: 'digestive',
    unitLabel: 'Body Systems',
    title: 'Digestive System',
    summary: 'GI motility, gastric acid secretion, intestinal villus absorption, hepatic CYP450 metabolism, and pancreas.',
    subtopicIds: []
  },
  topic_urinary_system: {
    id: 'topic_urinary_system',
    departmentId: 'dept_anatomy',
    subjectId: 'subj_body_systems',
    categoryId: 'urinary',
    unitLabel: 'Unit V · Renal',
    title: 'Urinary System',
    summary: 'Kidney architecture, nephron ultrafiltration/reabsorption/secretion, renal drug clearance, and urinary tract.',
    subtopicIds: ['subtopic_nephron'],
    linkedTab: 'explorer'
  },
  topic_endocrine_system: {
    id: 'topic_endocrine_system',
    departmentId: 'dept_anatomy',
    subjectId: 'subj_body_systems',
    categoryId: 'endocrine',
    unitLabel: 'Body Systems',
    title: 'Endocrine System',
    summary: 'Hypothalamic-pituitary axis, thyroid/parathyroid calcium regulation, adrenal cortex/medulla, and pineal.',
    subtopicIds: []
  },
  topic_lymphatic_system: {
    id: 'topic_lymphatic_system',
    departmentId: 'dept_anatomy',
    subjectId: 'subj_body_systems',
    categoryId: 'lymphatic',
    unitLabel: 'Unit III · Immune',
    title: 'Lymphatic & Immune System',
    summary: 'Lymph nodes, spleen red/white pulp, thymic T-cell maturation, tonsils, and bone marrow hematopoiesis.',
    subtopicIds: ['subtopic_hematopoiesis'],
    linkedTab: 'hematology'
  },
  topic_sensory_organs: {
    id: 'topic_sensory_organs',
    departmentId: 'dept_anatomy',
    subjectId: 'subj_body_systems',
    categoryId: 'sensory',
    unitLabel: 'Unit II & IV',
    title: 'Sensory Organs',
    summary: 'Ophthalmic optics, auditory/vestibular apparatus, skin receptors, and olfactory/taste chemoreception.',
    subtopicIds: ['subtopic_eye_ear_senses', 'subtopic_integumentary_skin'],
    linkedTab: 'diagrams'
  },
  topic_musculoskeletal_system: {
    id: 'topic_musculoskeletal_system',
    departmentId: 'dept_anatomy',
    subjectId: 'subj_body_systems',
    categoryId: 'musculoskeletal',
    unitLabel: 'Unit II · Osteology',
    title: 'Musculoskeletal System',
    summary: '206 bones (80 axial + 126 appendicular), synovial joints, and sarcomere excitation-contraction coupling.',
    subtopicIds: ['subtopic_osteology_bones'],
    linkedTab: 'bones'
  },
  topic_tissues: {
    id: 'topic_tissues',
    departmentId: 'dept_anatomy',
    subjectId: 'subj_cellular_tissue_biology',
    categoryId: 'tissues',
    unitLabel: 'Unit I · Histology',
    title: 'Tissues & Cellular Organization',
    summary: 'Epithelial, connective, muscular, and nervous tissues plus eukaryotic cell membrane transport.',
    subtopicIds: ['subtopic_primary_tissues'],
    linkedTab: 'microscopy'
  },
  topic_limit_tests: {
    id: 'topic_limit_tests',
    departmentId: 'dept_inorganic',
    subjectId: 'subj_analytical_inorganic',
    unitLabel: 'BP106T Unit I',
    title: 'Pharmacopoeial Limit Tests & Volumetric Assays',
    summary: 'Nessler cylinders, Gutzeit arsenic apparatus, and acid-base/redox/EDTA titrations.',
    subtopicIds: [],
    linkedTab: 'limit_tests'
  },
  topic_compounding: {
    id: 'topic_compounding',
    departmentId: 'dept_pharmaceutics',
    subjectId: 'subj_dosage_forms',
    unitLabel: 'BP102T Units II–V',
    title: 'Posology, Isotonicity & Extemporaneous Compounding',
    summary: 'Pediatric dosing formulas, alligation, displacement value, and isotonicity adjustments.',
    subtopicIds: [],
    linkedTab: 'experiments'
  },
  topic_botanical_microscopy: {
    id: 'topic_botanical_microscopy',
    departmentId: 'dept_pharmacognosy',
    subjectId: 'subj_crude_drugs',
    unitLabel: 'BP105T Unit III–V',
    title: 'Quantitative Leaf Microscopy & Crude Drug Monographs',
    summary: 'Stomatal index, vein-islet number, calcium oxalate crystals, and medicinal plant identification.',
    subtopicIds: [],
    linkedTab: 'leaf_constants'
  },
  topic_clinical_counseling: {
    id: 'topic_clinical_counseling',
    departmentId: 'dept_psychology',
    subjectId: 'subj_health_communication',
    unitLabel: 'BP103T Units I–III',
    title: 'SPIKES Protocol & SBAR Interprofessional Handover',
    summary: 'Structured clinical communication and medication adherence psychology.',
    subtopicIds: [],
    linkedTab: 'roleplay'
  },
  topic_pk_modeling: {
    id: 'topic_pk_modeling',
    departmentId: 'dept_python',
    subjectId: 'subj_pharma_computing',
    unitLabel: 'BP101T Units IV–V',
    title: 'Pharmacokinetic Clearance & Dissolution Plotting',
    summary: 'Oral vs IV plasma concentration-time profiles and ADR dataset aggregation.',
    subtopicIds: []
  }
};

export const ENGINE_SUBTOPICS: Record<string, EngineSubtopic> = {
  subtopic_nephron: {
    id: 'subtopic_nephron',
    departmentId: 'dept_anatomy',
    subjectId: 'subj_body_systems',
    topicId: 'topic_urinary_system',
    structureId: 'anat_11_right_kidney',
    title: 'Nephron — Ultrafiltration, Tubular Transport & Drug Clearance',
    summary: 'Glomerular filtration (~125 mL/min GFR), PCT OAT/OCT secretion, NKCC2 countercurrent multiplication, and diuretic pharmacology inside right and left kidneys.',
    anatomyNotes: 'Cortical (~85%) and juxtamedullary (~15%) nephrons spanning renal cortex and medullary pyramids.',
    structureNotes: 'Renal corpuscle (glomerulus + Bowman’s capsule) → PCT → Loop of Henle → DCT + Macula Densa → Collecting Duct.',
    physiologyNotes: 'Net urine/drug excretion = Filtration + Secretion − Reabsorption; ADH & aldosterone regulate final osmolarity.',
    functions: [
      'Ultrafiltration of unbound plasma solutes (<60 kDa)',
      'Obligatory reabsorption of glucose, amino acids, and ~65% Na⁺/H₂O in PCT',
      'Active tubular secretion of organic acids/bases and pH-dependent ion trapping'
    ],
    visualIds: ['builtin_nephron_anatomy', 'builtin_diuretic_pharmacology'],
    textbookRefIds: ['tb_tortora', 'tb_guyton', 'tb_sembulingam'],
    relatedTopicIds: ['topic_cardiovascular_system', 'topic_pk_modeling', 'topic_endocrine_system'],
    relatedStructureIds: [
      'anat_11_right_kidney',
      'anat_12_left_kidney',
      'anat_13_right_ureter',
      'anat_15_urinary_bladder',
      'anat_38_adrenal_glands'
    ]
  },
  subtopic_heart_chambers: {
    id: 'subtopic_heart_chambers',
    departmentId: 'dept_anatomy',
    subjectId: 'subj_body_systems',
    topicId: 'topic_cardiovascular_system',
    structureId: 'anat_03_heart',
    title: 'Cardiac Chambers, Valves & Great Vessels',
    summary: 'Four cardiac chambers, tricuspid/mitral/semilunar valves, S1–S2 heart sounds, and systemic vs pulmonary circuits.',
    visualIds: ['builtin_heart_anatomy'],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    relatedTopicIds: ['topic_respiratory_system', 'topic_urinary_system'],
    relatedStructureIds: ['anat_60_heart_valves', 'anat_04_lungs', 'anat_52_blood']
  },
  subtopic_cardiac_conduction: {
    id: 'subtopic_cardiac_conduction',
    departmentId: 'dept_anatomy',
    subjectId: 'subj_body_systems',
    topicId: 'topic_cardiovascular_system',
    structureId: 'anat_03_heart',
    title: 'Cardiac Conduction System & ECG Correlation',
    summary: 'SA node pacemaker (70–80 bpm), AV nodal 0.1 s delay, Bundle of His, Purkinje fibers, and P-QRS-T waveform.',
    visualIds: ['builtin_heart_anatomy'],
    textbookRefIds: ['tb_guyton', 'tb_tortora'],
    relatedTopicIds: ['topic_nervous_system'],
    relatedStructureIds: ['anat_60_heart_valves', 'anat_47_cardiac_muscle', 'anat_01_brain']
  },
  subtopic_hematopoiesis: {
    id: 'subtopic_hematopoiesis',
    departmentId: 'dept_anatomy',
    subjectId: 'subj_body_systems',
    topicId: 'topic_lymphatic_system',
    structureId: 'anat_43_bone_marrow',
    title: 'Hematopoiesis, Formed Elements & Clinical Blood Indices',
    summary: 'Red bone marrow lineage differentiation, RBC/WBC counts, hemoglobin, ESR, and ABO/Rh compatibility.',
    visualIds: [],
    textbookRefIds: ['tb_sembulingam', 'tb_tortora'],
    relatedTopicIds: ['topic_cardiovascular_system'],
    relatedStructureIds: ['anat_52_blood', 'anat_32_spleen', 'anat_40_thymus']
  },
  subtopic_eye_ear_senses: {
    id: 'subtopic_eye_ear_senses',
    departmentId: 'dept_anatomy',
    subjectId: 'subj_body_systems',
    topicId: 'topic_sensory_organs',
    structureId: 'anat_28_eyes',
    title: 'Ocular Optics, Aqueous Dynamics & Auditory-Vestibular Transduction',
    summary: 'Cornea/lens refraction, retinal rods/cones, intraocular pressure, middle-ear ossicles, and cochlear/vestibular hair cells.',
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    relatedTopicIds: ['topic_nervous_system'],
    relatedStructureIds: ['anat_57_cornea', 'anat_58_retina', 'anat_29_ears']
  },
  subtopic_integumentary_skin: {
    id: 'subtopic_integumentary_skin',
    departmentId: 'dept_anatomy',
    subjectId: 'subj_body_systems',
    topicId: 'topic_sensory_organs',
    structureId: 'anat_44_skin',
    title: 'Skin Layers, Appendages & Transdermal Absorption',
    summary: 'Stratum corneum barrier, dermal vascularity, sweat/sebaceous glands, wound healing, and topical/transdermal delivery.',
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    relatedTopicIds: ['topic_tissues', 'topic_compounding'],
    relatedStructureIds: ['anat_56_epithelial_tissue', 'anat_55_connective_tissue', 'anat_53_adipose_tissue']
  },
  subtopic_osteology_bones: {
    id: 'subtopic_osteology_bones',
    departmentId: 'dept_anatomy',
    subjectId: 'subj_body_systems',
    topicId: 'topic_musculoskeletal_system',
    structureId: 'anat_49_bone_tissue',
    title: '206-Bone Osteology & Synovial Articulations',
    summary: 'Axial (80 bones) vs Appendicular (126 bones) classification, Haversian bone remodeling, cartilage, tendons, and ligaments.',
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    relatedTopicIds: ['topic_endocrine_system'],
    relatedStructureIds: ['anat_48_cartilage', 'anat_50_tendons', 'anat_51_ligaments', 'anat_45_skeletal_muscle']
  },
  subtopic_primary_tissues: {
    id: 'subtopic_primary_tissues',
    departmentId: 'dept_anatomy',
    subjectId: 'subj_cellular_tissue_biology',
    topicId: 'topic_tissues',
    structureId: 'anat_56_epithelial_tissue',
    title: 'Four Primary Tissues & Eukaryotic Cell Ultrastructure',
    summary: 'Histological diagnostic features of epithelial, connective, muscular, and nervous tissues alongside brightfield microscopy.',
    visualIds: ['builtin_eukaryotic_cell'],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    relatedTopicIds: ['topic_botanical_microscopy'],
    relatedStructureIds: ['anat_55_connective_tissue', 'anat_45_skeletal_muscle', 'anat_54_nervous_tissue']
  }
};
