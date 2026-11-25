import { DEPARTMENT_WORKSPACES } from '../../types/academicArchitecture';
import { SyllabusProfile } from '../study-mode/types';
import {
  Asset3DItem,
  BPHARM_DEPARTMENT_LABELS,
  BPharmDepartmentId,
  EXPERIMENT_ROLE_LABELS,
  ExperimentAssetRole,
  getAsset3DAvailability,
  SyllabusAssociation
} from './types';

export interface ApparatusExplorationProfile {
  id: string;
  name: string;
  categoryLabel: string;
  purpose: string;
  principle?: string;
  mainComponents?: string[];
  relevantParts?: string[];
  experimentalRole: string;
  safetyConsiderations?: string[];
  relatedApparatusIds?: string[];
  searchKeywords: string[];
}

export interface ExperimentStepSpec {
  id: string;
  title: string;
  apparatusIds?: string[];
  relevantParts?: string[];
  focusKeyword?: string;
  contextualNote?: string;
}

export interface ExperimentSetupPart {
  id: string;
  label: string;
  role: ExperimentAssetRole;
  apparatusId?: string;
  connectionNote: string;
}

export interface ExperimentCatalogEntry {
  id: string;
  code: string;
  title: string;
  moduleId: 'inorganic' | 'general_pharmacy' | 'pharmacognosy' | 'anatomy';
  tab: string;
  departmentId: BPharmDepartmentId;
  subjectCode: string;
  departmentLabel: string;
  apparatusIds: string[];
  setupSummary?: string;
  setupFlow?: string[];
  setupParts?: ExperimentSetupPart[];
  steps: ExperimentStepSpec[];
  defaultSearchQuery: string;
}

export const APPARATUS_PROFILES: Record<string, ApparatusExplorationProfile> = {
  app_burette_titration: {
    id: 'app_burette_titration',
    name: '50 mL Class-A Burette & Erlenmeyer Titration Assembly',
    categoryLabel: 'Volumetric Glassware & Apparatus',
    purpose:
      'Delivers measured volumes of standardized titrant into a known analyte volume to reach the stoichiometric endpoint in IP volumetric assays.',
    principle:
      'Burette titrimetry determines analyte purity (% w/w) by measuring the exact titrant volume required for stoichiometric reaction at the indicator transition endpoint.',
    mainComponents: [
      '50 mL Class-A Graduated Burette (0.1 mL subdivisions)',
      'PTFE / Ground-Glass Stopcock Valve',
      'Retort Stand & Double Burette Clamp',
      '250 mL Erlenmeyer Conical Flask',
      'White Porcelain Base Tile'
    ],
    relevantParts: ['Concave/Convex Meniscus Line', 'PTFE Stopcock Tip', 'White Contrast Tile'],
    experimentalRole:
      'Executes quantitative Acid-Base (HCl/NaOH, NH₄Cl), Redox (Cerimetry, Iodometry, Permanganometry), Complexometric (EDTA), and Precipitation (Volhard) assays.',
    safetyConsiderations: [
      'Never leave strong NaOH inside a burette overnight; rinse thoroughly with distilled water to avoid freezing stopcocks.',
      'Remove the filling funnel before zeroing the burette to prevent stray drops from altering initial readings.',
      'Wear eye protection when handling corrosive mineral acids and silver nitrate; never mouth pipette.'
    ],
    relatedApparatusIds: ['app_nessler', 'app_gutzeit'],
    searchKeywords: ['burette', 'titration', 'erlenmeyer', 'conical flask', 'retort stand', 'volumetric']
  },
  app_nessler: {
    id: 'app_nessler',
    name: 'Matched 50 mL Nessler Cylinders',
    categoryLabel: 'Limit-Test Comparator Glassware',
    purpose:
      'Compares turbidity/opalescence or color intensity side-by-side between Test and Standard solutions diluted to identical 50 mL marks in IP Limit Tests.',
    principle:
      'Equal internal diameter and meniscus height equalize optical path length so semi-quantitative trace impurity comparison is free of path-length bias.',
    mainComponents: [
      'Pair of Matched 50 mL Flat-Bottom Borosilicate Cylinders',
      '50 mL Calibration Etch Ring',
      'Glass Stirring Rods (Test & Standard)'
    ],
    relevantParts: ['50 mL Calibration Mark', 'Flat Optical Bottom', 'Viewing Background (Black vs White)'],
    experimentalRole:
      'Used in IP Limit Tests for Chloride (AgCl opalescence vs black background), Sulphate (BaSO₄ vs black), Iron (purple ferro-thioglycolate vs white), and Heavy Metals.',
    safetyConsiderations: [
      'Handle concentrated nitric acid, hydrochloric acid, and barium chloride reagent cautiously with protective gloves/goggles.',
      'Keep Test and Standard stirring rods separate and view after the full 5-minute standing interval.'
    ],
    relatedApparatusIds: ['app_gutzeit', 'app_burette_titration'],
    searchKeywords: ['nessler', 'cylinder', 'limit test', 'turbidity', 'opalescence', 'chloride', 'sulphate', 'iron']
  },
  app_gutzeit: {
    id: 'app_gutzeit',
    name: 'Gutzeit Apparatus (IP Arsenic Limit Test — Apparatus A)',
    categoryLabel: 'Trace-Impurity Gas Evolution Apparatus',
    purpose:
      'Reduces trace inorganic arsenic impurities into volatile arsine gas (AsH₃) and directs it uniformly onto a sensitized HgCl₂ paper disc for 10 ppm IP stain comparison.',
    principle:
      'Pentavalent As⁵⁺ is reduced to As³⁺ via KI + stannated HCl (SnCl₂), then reduced by nascent hydrogen (AsT-grade Zn + HCl) to AsH₃↑, staining HgCl₂ paper yellow-to-brown.',
    mainComponents: [
      '120 mL Wide-Mouthed Borosilicate Reaction Bottle',
      'Rubber Bung & 2 mm Lower Lateral Vent Hole',
      '200 mm × 6.5 mm Internal Diameter Vertical Glass Tube',
      'Loosely Packed Lead Acetate Cotton Wool Plug',
      'Flat-Ground Circular Flanges & HgCl₂ Paper Disc'
    ],
    relevantParts: [
      '120 mL Reaction Bottle',
      '2 mm Lateral Vent Hole',
      'Lead Acetate Cotton Wool Plug',
      'HgCl₂ Paper Disc'
    ],
    experimentalRole:
      'Separates trace arsenic selectively in the gas phase while scrubbing interfering H₂S as black PbS so colored or turbid matrices do not mask the arsenic stain.',
    safetyConsiderations: [
      'Perform inside a well-ventilated fume hood — arsine (AsH₃) and mercuric chloride (HgCl₂) are highly toxic.',
      'Use arsenic-free (AsT grade) granulated zinc and stannated HCl to avoid false-positive stains.',
      'Pack lead acetate cotton wool loosely so gas flow is unobstructed and keep the HgCl₂ disc completely dry.'
    ],
    relatedApparatusIds: ['app_nessler'],
    searchKeywords: ['gutzeit', 'arsenic', 'arsine', 'hgcl2', 'lead acetate', 'reaction bottle']
  },
  app_swelling_ash_glassware: {
    id: 'app_swelling_ash_glassware',
    name: 'Measuring Cylinder, Water Bath & Silica Crucible QC Set',
    categoryLabel: 'Physicochemical & Synthesis Glassware',
    purpose:
      'Supports Bentonite/Ispaghula swelling factor determination in 100 mL stoppered cylinders, aqueous synthesis/recrystallization, Loss on Drying, and Total/Acid-Insoluble Ash determination.',
    principle:
      'Hydration volume of swelling clays/mucilage reflects colloidal grade; ignition in a silica crucible eliminates organic matter to quantify inorganic carbonate/silicate ash.',
    mainComponents: [
      '100 mL Glass-Stoppered Graduated Measuring Cylinder',
      'Beakers, Buchner Filtration & Water Bath Heating Assembly',
      'Tarred Silica / Porcelain Ash Crucible & Desiccator'
    ],
    relevantParts: ['100 mL Swelling Cylinder', 'Crucible Rim', 'Filtration Funnel'],
    experimentalRole:
      'Used in BP111P Inorganic Preparations/Purity tests (Exp 2 & 3) and BP110P Pharmacognosy Physicochemical QC (Exp 6, 7, 10, 11).',
    safetyConsiderations: [
      'Allow ignited crucibles to cool inside a desiccator and use crucible tongs before weighing on an analytical balance.',
      'Handle strong mineral acids (H₂SO₄/HCl during acid-insoluble ash digestion and FeSO₄ preparation) carefully.'
    ],
    relatedApparatusIds: ['app_burette_titration'],
    searchKeywords: ['crucible', 'measuring cylinder', 'beaker', 'water bath', 'desiccator', 'ash']
  },
  app_compounding_mortar: {
    id: 'app_compounding_mortar',
    name: 'Porcelain Mortar & Pestle, Sieves (#12–#120) & Ointment Slab',
    categoryLabel: 'Extemporaneous Compounding Apparatus',
    purpose:
      'Executes size reduction (trituration), geometric dilution of potent powders, wet-gum/dry-gum emulsification, and levigation on an ointment slab.',
    mainComponents: [
      'Unglazed Porcelain Mortar & Pestle (for powders/solids) / Glass Mortar (for dyes/iodine)',
      'Stainless/Brass Sieves (Sieve #12, #60, #120)',
      'Porcelain Ointment Tile & Flexible Steel/Horn Spatula',
      'Measuring Cylinders & Pipettes'
    ],
    relevantParts: ['Mortar Inner Grinding Bowl', 'Pestle Head', 'Ointment Slab Surface'],
    experimentalRole:
      'Core extemporaneous dispensing setup across BP107P Formulations (Exp 2–15: solutions, syrups, dusting/effervescent powders, ointments, liniments, and gargles).',
    safetyConsiderations: [
      'Avoid using steel spatulas with iodine or acidic preparations (use horn/plastic/glass or porcelain surfaces).',
      'Clean porcelain mortars thoroughly between potent or staining APIs like gentian violet or iodine.'
    ],
    relatedApparatusIds: ['app_suppository_mould', 'app_burette_titration'],
    searchKeywords: ['mortar', 'pestle', 'ointment slab', 'spatula', 'sieve', 'compounding', 'pharmaceutics']
  },
  app_suppository_mould: {
    id: 'app_suppository_mould',
    name: 'Calibrated Metal Suppository Mould & Water Bath Fusion Setup',
    categoryLabel: 'Dosage Form Moulding Apparatus',
    purpose:
      'Moulds melted medicated cocoa butter, glycerogelatin, or PEG suppository masses into uniform 1 g / 2 g rectal suppositories adjusted for API Displacement Value.',
    principle:
      'Solid API displaces a specific weight of base equal to (Drug Weight / Displacement Value); gentle fusion avoids polymorphic transition of cocoa butter.',
    mainComponents: [
      'Split Brass/Aluminium Suppository Mould (6- or 12-Cavity)',
      'Porcelain Evaporating Dish & Thermostated Water Bath',
      'Glass Stirring Rod'
    ],
    relevantParts: ['Mould Cavities', 'Clamping Screw', 'Porcelain Dish Spout'],
    experimentalRole:
      'Prepares and calibrates moulded suppositories (BP102T Unit V & BP107P Suppository Displacement Value bench).',
    safetyConsiderations: [
      'Do NOT overheat Theobroma oil (cocoa butter) above 35–36°C during fusion, or unstable α/γ polymorphs with low melting points will form.'
    ],
    relatedApparatusIds: ['app_compounding_mortar'],
    searchKeywords: ['suppository', 'mould', 'cocoa butter', 'water bath', 'evaporating dish']
  },
  app_compound_microscope: {
    id: 'app_compound_microscope',
    name: 'Binocular Compound Light Microscope',
    categoryLabel: 'Optical Microscopy Instrument',
    purpose:
      'Magnifies stained histological tissues, botanical leaf/powder structures, and hemocytometer grids using transmitted illumination (40× to 1000× total magnification).',
    principle:
      'Total Magnification = Eyepiece (10×) × Objective Lens (4×/10×/40×/100×); Abbe condenser and iris diaphragm match numerical aperture and contrast to the specimen.',
    mainComponents: [
      '10× Ocular Eyepiece Tube(s)',
      'Revolving Nosepiece with 4×, 10×, 40×, 100× Oil Objectives',
      'Mechanical Stage & Vernier Specimen Clips',
      'Abbe Condenser & Iris Diaphragm',
      'Coarse & Fine Focus Adjustment Knobs',
      'LED / Mirror Sub-Stage Light Source'
    ],
    relevantParts: ['Objective Lenses', 'Mechanical Stage', 'Iris Diaphragm', 'Fine Focus Knob'],
    experimentalRole:
      'Essential across Anatomy Histology & Hematology (BP109P Exp 1–3, 8, 9) and Pharmacognosy Powder/Leaf Microscopy (BP110P Exp 2–5, 8–13).',
    safetyConsiderations: [
      'Always focus first under low power (10×) before rotating to 40× or 100×; never use the coarse knob under 40×/100× to avoid crushing the coverslip or scratching the front lens.',
      'Wipe cedarwood/immersion oil immediately from the 100× objective using lens tissue after examination.'
    ],
    relatedApparatusIds: ['app_micrometer_botanical', 'app_neubauer'],
    searchKeywords: ['microscope', 'objective', 'condenser', 'eyepiece', 'histology', 'microscopy']
  },
  app_micrometer_botanical: {
    id: 'app_micrometer_botanical',
    name: 'Ocular & Stage Micrometer Calibration Assembly',
    categoryLabel: 'Quantitative Microscopy Accessory',
    purpose:
      'Calibrates eyepiece micrometer divisions against a 1 mm (100 divisions × 10 µm) stage micrometer to measure botanical cell/crystal dimensions in micrometers (µm).',
    principle:
      'Calibration Factor (µm/ocular div) = (Coinciding Stage Divisions × 10 µm) / Coinciding Ocular Divisions; measured object size = Ocular Divisions × Calibration Factor.',
    mainComponents: [
      'Eyepiece (Ocular) Micrometer Disc (100 Arbitrary Divisions)',
      'Stage Micrometer Slide (1 mm Scale = 100 × 10 µm Divisions)',
      'Glass Slides, Coverslips & Camera Lucida / Drawing Prism'
    ],
    relevantParts: ['Ocular Scale', 'Stage 10 µm Ruled Slide', 'Guard Cells / Crystal Target'],
    experimentalRole:
      'Determines Stomatal Index, Vein-Islet Number, Calcium Oxalate crystal dimensions, fiber widths, and Lycopodium spore counts in BP110P Exp 8, 9, 12, 13.',
    safetyConsiderations: [
      'Handle chloral hydrate clearing reagent and phloroglucinol + concentrated HCl lignin stain carefully with protective eyewear.'
    ],
    relatedApparatusIds: ['app_compound_microscope'],
    searchKeywords: ['micrometer', 'stage micrometer', 'ocular', 'stomata', 'trichome', 'lycopodium', 'botanical']
  },
  app_neubauer: {
    id: 'app_neubauer',
    name: 'Improved Neubauer Hemocytometer & Dilution Pipettes',
    categoryLabel: 'Hematology Counting Chamber',
    purpose:
      'Enumerates Red Blood Cells (RBCs) and White Blood Cells (WBCs) per mm³ of whole blood using precision-ruled 3×3 mm counting grids at 0.1 mm chamber depth.',
    principle:
      'Charging a fixed 0.1 mm deep H-shaped chamber with accurately diluted blood (1:20 in Turk’s fluid for WBC; 1:200 in Hayem’s fluid for RBC) allows direct volumetric cell count calculation.',
    mainComponents: [
      'Heavy-Glass Neubauer Counting Chamber (3×3 mm Ruled Areas, 0.1 mm Depth)',
      'Optically Plane Hemocytometer Coverslip',
      'WBC Thoma Pipette (White Bead, 1:20) & RBC Thoma Pipette (Red Bead, 1:200)'
    ],
    relevantParts: ['4 Corner 1 mm² WBC Squares', 'Central RBC Sub-Grid (0.2 mm²)', '0.1 mm Depth Pillar'],
    experimentalRole:
      'Core quantitative cell counting chamber for BP109P Exp 8 (WBC) and Exp 9 (RBC).',
    safetyConsiderations: [
      'Focus with the condenser lowered and iris diaphragm partially closed so unstained grid lines stand out cleanly without glare.',
      'Charge the chamber smoothly by capillary action without overflowing into the H-moats or trapping air bubbles.'
    ],
    relatedApparatusIds: ['app_compound_microscope', 'app_sahli_hemoglobinometer'],
    searchKeywords: ['neubauer', 'hemocytometer', 'wbc', 'rbc', 'blood count', 'pipette']
  },
  app_sahli_hemoglobinometer: {
    id: 'app_sahli_hemoglobinometer',
    name: 'Sahli’s Acid Hematin Hemoglobinometer',
    categoryLabel: 'Clinical Hematology Comparator',
    purpose:
      'Estimates hemoglobin concentration (g/dL) visually by converting erythrocyte hemoglobin into brown acid hematin with N/10 HCl and diluting to match comparator standards.',
    principle:
      'N/10 hydrochloric acid lyses RBCs and converts hemoglobin into brown acid hematin; progressive distilled-water dilution matches standard tinted glass prisms.',
    mainComponents: [
      'Comparator Box with Standard Brown Glass Prisms',
      'Graduated Hemoglobin Tube (g/dL & %)',
      '20 µL Sahli Hemoglobin Pipette & Glass Stirrer'
    ],
    relevantParts: ['Acid Hematin Mixing Tube', '20 µL Mark Pipette', 'Comparator Color Prisms'],
    experimentalRole:
      'Performs hemoglobin estimation in BP109P Exp 11 (Sahli’s method) alongside ABO/Rh slide grouping and Westergren ESR.',
    safetyConsiderations: [
      'Handle finger-prick blood samples with sterile lancets and dispose of biohazard sharps/swabs properly; wait the standardized 10-minute acid reaction time before dilution.'
    ],
    relatedApparatusIds: ['app_neubauer'],
    searchKeywords: ['sahli', 'hemoglobinometer', 'hemoglobin', 'hematin', 'comparator']
  },
  app_sphygmomanometer_ecg: {
    id: 'app_sphygmomanometer_ecg',
    name: 'Sphygmomanometer, Stethoscope & ECG Recording Setup',
    categoryLabel: 'Cardiovascular Physiology Diagnostic Set',
    purpose:
      'Measures arterial systolic/diastolic blood pressure via Korotkoff sounds and records cardiac P-QRS-T depolarization/repolarization intervals.',
    principle:
      'Brachial cuff occlusion followed by controlled deflation reveals systolic (Phase I) and diastolic (Phase V) Korotkoff sounds; surface leads capture SA/AV/Purkinje potentials.',
    mainComponents: [
      'Inflatable Brachial Cuff, Pressure Bulb & Manometer Dial/Column',
      'Acoustic Stethoscope (Bell & Diaphragm)',
      'Limb & Precordial ECG Electrodes / Waveform Monitor'
    ],
    relevantParts: ['Brachial Cuff Manometer', 'Stethoscope Chestpiece', 'P-QRS-T ECG Trace'],
    experimentalRole:
      'Used in BP109P Exp 14–16 for Blood Pressure, Pulse Rate, and Electrocardiogram (ECG) waveform assessment.',
    safetyConsiderations: [
      'Seat the subject quietly before cuff inflation and deflate steadily (~2–3 mmHg/s) without repeating prolonged cuff occlusion on the same arm.'
    ],
    relatedApparatusIds: ['app_compound_microscope'],
    searchKeywords: ['sphygmomanometer', 'stethoscope', 'ecg', 'blood pressure', 'heart', 'cardiovascular']
  }
};

export const EXPERIMENT_CATALOG: Record<string, ExperimentCatalogEntry> = {
  exp_inorg_diagrams: {
    id: 'exp_inorg_diagrams',
    code: 'BP106T Bench',
    title: 'Inorganic Chemistry Apparatus & Analytical Schematics',
    moduleId: 'inorganic',
    tab: 'diagrams',
    departmentId: 'pharmaceutical_chemistry',
    subjectCode: 'BP106T',
    departmentLabel: 'Inorganic Chemistry',
    apparatusIds: ['app_gutzeit', 'app_nessler', 'app_burette_titration'],
    setupSummary:
      'Visualizes pharmacopoeial glassware and comparator layouts connecting BP106T theory to BP111P assays and limit tests.',
    steps: [
      { id: 'gutzeit', title: 'Gutzeit Arsenic Apparatus', apparatusIds: ['app_gutzeit'], focusKeyword: 'gutzeit' },
      { id: 'nessler', title: 'Matched Nessler Cylinders', apparatusIds: ['app_nessler'], focusKeyword: 'nessler' },
      { id: 'titration_setup', title: 'Burette & Conical Flask Assembly', apparatusIds: ['app_burette_titration'], focusKeyword: 'burette' }
    ],
    defaultSearchQuery: 'burette gutzeit nessler chemistry apparatus'
  },
  exp_inorg_titration: {
    id: 'exp_inorg_titration',
    code: 'Exp 4a–4g',
    title: 'Volumetric Burette Assays & Titrant Standardization',
    moduleId: 'inorganic',
    tab: 'titration',
    departmentId: 'pharmaceutical_analysis',
    subjectCode: 'BP106T',
    departmentLabel: 'Inorganic Chemistry',
    apparatusIds: ['app_burette_titration', 'app_nessler'],
    setupSummary:
      'A Class-A 50 mL burette is clamped plumb on a retort stand above a 250 mL conical flask on a white porcelain contrast tile to detect stoichiometric endpoint color changes.',
    setupFlow: [
      'Rinse & zero 50 mL burette (expel tip air bubble, remove funnel)',
      'Pipette measured analyte + indicator into 250 mL Erlenmeyer flask',
      'Place flask over white porcelain tile and titrate dropwise near endpoint',
      'Read meniscus at eye level (concave lower / upper for KMnO₄ & I₂) for % purity calculation'
    ],
    setupParts: [
      {
        id: 'part_burette',
        label: '50 mL Graduated Burette & PTFE Stopcock',
        role: 'glassware',
        apparatusId: 'app_burette_titration',
        connectionNote: 'Delivers standardized titrant dropwise above the Erlenmeyer flask.'
      },
      {
        id: 'part_flask',
        label: 'Erlenmeyer Flask & White Porcelain Tile',
        role: 'setup',
        apparatusId: 'app_burette_titration',
        connectionNote: 'Holds analyte + indicator and provides white contrast for pale endpoint detection.'
      }
    ],
    steps: [
      { id: 'hcl_naoh', title: 'Standardization / Acid-Base (HCl vs 0.1N NaOH)', apparatusIds: ['app_burette_titration'], relevantParts: ['50 mL Burette', 'Conical Flask', 'Porcelain Tile'], focusKeyword: 'burette' },
      { id: 'nh4cl', title: 'Exp 4(a): Assay of Ammonium Chloride (Formal Titration)', apparatusIds: ['app_burette_titration'], focusKeyword: 'burette' },
      { id: 'feso4', title: 'Exp 4(b): Assay of Ferrous Sulphate (Cerimetry)', apparatusIds: ['app_burette_titration'], focusKeyword: 'burette' },
      { id: 'cuso4', title: 'Exp 4(c): Assay of Copper Sulphate (Iodometry)', apparatusIds: ['app_burette_titration'], focusKeyword: 'burette' },
      { id: 'cagluconate', title: 'Exp 4(d): Assay of Calcium Gluconate (EDTA)', apparatusIds: ['app_burette_titration'], focusKeyword: 'burette' },
      { id: 'h2o2', title: 'Exp 4(e): Assay of Hydrogen Peroxide (Permanganometry)', apparatusIds: ['app_burette_titration'], focusKeyword: 'burette', contextualNote: 'Read UPPER meniscus for deeply colored KMnO₄ solution.' },
      { id: 'nabenzoate', title: 'Exp 4(f): Assay of Sodium Benzoate (Biphasic)', apparatusIds: ['app_burette_titration'], focusKeyword: 'burette' },
      { id: 'nacl', title: 'Exp 4(g): Assay of Sodium Chloride (Modified Volhard)', apparatusIds: ['app_burette_titration'], focusKeyword: 'burette' }
    ],
    defaultSearchQuery: 'volumetric burette titration flask apparatus'
  },
  exp_inorg_limit_tests: {
    id: 'exp_inorg_limit_tests',
    code: 'Exp 1a–1e',
    title: 'Pharmacopoeial Impurity Limit Tests (Cl⁻, SO₄²⁻, Fe, Pb, As)',
    moduleId: 'inorganic',
    tab: 'limit_tests',
    departmentId: 'pharmaceutical_chemistry',
    subjectCode: 'BP106T',
    departmentLabel: 'Inorganic Chemistry',
    apparatusIds: ['app_nessler', 'app_gutzeit'],
    setupSummary:
      'Solution turbidity/color tests (Cl⁻, SO₄²⁻, Fe, Pb) use matched 50 mL Nessler cylinders, whereas trace Arsenic uses the gas-phase Gutzeit reaction bottle & HgCl₂ disc assembly.',
    setupFlow: [
      'Prepare Test & Standard solutions simultaneously in matched cylinders or paired Gutzeit bottles',
      'Cl⁻ / SO₄²⁻: Compare turbidity vertically against BLACK background after 5 min',
      'Fe / Pb: Compare pink/brown color vertically against WHITE background',
      'As (Gutzeit): Reduce As⁵⁺ → As³⁺ → AsH₃↑, scrub H₂S on lead acetate wool, compare HgCl₂ disc stain'
    ],
    setupParts: [
      {
        id: 'part_nessler',
        label: 'Matched 50 mL Nessler Cylinders (Test vs Standard)',
        role: 'glassware',
        apparatusId: 'app_nessler',
        connectionNote: 'Side-by-side optical path comparison for Cl⁻, SO₄²⁻, Fe & Pb limit tests.'
      },
      {
        id: 'part_gutzeit',
        label: 'Gutzeit Apparatus (120 mL Bottle + 200 mm Tube + HgCl₂ Disc)',
        role: 'apparatus',
        apparatusId: 'app_gutzeit',
        connectionNote: 'Gas-phase isolation of arsine (AsH₃) scrubbed by lead acetate cotton wool.'
      }
    ],
    steps: [
      {
        id: 'chloride',
        title: 'Exp 1(a): Limit Test for Chloride (AgNO₃)',
        apparatusIds: ['app_nessler'],
        relevantParts: ['50 mL Nessler Cylinders', 'Black Viewing Background'],
        focusKeyword: 'nessler',
        contextualNote: 'View AgCl opalescence against a black background after 5 min standing.'
      },
      {
        id: 'sulphate',
        title: 'Exp 1(b): Limit Test for Sulphate (BaCl₂)',
        apparatusIds: ['app_nessler'],
        relevantParts: ['50 mL Nessler Cylinders', 'Black Viewing Background'],
        focusKeyword: 'nessler',
        contextualNote: 'Alcoholic K₂SO₄ seeds uniform BaSO₄ crystals for vertical comparison.'
      },
      {
        id: 'iron',
        title: 'Exp 1(c): Limit Test for Iron (Thioglycolic Acid)',
        apparatusIds: ['app_nessler'],
        relevantParts: ['50 mL Nessler Cylinders', 'White Viewing Background'],
        focusKeyword: 'nessler',
        contextualNote: 'Citric acid complexes Fe while ammonia turns solution alkaline; view against white surface.'
      },
      {
        id: 'lead',
        title: 'Exp 1(d): Limit Test for Heavy Metals / Lead',
        apparatusIds: ['app_nessler'],
        relevantParts: ['50 mL Nessler Cylinders', 'White Viewing Background'],
        focusKeyword: 'nessler',
        contextualNote: 'Compare brown PbS/dithizone color vertically against standard.'
      },
      {
        id: 'arsenic',
        title: 'Exp 1(e): Limit Test for Arsenic (Gutzeit Apparatus)',
        apparatusIds: ['app_gutzeit'],
        relevantParts: ['120 mL Bottle', '2 mm Vent Hole', 'Lead Acetate Wool', 'HgCl₂ Disc'],
        focusKeyword: 'gutzeit',
        contextualNote: 'Requires Gutzeit Apparatus A rather than Nessler cylinders; compare HgCl₂ disc stain against 10 ppm As standard.'
      }
    ],
    defaultSearchQuery: 'gutzeit nessler apparatus limit test chemistry'
  },
  exp_inorg_preparations: {
    id: 'exp_inorg_preparations',
    code: 'Exp 2a–2d',
    title: 'Inorganic Preparations & Stoichiometric Yield Scaler',
    moduleId: 'inorganic',
    tab: 'preparations',
    departmentId: 'pharmaceutical_chemistry',
    subjectCode: 'BP106T',
    departmentLabel: 'Inorganic Chemistry',
    apparatusIds: ['app_swelling_ash_glassware', 'app_burette_titration'],
    setupSummary:
      'Bench reaction beakers, heating water bath, filtration funnel, and drying oven/desiccator used to synthesize and crystallize pharmaceutical inorganic salts.',
    steps: [
      { id: 'aloh3', title: 'Exp 2(a): Aluminium Hydroxide Gel', apparatusIds: ['app_swelling_ash_glassware'] },
      { id: 'alum', title: 'Exp 2(b): Potash Alum', apparatusIds: ['app_swelling_ash_glassware'] },
      { id: 'feso4', title: 'Exp 2(c): Ferrous Sulphate', apparatusIds: ['app_swelling_ash_glassware'] },
      { id: 'mgso4', title: 'Exp 2(d): Magnesium Sulphate (Epsom Salt)', apparatusIds: ['app_swelling_ash_glassware'] }
    ],
    defaultSearchQuery: 'beaker filtration flask synthesis glassware'
  },
  exp_inorg_purity: {
    id: 'exp_inorg_purity',
    code: 'Exp 3a–3c',
    title: 'Tests for Purity, Bentonite Swelling & Antacid ANC',
    moduleId: 'inorganic',
    tab: 'purity',
    departmentId: 'pharmaceutical_analysis',
    subjectCode: 'BP106T',
    departmentLabel: 'Inorganic Chemistry',
    apparatusIds: ['app_swelling_ash_glassware', 'app_burette_titration'],
    setupSummary:
      'Combines a 100 mL stoppered graduated cylinder (24 h Bentonite swelling) with a 50 mL back-titration burette assembly (Antacid ANC & KI iodate purity).',
    steps: [
      { id: 'exp3a_bentonite', title: 'Exp 3(a): Bentonite Swelling Power (100 mL Cylinder)', apparatusIds: ['app_swelling_ash_glassware'] },
      { id: 'exp3b_anc', title: 'Exp 3(b): Acid Neutralizing Capacity Back-Titration', apparatusIds: ['app_burette_titration'] },
      { id: 'exp3c_ki', title: 'Exp 3(c): Free Iodine & Iodate Purity in KI', apparatusIds: ['app_burette_titration', 'app_nessler'] }
    ],
    defaultSearchQuery: 'graduated cylinder burette titration purity'
  },
  exp_pharm_compounding: {
    id: 'exp_pharm_compounding',
    code: 'Exp 2–15',
    title: 'IP/BPC/WHO Extemporaneous Compounding Workbench',
    moduleId: 'general_pharmacy',
    tab: 'experiments',
    departmentId: 'pharmaceutics',
    subjectCode: 'BP102T',
    departmentLabel: 'Pharmaceutics',
    apparatusIds: ['app_compounding_mortar', 'app_suppository_mould', 'app_burette_titration'],
    setupSummary:
      'Dispensing station pairing porcelain/glass mortars, stainless sieves, measuring cylinders, ointment slabs, and water bath fusion dishes according to dosage form.',
    setupFlow: [
      'Weigh active ingredients & excipients on balanced compounding scale (apply Batch Factor)',
      'Sieve (#60/#120) or triturate by geometric dilution in mortar & pestle (or fuse on slab/water bath)',
      'Adjust final volume/weight in calibrated vessel & package with auxiliary dispensing label'
    ],
    setupParts: [
      {
        id: 'part_mortar',
        label: 'Porcelain Mortar & Pestle / Ointment Slab',
        role: 'apparatus',
        apparatusId: 'app_compounding_mortar',
        connectionNote: 'Trituration, geometric dilution, wet/dry gum emulsification, or levigation.'
      },
      {
        id: 'part_measure',
        label: 'Calibrated Measuring Vessels & Water Bath',
        role: 'glassware',
        apparatusId: 'app_suppository_mould',
        connectionNote: 'Final q.s. volume adjustment, gentle heating for syrups/semisolids.'
      }
    ],
    steps: [
      { id: 'sol_ammonium', title: 'Exp 2(a): Strong Solution of Ammonium Acetate – IP', apparatusIds: ['app_compounding_mortar', 'app_burette_titration'] },
      { id: 'sol_cresol', title: 'Exp 2(b): Cresol with Soap Solution (Lysol) – IP', apparatusIds: ['app_compounding_mortar'] },
      { id: 'syp_simple', title: 'Exp 3(a): Simple Syrup – IP (66.7% w/w)', apparatusIds: ['app_compounding_mortar'] },
      { id: 'syp_piperazine', title: 'Exp 3(b): Piperazine Citrate Elixir – IP', apparatusIds: ['app_compounding_mortar'] },
      { id: 'pwd_ors', title: 'Exp 4(a): Oral Rehydration Salts (WHO Formula)', apparatusIds: ['app_compounding_mortar'] },
      { id: 'pwd_efferv', title: 'Exp 4(b): Effervescent Sodium Phosphate Granules', apparatusIds: ['app_compounding_mortar'] },
      { id: 'supp_zinc', title: 'Exp 5(a): Zinc Oxide Suppository – BPC', apparatusIds: ['app_suppository_mould'] },
      { id: 'semi_whitfield', title: 'Exp 6(a): Whitfield’s Benzoic + Salicylic Acid Ointment', apparatusIds: ['app_compounding_mortar'] },
      { id: 'gargle_povidone', title: 'Exp 7(a): Mandl’s / Compound Iodine Paint & Gargle', apparatusIds: ['app_compounding_mortar'] },
      { id: 'mw_chx', title: 'Exp 7(b): Chlorhexidine Mouthwash (0.2% w/v)', apparatusIds: ['app_compounding_mortar'] }
    ],
    defaultSearchQuery: 'mortar pestle compounding glassware pharmaceutics'
  },
  exp_pharm_suppository: {
    id: 'exp_pharm_suppository',
    code: 'Calc 5',
    title: 'Suppository Displacement Value & Mould Calibration',
    moduleId: 'general_pharmacy',
    tab: 'suppository',
    departmentId: 'pharmaceutics',
    subjectCode: 'BP102T',
    departmentLabel: 'Pharmaceutics',
    apparatusIds: ['app_suppository_mould', 'app_compounding_mortar'],
    setupSummary:
      'Calibrated split suppository mould paired with a gentle water bath dish to fuse cocoa butter without exceeding 35–36°C.',
    steps: [
      {
        id: 'mould_calibration',
        title: 'Mould Capacity & Displacement Value Calibration',
        apparatusIds: ['app_suppository_mould'],
        relevantParts: ['Mould Cavities', 'Water Bath Dish']
      }
    ],
    defaultSearchQuery: 'suppository mould pharmaceutics compounding'
  },
  exp_cog_leaf_micrometry: {
    id: 'exp_cog_leaf_micrometry',
    code: 'Exp 8, 9, 12, 13',
    title: 'Leaf Constants, Eyepiece Micrometry & Lycopodium Purity',
    moduleId: 'pharmacognosy',
    tab: 'leaf_constants',
    departmentId: 'pharmacognosy',
    subjectCode: 'BP105T',
    departmentLabel: 'Pharmacognosy',
    apparatusIds: ['app_micrometer_botanical', 'app_compound_microscope'],
    setupSummary:
      'Compound microscope fitted with a 100-division ocular micrometer and stage micrometer (10 µm/div) or camera lucida for quantitative botanical constants.',
    setupFlow: [
      'Mount stage micrometer (10 µm divisions) and align with ocular micrometer scale to compute calibration factor',
      'Replace with cleared leaf lamina (chloral hydrate) or stained powder slide',
      'Count stomata, epidermal cells, vein-islets, crystals, or Lycopodium spores across 1 mm² / fields'
    ],
    setupParts: [
      {
        id: 'part_cog_scope',
        label: 'Compound Light Microscope',
        role: 'instrument',
        apparatusId: 'app_compound_microscope',
        connectionNote: 'Provides calibrated optical magnification (10× × 10×/40×) of cleared tissue.'
      },
      {
        id: 'part_micrometer',
        label: 'Ocular & Stage Micrometer Scales',
        role: 'component',
        apparatusId: 'app_micrometer_botanical',
        connectionNote: 'Converts arbitrary ocular scale divisions into true micrometers (µm).'
      }
    ],
    steps: [
      { id: 'stomatal_index', title: 'Exp 8: Stomatal Number & Stomatal Index', apparatusIds: ['app_micrometer_botanical', 'app_compound_microscope'] },
      { id: 'vein_islet', title: 'Exp 9: Vein-Islet & Vein-let Termination Number', apparatusIds: ['app_micrometer_botanical', 'app_compound_microscope'] },
      { id: 'micrometry', title: 'Exp 12: Eyepiece Micrometry (Ca-Oxalate & Fibers)', apparatusIds: ['app_micrometer_botanical', 'app_compound_microscope'] },
      { id: 'lycopodium', title: 'Exp 13: Lycopodium Spore Method (% Purity)', apparatusIds: ['app_micrometer_botanical', 'app_compound_microscope'] }
    ],
    defaultSearchQuery: 'compound microscope botanical micrometer stomata'
  },
  exp_cog_powder: {
    id: 'exp_cog_powder',
    code: 'Exp 2–5',
    title: 'Powder Microscopy of Crude Medicinal Drugs',
    moduleId: 'pharmacognosy',
    tab: 'powder',
    departmentId: 'pharmacognosy',
    subjectCode: 'BP105T',
    departmentLabel: 'Pharmacognosy',
    apparatusIds: ['app_compound_microscope', 'app_micrometer_botanical'],
    setupSummary:
      'Diagnostic slide clearing (chloral hydrate) and microchemical staining (phloroglucinol + HCl, iodine, Sudan III) examined under compound microscope.',
    steps: [
      { id: 'exp2', title: 'Exp 2: Tulsi Leaf & Cinnamon Bark Powder', apparatusIds: ['app_compound_microscope', 'app_micrometer_botanical'] },
      { id: 'exp3', title: 'Exp 3: Clove Bud & Fennel Fruit Powder', apparatusIds: ['app_compound_microscope', 'app_micrometer_botanical'] },
      { id: 'exp4', title: 'Exp 4: Ginger Rhizome & Senna Leaf Powder', apparatusIds: ['app_compound_microscope', 'app_micrometer_botanical'] },
      { id: 'exp5', title: 'Exp 5: Ephedra Stem & Arjuna Bark Powder', apparatusIds: ['app_compound_microscope', 'app_micrometer_botanical'] }
    ],
    defaultSearchQuery: 'botanical microscopy plant cell trichome'
  },
  exp_cog_morphology: {
    id: 'exp_cog_morphology',
    code: 'Exp 1',
    title: 'Morphological Study of Unit V Medicinal Plants (20 Drugs)',
    moduleId: 'pharmacognosy',
    tab: 'morphology',
    departmentId: 'pharmacognosy',
    subjectCode: 'BP105T',
    departmentLabel: 'Pharmacognosy',
    apparatusIds: ['app_micrometer_botanical', 'app_compound_microscope'],
    setupSummary: 'Macroscopic organoleptic and anatomical voucher inspection of official medicinal plants.',
    steps: [
      { id: 'unit5_plants', title: 'Unit V Crude Drug Morphology', apparatusIds: ['app_micrometer_botanical'] }
    ],
    defaultSearchQuery: 'medicinal plant botanical leaf root bark'
  },
  exp_cog_physicochemical: {
    id: 'exp_cog_physicochemical',
    code: 'Exp 6, 7, 10, 11',
    title: 'Physicochemical Evaluation of Crude Drugs (LOD, Swelling, Ash)',
    moduleId: 'pharmacognosy',
    tab: 'physicochemical',
    departmentId: 'pharmacognosy',
    subjectCode: 'BP105T',
    departmentLabel: 'Pharmacognosy',
    apparatusIds: ['app_swelling_ash_glassware'],
    setupSummary:
      'Silica crucible ignition, stoppered 25 mL swelling cylinder, hot air LOD weighing bottle, and extractive reflux apparatus.',
    steps: [
      { id: 'lod_swelling', title: 'Exp 6 & 7: Loss on Drying & Swelling Factor', apparatusIds: ['app_swelling_ash_glassware'] },
      { id: 'ash_extractive', title: 'Exp 10 & 11: Total Ash, Acid-Insoluble Ash & Extractives', apparatusIds: ['app_swelling_ash_glassware'] }
    ],
    defaultSearchQuery: 'crucible graduated cylinder laboratory'
  },
  exp_anat_microscopy: {
    id: 'exp_anat_microscopy',
    code: 'Exp 1–3',
    title: 'Compound Microscopy, Cell Ultrastructure & Tissue Histology',
    moduleId: 'anatomy',
    tab: 'microscopy',
    departmentId: 'anatomy',
    subjectCode: 'BP104T',
    departmentLabel: 'Anatomy & Physiology',
    apparatusIds: ['app_compound_microscope'],
    setupSummary:
      'Binocular compound microscope optical path (sub-stage illuminator → Abbe condenser → specimen slide → objective lens → 10× ocular).',
    setupFlow: [
      'Place H&E stained tissue slide on mechanical stage clips',
      'Focus first under 10× objective with coarse knob, then switch to 40×/100× oil using fine focus only',
      'Inspect cellular organelles and primary tissue architecture'
    ],
    steps: [
      { id: 'compound_scope', title: 'Exp 1: Compound Microscope Optics & Magnification', apparatusIds: ['app_compound_microscope'], focusKeyword: 'microscope' },
      { id: 'histology_tissues', title: 'Exp 2–3: Epithelial, Connective, Muscular & Nervous Tissues', apparatusIds: ['app_compound_microscope'], focusKeyword: 'cell' }
    ],
    defaultSearchQuery: 'compound microscope eukaryotic cell histology'
  },
  exp_anat_bones: {
    id: 'exp_anat_bones',
    code: 'Exp 4–5',
    title: 'Axial (80) & Appendicular (126) Skeleton Osteology',
    moduleId: 'anatomy',
    tab: 'bones',
    departmentId: 'anatomy',
    subjectCode: 'BP104T',
    departmentLabel: 'Anatomy & Physiology',
    apparatusIds: ['app_compound_microscope'],
    setupSummary: 'Regional inspection of articulated human skeletal specimens across axial and appendicular divisions.',
    steps: [
      { id: 'axial', title: 'Exp 4: Axial Skeleton (80 Bones — Skull, Vertebrae, Rib Cage)', focusKeyword: 'skull' },
      { id: 'appendicular', title: 'Exp 5: Appendicular Skeleton (126 Bones — Pectoral, Pelvic & Limbs)', focusKeyword: 'skeleton' }
    ],
    defaultSearchQuery: 'human skeleton femur skull anatomy bone'
  },
  exp_anat_hematology: {
    id: 'exp_anat_hematology',
    code: 'Exp 6–13',
    title: 'Hemocytometry, DLC Smear, Sahli Hb & Blood Grouping',
    moduleId: 'anatomy',
    tab: 'hematology',
    departmentId: 'anatomy',
    subjectCode: 'BP104T',
    departmentLabel: 'Anatomy & Physiology',
    apparatusIds: ['app_neubauer', 'app_sahli_hemoglobinometer', 'app_compound_microscope'],
    setupSummary:
      'Combines Neubauer counting chamber + Thoma dilution pipettes under the compound microscope with Sahli’s acid hematin comparator and ABO/Rh agglutination slides.',
    setupParts: [
      {
        id: 'part_neubauer_chamber',
        label: 'Neubauer Chamber & Thoma Pipettes',
        role: 'apparatus',
        apparatusId: 'app_neubauer',
        connectionNote: 'Dilutes whole blood (Turk 1:20 or Hayem 1:200) and charges the 0.1 mm deep grid.'
      },
      {
        id: 'part_heme_scope',
        label: 'Compound Microscope (10× / 40× / 100× Oil)',
        role: 'instrument',
        apparatusId: 'app_compound_microscope',
        connectionNote: 'Counts Neubauer squares and examines Leishman-stained DLC smears.'
      }
    ],
    steps: [
      { id: 'wbc_neubauer', title: 'Exp 8: Hemocytometry WBC Enumeration', apparatusIds: ['app_neubauer', 'app_compound_microscope'] },
      { id: 'hb_sahli', title: 'Exp 11: Hemoglobin Diagnostic Analyzer (Sahli’s)', apparatusIds: ['app_sahli_hemoglobinometer'] },
      { id: 'dlc_smear', title: 'Exp 8(b): Differential Leukocyte Count (Leishman Smear)', apparatusIds: ['app_compound_microscope'] },
      { id: 'rbc_neubauer', title: 'Exp 9: Total RBC Count (Hayem’s Fluid)', apparatusIds: ['app_neubauer', 'app_compound_microscope'] },
      { id: 'blood_grouping', title: 'Exp 12: ABO & Rh Slide Agglutination', apparatusIds: ['app_compound_microscope'] }
    ],
    defaultSearchQuery: 'neubauer hemocytometer microscope hemoglobin'
  },
  exp_anat_cardio: {
    id: 'exp_anat_cardio',
    code: 'Exp 14–16',
    title: 'Blood Pressure, Pulse & 12-Lead ECG Cardiovascular Bench',
    moduleId: 'anatomy',
    tab: 'cardio',
    departmentId: 'anatomy',
    subjectCode: 'BP104T',
    departmentLabel: 'Anatomy & Physiology',
    apparatusIds: ['app_sphygmomanometer_ecg'],
    setupSummary:
      'Auscultatory sphygmomanometry and cardiac conduction system / ECG P-QRS-T rhythm recording.',
    steps: [
      { id: 'normal', title: 'Normal Sinus Rhythm (SA → AV → Bundle of His → Purkinje)', apparatusIds: ['app_sphygmomanometer_ecg'], focusKeyword: 'heart' },
      { id: 'sinus_tachy', title: 'Sinus Tachycardia (>100 bpm)', apparatusIds: ['app_sphygmomanometer_ecg'], focusKeyword: 'heart' },
      { id: 'sinus_brady', title: 'Sinus Bradycardia (<60 bpm)', apparatusIds: ['app_sphygmomanometer_ecg'], focusKeyword: 'heart' },
      { id: 'st_elev', title: 'Ischemic ST-Segment Elevation Comparison', apparatusIds: ['app_sphygmomanometer_ecg'], focusKeyword: 'heart' }
    ],
    defaultSearchQuery: 'human heart stethoscope sphygmomanometer anatomy'
  }
};

export function getExperimentById(id?: string | null): ExperimentCatalogEntry | null {
  if (!id) return null;
  if (EXPERIMENT_CATALOG[id]) return EXPERIMENT_CATALOG[id];
  const norm = id.trim().toLowerCase();
  return (
    Object.values(EXPERIMENT_CATALOG).find(
      (e) =>
        e.id.toLowerCase() === norm ||
        e.title.toLowerCase() === norm ||
        e.code.toLowerCase() === norm
    ) || null
  );
}

export function getExperimentForWorkspace(
  moduleId?: string | null,
  tab?: string | null
): ExperimentCatalogEntry | null {
  if (!moduleId) return null;
  const all = Object.values(EXPERIMENT_CATALOG).filter((e) => e.moduleId === moduleId);
  if (tab) {
    const exact = all.find((e) => e.tab === tab);
    if (exact) return exact;
  }
  return all[0] || null;
}

export function getApparatusProfile(id?: string | null): ApparatusExplorationProfile | null {
  if (!id) return null;
  return APPARATUS_PROFILES[id] || null;
}

export function resolveApparatusForExperiment(
  exp: ExperimentCatalogEntry | null,
  activeStepId?: string | null
): {
  primaryApparatus: ApparatusExplorationProfile[];
  stepApparatusIds: string[];
  activeStepSpec: ExperimentStepSpec | null;
} {
  if (!exp) {
    return { primaryApparatus: [], stepApparatusIds: [], activeStepSpec: null };
  }
  const activeStepSpec = activeStepId
    ? exp.steps.find((s) => s.id === activeStepId) || null
    : null;
  const stepApparatusIds = activeStepSpec?.apparatusIds || [];
  const mergedIds = Array.from(new Set([...stepApparatusIds, ...exp.apparatusIds]));
  const primaryApparatus = mergedIds
    .map((id) => APPARATUS_PROFILES[id])
    .filter((p): p is ApparatusExplorationProfile => Boolean(p));
  return { primaryApparatus, stepApparatusIds, activeStepSpec };
}

export interface ExperimentAssetHealth {
  ok: boolean;
  statusLabel: string;
  issueMessage?: string;
}

export function validateAssetReferenceHealth(
  asset: Asset3DItem,
  allAssets: Asset3DItem[]
): ExperimentAssetHealth {
  const avail = getAsset3DAvailability(asset);
  if (asset.binaryRefAssetId && !allAssets.some((a) => a.id === asset.binaryRefAssetId)) {
    return {
      ok: false,
      statusLabel: 'Shared Binary Missing',
      issueMessage:
        'The referenced 3D binary owner is no longer in the library. Re-attach a 3D file or unlink cleanly.'
    };
  }
  if (!avail.canOpenViewer) {
    return {
      ok: false,
      statusLabel: avail.label,
      issueMessage:
        'Metadata-only asset: attach a local GLB/STL binary or remote URL in the 3D Library to inspect in 3D.'
    };
  }
  return {
    ok: true,
    statusLabel: avail.label
  };
}

export interface Experiment3DMatch {
  asset: Asset3DItem;
  matchScope: 'step_direct' | 'experiment_direct' | 'subject_context';
  matchingLinkIds: string[];
  matchedRoles: ExperimentAssetRole[];
  roleLabel: string;
  matchedStepTitles: string[];
  setupNotes: string[];
  focusComponentName?: string;
  matchReasons: string[];
  score: number;
  health: ExperimentAssetHealth;
}

function normExpStr(v?: string | null): string {
  return (v || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function matchExperimentAssetsSync(
  allAssets: Asset3DItem[],
  query: {
    experimentId?: string;
    experimentTitle?: string;
    experimentTab?: string;
    stepId?: string;
    stepTitle?: string;
    subjectCode?: string;
    departmentId?: BPharmDepartmentId;
    topicTitle?: string;
    onlyActiveStep?: boolean;
  }
): Experiment3DMatch[] {
  if (!allAssets.length) return [];

  const qExpId = normExpStr(query.experimentId);
  const qExpTitle = normExpStr(query.experimentTitle);
  const qExpTab = normExpStr(query.experimentTab);
  const qStepId = normExpStr(query.stepId);
  const qStepTitle = normExpStr(query.stepTitle);
  const qSubject = normExpStr(query.subjectCode);
  const qDept = normExpStr(query.departmentId);

  const matches: Experiment3DMatch[] = [];

  for (const asset of allAssets) {
    let bestScore = 0;
    let bestScope: Experiment3DMatch['matchScope'] | null = null;
    const matchingLinkIds: string[] = [];
    const matchedRoles = new Set<ExperimentAssetRole>();
    const matchedStepTitles = new Set<string>();
    const setupNotes = new Set<string>();
    const matchReasons: string[] = [];
    let focusComponentName: string | undefined;

    for (const lnk of asset.syllabusLinks || []) {
      const lExpId = normExpStr(lnk.experimentId);
      const lExpTitle = normExpStr(lnk.experimentTitle);
      const lExpTab = normExpStr(lnk.experimentTab);
      const lStepId = normExpStr(lnk.stepId);
      const lStepTitle = normExpStr(lnk.stepTitle);

      const expHit = Boolean(
        (qExpId && lExpId === qExpId) ||
          (qExpTitle && lExpTitle && (lExpTitle === qExpTitle || lExpTitle.includes(qExpTitle) || qExpTitle.includes(lExpTitle))) ||
          (qExpTab && lExpTab && lExpTab === qExpTab && (!qDept || normExpStr(lnk.departmentId) === qDept))
      );

      const stepHit = Boolean(
        expHit &&
          (qStepId || qStepTitle) &&
          ((qStepId && lStepId === qStepId) ||
            (qStepTitle && lStepTitle && lStepTitle === qStepTitle))
      );

      const hasDifferentStep = Boolean(
        expHit &&
          (qStepId || qStepTitle) &&
          (lStepId || lStepTitle) &&
          !stepHit
      );

      if (stepHit) {
        bestScore = Math.max(bestScore, 100);
        bestScope = 'step_direct';
        matchingLinkIds.push(lnk.id);
        if (lnk.experimentRole) matchedRoles.add(lnk.experimentRole);
        if (lnk.stepTitle) matchedStepTitles.add(lnk.stepTitle);
        if (lnk.setupNote) setupNotes.add(lnk.setupNote);
        if (!focusComponentName && lnk.focusComponentName) {
          focusComponentName = lnk.focusComponentName;
        }
        matchReasons.push(`Step focus: ${lnk.stepTitle || lnk.stepId}`);
      } else if (expHit && !hasDifferentStep) {
        if (!query.onlyActiveStep) {
          bestScore = Math.max(bestScore, 88);
          if (bestScope !== 'step_direct') bestScope = 'experiment_direct';
          matchingLinkIds.push(lnk.id);
          if (lnk.experimentRole) matchedRoles.add(lnk.experimentRole);
          if (lnk.setupNote) setupNotes.add(lnk.setupNote);
          if (!focusComponentName && lnk.focusComponentName) {
            focusComponentName = lnk.focusComponentName;
          }
          matchReasons.push(`Linked to ${lnk.experimentTitle || query.experimentTitle || 'experiment'}`);
        }
      } else if (expHit && hasDifferentStep && !query.onlyActiveStep) {
        // Still surface under the same experiment (lower priority than active step)
        bestScore = Math.max(bestScore, 74);
        if (bestScope !== 'step_direct') bestScope = 'experiment_direct';
        matchingLinkIds.push(lnk.id);
        if (lnk.experimentRole) matchedRoles.add(lnk.experimentRole);
        if (lnk.stepTitle) matchedStepTitles.add(lnk.stepTitle);
        if (lnk.setupNote) setupNotes.add(lnk.setupNote);
        if (!focusComponentName && lnk.focusComponentName) {
          focusComponentName = lnk.focusComponentName;
        }
        matchReasons.push(`Experiment asset (${lnk.stepTitle || lnk.stepId})`);
      } else if (
        !query.onlyActiveStep &&
        !lExpId &&
        !lExpTitle &&
        qSubject &&
        normExpStr(lnk.subjectCode) === qSubject &&
        (!qDept || normExpStr(lnk.departmentId) === qDept)
      ) {
        bestScore = Math.max(bestScore, 55);
        if (!bestScope) bestScope = 'subject_context';
        matchingLinkIds.push(lnk.id);
        if (lnk.experimentRole) matchedRoles.add(lnk.experimentRole);
        matchReasons.push(`Linked to ${lnk.subjectCode}${lnk.topicTitle ? ` · ${lnk.topicTitle}` : ''}`);
      }
    }

    if (bestScope && bestScore > 0) {
      const primaryRole: ExperimentAssetRole =
        Array.from(matchedRoles)[0] ||
        (asset.category === 'apparatus'
          ? 'apparatus'
          : asset.category === 'instrument'
          ? 'instrument'
          : asset.category === 'molecule' || asset.category === 'chemistry'
          ? 'molecule'
          : asset.category === 'anatomy' || asset.category === 'organ'
          ? 'anatomy'
          : 'reference');

      matches.push({
        asset,
        matchScope: bestScope,
        matchingLinkIds: Array.from(new Set(matchingLinkIds)),
        matchedRoles: Array.from(matchedRoles),
        roleLabel: EXPERIMENT_ROLE_LABELS[primaryRole],
        matchedStepTitles: Array.from(matchedStepTitles),
        setupNotes: Array.from(setupNotes),
        focusComponentName,
        matchReasons: Array.from(new Set(matchReasons)),
        score: bestScore,
        health: validateAssetReferenceHealth(asset, allAssets)
      });
    }
  }

  return matches.sort(
    (a, b) => b.score - a.score || (b.asset.updatedAt || 0) - (a.asset.updatedAt || 0)
  );
}

export interface AssetExperimentRelation {
  id: string;
  code: string;
  title: string;
  moduleId: string;
  tab: string;
  departmentLabel: string;
  linkSource: 'direct_experiment' | 'step_linked' | 'topic_context';
  roleLabel?: string;
  stepTitle?: string;
  setupNote?: string;
  focusComponentName?: string;
}

export function getRelatedExperimentsForAsset(
  asset: Asset3DItem,
  syllabi: SyllabusProfile[] = []
): AssetExperimentRelation[] {
  const map = new Map<string, AssetExperimentRelation>();
  const topicTabMap = new Map<string, string>();

  for (const syl of syllabi) {
    for (const sub of syl.subjects) {
      for (const unit of sub.units) {
        for (const topic of unit.topics) {
          if (topic.linkedLabTab) {
            topicTabMap.set(topic.id, topic.linkedLabTab);
          }
        }
      }
    }
  }

  const deptToModule = (dept: SyllabusAssociation['departmentId']): string | undefined => {
    switch (dept) {
      case 'anatomy':
        return 'anatomy';
      case 'pharmaceutics':
      case 'industrial_pharmacy':
        return 'general_pharmacy';
      case 'pharmaceutical_chemistry':
      case 'pharmaceutical_analysis':
        return 'inorganic';
      case 'pharmacognosy':
        return 'pharmacognosy';
      case 'clinical_pharmacy':
        return 'psychology';
      default:
        return undefined;
    }
  };

  for (const lnk of asset.syllabusLinks || []) {
    // 1. Direct match against EXPERIMENT_CATALOG
    const catalogHit =
      getExperimentById(lnk.experimentId) ||
      getExperimentById(lnk.experimentTitle) ||
      (lnk.experimentTab ? getExperimentForWorkspace(deptToModule(lnk.departmentId), lnk.experimentTab) : null);

    if (catalogHit) {
      const key = `${catalogHit.moduleId}:${catalogHit.id}:${lnk.stepId || ''}`;
      map.set(key, {
        id: catalogHit.id,
        code: catalogHit.code,
        title: catalogHit.title,
        moduleId: catalogHit.moduleId,
        tab: catalogHit.tab,
        departmentLabel: catalogHit.departmentLabel,
        linkSource: lnk.stepId || lnk.stepTitle ? 'step_linked' : 'direct_experiment',
        roleLabel: lnk.experimentRole ? EXPERIMENT_ROLE_LABELS[lnk.experimentRole] : undefined,
        stepTitle: lnk.stepTitle,
        setupNote: lnk.setupNote,
        focusComponentName: lnk.focusComponentName
      });
      continue;
    }

    // 2. Match against workspace practicals via topic or experiment string
    const modId = deptToModule(lnk.departmentId);
    const ws = modId ? DEPARTMENT_WORKSPACES[modId] : undefined;
    if (ws) {
      const topicTab = lnk.topicId ? topicTabMap.get(lnk.topicId) : undefined;
      for (const exp of ws.experiments) {
        const directStr =
          (lnk.experimentId && exp.id === lnk.experimentId) ||
          (lnk.experimentTitle &&
            exp.title.toLowerCase().includes(lnk.experimentTitle.toLowerCase()));
        const viaTab = Boolean(
          (lnk.experimentTab && exp.tab === lnk.experimentTab) ||
            (topicTab && exp.tab === topicTab)
        );
        if (directStr || viaTab) {
          const key = `${ws.id}:${exp.id}:${lnk.stepId || ''}`;
          if (!map.has(key)) {
            map.set(key, {
              id: exp.id,
              code: exp.code,
              title: exp.title,
              moduleId: ws.id,
              tab: exp.tab,
              departmentLabel: ws.shortLabel,
              linkSource: lnk.stepId ? 'step_linked' : directStr ? 'direct_experiment' : 'topic_context',
              roleLabel: lnk.experimentRole ? EXPERIMENT_ROLE_LABELS[lnk.experimentRole] : undefined,
              stepTitle: lnk.stepTitle,
              setupNote: lnk.setupNote,
              focusComponentName: lnk.focusComponentName
            });
          }
        }
      }
    }

    // 3. Fallback if user entered a freeform experimentTitle without catalog hit
    if (lnk.experimentTitle && ws) {
      const key = `${ws.id}:custom:${normExpStr(lnk.experimentTitle)}:${lnk.stepId || ''}`;
      if (!map.has(key)) {
        map.set(key, {
          id: lnk.experimentId || `custom_${lnk.id}`,
          code: ws.code,
          title: lnk.experimentTitle,
          moduleId: ws.id,
          tab: lnk.experimentTab || ws.defaultTab,
          departmentLabel: BPHARM_DEPARTMENT_LABELS[lnk.departmentId] || ws.shortLabel,
          linkSource: lnk.stepId ? 'step_linked' : 'direct_experiment',
          roleLabel: lnk.experimentRole ? EXPERIMENT_ROLE_LABELS[lnk.experimentRole] : undefined,
          stepTitle: lnk.stepTitle,
          setupNote: lnk.setupNote,
          focusComponentName: lnk.focusComponentName
        });
      }
    }
  }

  return Array.from(map.values());
}
