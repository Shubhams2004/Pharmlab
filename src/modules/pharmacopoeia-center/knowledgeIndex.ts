import { ENGINE_TOPICS } from '../../data/academicEngineRegistry';
import { SYLLABUS_COURSES } from '../../data/bpharmSem1Syllabus';
import { getBookPages } from '../knowledge-library/libraryDb';
import { searchBookPages } from '../knowledge-library/searchEngine';
import { LibraryBookMeta } from '../knowledge-library/types';
import { INITIAL_REFERENCE_CATALOG } from '../reference-center/seedCatalog';
import { PharmacopoeiaProfileMeta, ReferenceItem } from '../reference-center/types';
import { OFFICIAL_BPHARM_SEM1_SYLLABUS_ID } from '../study-mode/syllabusBridge';
import { PHARMACOPOEIA_DIRECTORY } from './pharmacopoeiaCatalog';
import { runUnifiedPharmacopoeiaSearch } from './searchEngine';
import {
  AcademicTopicSearchHit,
  AVAILABILITY_STATUS_LABELS,
  EducationalTestModule,
  PharmacopoeiaAvailabilityStatus,
  PharmacopoeiaDirectoryEntry,
  PharmacopoeiaUserStore,
  SeededTextbookMatch,
  SubstanceWorkspaceRecord,
  TextbookPdfHit,
  UnifiedKnowledgeSearchResponse
} from './types';

export const SUBSTANCE_KNOWLEDGE_BASE: SubstanceWorkspaceRecord[] = [
  {
    id: 'sub_paracetamol',
    name: 'Paracetamol (Acetaminophen)',
    kind: 'drug_substance',
    synonyms: ['Acetaminophen', 'N-acetyl-p-aminophenol', 'APAP', 'PCM'],
    categoryLabel: 'Analgesic & Antipyretic API · Solid & Liquid Dosage Forms',
    dataSourceOrigin: 'PharmaLab BP102T/BP107P Compendium, Divided Powders & Dissolution Curriculum',
    overview:
      'Para-aminophenol derivative widely formulated as compressed tablets, oral suspensions, and divided powders (chartulae). Covered in PharmaLab BP107P posology dosing checks, marketed dosage form evaluation, and solid-oral dissolution principles.',
    chemicalInfo: {
      chemicalName: 'N-(4-hydroxyphenyl)acetamide',
      formula: 'C₈H₉NO₂',
      functionalGroups: 'Phenolic hydroxyl (-OH) and secondary amide (-NHCOCH₃)',
      physicalNotes: 'White crystalline powder; used across immediate-release tablet and pediatric oral dosage formulations.'
    },
    analyticalMethods: [
      'UV-Visible spectrophotometric absorbance principles (aromatic chromophore) covered in Pharmaceutical Analysis curriculum.',
      'Titrimetric redox / cerimetric assay principles discussed in standard pharmaceutical chemistry textbooks.',
      'Dissolution testing (paddle/basket) for solid oral tablet formulations (Noyes–Whitney release kinetics).'
    ],
    qualityControl: [
      'Tablet weight variation, friability, disintegration time, and in-vitro dissolution verification (check official IP/BP/USP–NF monograph for binding acceptance criteria).',
      'Labeling compliance verified in BP107P Marketed Compendia: active strength per dose unit and maximum daily dose caution.'
    ],
    impurities: [
      'Process-related and hydrolytic degradant concepts such as 4-aminophenol are evaluated in official pharmacopoeial related-substances chapters (refer to official IP/BP/USP–NF for exact ppm limits).'
    ],
    pharmaceuticalApplications: [
      'Analgesic and antipyretic tablets, pediatric syrups/suspensions, effervescent granules, and divided powder formulations (BP107P).'
    ],
    relevantPharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur', 'pc_who_int', 'pc_jp', 'pc_martindale'],
    relatedTestIds: ['test_dissolution', 'test_volumetric_acid_base'],
    textbookKeywords: ['Paracetamol', 'Acetaminophen', 'Dissolution', 'Tablets', 'Tripathi', 'Aulton', 'Beckett'],
    academicLinks: [
      {
        subjectCode: 'BP102T / BP107P',
        subjectTitle: 'Pharmaceutics I',
        topicTitle: 'Posology, Divided Powders & Marketed Dosage Form Standards',
        syllabusId: OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
        topicId: 'bp102t_unit2'
      }
    ],
    labConnections: [
      {
        label: 'BP107P Posology & Marketed Compendia',
        kind: 'module',
        moduleId: 'general_pharmacy',
        tab: 'posology_proof',
        description: 'Open pediatric dose calculations & paracetamol max-dose check in Pharmaceutics lab.'
      },
      {
        label: 'Tablet Dissolution Simulator',
        kind: 'experiment',
        experimentId: 'exp_dissolution_noyes_whitney',
        description: 'Explore paddle RPM, particle size, and temperature effects on tablet dissolution profiles.'
      }
    ]
  },
  {
    id: 'sub_aspirin',
    name: 'Aspirin (Acetylsalicylic Acid)',
    kind: 'drug_substance',
    synonyms: ['Acetylsalicylic Acid', '2-Acetoxybenzoic acid', 'ASA', 'Salicylate'],
    categoryLabel: 'NSAID & Antiplatelet API · Ester Hydrolysis Stability Model',
    dataSourceOrigin: 'PharmaLab Visual Atlas (builtin_aspirin_molecule) & BP107P Curriculum',
    overview:
      '2-Acetoxybenzoic acid (C₉H₈O₄), a classical non-steroidal anti-inflammatory and antiplatelet drug synthesized via O-acetylation of salicylic acid. Moisture-sensitive ortho-acetoxy ester makes hydrolysis stability and free salicylic acid limit testing central QC topics.',
    chemicalInfo: {
      chemicalName: '2-Acetoxybenzoic acid',
      formula: 'C₉H₈O₄',
      functionalGroups: 'Aromatic benzene ring, carboxylic acid (-COOH, pKa 3.5), ortho-acetoxy ester (-OCOCH₃)',
      physicalNotes: 'Susceptible to hydrolytic cleavage into salicylic acid and acetic acid upon exposure to moisture/heat.'
    },
    identification: [
      'Educational Concept: Ferric chloride test after brief hydrolysis yields violet-colored ferric-salicylate complex; infrared spectrum & melting point apparatus checks are standard qualitative techniques.'
    ],
    analyticalMethods: [
      'Educational Titrimetry Concept: Back-titration with standardized NaOH and H₂SO₄ after alkaline ester hydrolysis, or direct titration in neutral ethanol with phenolphthalein.',
      'UV spectrophotometry and chromatographic determination of free salicylic acid impurity (consult official monograph for binding procedure and limits).'
    ],
    qualityControl: [
      'Moisture protection & desiccated blister/strip packaging to prevent ester hydrolysis.',
      'Dissolution profiling for plain vs enteric-coated tablet dosage forms.'
    ],
    impurities: [
      'Free salicylic acid formed via moisture-induced ester hydrolysis (refer to official IP/BP/USP–NF monograph for exact permitted limit).'
    ],
    pharmaceuticalApplications: [
      'Analgesic, anti-inflammatory, antipyretic tablets, low-dose antiplatelet enteric-coated tablets, and divided powder compounding examples (BP107P).'
    ],
    relevantPharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur', 'pc_who_int', 'pc_jp', 'pc_martindale'],
    relatedTestIds: ['test_volumetric_acid_base', 'test_dissolution'],
    textbookKeywords: ['Aspirin', 'Acetylsalicylic', 'Salicylic acid', 'Ester hydrolysis', 'Foye', 'Wilson'],
    academicLinks: [
      {
        subjectCode: 'BP102T / BP107P',
        subjectTitle: 'Pharmaceutics I',
        topicTitle: 'Solid Dosage Forms, Enteric Coating & Posology',
        syllabusId: OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
        topicId: 'bp102t_unit3'
      }
    ],
    labConnections: [
      {
        label: 'Aspirin Structure & SAR Plate',
        kind: 'visual',
        visualId: 'builtin_aspirin_molecule',
        description: 'Inspect the aromatic ring, -COOH, and ortho-acetoxy ester plate in Visual Library.'
      },
      {
        label: 'BP107P Posology & Compendia',
        kind: 'module',
        moduleId: 'general_pharmacy',
        tab: 'posology_proof',
        description: 'Check pediatric posology rules and maximum single/daily analgesic dose limits.'
      },
      {
        label: 'Tablet Dissolution Simulator',
        kind: 'experiment',
        experimentId: 'exp_dissolution_noyes_whitney',
        description: 'Simulate solid dosage release parameters for immediate vs controlled formulations.'
      }
    ]
  },
  {
    id: 'sub_ferrous_sulphate',
    name: 'Ferrous Sulphate (FeSO₄·7H₂O)',
    kind: 'drug_substance',
    synonyms: ['Ferrous Sulfate', 'FeSO4', 'Green Vitriol', 'Haematinic'],
    categoryLabel: 'Inorganic Haematinic API · BP106T / BP111P Exp 2(c) & Exp 4(b)',
    dataSourceOrigin: 'PharmaLab BP106T/BP111P Inorganic Chemistry Practicals',
    overview:
      'Pale green monoclinic crystalline inorganic haematinic prepared in BP111P Exp 2(c) by reacting clean iron filings with dilute sulphuric acid and assayed via redox cerimetry in Exp 4(b).',
    chemicalInfo: {
      chemicalName: 'Iron(II) sulphate heptahydrate',
      formula: 'FeSO₄·7H₂O',
      functionalGroups: 'Divisional Fe²⁺ cation paired with SO₄²⁻',
      physicalNotes: 'Efflorescent crystals easily oxidized in moist air to brownish ferric basic sulphate; trace dil. H₂SO₄ during crystallization suppresses hydrolysis/oxidation.'
    },
    identification: [
      'Educational Reaction: Reacts with potassium ferricyanide to yield deep blue Turnbull’s blue precipitate (Fe²⁺ test), and with BaCl₂ to confirm sulphate ions.'
    ],
    assayInfo: {
      methodName: 'Redox Titration — Cerimetry (BP111P Exp 4b Educational Curriculum)',
      titrantOrTechnique: '0.1N Ceric Ammonium Sulphate in dilute H₂SO₄ medium',
      indicator: 'Ferroin indicator (Red-Orange → Pale Blue endpoint)',
      formulaNote: 'Practical equivalence basis (educational example): 1 mL of 0.1N Ceric Ammonium Sulphate ≡ 0.02780 g FeSO₄·7H₂O.',
      educationalExplanation:
        'Educational curriculum principle: Ce⁴⁺ oxidizes Fe²⁺ stoichiometrically to Fe³⁺ in acidic medium without interfering chloride oxidation or self-indicator interference. Official specification limits must be verified in IP/BP/USP–NF.'
    },
    qualityControl: [
      'Limit tests for heavy metals, arsenic, chloride, and ferric ion contamination (refer to official pharmacopoeial monograph for binding thresholds).',
      'Store in airtight containers to minimize atmospheric oxidation of Fe²⁺ to Fe³⁺.'
    ],
    pharmaceuticalApplications: [
      'Oral haematinic tablets and liquid preparations for iron-deficiency anaemia.'
    ],
    relevantPharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur', 'pc_who_int'],
    relatedTestIds: ['test_redox_cerimetry_permanganometry', 'test_limit_chloride_sulphate'],
    textbookKeywords: ['Ferrous sulphate', 'Cerimetry', 'Haematinics', 'Inorganic', 'Block', 'Vogel'],
    academicLinks: [
      {
        subjectCode: 'BP106T / BP111P',
        subjectTitle: 'Pharmaceutical Inorganic Chemistry',
        topicTitle: 'Haematinics, Preparations & Redox Assays (Exp 2c & 4b)',
        syllabusId: OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
        topicId: 'bp106t_unit3'
      }
    ],
    labConnections: [
      {
        label: 'BP111P Cerimetry Burette Simulator',
        kind: 'module',
        moduleId: 'inorganic',
        tab: 'titration',
        description: 'Run the interactive Ferrous Sulphate cerimetric titration and % purity calculator.'
      },
      {
        label: 'BP111P Preparation & Stoichiometry',
        kind: 'module',
        moduleId: 'inorganic',
        tab: 'preparations',
        description: 'Inspect Fe + H₂SO₄ synthesis reaction and stoichiometric yield calculator.'
      }
    ]
  },
  {
    id: 'sub_copper_sulphate',
    name: 'Copper Sulphate (CuSO₄·5H₂O)',
    kind: 'drug_substance',
    synonyms: ['Cupric Sulfate', 'CuSO4', 'Blue Vitriol'],
    categoryLabel: 'Inorganic Astringent & Emetic · BP111P Exp 4(c) Iodometry',
    dataSourceOrigin: 'PharmaLab BP106T/BP111P Volumetric Assay Curriculum',
    overview:
      'Hydrated cupric salt studied in Pharmaceutical Inorganic Chemistry as an astringent, fungicide, and trace mineral, and assayed in BP111P Exp 4(c) via indirect iodometric titration.',
    chemicalInfo: {
      chemicalName: 'Copper(II) sulphate pentahydrate',
      formula: 'CuSO₄·5H₂O',
      physicalNotes: 'Deep blue triclinic crystals; loses water of crystallization on heating.'
    },
    assayInfo: {
      methodName: 'Indirect Iodometric Titration (BP111P Exp 4c Educational Curriculum)',
      titrantOrTechnique: '0.1N Sodium Thiosulphate against liberated I₂ from excess KI + acetic acid',
      indicator: 'Starch mucilage + Potassium thiocyanate (KSCN) near endpoint (Blue-Black → Milky White CuI)',
      formulaNote: 'Practical equivalence basis (educational example): 1 mL of 0.1N Na₂S₂O₃ ≡ 0.02497 g CuSO₄·5H₂O.',
      educationalExplanation:
        'Educational curriculum principle: Cu²⁺ oxidizes excess I⁻ to free I₂ while forming white CuI precipitate; KSCN displaces adsorbed iodine from CuI surface just before the final starch endpoint.'
    },
    relevantPharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur'],
    relatedTestIds: ['test_iodometry_volhard'],
    textbookKeywords: ['Copper sulphate', 'Iodometry', 'Thiosulphate', 'Starch', 'Vogel'],
    academicLinks: [
      {
        subjectCode: 'BP106T / BP111P',
        subjectTitle: 'Pharmaceutical Inorganic Chemistry',
        topicTitle: 'Volumetric Redox & Iodometric Assays (Exp 4c)',
        syllabusId: OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
        topicId: 'bp106t_unit4'
      }
    ],
    labConnections: [
      {
        label: 'BP111P Iodometry Burette Simulator',
        kind: 'module',
        moduleId: 'inorganic',
        tab: 'titration',
        description: 'Practice Exp 4(c) CuSO₄ titration with 0.1N sodium thiosulphate and starch indicator.'
      }
    ]
  },
  {
    id: 'sub_calcium_gluconate',
    name: 'Calcium Gluconate',
    kind: 'drug_substance',
    synonyms: ['Calcium D-gluconate', 'Ca-Gluconate', 'Calcium replenisher'],
    categoryLabel: 'Electrolyte Replenisher · BP111P Exp 4(d) EDTA Complexometry',
    dataSourceOrigin: 'PharmaLab BP106T/BP111P Complexometric Assay Curriculum',
    overview:
      'Water-soluble calcium salt used for hypocalcemia and electrolyte replenishment, and featured in BP111P Exp 4(d) as the classic complexometric EDTA titration model.',
    chemicalInfo: {
      chemicalName: 'Calcium D-gluconate monohydrate',
      formula: 'C₁₂H₂₂CaO₁₄·H₂O',
      physicalNotes: 'White crystalline granules; chelates stoichiometrically 1:1 with disodium edetate at alkaline pH.'
    },
    assayInfo: {
      methodName: 'Complexometric Titration with Disodium EDTA (BP111P Exp 4d Educational Curriculum)',
      titrantOrTechnique: '0.05M Disodium EDTA with MgSO₄ + NH₃–NH₄Cl buffer (pH 10)',
      indicator: 'Mordant Black II / Eriochrome Black T (Wine Red → Pure Sky Blue)',
      formulaNote: 'Practical equivalence basis (educational example): 1 mL of 0.05M EDTA ≡ 0.02242 g Ca-gluconate monohydrate.',
      educationalExplanation:
        'Educational curriculum principle: Added Mg²⁺ sharpens the Mordant Black II color transition because Ca²⁺ alone forms a weaker dye complex; EDTA chelates free Ca²⁺ first and finally strips Mg²⁺ from the indicator.'
    },
    relevantPharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur', 'pc_who_int'],
    relatedTestIds: ['test_complexometry_edta'],
    textbookKeywords: ['Calcium gluconate', 'EDTA', 'Complexometry', 'Mordant Black', 'Electrolytes'],
    academicLinks: [
      {
        subjectCode: 'BP106T / BP111P',
        subjectTitle: 'Pharmaceutical Inorganic Chemistry',
        topicTitle: 'Electrolyte Replenishers & Complexometric Assays (Exp 4d)',
        syllabusId: OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
        topicId: 'bp106t_unit2'
      }
    ],
    labConnections: [
      {
        label: 'BP111P Complexometry Simulator',
        kind: 'module',
        moduleId: 'inorganic',
        tab: 'titration',
        description: 'Titrate Calcium Gluconate with 0.05M EDTA at pH 10 in Inorganic Lab.'
      }
    ]
  },
  {
    id: 'sub_hydrogen_peroxide',
    name: 'Hydrogen Peroxide (H₂O₂)',
    kind: 'drug_substance',
    synonyms: ['H2O2', 'Peroxide', '20 Volume Hydrogen Peroxide', 'Antiseptic'],
    categoryLabel: 'Topical Antimicrobial & Oxidizing Agent · BP111P Exp 4(e)',
    dataSourceOrigin: 'PharmaLab BP106T/BP111P Permanganometry Curriculum',
    overview:
      'Clear oxidizing antimicrobial solution (e.g., 20-volume strength) classified under inorganic antimicrobials in BP106T and assayed by self-indicating permanganometry in BP111P Exp 4(e).',
    chemicalInfo: {
      chemicalName: 'Hydrogen peroxide',
      formula: 'H₂O₂',
      physicalNotes: 'Decomposes on exposure to light, heat, or metallic catalysts into water and oxygen; stabilized with small amounts of acid/organic stabilizers.'
    },
    assayInfo: {
      methodName: 'Redox Titration — Permanganometry (BP111P Exp 4e Educational Curriculum)',
      titrantOrTechnique: '0.1N Potassium Permanganate (KMnO₄) in dilute H₂SO₄ medium',
      indicator: 'Self-Indicator (Colorless → Faint Persistent Pink for 30 s)',
      formulaNote: 'Practical equivalence basis (educational example): 1 mL of 0.1N KMnO₄ ≡ 0.001701 g H₂O₂.',
      educationalExplanation:
        'Educational curriculum principle: MnO₄⁻ oxidizes H₂O₂ to O₂ gas and is itself reduced to colorless Mn²⁺ in sulphuric acid; the first excess drop of permanganate imparts a persistent pale pink endpoint.'
    },
    relevantPharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur'],
    relatedTestIds: ['test_redox_cerimetry_permanganometry'],
    textbookKeywords: ['Hydrogen peroxide', 'Permanganometry', 'KMnO4', 'Antimicrobials', 'Block'],
    academicLinks: [
      {
        subjectCode: 'BP106T / BP111P',
        subjectTitle: 'Pharmaceutical Inorganic Chemistry',
        topicTitle: 'Inorganic Antimicrobials & Permanganometry (Exp 4e)',
        syllabusId: OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
        topicId: 'bp106t_unit3'
      }
    ],
    labConnections: [
      {
        label: 'BP111P Permanganometry Lab',
        kind: 'module',
        moduleId: 'inorganic',
        tab: 'titration',
        description: 'Run the H₂O₂ vs 0.1N KMnO₄ self-indicator assay simulation.'
      }
    ]
  },
  {
    id: 'sub_ammonium_chloride',
    name: 'Ammonium Chloride (NH₄Cl)',
    kind: 'drug_substance',
    synonyms: ['NH4Cl', 'Sal Ammoniac', 'Acidifying Expectorant'],
    categoryLabel: 'Expectorant & Systemic Acidifier · BP111P Exp 4(a) Formal Titration',
    dataSourceOrigin: 'PharmaLab BP106T/BP111P Formal Titration Curriculum',
    overview:
      'Inorganic expectorant and urinary acidifier assayed in BP111P Exp 4(a) using neutralized formaldehyde (formol titration) so weak ammonium ion can be titrated sharply with standard alkali.',
    chemicalInfo: {
      chemicalName: 'Ammonium chloride',
      formula: 'NH₄Cl',
      physicalNotes: 'White crystalline, odorless, cooling saline powder; freely soluble in water.'
    },
    assayInfo: {
      methodName: 'Acid-Base Formal Titration (BP111P Exp 4a Educational Curriculum)',
      titrantOrTechnique: '0.1N Sodium Hydroxide (NaOH) after reaction with neutralized formaldehyde',
      indicator: 'Phenolphthalein (Colorless → Permanent Pink)',
      formulaNote: 'Practical equivalence basis (educational example): 1 mL of 0.1N NaOH ≡ 0.005349 g NH₄Cl.',
      educationalExplanation:
        'Educational curriculum principle: Direct titration of NH₄⁺ is poor due to weak acidity and volatile NH₃; formaldehyde converts NH₄⁺ into hexamethylenetetramine (hexamine) and releases stoichiometric HCl for direct titration with NaOH.'
    },
    relevantPharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur'],
    relatedTestIds: ['test_volumetric_acid_base'],
    textbookKeywords: ['Ammonium chloride', 'Formal titration', 'Expectorant', 'Hexamine'],
    academicLinks: [
      {
        subjectCode: 'BP106T / BP111P',
        subjectTitle: 'Pharmaceutical Inorganic Chemistry',
        topicTitle: 'Expectorants & Formal Titration Assay (Exp 4a)',
        syllabusId: OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
        topicId: 'bp106t_unit3'
      }
    ],
    labConnections: [
      {
        label: 'BP111P Formal Titration Simulator',
        kind: 'module',
        moduleId: 'inorganic',
        tab: 'titration',
        description: 'Open Exp 4(a) NH₄Cl formal titration simulation in Inorganic Lab.'
      }
    ]
  },
  {
    id: 'sub_sodium_benzoate',
    name: 'Sodium Benzoate',
    kind: 'drug_substance',
    synonyms: ['Benzoate of Soda', 'C6H5COONa', 'Antimicrobial Preservative'],
    categoryLabel: 'Preservative & API · BP111P Exp 4(f) Non-Aqueous Titration',
    dataSourceOrigin: 'PharmaLab BP106T/BP111P Non-Aqueous Titration Curriculum',
    overview:
      'Widely used liquid pharmaceutical preservative and urea-cycle disorder therapy drug, assayed in BP111P Exp 4(f) via non-aqueous titration in glacial acetic acid.',
    chemicalInfo: {
      chemicalName: 'Sodium benzoate',
      formula: 'C₇H₅NaO₂',
      physicalNotes: 'Weakly basic carboxylate salt whose conjugate base sharpens dramatically in anhydrous glacial acetic acid.'
    },
    assayInfo: {
      methodName: 'Non-Aqueous Acidimetry (BP111P Exp 4f Educational Curriculum)',
      titrantOrTechnique: '0.1N Perchloric Acid (HClO₄) in glacial acetic acid',
      indicator: 'Crystal Violet (Violet → Emerald Green)',
      formulaNote: 'Practical equivalence basis (educational example): 1 mL of 0.1N HClO₄ ≡ 0.01441 g C₇H₅NaO₂.',
      educationalExplanation:
        'Educational curriculum principle: Replacing water with glacial acetic acid eliminates leveling competition from H₂O and enhances the apparent basicity of benzoate ion for a sharp non-aqueous endpoint.'
    },
    relevantPharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur'],
    relatedTestIds: ['test_non_aqueous_titration'],
    textbookKeywords: ['Sodium benzoate', 'Non-aqueous titration', 'Perchloric acid', 'Crystal violet', 'Preservative'],
    academicLinks: [
      {
        subjectCode: 'BP106T / BP111P',
        subjectTitle: 'Pharmaceutical Inorganic Chemistry',
        topicTitle: 'Non-Aqueous Titration Assay (Exp 4f)',
        syllabusId: OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
        topicId: 'bp106t_unit4'
      }
    ],
    labConnections: [
      {
        label: 'BP111P Non-Aqueous Titration Lab',
        kind: 'module',
        moduleId: 'inorganic',
        tab: 'titration',
        description: 'Simulate Exp 4(f) Sodium Benzoate titration with 0.1N HClO₄ and Crystal Violet.'
      }
    ]
  },
  {
    id: 'sub_sodium_chloride',
    name: 'Sodium Chloride (NaCl)',
    kind: 'drug_substance',
    synonyms: ['NaCl', 'Normal Saline', '0.9% w/v Saline', 'Isotonicity Standard'],
    categoryLabel: 'Electrolyte Replenisher & Isotonicity Adjuster · BP107P & BP111P Exp 4(g)',
    dataSourceOrigin: 'PharmaLab BP107P Isotonicity & BP111P Modified Volhard Curriculum',
    overview:
      'Essential extracellular electrolyte and reference isotonicity adjuster (0.9% w/v NaCl is iso-osmotic with blood plasma/lacrimal fluid at ΔTf = -0.52°C). Assayed in BP111P Exp 4(g) using Modified Volhard’s argentometric titration.',
    chemicalInfo: {
      chemicalName: 'Sodium chloride',
      formula: 'NaCl',
      physicalNotes: 'Cubic colorless/white crystals; aqueous 0.9% w/v solution is used as normal saline and isotonicity reference.'
    },
    assayInfo: {
      methodName: "Modified Volhard's Precipitation Titration (BP111P Exp 4g Educational Curriculum)",
      titrantOrTechnique: 'Excess 0.1N AgNO₃ back-titrated with 0.1N Ammonium Thiocyanate + nitrobenzene',
      indicator: 'Ferric Ammonium Sulphate (Colorless → Reddish-Brown [Fe(SCN)]²⁺)',
      formulaNote: 'Practical equivalence basis (educational example): 1 mL of 0.1N AgNO₃ ≡ 0.005844 g NaCl.',
      educationalExplanation:
        'Educational curriculum principle: Nitrobenzene coats precipitated AgCl particles to prevent displacement of Cl⁻ by SCN⁻ because AgSCN is less soluble than AgCl.'
    },
    pharmaceuticalApplications: [
      'Intravenous normal saline, ophthalmic/nasal tonicity adjustment (E-value and freezing-point depression calculations in BP107P), and ORS electrolyte formulations.'
    ],
    relevantPharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur', 'pc_who_int'],
    relatedTestIds: ['test_iodometry_volhard'],
    textbookKeywords: ['Sodium chloride', 'Volhard', 'Isotonicity', 'Freezing point depression', 'E-value'],
    academicLinks: [
      {
        subjectCode: 'BP102T / BP107P',
        subjectTitle: 'Pharmaceutics I',
        topicTitle: 'Isotonic Solutions & E-Value Calculations',
        syllabusId: OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
        topicId: 'bp102t_unit2'
      },
      {
        subjectCode: 'BP106T / BP111P',
        subjectTitle: 'Pharmaceutical Inorganic Chemistry',
        topicTitle: 'Electrolytes & Volhard Precipitation Assay (Exp 4g)',
        syllabusId: OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
        topicId: 'bp106t_unit2'
      }
    ],
    labConnections: [
      {
        label: 'BP107P Isotonicity Calculator',
        kind: 'module',
        moduleId: 'general_pharmacy',
        tab: 'isotonicity',
        description: 'Compute NaCl required using freezing-point depression (ΔTf = -0.52°C) or E-value.'
      },
      {
        label: "BP111P Modified Volhard's Assay",
        kind: 'module',
        moduleId: 'inorganic',
        tab: 'titration',
        description: 'Simulate Exp 4(g) argentometric back-titration with ferric alum indicator.'
      }
    ]
  },
  {
    id: 'sub_potassium_iodide',
    name: 'Potassium Iodide (KI)',
    kind: 'drug_substance',
    synonyms: ['KI', 'Iodide', "Lugol's Solubilizer"],
    categoryLabel: 'Thyroid / Solubilizer / Expectorant · BP111P Exp 3(c) & BP107P Lugol’s',
    dataSourceOrigin: 'PharmaLab BP111P Purity Test (Iodate/Cyanide) & BP107P Lugol’s Formulation',
    overview:
      'Inorganic iodide salt used to solubilize elemental iodine via triiodide complex formation (I₂ + I⁻ ⇌ I₃⁻) in Lugol’s solution (BP107P), and tested for iodate/cyanide impurities in BP111P Exp 3(c).',
    chemicalInfo: {
      chemicalName: 'Potassium iodide',
      formula: 'KI',
      physicalNotes: 'White cubical crystals or granular powder; light-sensitive in moist air.'
    },
    impurities: [
      'Iodate contamination: acidified KI + starch yields blue color if IO₃⁻ oxidizes I⁻ to free I₂ (titrated with dilute Na₂S₂O₃ in BP111P Exp 3c educational purity model).'
    ],
    pharmaceuticalApplications: [
      'Solubilizing agent for Aqueous Iodine Solution (Lugol’s Solution BPC), thyroid blocking agent, and saline expectorant.'
    ],
    relevantPharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur', 'pc_who_int'],
    relatedTestIds: ['test_iodometry_volhard'],
    textbookKeywords: ['Potassium iodide', 'Iodate', 'Lugol', 'Triiodide', 'Inorganic'],
    academicLinks: [
      {
        subjectCode: 'BP106T / BP111P',
        subjectTitle: 'Pharmaceutical Inorganic Chemistry',
        topicTitle: 'Tests for Purity — Iodate Contamination in KI (Exp 3c)',
        syllabusId: OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
        topicId: 'bp106t_unit1'
      }
    ],
    labConnections: [
      {
        label: 'BP111P KI Purity Simulator (Exp 3c)',
        kind: 'module',
        moduleId: 'inorganic',
        tab: 'purity',
        description: 'Run the educational iodate/cyanide contamination check in Inorganic Purity Lab.'
      },
      {
        label: "BP107P Lugol's Solution Compounding",
        kind: 'module',
        moduleId: 'general_pharmacy',
        tab: 'experiments',
        description: 'Explore triiodide complexation in Aqueous Iodine Solution preparation.'
      }
    ]
  },
  {
    id: 'sub_aluminium_hydroxide',
    name: 'Aluminium Hydroxide Gel & Magnesium Sulphate',
    kind: 'drug_substance',
    synonyms: ['Al(OH)3', 'Alum', 'Potash Alum', 'MgSO4', 'Epsom Salt', 'Antacid'],
    categoryLabel: 'GI Agents, Antacids & Saline Purgatives · BP111P Exp 2 & Exp 3(b)',
    dataSourceOrigin: 'PharmaLab BP106T/BP111P GI Agents & Acid Neutralizing Capacity Lab',
    overview:
      'Core inorganic gastrointestinal agents in BP106T/BP111P: non-systemic antacid Aluminium Hydroxide Gel (evaluated via Acid Neutralizing Capacity in Exp 3b), osmotic cathartic Magnesium Sulphate (Exp 2d), and topical astringent Potash Alum (Exp 2b).',
    qualityControl: [
      'Acid Neutralizing Capacity (ANC): back-titration of excess 0.5N HCl after reaction with antacid gel (mEq HCl consumed per gram — practiced in BP111P Exp 3b).',
      'Wash precipitated Al(OH)₃ free of sulphate ions (checked with BaCl₂) during Exp 2(a) preparation.'
    ],
    pharmaceuticalApplications: [
      'Non-systemic gastric antacids (Al(OH)₃), osmotic purgative (MgSO₄·7H₂O), and topical astringent/styptic (Potash Alum).'
    ],
    relevantPharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_who_int'],
    relatedTestIds: ['test_volumetric_acid_base'],
    textbookKeywords: ['Aluminium hydroxide', 'Antacid', 'Acid neutralizing capacity', 'Magnesium sulphate', 'Alum'],
    academicLinks: [
      {
        subjectCode: 'BP106T / BP111P',
        subjectTitle: 'Pharmaceutical Inorganic Chemistry',
        topicTitle: 'Gastrointestinal Agents — Antacids & Cathartics',
        syllabusId: OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
        topicId: 'bp106t_unit3'
      }
    ],
    labConnections: [
      {
        label: 'BP111P Antacid ANC Calculator',
        kind: 'module',
        moduleId: 'inorganic',
        tab: 'purity',
        description: 'Calculate Acid Neutralizing Capacity (mEq/g) in Exp 3(b).'
      },
      {
        label: 'BP111P Inorganic Preparations',
        kind: 'module',
        moduleId: 'inorganic',
        tab: 'preparations',
        description: 'Inspect Al(OH)₃, Alum, and MgSO₄ synthesis reactions & yield.'
      }
    ]
  },
  {
    id: 'sub_diuretics_class',
    name: 'Diuretic Agents (Furosemide, Hydrochlorothiazide, Acetazolamide, Spironolactone)',
    kind: 'drug_substance',
    synonyms: ['Furosemide', 'Hydrochlorothiazide', 'Acetazolamide', 'Spironolactone', 'Amiloride', 'Loop diuretic'],
    categoryLabel: 'Renal Pharmacology & Nephron Targets · Visual Atlas & Study Mode',
    dataSourceOrigin: 'PharmaLab Visual Atlas (builtin_diuretic_pharmacology) & Academic Engine Nephron Topic',
    overview:
      'Major diuretic classes mapped along distinct nephron transport segments: carbonic anhydrase inhibitors (Acetazolamide, PCT), loop diuretics (Furosemide, NKCC2 in thick ascending limb), thiazides (Hydrochlorothiazide, NCC in DCT), and K⁺-sparing diuretics (Spironolactone, Amiloride in collecting duct).',
    pharmaceuticalApplications: [
      'Edema, hypertension, heart failure, and glaucoma management (oral tablets and parenteral loop diuretic solutions).'
    ],
    relevantPharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur', 'pc_who_int', 'pc_martindale'],
    textbookKeywords: ['Furosemide', 'Hydrochlorothiazide', 'Spironolactone', 'Diuretics', 'Katzung', 'Rang', 'Tripathi'],
    academicLinks: [
      {
        subjectCode: 'BP101T / Engine',
        subjectTitle: 'Human Anatomy, Physiology & Renal Clearance',
        topicTitle: 'Urinary System & Nephron — Ultrafiltration & Diuretic Targets',
        syllabusId: OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
        topicId: 'bp101t_engine_renal'
      }
    ],
    labConnections: [
      {
        label: 'Diuretic Nephron Target Plate',
        kind: 'visual',
        visualId: 'builtin_diuretic_pharmacology',
        description: 'Inspect PCT, NKCC2, NCC, and ENaC/MR diuretic sites on the Visual Atlas plate.'
      }
    ]
  },
  {
    id: 'sub_bentonite',
    name: 'Bentonite (Colloidal Hydrated Aluminium Silicate)',
    kind: 'excipient',
    synonyms: ['Colloidal clay', 'Suspending agent', 'Swelling power excipient'],
    categoryLabel: 'Pharmaceutical Suspending Excipient · BP111P Exp 3(a) Swelling Power',
    dataSourceOrigin: 'PharmaLab BP106T/BP111P Swelling Power Purity Test',
    overview:
      'Natural colloidal hydrated aluminium silicate clay used as a thixotropic suspending agent and adsorbent in liquid dispersions, evaluated in BP111P Exp 3(a) by its hydration swelling volume.',
    chemicalInfo: {
      chemicalName: 'Hydrated aluminium silicate (montmorillonite clay)',
      physicalNotes: 'Imbibes water between silicate sheets to form viscous thixotropic gels.'
    },
    qualityControl: [
      'Swelling Power Test (BP111P Exp 3a educational model): hydrated gel sediment volume per gram after dispersion in water (verify exact acceptance volume directly in IP/BP/USP–NF).'
    ],
    pharmaceuticalApplications: [
      'Suspending agent (e.g., calamine/bismuth suspensions), emulsion stabilizer, and topical absorbent base.'
    ],
    relevantPharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur'],
    relatedTestIds: ['test_crude_drug_physicochemical'],
    textbookKeywords: ['Bentonite', 'Excipients', 'Swelling power', 'Suspending agent', 'Rowe', 'Sheskey'],
    academicLinks: [
      {
        subjectCode: 'BP106T / BP111P',
        subjectTitle: 'Pharmaceutical Inorganic Chemistry',
        topicTitle: 'Tests for Purity — Swelling Power of Bentonite (Exp 3a)',
        syllabusId: OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
        topicId: 'bp106t_unit1'
      }
    ],
    labConnections: [
      {
        label: 'BP111P Swelling Power Calculator',
        kind: 'module',
        moduleId: 'inorganic',
        tab: 'purity',
        description: 'Compute bentonite swelling volume ratio in Inorganic Purity Lab.'
      }
    ]
  },
  {
    id: 'sub_ethanol_water',
    name: 'Ethanol (Alcohol) & Purified Water',
    kind: 'excipient',
    synonyms: ['Alcohol', 'Ethyl alcohol', 'Proof spirit', 'Purified water', 'WFI', 'Solvent vehicle'],
    categoryLabel: 'Pharmaceutical Solvents & Vehicles · BP102T/BP107P Alcohol Dilution & Proof',
    dataSourceOrigin: 'PharmaLab BP102T/BP107P Alcohol Dilution & Proof Spirit Calculators',
    overview:
      'Primary pharmaceutical solvents and co-solvents. Ethanol strength in compounding is verified using % v/v alligation and UK Proof Spirit conversions (57.1% v/v ethanol = 100° Proof). Water grades (Purified Water, Water for Injections) carry strict microbial, conductivity, and endotoxin controls.',
    chemicalInfo: {
      chemicalName: 'Ethanol (C₂H₅OH) / Purified Water (H₂O)',
      formula: 'C₂H₅OH / H₂O',
      physicalNotes: 'Hydroalcoholic co-solvent blends improve solubility of poorly water-soluble APIs; volume contraction occurs on mixing ethanol and water.'
    },
    qualityControl: [
      'Alligation alternate & proof spirit conversion practiced in BP107P (O.P. over-proof vs U.P. under-proof).',
      'Conductivity, Total Organic Carbon (TOC), and Bacterial Endotoxins Test (LAL) for Water for Injections (consult official compendia for exact limits).'
    ],
    pharmaceuticalApplications: [
      'Elixirs, tinctures, syrups, parenteral vehicles (WFI), and disinfectant hydroalcoholic preparations.'
    ],
    relevantPharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur', 'pc_who_int', 'pc_jp'],
    textbookKeywords: ['Alcohol', 'Ethanol', 'Proof spirit', 'Alligation', 'Purified water', 'WFI', 'Aulton'],
    academicLinks: [
      {
        subjectCode: 'BP102T / BP107P',
        subjectTitle: 'Pharmaceutics I',
        topicTitle: 'Pharmaceutical Calculations: Alligation & Proof Spirit',
        syllabusId: OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
        topicId: 'bp102t_unit2'
      }
    ],
    labConnections: [
      {
        label: 'BP107P Alcohol Dilution Simulator',
        kind: 'module',
        moduleId: 'general_pharmacy',
        tab: 'alcohol',
        description: 'Calculate volume of stronger alcohol and purified water needed for target % v/v.'
      },
      {
        label: 'BP107P Proof Spirit Converter',
        kind: 'module',
        moduleId: 'general_pharmacy',
        tab: 'posology_proof',
        description: 'Convert ethanol % v/v to degrees Over Proof / Under Proof.'
      }
    ]
  },
  {
    id: 'sub_suppository_excipients',
    name: 'Suppository Bases (Cocoa Butter / Theobroma Oil & Glycerogelatin) & Talc/Zinc Oxide',
    kind: 'excipient',
    synonyms: ['Theobroma oil', 'Cocoa butter', 'Glycerogelatin', 'Talc', 'Zinc oxide', 'Displacement value', 'Dusting powder'],
    categoryLabel: 'Semisolid, Suppository & Powder Excipients · BP107P Formulations',
    dataSourceOrigin: 'PharmaLab BP107P Compounding Formulations & Suppository DV Calculator',
    overview:
      'Core formulation excipients taught in BP102T/BP107P: oleaginous Cocoa Butter (polymorphic α/β/γ melting forms requiring gentle fusion), water-soluble Glycerogelatin base, and dusting powder carriers (Purified Talc, Starch, Zinc Oxide).',
    qualityControl: [
      'Displacement Value (DV) correction: accounts for density differences between medicament and suppository base so mould weight remains calibrated.',
      'Talc sterilization / microbial limit awareness for surgical or open-wound dusting powders.'
    ],
    pharmaceuticalApplications: [
      'Rectal/vaginal suppositories and topical dusting powders (BP107P).'
    ],
    relevantPharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur'],
    textbookKeywords: ['Cocoa butter', 'Theobroma', 'Glycerogelatin', 'Displacement value', 'Talc', 'Excipients'],
    academicLinks: [
      {
        subjectCode: 'BP102T / BP107P',
        subjectTitle: 'Pharmaceutics I',
        topicTitle: 'Unit V: Suppositories & Displacement Value Calculations',
        syllabusId: OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
        topicId: 'bp102t_unit5'
      }
    ],
    labConnections: [
      {
        label: 'BP107P Suppository DV Calculator',
        kind: 'module',
        moduleId: 'general_pharmacy',
        tab: 'suppository',
        description: 'Compute exact base and API mass using medicament displacement value.'
      },
      {
        label: 'BP107P Compounding Lab',
        kind: 'module',
        moduleId: 'general_pharmacy',
        tab: 'experiments',
        description: 'Inspect Glycerogelatin, Cocoa Butter, and Dusting Powder compounding workflows.'
      }
    ]
  },
  {
    id: 'sub_tablets_dosage',
    name: 'Compressed, Coated & Effervescent Tablets (Oral Solid Dosage Forms)',
    kind: 'dosage_form',
    synonyms: ['Tablets', 'Enteric coated tablets', 'Effervescent granules', 'Dissolution', 'Disintegration'],
    categoryLabel: 'Dosage Form Standard · BP102T Unit III & Dissolution Simulator',
    dataSourceOrigin: 'PharmaLab BP102T Unit III & Interactive Dissolution Experiment',
    overview:
      'Most prevalent unit solid dosage form produced via wet granulation, dry granulation, or direct compression. Pharmacopoeial dosage-form chapters evaluate weight variation, content uniformity, disintegration, friability, and dissolution drug release.',
    analyticalMethods: [
      'Paddle (Apparatus II) & Basket (Apparatus I) Dissolution governed by Noyes–Whitney equation: dC/dt = D·A·(Cs - C)/(V·h).',
      'Disintegration test (simulated gastric/intestinal fluid immersion basket cycles) and friability drum testing.'
    ],
    qualityControl: [
      'Uniformity of mass/weight, uniformity of dosage units, hardness, friability, disintegration, and dissolution Q-value (check official IP/BP/USP–NF/Ph. Eur. chapters for exact numerical tolerances).'
    ],
    pharmaceuticalApplications: [
      'Immediate-release, film/sugar-coated, enteric-coated (CAP/Eudragit), chewable, buccal/sublingual, and effervescent solid dosage forms.'
    ],
    relevantPharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur', 'pc_who_int', 'pc_jp', 'pc_martindale'],
    relatedTestIds: ['test_dissolution'],
    textbookKeywords: ['Tablets', 'Granulation', 'Dissolution', 'Disintegration', 'Lachman', 'Aulton'],
    academicLinks: [
      {
        subjectCode: 'BP102T',
        subjectTitle: 'Pharmaceutics I',
        topicTitle: 'Unit III: Powders, Granules & Tablet Dosage Forms',
        syllabusId: OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
        topicId: 'bp102t_unit3'
      }
    ],
    labConnections: [
      {
        label: 'Noyes–Whitney Dissolution Simulator',
        kind: 'experiment',
        experimentId: 'exp_dissolution_noyes_whitney',
        description: 'Adjust paddle RPM, particle radius, solubility, and viscosity to plot % dissolved vs time.'
      },
      {
        label: 'BP102T Theory Unit III',
        kind: 'module',
        moduleId: 'general_pharmacy',
        tab: 'theory',
        description: 'Review tablet classifications, compression defects, and granulation principles.'
      }
    ]
  },
  {
    id: 'sub_ors_solutions',
    name: 'Oral Rehydration Salts (ORS), Simple Syrup & Official Compounded Liquids',
    kind: 'dosage_form',
    synonyms: ['ORS', 'Simple Syrup', 'Strong Ammonium Acetate', 'Lysol', 'Cresol with Soap', "Lugol's Solution"],
    categoryLabel: 'Official Monophasic & Powder Preparations · BP107P Curriculum',
    dataSourceOrigin: 'PharmaLab BP107P Practical Compounding Formulations',
    overview:
      'Compendial compounding preparations taught in BP107P: WHO Oral Rehydration Salts (glucose-assisted Na⁺/water co-transport), Simple Syrup IP (66.7% w/w self-preserving sucrose vehicle), Strong Solution of Ammonium Acetate IP, Cresol with Soap (Lysol) IP, and Lugol’s Aqueous Iodine Solution BPC.',
    qualityControl: [
      'Labeling clarity ("Shake well", external vs internal route, freshly boiled & cooled water reconstitution for ORS), specific gravity of syrup, and pH neutrality check of ammonium acetate solution.'
    ],
    pharmaceuticalApplications: [
      'Oral rehydration therapy (ORS), flavored liquid vehicle (Simple Syrup), diaphoretic/alkalinizing liquid, and phenolic surface disinfectant (Lysol).'
    ],
    relevantPharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_who_int', 'pc_martindale'],
    textbookKeywords: ['ORS', 'Oral Rehydration Salts', 'Simple syrup', 'Lysol', 'Ammonium acetate', 'Compounding'],
    academicLinks: [
      {
        subjectCode: 'BP102T / BP107P',
        subjectTitle: 'Pharmaceutics I',
        topicTitle: 'Monophasic Liquids, Syrups & Powders (Exp 2–15)',
        syllabusId: OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
        topicId: 'bp102t_unit4'
      }
    ],
    labConnections: [
      {
        label: 'BP107P Compounding Simulator',
        kind: 'module',
        moduleId: 'general_pharmacy',
        tab: 'experiments',
        description: 'Inspect ingredients, working formulas, and compounding steps for ORS, Syrup, Lysol & Lugol’s.'
      }
    ]
  },
  {
    id: 'sub_parenterals_sterile',
    name: 'Parenteral & Sterile Dosage Forms (Autoclave F0 & Endotoxin Control)',
    kind: 'dosage_form',
    synonyms: ['Parenterals', 'Injections', 'Sterility', 'Pyrogen', 'Endotoxin', 'LAL', 'Autoclave', 'F0'],
    categoryLabel: 'Sterile Dosage Forms & Microbiology QC · Simulator & Bacterial Plate',
    dataSourceOrigin: 'PharmaLab Microbial Sterilization Simulator & Microbiology Atlas',
    overview:
      'Injectable and ophthalmic sterile products requiring freedom from viable microorganisms (Sterility Test), bacterial endotoxins/Lipid A pyrogens (LAL test), and visible/subvisible particulates, typically validated via thermal F0 lethality or aseptic filtration.',
    analyticalMethods: [
      'Steam sterilization F0 thermal lethality modeling (D-value, z-value, Sterility Assurance Level).',
      'Membrane filtration or direct inoculation sterility testing principles and Gram-negative LPS endotoxin awareness.'
    ],
    impurities: [
      'Bacterial endotoxins (Lipopolysaccharide / Lipid A outer membrane component of Gram-negative bacteria) and subvisible particulate matter.'
    ],
    relevantPharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur', 'pc_who_int', 'pc_jp'],
    relatedTestIds: ['test_sterility_endotoxin'],
    textbookKeywords: ['Parenterals', 'Sterility', 'Autoclave', 'Endotoxin', 'LAL', 'Pyrogen', 'Prescott', 'Pelczar'],
    academicLinks: [
      {
        subjectCode: 'BP102T / Microbiology',
        subjectTitle: 'Pharmaceutical Technology & Microbiology',
        topicTitle: 'Sterilization Kinetics, Parenterals & Endotoxin Control',
        syllabusId: OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
        topicId: 'bp102t_unit1'
      }
    ],
    labConnections: [
      {
        label: 'Autoclave & Microbial Sterilization Simulator',
        kind: 'experiment',
        experimentId: 'exp_microbial_growth_sterilization',
        description: 'Simulate thermal death curves, D-values, and autoclave F0 sterilization cycles.'
      },
      {
        label: 'Gram-Negative LPS Endotoxin Plate',
        kind: 'visual',
        visualId: 'builtin_bacterial_cell_wall',
        description: 'Inspect Lipid A outer membrane endotoxin vs peptidoglycan architecture.'
      }
    ]
  },
  {
    id: 'sub_inorganic_impurities',
    name: 'Inorganic Impurities & Limit Tests (Chloride, Sulphate, Iron, Lead, Arsenic)',
    kind: 'standard_concept',
    synonyms: ['Limit test', 'Chloride', 'Sulphate', 'Sulfate', 'Iron', 'Lead', 'Arsenic', 'Gutzeit', 'Nessler cylinder', 'Heavy metals'],
    categoryLabel: 'Pharmacopoeial Impurity Control · BP106T/BP111P Exp 1(a–e)',
    dataSourceOrigin: 'PharmaLab BP106T/BP111P Limit Tests & Visual Apparatus Atlas',
    overview:
      'Semi-quantitative pharmacopoeial limit tests compare opalescence, turbidity, color intensity, or mercuric-chloride stain generated by a test sample against a concurrently prepared standard in matched Nessler cylinders or a Gutzeit apparatus.',
    analyticalMethods: [
      'Chloride (AgNO₃ + dil. HNO₃ → AgCl opalescence in Nessler cylinder).',
      'Sulphate (BaSO₄ reagent + dil. HCl → BaSO₄ turbidity in Nessler cylinder).',
      'Iron (Citric acid + thioglycolic acid + NH₃ → purple ferrous thioglycolate).',
      'Lead (Dithizone in CHCl₃ at pH 9.5–10 with KCN/citrate masking → red dithizonate).',
      'Arsenic (Gutzeit apparatus: Zn + stannated HCl + KI + SnCl₂ → AsH₃ gas staining HgCl₂ paper; Pb-acetate cotton traps H₂S).'
    ],
    relevantPharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur', 'pc_who_int'],
    relatedTestIds: ['test_limit_chloride_sulphate', 'test_limit_arsenic_metals'],
    textbookKeywords: ['Limit test', 'Chloride', 'Sulphate', 'Arsenic', 'Gutzeit', 'Nessler', 'Impurities', 'Inorganic'],
    academicLinks: [
      {
        subjectCode: 'BP106T / BP111P',
        subjectTitle: 'Pharmaceutical Inorganic Chemistry',
        topicTitle: 'Unit I: Sources of Impurities & Limit Tests (Exp 1a–1e)',
        syllabusId: OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
        topicId: 'bp106t_unit1'
      }
    ],
    labConnections: [
      {
        label: 'BP111P Limit Tests Simulator (Exp 1a–1e)',
        kind: 'module',
        moduleId: 'inorganic',
        tab: 'limit_tests',
        description: 'Compare sample vs standard opalescence/stain across all 5 IP limit tests.'
      },
      {
        label: 'Gutzeit Arsenic Apparatus Plate',
        kind: 'visual',
        visualId: 'builtin_gutzeit_apparatus',
        description: 'Inspect the Gutzeit generator bottle, Pb-acetate cotton trap & HgCl₂ cap.'
      }
    ]
  },
  {
    id: 'sub_crude_drugs_botanical',
    name: 'Botanical Crude Drugs (Tulsi, Ashwagandha, Psyllium Husk, Turmeric, Amla, Arjuna)',
    kind: 'crude_drug',
    synonyms: ['Tulsi', 'Ashwagandha', 'Psyllium', 'Isabgol', 'Turmeric', 'Amla', 'Arjuna', 'Ash value', 'Stomatal index'],
    categoryLabel: 'Pharmacognosy & Herbal Drug Quality · BP105T / BP110P',
    dataSourceOrigin: 'PharmaLab BP105T/BP110P Pharmacognosy Curriculum',
    overview:
      'Medicinal plant drugs studied in BP105T/BP110P for organoleptic identity, diagnostic powder microscopy (stomata, trichomes, calcium oxalate crystals, starch, sclereids), quantitative leaf constants, and physicochemical quality control (ash values, extractive values, swelling index, moisture/LOD, foreign organic matter).',
    analyticalMethods: [
      'Leaf Constants: Stomatal Index = [S / (E + S)] × 100, Stomatal Number, Vein-Islet & Veinlet Termination Numbers via camera lucida / stage-ocular micrometry.',
      'Physicochemical QC: Total Ash, Acid-Insoluble Ash, Alcohol/Water-Soluble Extractive Values, Loss on Drying (LOD), Swelling Index (Psyllium/Isabgol mucilage), and Foaming Index.'
    ],
    relevantPharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_ph_eur', 'pc_jp', 'pc_chp'],
    relatedTestIds: ['test_crude_drug_physicochemical'],
    textbookKeywords: ['Crude drugs', 'Ash value', 'Stomatal index', 'Psyllium', 'Turmeric', 'Kokate', 'Trease', 'Evans'],
    academicLinks: [
      {
        subjectCode: 'BP105T / BP110P',
        subjectTitle: 'Pharmacognosy & Phytochemistry',
        topicTitle: 'Unit III: Quality Control, Ash Values & Powder Microscopy',
        syllabusId: OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
        topicId: 'bp105t_unit3'
      }
    ],
    labConnections: [
      {
        label: 'BP110P Physicochemical QC Lab',
        kind: 'module',
        moduleId: 'pharmacognosy',
        tab: 'physicochemical',
        description: 'Calculate Total Ash, Acid-Insoluble Ash, Extractive Value, Swelling Index & LOD.'
      },
      {
        label: 'BP110P Leaf Constants & Powder Microscopy',
        kind: 'module',
        moduleId: 'pharmacognosy',
        tab: 'powder',
        description: 'Study diagnostic microscopy for Tulsi, Ashwagandha, Amla, Arjuna, Turmeric & Psyllium.'
      }
    ]
  }
];

export const EDUCATIONAL_ANALYTICAL_TESTS: EducationalTestModule[] = [
  {
    id: 'test_volumetric_acid_base',
    testName: 'Volumetric Acid–Base & Formal Titration Assays',
    categoryId: 'assays_titrimetry',
    aliases: ['Acidimetry', 'Alkalimetry', 'Standardization', 'Formal titration', 'NH4Cl assay', 'KHP'],
    dataSourceOrigin: 'PharmaLab BP106T/BP111P & Acid–Base Titration Simulator',
    purpose:
      'Determines the quantitative purity/assay percentage of acidic or basic pharmaceutical substances and standardizes volumetric titrants (e.g., 0.1N NaOH against primary standard KHP) before analytical assays.',
    scientificPrinciple:
      'Stoichiometric neutralization (H⁺ + OH⁻ → H₂O) monitored near the equivalence point using an indicator whose pKa transition window matches the salt-hydrolysis pH at equivalence (e.g., phenolphthalein pH 8.2–10.0 vs methyl orange pH 3.1–4.4).',
    whatItMeasures:
      'Milliequivalents or molar quantity of acidic/basic functional analyte in a weighed sample.',
    chemicalOrPhysicalProcess:
      'Proton transfer neutralization; for ammonium chloride (formal titration), neutralized formaldehyde converts NH₄⁺ into hexamethylenetetramine, liberating stoichiometric HCl titrated by NaOH.',
    instrumentsAndApparatus: [
      'Calibrated 50 mL Class-A Burette & clamp',
      '250 mL Conical titration flask & white porcelain tile',
      '25 mL Volumetric pipette & analytical balance (±0.1 mg)',
      'Optional pH meter / glass electrode for potentiometric inflection curves'
    ],
    educationalProcedure: [
      'Standardize secondary titrant (e.g., 0.1N NaOH with dried KHP primary standard) to determine the exact molarity/normality factor.',
      'Accurately weigh or pipette the pharmaceutical sample into a conical flask with freshly boiled/cooled water (or neutralized formaldehyde for NH₄Cl).',
      'Add 2–3 drops of the indicator matched to the equivalence pH jump and titrate dropwise near the endpoint until a faint persistent color change lasts ~30 seconds.',
      'Record concordant burette readings and compute % purity using the equivalent weight factor.'
    ],
    calculationSection: {
      formulaLabel: 'Educational Volumetric Assay % Purity Formula',
      formulaExpression: '% Purity = (Burette Volume × Titrant Normality Factor × Equivalent Factor × 100) / Sample Weight (g)',
      variablesNote: 'Verify exact equivalent factor and blank correction per official pharmacopoeial monograph.',
      exampleSummary: 'Example (BP111P NH₄Cl): 22.4 mL × 1.00 × 0.005349 / 0.120 g × 100 = 99.85% (illustrative lab calculation only).'
    },
    resultInterpretation:
      'Compare calculated purity against the official monograph acceptance window (refer directly to IP/BP/USP–NF; educational lab runs illustrate stoichiometry and concordant precision ≤ 0.1 mL).',
    commonErrors: [
      'Using unneutralized formaldehyde (causes falsely high NaOH titration volume in NH₄Cl assay).',
      'Reading burette meniscus at an angle (parallax error) or forgetting to expel air bubbles from burette tip.',
      'Selecting methyl orange instead of phenolphthalein for weak acid vs strong base (early endpoint).'
    ],
    linkedPharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur', 'pc_who_int'],
    textbookKeywords: ['Titrimetry', 'Acidimetry', 'KHP', 'Phenolphthalein', 'Beckett', 'Vogel'],
    labConnections: [
      {
        label: 'Acid–Base Volumetric Simulator',
        kind: 'experiment',
        experimentId: 'exp_acid_base_titration',
        description: 'Plot live pH curves and compare phenolphthalein vs methyl orange equivalence jumps.'
      },
      {
        label: 'BP111P Burette & Standardization Lab',
        kind: 'module',
        moduleId: 'inorganic',
        tab: 'titration',
        description: 'Run drop-by-drop HCl/NH₄Cl titrations and KHP standardization checks.'
      },
      {
        label: 'Burette & Meniscus Visual Plate',
        kind: 'visual',
        visualId: 'builtin_chemistry_apparatus',
        description: 'Review Class-A burette meniscus reading technique.'
      }
    ],
    academicLinks: [
      {
        subjectCode: 'BP106T / BP111P',
        subjectTitle: 'Pharmaceutical Inorganic Chemistry',
        topicTitle: 'Acid–Base Titrations, Indicators & Assay of NH₄Cl',
        syllabusId: OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
        topicId: 'bp106t_unit4'
      }
    ]
  },
  {
    id: 'test_redox_cerimetry_permanganometry',
    testName: 'Redox Titrimetry: Cerimetry & Permanganometry',
    categoryId: 'assays_titrimetry',
    aliases: ['Cerimetry', 'Permanganometry', 'Ferrous sulphate assay', 'Hydrogen peroxide assay', 'KMnO4', 'Ceric ammonium sulphate'],
    dataSourceOrigin: 'PharmaLab BP106T/BP111P Exp 4(b) & 4(e)',
    purpose:
      'Quantifies oxidizable or reducible inorganic pharmaceuticals such as Ferrous Sulphate (Fe²⁺ → Fe³⁺) and Hydrogen Peroxide using strong oxidizing volumetric titrants.',
    scientificPrinciple:
      'Balanced electron-transfer redox reactions in strongly acidic (H₂SO₄) solution driven by standard reduction potential differences (Ce⁴⁺/Ce³⁺ +1.44 V in H₂SO₄; MnO₄⁻/Mn²⁺ +1.51 V).',
    whatItMeasures:
      'Reducing equivalents of active API (Fe²⁺ or H₂O₂) in solution.',
    chemicalOrPhysicalProcess:
      'Cerimetry uses Ce⁴⁺ with Ferroin redox indicator (orange-red → pale blue). Permanganometry uses KMnO₄ as a self-indicator until the first excess MnO₄⁻ produces faint pink.',
    instrumentsAndApparatus: [
      'Amber/clean 50 mL Glass Burette (avoid rubber pinchcocks with KMnO₄)',
      '250 mL Conical flask',
      'Dilute Sulphuric Acid dispenser & graduated cylinders'
    ],
    educationalProcedure: [
      'Standardize 0.1N KMnO₄ (warmed 60–70°C oxalic acid) or 0.1N Ceric Ammonium Sulphate (arsenious oxide/OsO₄ catalyst).',
      'Dissolve sample in freshly boiled, cooled water acidified with dilute sulphuric acid.',
      'Titrate slowly while swirling until Ferroin shifts red-orange → pale blue (cerimetry) or faint pink persists 30 s (permanganometry).'
    ],
    calculationSection: {
      formulaLabel: 'Educational Redox Assay Basis',
      formulaExpression: '% Purity = (mL Titrant × Factor × Equivalent Weight × 100) / Sample Weight (g)',
      variablesNote: 'BP111P practical equivalents: FeSO₄·7H₂O = 0.02780 g/mL (0.1N Ce⁴⁺); H₂O₂ = 0.001701 g/mL (0.1N KMnO₄).',
      exampleSummary: 'Acidic H₂SO₄ suppresses MnO₂ brown precipitate formation during permanganometry.'
    },
    resultInterpretation:
      'Persistent endpoint confirms complete oxidation of all reducing analyte; check official IP/BP/USP–NF monographs for official acceptance ranges.',
    commonErrors: [
      'Using HCl instead of H₂SO₄ in permanganometry (Cl⁻ gets oxidized to Cl₂ gas, inflating titrant volume).',
      'Reading dark purple KMnO₄ meniscus from the bottom instead of the upper meniscus edge.'
    ],
    linkedPharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur'],
    textbookKeywords: ['Cerimetry', 'Permanganometry', 'Ferroin', 'Ferrous sulphate', 'KMnO4'],
    labConnections: [
      {
        label: 'BP111P Cerimetry & Permanganometry Simulator',
        kind: 'module',
        moduleId: 'inorganic',
        tab: 'titration',
        description: 'Select Exp 4(b) Ferrous Sulphate or Exp 4(e) Hydrogen Peroxide in Inorganic Lab.'
      }
    ],
    academicLinks: [
      {
        subjectCode: 'BP106T / BP111P',
        subjectTitle: 'Pharmaceutical Inorganic Chemistry',
        topicTitle: 'Redox Titrations: Cerimetry & Permanganometry (Exp 4b & 4e)',
        syllabusId: OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
        topicId: 'bp106t_unit4'
      }
    ]
  },
  {
    id: 'test_iodometry_volhard',
    testName: "Iodometry (CuSO₄) & Modified Volhard's Precipitation Assay (NaCl)",
    categoryId: 'assays_titrimetry',
    aliases: ['Iodometry', 'Volhard', 'Sodium thiosulphate', 'Silver nitrate', 'CuSO4', 'NaCl'],
    dataSourceOrigin: 'PharmaLab BP106T/BP111P Exp 4(c) & Exp 4(g)',
    purpose:
      'Measures oxidizing salts indirectly via liberated iodine (Iodometry) or halide ions via back-titration of excess silver nitrate with thiocyanate (Modified Volhard).',
    scientificPrinciple:
      'In iodometry, Cu²⁺ liberates stoichiometric I₂ from excess KI which is titrated with Na₂S₂O₃ using starch. In Modified Volhard, excess AgNO₃ precipitates Cl⁻ as AgCl, and remaining Ag⁺ is titrated with NH₄SCN using Fe³⁺ indicator.',
    whatItMeasures:
      'Liberated iodine equivalents (Cu²⁺) or precipitated silver halide equivalents (Cl⁻).',
    chemicalOrPhysicalProcess:
      '2Cu²⁺ + 4I⁻ → 2CuI↓ + I₂; I₂ + 2S₂O₃²⁻ → 2I⁻ + S₄O₆²⁻. In Volhard, nitrobenzene coats AgCl before NH₄SCN back-titration.',
    instrumentsAndApparatus: [
      'Iodine flask (glass-stoppered conical flask to prevent I₂ volatilization)',
      '50 mL Burette & volumetric pipettes',
      'Fume-hood compatible setup when handling nitrobenzene'
    ],
    educationalProcedure: [
      'For iodometry: dissolve CuSO₄, add acetic acid & excess KI, allow dark evolution of I₂, titrate with 0.1N Na₂S₂O₃ until pale straw-yellow before adding starch + KSCN.',
      'For Modified Volhard: react NaCl with measured excess 0.1N AgNO₃ + HNO₃ + nitrobenzene, shake vigorously to coagulate AgCl, and back-titrate excess Ag⁺ with 0.1N NH₄SCN to reddish-brown [Fe(SCN)]²⁺.'
    ],
    calculationSection: {
      formulaLabel: 'Educational Back-Titration / Iodometry Formula',
      formulaExpression: 'NaCl % = ((mL AgNO₃ × N₁ - mL NH₄SCN × N₂) × 0.05844 × 100) / Sample Wt (g)',
      variablesNote: 'Add starch only near the end of iodometric titration (pale straw-yellow) to avoid irreversible starch-iodine trapping.',
      exampleSummary: 'KSCN displaces adsorbed iodine from CuI precipitate for a crisp milky-white endpoint.'
    },
    resultInterpretation:
      'Starch color discharge (iodometry) or persistent ferric thiocyanate tint (Volhard) signals stoichiometric completion; consult official monographs for legal tolerances.',
    commonErrors: [
      'Adding starch indicator at the start of iodometric titration when iodine concentration is high.',
      'Omitting nitrobenzene or filtration in chloride Volhard assay (AgSCN solubility < AgCl causes fading endpoint).'
    ],
    linkedPharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur'],
    textbookKeywords: ['Iodometry', 'Volhard', 'Starch', 'Thiosulphate', 'Nitrobenzene'],
    labConnections: [
      {
        label: 'BP111P Iodometry & Volhard Simulator',
        kind: 'module',
        moduleId: 'inorganic',
        tab: 'titration',
        description: 'Run Exp 4(c) CuSO₄ or Exp 4(g) NaCl assays in Inorganic Lab.'
      }
    ],
    academicLinks: [
      {
        subjectCode: 'BP106T / BP111P',
        subjectTitle: 'Pharmaceutical Inorganic Chemistry',
        topicTitle: 'Iodometric & Argentometric Precipitation Assays',
        syllabusId: OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
        topicId: 'bp106t_unit4'
      }
    ]
  },
  {
    id: 'test_complexometry_edta',
    testName: 'Complexometric Titration with Disodium EDTA',
    categoryId: 'assays_titrimetry',
    aliases: ['EDTA', 'Complexometry', 'Calcium gluconate assay', 'Mordant Black', 'Eriochrome Black T'],
    dataSourceOrigin: 'PharmaLab BP106T/BP111P Exp 4(d)',
    purpose:
      'Quantifies divalent pharmaceutical cations (Ca²⁺, Mg²⁺, Zn²⁺) via formation of stable 1:1 water-soluble metal-chelate complexes with disodium edetate.',
    scientificPrinciple:
      'Hexadentate EDTA⁴⁻ ligand binds metal ions with a higher stability constant (Kf) than the metallochromic indicator, releasing free blue indicator at the equivalence point in pH 10 ammonia buffer.',
    whatItMeasures:
      'Total chelatable divalent metal ion content (e.g., Ca-gluconate).',
    chemicalOrPhysicalProcess:
      'At pH 10, trace Mg²⁺ forms wine-red Mg-EBT complex; EDTA chelates all free Ca²⁺ first, then strips Mg²⁺ from EBT turning the solution pure sky blue.',
    instrumentsAndApparatus: [
      '50 mL Burette & 250 mL conical flask',
      'pH 10 Ammonia–Ammonium Chloride buffer',
      'Standardized 0.05M Disodium EDTA & CaCO₃ primary standard'
    ],
    educationalProcedure: [
      'Standardize 0.05M EDTA against dried CaCO₃ dissolved in minimal HCl and buffered at pH 10.',
      'Dissolve calcium gluconate sample in warm water, add ammonia buffer pH 10, trace MgSO₄/Mg-EDTA if specified, and Mordant Black II.',
      'Titrate slowly near endpoint from wine-red/purple to pure sky blue without any reddish tinge.'
    ],
    calculationSection: {
      formulaLabel: 'Educational Complexometric Assay Basis',
      formulaExpression: '% Purity = (mL 0.05M EDTA × Factor × 0.02242 × 100) / Sample Weight (g)',
      variablesNote: '1:1 stoichiometry holds independently of cation charge (+2, +3).',
      exampleSummary: 'Strict pH 10 buffering ensures EDTA predominantly exists as reactive Y⁴⁻/HY³⁻ species.'
    },
    resultInterpretation:
      'Sharp transition to pure blue confirms 1:1 chelation completion; refer to official IP/BP/USP–NF monographs for official acceptance percentages.',
    commonErrors: [
      'Failure to maintain pH 10 buffer (causes sluggish or faded endpoints).',
      'Trace heavy metal ions poisoning EBT indicator unless masked (e.g., with triethanolamine or KCN).'
    ],
    linkedPharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur'],
    textbookKeywords: ['EDTA', 'Complexometry', 'Calcium gluconate', 'Eriochrome Black T', 'Buffer'],
    labConnections: [
      {
        label: 'BP111P EDTA Complexometry Simulator',
        kind: 'module',
        moduleId: 'inorganic',
        tab: 'titration',
        description: 'Execute Exp 4(d) Calcium Gluconate titration in Inorganic Lab.'
      }
    ],
    academicLinks: [
      {
        subjectCode: 'BP106T / BP111P',
        subjectTitle: 'Pharmaceutical Inorganic Chemistry',
        topicTitle: 'Complexometric Assays & pH 10 Chelation (Exp 4d)',
        syllabusId: OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
        topicId: 'bp106t_unit4'
      }
    ]
  },
  {
    id: 'test_non_aqueous_titration',
    testName: 'Non-Aqueous Titration (Perchloric Acid in Glacial Acetic Acid)',
    categoryId: 'assays_titrimetry',
    aliases: ['Non-aqueous', 'HClO4', 'Glacial acetic acid', 'Crystal violet', 'Sodium benzoate assay'],
    dataSourceOrigin: 'PharmaLab BP106T/BP111P Exp 4(f)',
    purpose:
      'Assays very weakly basic drugs, amine salts, and alkali carboxylates (e.g., Sodium Benzoate) that cannot be sharply titrated in aqueous media.',
    scientificPrinciple:
      'Glacial acetic acid is an amphiprotic/protogenic solvent with low dielectric constant that suppresses water’s leveling effect, forming strongly acidic acetonium ions (CH₃COOH₂⁺) with HClO₄ to cleanly protonate weak bases.',
    whatItMeasures:
      'Weak base / carboxylate equivalents in strictly anhydrous organic medium.',
    chemicalOrPhysicalProcess:
      'RCOO⁻ + CH₃COOH₂⁺ → RCOOH + CH₃COOH; Crystal Violet shifts violet → blue → emerald green at equivalence.',
    instrumentsAndApparatus: [
      'Moisture-protected burette & anhydrous glassware',
      'Glacial acetic acid & acetic anhydride (to scavenge water)',
      '0.1N Perchloric Acid standardized against KHP in glacial acetic acid'
    ],
    educationalProcedure: [
      'Ensure all flasks and burettes are oven-dried and moisture-free (moisture > 0.1% blurs endpoints).',
      'Dissolve sample (e.g., sodium benzoate) in anhydrous glacial acetic acid with gentle warming if required, then cool.',
      'Add Crystal Violet indicator and titrate with 0.1N HClO₄ until emerald green endpoint.'
    ],
    calculationSection: {
      formulaLabel: 'Educational Non-Aqueous Assay Basis',
      formulaExpression: '% Purity = (mL 0.1N HClO₄ × Factor × Equivalent Weight × 100) / Sample Weight (g)',
      variablesNote: 'Perform blank titration on glacial acetic acid solvent when appropriate and correct temperature expansion (glacial acetic acid has high thermal expansion coefficient).',
      exampleSummary: 'Temperature coefficient correction is critical if titrant standardization and assay occur at different room temperatures.'
    },
    resultInterpretation:
      'Potentiometric or Crystal Violet emerald-green endpoint denotes neutralization; verify exact solvent/indicator tolerances in official pharmacopoeias.',
    commonErrors: [
      'Moisture ingress from humid air or wet glassware reducing endpoint sharpness.',
      'Ignoring volumetric thermal expansion of glacial acetic acid between standardization and assay.'
    ],
    linkedPharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur'],
    textbookKeywords: ['Non-aqueous', 'Perchloric acid', 'Glacial acetic acid', 'Sodium benzoate'],
    labConnections: [
      {
        label: 'BP111P Non-Aqueous Titration Simulator',
        kind: 'module',
        moduleId: 'inorganic',
        tab: 'titration',
        description: 'Run Exp 4(f) Sodium Benzoate non-aqueous titration in Inorganic Lab.'
      }
    ],
    academicLinks: [
      {
        subjectCode: 'BP106T / BP111P',
        subjectTitle: 'Pharmaceutical Inorganic Chemistry',
        topicTitle: 'Non-Aqueous Titrations (Exp 4f)',
        syllabusId: OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
        topicId: 'bp106t_unit4'
      }
    ]
  },
  {
    id: 'test_limit_chloride_sulphate',
    testName: 'Pharmacopoeial Limit Tests for Chloride & Sulphate (Nessler Cylinders)',
    categoryId: 'limit_tests_impurities',
    aliases: ['Chloride limit test', 'Sulphate limit test', 'Nessler cylinder', 'AgCl opalescence', 'BaSO4 turbidity'],
    dataSourceOrigin: 'PharmaLab BP106T/BP111P Exp 1(a–b) & Apparatus Atlas',
    purpose:
      'Controls trace chloride (Cl⁻) and sulphate (SO₄²⁻) impurities introduced from raw materials, water, or mineral acid synthesis steps.',
    scientificPrinciple:
      'Side-by-side visual comparison in matched 50 mL Nessler cylinders: test solution turbidity/opalescence must not exceed a concurrently prepared standard reference solution viewed laterally and vertically against a dark background.',
    whatItMeasures:
      'Whether trace Cl⁻ or SO₄²⁻ impurity falls below a specified pass/fail standard threshold.',
    chemicalOrPhysicalProcess:
      'Chloride: Cl⁻ + Ag⁺ (in dil. HNO₃) → AgCl opalescence. Sulphate: SO₄²⁻ + BaCl₂ (with K₂SO₄ seeding & alcohol) → BaSO₄ turbidity.',
    instrumentsAndApparatus: [
      'Matched 50 mL Nessler Cylinders (identical diameter & glass thickness)',
      'Graduated 1 mL & 10 mL pipettes',
      'Black matte viewing card / comparator box'
    ],
    educationalProcedure: [
      'Label two matched Nessler cylinders "Test" and "Standard".',
      'For Chloride: acidify with 10 mL dil. HNO₃, dilute to 50 mL, add 1 mL 0.1M AgNO₃, stir immediately, stand 5 min protected from light.',
      'For Sulphate: acidify with 2 mL dil. HCl, add Barium Sulphate Reagent (BaCl₂ + alcohol + trace K₂SO₄ seed), make to 50 mL, stand 5 min.',
      'Compare opalescence/turbidity against the concurrently prepared standard (0.05845% w/v NaCl or 0.1089% w/v K₂SO₄).'
    ],
    resultInterpretation:
      'Test turbidity ≤ Standard turbidity indicates sample complies (Pass); Test > Standard indicates non-compliance (Fail). Consult official IP/BP/USP–NF monograph for sample-specific quantities.',
    commonErrors: [
      'Using mismatched Nessler cylinders of unequal cross-section or wall thickness.',
      'Exposing AgCl cylinder to bright light (photodecomposition darkens AgCl).',
      'Omitting K₂SO₄ seeding or alcohol in sulphate reagent (leads to supersaturation & inconsistent particle size).'
    ],
    linkedPharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur', 'pc_who_int'],
    textbookKeywords: ['Limit test', 'Chloride', 'Sulphate', 'Nessler cylinder', 'Impurities'],
    labConnections: [
      {
        label: 'BP111P Limit Tests Simulator (Exp 1a–1b)',
        kind: 'module',
        moduleId: 'inorganic',
        tab: 'limit_tests',
        description: 'Inspect Chloride & Sulphate limit tests and modified procedures in Inorganic Lab.'
      },
      {
        label: 'Nessler Comparator Plate',
        kind: 'visual',
        visualId: 'builtin_chemistry_apparatus',
        description: 'Inspect matched Nessler cylinders and optical comparison setup.'
      }
    ],
    academicLinks: [
      {
        subjectCode: 'BP106T / BP111P',
        subjectTitle: 'Pharmaceutical Inorganic Chemistry',
        topicTitle: 'Limit Tests for Chloride & Sulphate (Exp 1a–1b)',
        syllabusId: OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
        topicId: 'bp106t_unit1'
      }
    ]
  },
  {
    id: 'test_limit_arsenic_metals',
    testName: 'Limit Test for Arsenic (Gutzeit Apparatus), Iron & Lead',
    categoryId: 'limit_tests_impurities',
    aliases: ['Arsenic limit test', 'Gutzeit apparatus', 'Lead limit test', 'Iron limit test', 'Dithizone', 'Thioglycolic acid'],
    dataSourceOrigin: 'PharmaLab BP106T/BP111P Exp 1(c–e) & Gutzeit Atlas Plate',
    purpose:
      'Detects toxic trace elemental impurities (Arsenic, Lead, Iron) in pharmaceutical substances before clinical release.',
    scientificPrinciple:
      'Arsenic (Gutzeit): nascent hydrogen reduces pentavalent/trivalent As to volatile arsine gas (AsH₃), producing a yellow-brown stain on HgCl₂ test paper. Iron forms purple ferrous thioglycolate in alkaline medium; Lead forms chloroform-soluble red lead-dithizonate.',
    whatItMeasures:
      'Semi-quantitative trace heavy metal / metalloid stain or color intensity against concurrent standard.',
    chemicalOrPhysicalProcess:
      'Zn + HCl → [H]; As⁵⁺ → As³⁺ (via KI + SnCl₂) → AsH₃↑. Lead-acetate cotton plug traps interfering H₂S gas before AsH₃ reaches HgCl₂ paper.',
    instrumentsAndApparatus: [
      'Standard Gutzeit Apparatus (wide-mouth bottle, glass tube, Pb-acetate cotton plug, HgCl₂ test paper cap)',
      'Matched Nessler cylinders & separating funnels (for CHCl₃ Dithizone Lead extraction)'
    ],
    educationalProcedure: [
      'Ensure glass tube dimensions and HgCl₂ paper clamping are identical between Test and Standard Gutzeit assemblies.',
      'Reduce sample arsenic with stannated HCl, potassium iodide, and granulated zinc at ~40°C (or gentle warmth) for 40 minutes.',
      'Compare yellow-brown HgCl₂ paper stain immediately against concurrent standard arsenic stain (protected from light/moisture).'
    ],
    resultInterpretation:
      'Test stain intensity ≤ Standard stain complies; greater intensity fails. Always consult official pharmacopoeial monographs (or ICH Q3D ICP-MS frameworks) for binding elemental impurity limits.',
    commonErrors: [
      'Omitting Lead Acetate cotton wool (trace sulphide blackens HgCl₂ paper as HgS).',
      'Allowing moisture condensation onto HgCl₂ test paper or omitting SnCl₂.'
    ],
    linkedPharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur', 'pc_who_int'],
    textbookKeywords: ['Gutzeit', 'Arsenic', 'Lead', 'Iron', 'Dithizone', 'Elemental impurities'],
    labConnections: [
      {
        label: 'BP111P Arsenic/Lead/Iron Limit Tests',
        kind: 'module',
        moduleId: 'inorganic',
        tab: 'limit_tests',
        description: 'Inspect Iron, Lead (Dithizone), and Arsenic (Gutzeit) limit tests in Inorganic Lab.'
      },
      {
        label: 'Gutzeit Apparatus Visual Plate',
        kind: 'visual',
        visualId: 'builtin_gutzeit_apparatus',
        description: 'Study labeled Gutzeit bottle, Pb-acetate plug, and HgCl₂ paper cap.'
      }
    ],
    academicLinks: [
      {
        subjectCode: 'BP106T / BP111P',
        subjectTitle: 'Pharmaceutical Inorganic Chemistry',
        topicTitle: 'Limit Tests for Iron, Lead & Arsenic (Exp 1c–1e)',
        syllabusId: OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
        topicId: 'bp106t_unit1'
      }
    ]
  },
  {
    id: 'test_dissolution',
    testName: 'In-Vitro Tablet Dissolution & Drug Release Testing',
    categoryId: 'dissolution_release',
    aliases: ['Dissolution', 'Noyes-Whitney', 'Paddle apparatus', 'Basket apparatus', 'USP 711', 'Drug release'],
    dataSourceOrigin: 'PharmaLab Interactive Dissolution Experiment (Noyes–Whitney Simulator)',
    purpose:
      'Evaluates the rate and extent of active pharmaceutical ingredient (API) release from solid oral dosage forms (tablets, capsules) into a standardized medium at 37°C ± 0.5°C.',
    scientificPrinciple:
      'Governed by the Noyes–Whitney diffusion layer equation: dissolution rate increases with effective surface area (smaller particle size), diffusion coefficient, hydrodynamic agitation (paddle/basket RPM reducing boundary layer thickness h), and sink saturation solubility (Cs).',
    whatItMeasures:
      'Cumulative percentage of labeled API dissolved over standardized sampling intervals (e.g., 15, 30, 45, 60 min).',
    chemicalOrPhysicalProcess:
      'Wetting, dosage-form disintegration into granules/primary particles, boundary-layer mass transfer, and bulk solution homogenization under sink conditions.',
    instrumentsAndApparatus: [
      'Dissolution Apparatus (Basket / Paddle vessels in 37.0°C thermostatted water bath)',
      'Degassing unit (prevents micro-bubbles on tablet surfaces)',
      '0.45 µm syringe filters & UV-Vis Spectrophotometer or HPLC for aliquot quantitation'
    ],
    educationalProcedure: [
      'Pre-heat 900 mL of degassed dissolution medium to 37.0°C ± 0.5°C.',
      'Introduce dosage unit into basket or sinker/vessel (paddle) at exact RPM without entrapping air bubbles.',
      'Withdraw filtered aliquots at scheduled timepoints with media replacement if specified, and assay concentration vs standard.'
    ],
    calculationSection: {
      formulaLabel: 'Noyes–Whitney Dissolution Kinetics Relationship',
      formulaExpression: 'dC / dt = [ D · A · (Cs − C) ] / ( V · h )',
      variablesNote: 'D: diffusion coefficient; A: particle surface area; Cs: saturation solubility; C: bulk concentration; V: medium volume; h: diffusion layer thickness.',
      exampleSummary: 'Explore live % drug dissolved curves across RPM, particle radius, temperature, and medium viscosity in PharmaLab’s Dissolution Simulator.'
    },
    resultInterpretation:
      'Official stage-1/2/3 Q-value acceptance limits vary strictly by drug monograph and dosage form (verify directly in IP, BP, USP–NF <711>, or Ph. Eur. 2.9.3).',
    commonErrors: [
      'Undegassed dissolution medium forming floating bubbles that lift or shield tablets.',
      'Vibration, shaft wobble, or non-centered vessel alignment altering boundary layer hydrodynamics.'
    ],
    linkedPharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur', 'pc_jp', 'pc_who_int'],
    textbookKeywords: ['Dissolution', 'Noyes-Whitney', 'Sink conditions', 'Paddle', 'Aulton', 'Lachman'],
    labConnections: [
      {
        label: 'Interactive Dissolution Simulator',
        kind: 'experiment',
        experimentId: 'exp_dissolution_noyes_whitney',
        description: 'Vary particle radius, paddle RPM, and temperature to simulate live dissolution curves.'
      }
    ],
    academicLinks: [
      {
        subjectCode: 'BP102T / Industrial',
        subjectTitle: 'Pharmaceutics & Biopharmaceutics',
        topicTitle: 'Solid Dosage Forms & Dissolution Kinetics',
        syllabusId: OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
        topicId: 'bp102t_unit3'
      }
    ]
  },
  {
    id: 'test_sterility_endotoxin',
    testName: 'Sterility Validation (Autoclave F0) & Bacterial Endotoxins Principles',
    categoryId: 'sterility_microbial',
    aliases: ['Sterility', 'Autoclave', 'F0 value', 'D-value', 'Endotoxin', 'LAL test', 'Pyrogen'],
    dataSourceOrigin: 'PharmaLab Microbial Sterilization Simulator & Microbiology Visual Plate',
    purpose:
      'Ensures parenteral and ophthalmic preparations meet Sterility Assurance Level (SAL ≤ 10⁻⁶) and are free from pyrogenic Gram-negative bacterial endotoxins.',
    scientificPrinciple:
      'Log-linear microbial thermal death follows first-order kinetics characterized by D-value (time for 90% log-reduction) and z-value; equivalent sterilization lethality at 121.1°C is expressed as F0. Bacterial Endotoxins Test (LAL) detects Lipid A from Gram-negative outer membranes.',
    whatItMeasures:
      'Thermal lethality F0 (minutes at 121.1°C), viable survivor bioburden, or endotoxin concentration (EU/mL).',
    chemicalOrPhysicalProcess:
      'Moist heat coagulates microbial proteins/enzymes inside saturated steam autoclaves; LAL reagent undergoes enzymatic clotting cascade triggered by Lipid A.',
    instrumentsAndApparatus: [
      'Saturated Steam Autoclave with calibrated temperature probes & biological indicators (Geobacillus stearothermophilus)',
      'Laminar Air Flow workbench & 0.22 µm sterile membrane filtration units'
    ],
    educationalProcedure: [
      'Determine initial bioburden and biological indicator D121 value.',
      'Monitor load-probe temperature profile to integrate F0 lethality and confirm Sterility Assurance Level ≤ 10⁻⁶.',
      'Perform aseptic membrane filtration sterility testing (fluid thioglycollate & soybean-casein digest media) or LAL endotoxin testing per official chapters.'
    ],
    calculationSection: {
      formulaLabel: 'Thermal Sterilization Lethality & Log-Reduction Equations',
      formulaExpression: 'F₀ = ∫ 10^((T(t) − 121.1) / z) dt   |   Log Reduction = F₀ / D₁₂₁',
      variablesNote: 'Standard steam reference temperature = 121.1°C; typical z-value ≈ 10°C.',
      exampleSummary: 'Simulate temperature, D-value, and initial bioburden interactively in PharmaLab’s Microbial Sterilization Simulator.'
    },
    resultInterpretation:
      'Zero viable growth across incubated media or endotoxin below monograph limit confirms compliance (verify exact official test criteria in IP/BP/USP–NF/Ph. Eur.).',
    commonErrors: [
      'Incomplete air removal in autoclave creating cold pockets.',
      'Failing to distinguish heat-stable LPS endotoxins (which survive autoclaving and require depyrogenation at ~250°C) from viable bacteria.'
    ],
    linkedPharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur', 'pc_who_int', 'pc_jp'],
    textbookKeywords: ['Sterility', 'Autoclave', 'F0', 'D-value', 'Endotoxin', 'LAL', 'Prescott'],
    labConnections: [
      {
        label: 'Microbial Growth & Sterilization Simulator',
        kind: 'experiment',
        experimentId: 'exp_microbial_growth_sterilization',
        description: 'Model F0 lethality, D-value, and SAL survivor curves interactively.'
      },
      {
        label: 'Gram-Positive vs Gram-Negative LPS Plate',
        kind: 'visual',
        visualId: 'builtin_bacterial_cell_wall',
        description: 'Inspect Lipid A endotoxin structure on Gram-negative outer membrane.'
      }
    ],
    academicLinks: [
      {
        subjectCode: 'BP102T / Microbiology',
        subjectTitle: 'Pharmaceutical Microbiology & Sterile Manufacturing',
        topicTitle: 'Moist Heat Sterilization & Pyrogen/Endotoxin Control',
        syllabusId: OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
        topicId: 'bp102t_unit1'
      }
    ]
  },
  {
    id: 'test_crude_drug_physicochemical',
    testName: 'Crude Drug Physicochemical QC (Ash, Extractives, LOD, Swelling & Leaf Constants)',
    categoryId: 'disintegration_physical',
    aliases: ['Ash value', 'Acid insoluble ash', 'Extractive value', 'Loss on drying', 'Swelling index', 'Stomatal index', 'Foaming index'],
    dataSourceOrigin: 'PharmaLab BP105T/BP110P Pharmacognosy Lab Suite',
    purpose:
      'Detects inorganic adulteration (sand/silica/earthy matter), exhausted drugs, excess moisture, mucilage quality, and botanical authenticity in herbal drugs.',
    scientificPrinciple:
      'Incineration at 450–600°C removes organic matter leaving Total Ash; boiling Total Ash with dil. HCl isolates siliceous Acid-Insoluble Ash. Solvent maceration estimates soluble phytochemicals (Extractive Values), while Stomatal Index stays constant across leaf age/climate.',
    whatItMeasures:
      'Percentage w/w inorganic residue, solvent-soluble constituents, volatile moisture, mucilage swelling volume (mL/g), and epidermal stomatal ratio.',
    chemicalOrPhysicalProcess:
      'Gravimetric ignition, HCl digestion, cold maceration/evaporation, gravimetric drying at 105°C, aqueous mucilage hydration, and microscopic cell counting.',
    instrumentsAndApparatus: [
      'Silica/platinum crucible & Muffle Furnace (450–600°C)',
      'Hot-air oven (105°C) & Desiccator',
      '25 mL Stoppered graduated cylinder (Swelling Index)',
      'Compound Microscope with calibrated ocular/stage micrometer'
    ],
    educationalProcedure: [
      'Ash Value: Ignite accurately weighed air-dried crude drug in tarred silica crucible until carbon-free, cool in desiccator, weigh Total Ash; boil with 2M HCl to isolate Acid-Insoluble Ash.',
      'Extractive Value: Macerate 5 g coarse powder with 100 mL solvent (alcohol/water) for 24 h, filter, evaporate 25 mL filtrate to dryness, and weigh.',
      'Stomatal Index: Count stomata (S) and epidermal cells (E) in defined microscopic fields and compute [S / (E + S)] × 100.'
    ],
    calculationSection: {
      formulaLabel: 'Educational Pharmacognosy QC Formulas',
      formulaExpression: 'Total Ash % = (Ash Wt / Sample Wt) × 100   |   Stomatal Index = [S / (E + S)] × 100',
      variablesNote: 'Verify drug-specific monograph limits in IP, Ayurvedic Pharmacopoeia, BP, Ph. Eur., JP, or ChP.',
      exampleSummary: 'Compute all 6 physicochemical QC tests and micrometry leaf constants interactively in BP110P Pharmacognosy Lab.'
    },
    resultInterpretation:
      'Elevated acid-insoluble ash warns of siliceous earth/sand adulteration; low extractive value suggests exhausted or degraded plant material.',
    commonErrors: [
      'Weighing hot crucibles without cooling in a desiccator (convection buoyancy & moisture uptake errors).',
      'Overheating above ~600°C causing volatilization of alkali chlorides and artificially low Total Ash.'
    ],
    linkedPharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_ph_eur', 'pc_jp', 'pc_chp'],
    textbookKeywords: ['Ash value', 'Extractive', 'Swelling index', 'Stomatal index', 'Kokate', 'Trease', 'Evans'],
    labConnections: [
      {
        label: 'BP110P Physicochemical QC Calculators',
        kind: 'module',
        moduleId: 'pharmacognosy',
        tab: 'physicochemical',
        description: 'Calculate Total Ash, Acid-Insoluble Ash, Extractives, LOD & Swelling Index.'
      },
      {
        label: 'BP110P Leaf Constants & Micrometry',
        kind: 'module',
        moduleId: 'pharmacognosy',
        tab: 'leaf_constants',
        description: 'Compute Stomatal Index, Vein-Islet Number, and ocular calibration.'
      }
    ],
    academicLinks: [
      {
        subjectCode: 'BP105T / BP110P',
        subjectTitle: 'Pharmacognosy & Phytochemistry',
        topicTitle: 'Quality Control of Crude Drugs & Quantitative Microscopy',
        syllabusId: OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
        topicId: 'bp105t_unit3'
      }
    ]
  }
];

export function computePharmacopoeiaAvailability(params: {
  entry: PharmacopoeiaDirectoryEntry;
  books: LibraryBookMeta[];
  referenceItems: ReferenceItem[];
  referenceProfiles: PharmacopoeiaProfileMeta[];
}): {
  status: PharmacopoeiaAvailabilityStatus;
  label: string;
  detail: string;
  linkedBook?: LibraryBookMeta;
} {
  const { entry, books, referenceItems } = params;
  const linkedRef = referenceItems.find((r) => r.id === entry.linkedReferenceCenterId);
  const linkedBook = books.find(
    (b) =>
      b.id === linkedRef?.linkedBookId ||
      b.title.toLowerCase().includes(entry.fullName.toLowerCase()) ||
      (entry.abbreviation.length >= 2 &&
        new RegExp(`\\b${entry.abbreviation.replace(/[^a-z0-9]/gi, '')}\\b`, 'i').test(b.title))
  );

  if (linkedBook) {
    return {
      status: 'imported_user_pdf',
      label: AVAILABILITY_STATUS_LABELS.imported_user_pdf,
      detail: `User-imported PDF "${linkedBook.title}" (${linkedBook.pageCount} pages) available locally.`,
      linkedBook
    };
  }

  if (entry.contentAccessType === 'public') {
    return {
      status: 'publicly_accessible',
      label: AVAILABILITY_STATUS_LABELS.publicly_accessible,
      detail: entry.onlineAccessibilityStatus
    };
  }

  if (entry.contentAccessType === 'subscription' || entry.contentAccessType === 'licensed') {
    return {
      status: 'subscription_restricted',
      label: AVAILABILITY_STATUS_LABELS.subscription_restricted,
      detail: entry.accessLimitations
    };
  }

  if (entry.contentAccessType === 'restricted') {
    return {
      status: 'external_official_reference',
      label: AVAILABILITY_STATUS_LABELS.external_official_reference,
      detail: entry.accessLimitations
    };
  }

  return {
    status: 'unavailable',
    label: AVAILABILITY_STATUS_LABELS.unavailable,
    detail: 'No local or verified online monograph text detected.'
  };
}

function scoreMatch(haystack: string, q: string, tokens: string[]): number {
  if (!q) return 30;
  const low = haystack.toLowerCase();
  if (low === q) return 100;
  if (low.includes(q)) return 88;
  if (tokens.length === 0) return 0;
  const hits = tokens.filter((t) => low.includes(t)).length;
  return hits === tokens.length ? 76 : hits > 0 ? Math.round((hits / tokens.length) * 60) : 0;
}

export async function runUnifiedKnowledgeSearch(params: {
  query: string;
  books: LibraryBookMeta[];
  referenceItems: ReferenceItem[];
  referenceProfiles: PharmacopoeiaProfileMeta[];
  userStore: PharmacopoeiaUserStore;
}): Promise<UnifiedKnowledgeSearchResponse> {
  const rawQuery = params.query.trim();
  const q = rawQuery.toLowerCase();
  const tokens = q.split(/\s+/).filter((t) => t.length >= 2);

  // 1. TEXTBOOK-FIRST: Search imported Knowledge Library PDFs for exact page snippets
  const textbookPdfHits: TextbookPdfHit[] = [];
  const entryLinkedBookMap = new Map<string, PharmacopoeiaDirectoryEntry>();
  for (const entry of PHARMACOPOEIA_DIRECTORY) {
    if (!entry.linkedReferenceCenterId) continue;
    const ref = params.referenceItems.find((r) => r.id === entry.linkedReferenceCenterId);
    if (ref?.linkedBookId) {
      entryLinkedBookMap.set(ref.linkedBookId, entry);
    }
  }

  if (params.books.length > 0) {
    for (const book of params.books) {
      const linkedEntry = entryLinkedBookMap.get(book.id);
      if (!q) {
        textbookPdfHits.push({
          id: `pdf_home_${book.id}`,
          bookId: book.id,
          bookTitle: book.title,
          authors: book.authors,
          department: book.department,
          pageNumber: book.lastReadPage || 1,
          snippet: book.hasSearchableText
            ? `${book.pageCount} pages indexed locally in PDF Knowledge Library.`
            : `${book.pageCount} pages available locally in PDF Knowledge Library.`,
          isPharmacopoeiaLinked: Boolean(linkedEntry),
          linkedEntryAbbreviation: linkedEntry?.abbreviation
        });
        continue;
      }

      if (book.hasSearchableText && q.length >= 2) {
        try {
          const pages = await getBookPages(book.id);
          const matches = searchBookPages(pages, rawQuery, 3);
          for (const m of matches) {
            textbookPdfHits.push({
              id: `pdf_hit_${book.id}_${m.pageNumber}`,
              bookId: book.id,
              bookTitle: book.title,
              authors: book.authors,
              department: book.department,
              pageNumber: m.pageNumber,
              snippet: `${m.beforeContext}${m.matchedText}${m.afterContext}`.trim(),
              isPharmacopoeiaLinked: Boolean(linkedEntry),
              linkedEntryAbbreviation: linkedEntry?.abbreviation
            });
          }
        } catch {
          // keep resilient if indexedDB page read fails
        }
      }

      if (
        !textbookPdfHits.some((h) => h.bookId === book.id) &&
        scoreMatch(`${book.title} ${book.authors || ''} ${book.department}`, q, tokens) >= 50
      ) {
        textbookPdfHits.push({
          id: `pdf_meta_${book.id}`,
          bookId: book.id,
          bookTitle: book.title,
          authors: book.authors,
          department: book.department,
          pageNumber: book.lastReadPage || 1,
          snippet: 'Matched local PDF title or subject metadata in Knowledge Library.',
          isPharmacopoeiaLinked: Boolean(linkedEntry),
          linkedEntryAbbreviation: linkedEntry?.abbreviation
        });
      }
    }
  }

  // 2. SEEDED REFERENCE CENTER TEXTBOOKS, HANDBOOKS & STANDARDS
  const refPool = params.referenceItems.length > 0 ? params.referenceItems : INITIAL_REFERENCE_CATALOG;
  const seededTextbooks: SeededTextbookMatch[] = refPool
    .filter((item) => item.collectionType !== 'pharmacopoeia')
    .map((item) => {
      const hay = `${item.title} ${item.authors || ''} ${item.subject} ${item.description} ${item.tags.join(' ')}`;
      const score = scoreMatch(hay, q, tokens);
      return { item, score };
    })
    .filter(({ score }) => (q ? score >= 45 : true))
    .sort((a, b) => b.score - a.score)
    .slice(0, q ? 8 : 6)
    .map(({ item }) => ({
      id: item.id,
      title: item.title,
      authors: item.authors,
      subject: item.subject,
      collectionType: item.collectionType,
      accessLabel:
        item.accessStatus === 'open_access_portal'
          ? 'Open Official / Educational Portal'
          : item.accessStatus === 'imported_pdf'
          ? 'Imported User PDF'
          : item.accessStatus === 'licensed_external'
          ? 'Publisher / Subscription Reference'
          : 'Curriculum Textbook Reference',
      description: item.description,
      externalUrl: item.externalUrl
    }));

  // 3. SUBSTANCE / DRUG / EXCIPIENT / DOSAGE FORM / CRUDE DRUG KNOWLEDGE WORKSPACES
  const substances = SUBSTANCE_KNOWLEDGE_BASE.map((sub) => {
    const hay = [
      sub.name,
      sub.synonyms.join(' '),
      sub.categoryLabel,
      sub.overview,
      sub.chemicalInfo?.chemicalName || '',
      sub.chemicalInfo?.formula || '',
      sub.chemicalInfo?.functionalGroups || '',
      (sub.analyticalMethods || []).join(' '),
      (sub.qualityControl || []).join(' '),
      (sub.impurities || []).join(' '),
      (sub.pharmaceuticalApplications || []).join(' '),
      sub.textbookKeywords.join(' ')
    ].join(' ');
    return { sub, score: scoreMatch(hay, q, tokens) };
  })
    .filter(({ score }) => (q ? score >= 45 : true))
    .sort((a, b) => b.score - a.score)
    .map(({ sub }) => sub);

  // 4. EDUCATIONAL ANALYTICAL TESTS & PRACTICAL LEARNING MODULES
  const analyticalTests = EDUCATIONAL_ANALYTICAL_TESTS.map((test) => {
    const hay = [
      test.testName,
      test.aliases.join(' '),
      test.purpose,
      test.scientificPrinciple,
      test.whatItMeasures,
      test.chemicalOrPhysicalProcess,
      test.instrumentsAndApparatus.join(' '),
      test.textbookKeywords.join(' ')
    ].join(' ');
    return { test, score: scoreMatch(hay, q, tokens) };
  })
    .filter(({ score }) => (q ? score >= 45 : true))
    .sort((a, b) => b.score - a.score)
    .map(({ test }) => test);

  // 5. ACADEMIC TOPICS & SYLLABUS CONNECTIONS
  const academicTopics: AcademicTopicSearchHit[] = [];
  for (const topic of Object.values(ENGINE_TOPICS)) {
    const hay = `${topic.title} ${topic.unitLabel} ${topic.summary}`;
    const score = scoreMatch(hay, q, tokens);
    if (!q || score >= 48) {
      academicTopics.push({
        id: `engine_${topic.id}`,
        subjectCode: topic.unitLabel,
        subjectTitle: topic.departmentId.replace('dept_', '').toUpperCase(),
        topicTitle: topic.title,
        summary: topic.summary,
        syllabusId: OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
        sourceLabel: 'PharmaLab Academic Engine'
      });
    }
  }
  for (const course of SYLLABUS_COURSES) {
    for (const unit of course.units || []) {
      const unitBody = unit.sections
        .map((s) => `${s.heading || ''} ${(s.paragraphs || []).join(' ')} ${(s.bullets || []).join(' ')}`)
        .join(' ');
      const hay = `${course.courseCode} ${course.courseTitle} ${unit.unitNo} ${unit.title || ''} ${unitBody}`;
      const score = scoreMatch(hay, q, tokens);
      if (q && score >= 52) {
        academicTopics.push({
          id: `syl_${course.courseCode}_${unit.unitNo}`,
          subjectCode: course.courseCode,
          subjectTitle: course.courseTitle,
          topicTitle: `${unit.unitNo}${unit.title ? ` · ${unit.title}` : ''}`,
          summary: unitBody.slice(0, 210).trim() + (unitBody.length > 210 ? '…' : ''),
          syllabusId: OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
          sourceLabel: 'Official B.Pharm Syllabus'
        });
      }
    }
    for (const block of course.practicalBlocks || []) {
      const itemsText = (block.items || [])
        .map((it) => `${it.number || ''} ${it.title} ${(it.subItems || []).join(' ')}`)
        .join(' ');
      const hay = `${course.courseCode} ${course.courseTitle} ${block.heading || ''} ${itemsText}`;
      const score = scoreMatch(hay, q, tokens);
      if (q && score >= 52) {
        academicTopics.push({
          id: `syl_prac_${course.courseCode}_${block.heading || 'block'}`,
          subjectCode: course.courseCode,
          subjectTitle: course.courseTitle,
          topicTitle: block.heading || `${course.courseCode} Practical Schedule`,
          summary: itemsText.slice(0, 210).trim() + (itemsText.length > 210 ? '…' : ''),
          syllabusId: OFFICIAL_BPHARM_SEM1_SYLLABUS_ID,
          sourceLabel: 'Official B.Pharm Practical Syllabus'
        });
      }
    }
  }

  // 6. PHARMACOPOEIA PORTALS & DIRECTORY ENTRIES
  const pharmacopoeiaResults = await runUnifiedPharmacopoeiaSearch({
    query: rawQuery,
    userStore: params.userStore,
    books: params.books,
    referenceItems: params.referenceItems,
    referenceProfiles: params.referenceProfiles
  });

  const matchingDirectCompendiaCount = pharmacopoeiaResults.filter(
    (r) => r.origin === 'local_metadata' || r.origin === 'imported_reference_file' || r.relevanceScore >= 45
  ).length;

  const totalHits =
    textbookPdfHits.length +
    seededTextbooks.length +
    substances.length +
    analyticalTests.length +
    academicTopics.slice(0, 8).length +
    matchingDirectCompendiaCount;

  return {
    query: rawQuery,
    textbookPdfHits,
    seededTextbooks,
    substances: q ? substances : substances.slice(0, 8),
    analyticalTests: q ? analyticalTests : analyticalTests.slice(0, 6),
    academicTopics: academicTopics.slice(0, 6),
    pharmacopoeiaResults,
    hasAnyImportedBooks: params.books.length > 0,
    totalHits
  };
}
