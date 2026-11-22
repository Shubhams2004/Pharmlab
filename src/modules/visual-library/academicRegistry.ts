import {
  ACADEMIC_DOMAIN_LABELS,
  AcademicCompletenessReport,
  AcademicDomain,
  AcademicReference,
  AcademicSubjectResource,
  AcademicTabId,
  InteractiveAnnotation,
  RelatedPharmaLabLink,
  ResolvedAcademicContext,
  UserAcademicEnrichment
} from './academicTypes';
import { VisualCategory, VisualMediaItem } from './types';

export const ACADEMIC_SUBJECTS: Record<string, AcademicSubjectResource> = {
  subj_nephron: {
    id: 'subj_nephron',
    domain: 'anatomy',
    defaultCategory: 'anatomy',
    departments: ['anatomy', 'general_pharmacy', 'python'],
    identification: {
      primaryName: 'Human Nephron & Renal Corpuscle',
      scientificOrChemicalName: 'Nephronum (Functional Unit of Ren / Kidney)',
      commonNames: ['Nephron', 'Uriniferous Tubule', 'Glomerular Filtration Unit'],
      classification: 'Excretory & Osmoregulatory Functional Unit (~1.0–1.2 million per kidney)',
      taxonomyOrCode: 'BP104T Unit V / Renal Physiology & PK Elimination'
    },
    definition:
      'The nephron is the microscopic structural and functional filtration unit of the kidney responsible for clearing metabolic wastes, regulating extracellular fluid volume, electrolyte balance, acid-base homeostasis, and renal drug elimination.',
    introduction:
      'Each human kidney contains approximately 1 million nephrons arranged across the outer renal cortex and inner renal medulla. A nephron comprises two major divisions: the renal corpuscle (glomerulus enclosed in Bowman’s capsule) where blood plasma is ultrafiltered, and the renal tubule (PCT, Loop of Henle, DCT, and shared collecting duct) where selective reabsorption and active tubular secretion transform ~180 L/day of filtrate into ~1.5 L/day of urine.',
    classificationDetails: [
      {
        label: 'Cortical Nephrons (~80–85%)',
        detail: 'Renal corpuscles lie in the outer cortex with short Loops of Henle that barely penetrate the outer medulla; primary role is routine filtration and solute reabsorption.'
      },
      {
        label: 'Juxtamedullary Nephrons (~15–20%)',
        detail: 'Corpuscles lie near the corticomedullary junction with long Loops of Henle dipping deep into the inner medulla alongside vasa recta; essential for urine concentration.'
      }
    ],
    locationOrOrigin:
      'Distributed within the renal parenchyma: renal corpuscles, PCT, and DCT reside in the renal cortex, while the Loop of Henle and collecting ducts descend into the medullary pyramids.',
    structureSummary:
      'Consists of an afferent arteriole feeding a high-pressure fenestrated glomerular capillary tuft surrounded by podocytes and Bowman’s capsule, draining sequentially into the Proximal Convoluted Tubule (PCT), Loop of Henle, Distal Convoluted Tubule (DCT), and Collecting Duct.',
    components: [
      {
        name: 'Glomerulus & Bowman’s Capsule (Renal Corpuscle)',
        description: 'Three-layer filtration barrier (fenestrated endothelium, negatively charged glomerular basement membrane, podocyte slit diaphragms) filtering plasma free of large proteins.'
      },
      {
        name: 'Proximal Convoluted Tubule (PCT)',
        description: 'Simple cuboidal epithelium with dense microvilli brush border and abundant mitochondria; reabsorbs ~65–70% of filtered Na⁺, water, and 100% of glucose/amino acids (normal load).'
      },
      {
        name: 'Loop of Henle',
        description: 'Hairpin countercurrent multiplier: thin descending limb is water-permeable; thick ascending limb (TAL) actively pumps Na⁺-K⁺-2Cl⁻ via NKCC2 while remaining water-impermeable.'
      },
      {
        name: 'Distal Convoluted Tubule (DCT) & JGA',
        description: 'Early DCT reabsorbs NaCl via NCC under thiazide sensitivity; Macula Densa cells sense luminal NaCl delivery to regulate GFR and renin release via JGA.'
      },
      {
        name: 'Collecting Duct',
        description: 'Principal cells regulate facultative water reabsorption via ADH-responsive Aquaporin-2 (AQP2) and Na⁺/K⁺ exchange via aldosterone; intercalated cells control H⁺/HCO₃⁻ balance.'
      }
    ],
    functions: [
      'Glomerular ultrafiltration of blood plasma (~125 mL/min GFR) driven by net filtration pressure (~10 mmHg).',
      'Selective tubular reabsorption of water, glucose, amino acids, bicarbonate, and essential electrolytes.',
      'Active tubular secretion of H⁺, K⁺, organic acids (penicillins, loop diuretics, uric acid via OATs), and organic bases (creatinine, metformin via OCTs).',
      'Maintenance of systemic blood pressure and extracellular osmolarity via RAAS and ADH feedback.'
    ],
    physiologicalRole:
      'Preserves plasma osmolarity (~285–295 mOsm/kg) and arterial pH (7.35–7.45) while eliminating nitrogenous wastes (urea, uric acid, creatinine) and water-soluble xenobiotics.',
    associatedOrgansOrSystems: [
      'Cardiovascular System (receives ~20–25% of cardiac output; RAAS blood pressure regulation)',
      'Endocrine System (Renin, Erythropoietin, Calcitriol 1α-hydroxylation, Aldosterone & ADH targets)',
      'Hepatic-Renal Drug Clearance Axis (Phase II water-soluble conjugates excreted renally)'
    ],
    mechanism: {
      title: 'Three-Step Urine Formation & Renal Drug Clearance',
      summary:
        'Urine formation and renal drug excretion follow the mass-balance principle: Excretion = Filtration + Secretion − Reabsorption.',
      steps: [
        '1. Glomerular Ultrafiltration: High hydrostatic pressure (~55–60 mmHg) in glomerular capillaries pushes water and unbound solutes (< ~60 kDa; unbound drug fraction f_u) across the filtration barrier into Bowman’s space.',
        '2. Tubular Reabsorption: PCT reabsorbs ~65% of Na⁺/H₂O via Na⁺/K⁺-ATPase gradients and SGLT2; lipid-soluble, unionized drugs passively diffuse back into peritubular capillaries (pH-dependent ion trapping).',
        '3. Tubular Secretion: PCT Organic Anion Transporters (OAT1/3) and Organic Cation Transporters (OCT2) actively secrete protein-bound and unbound drugs (e.g., penicillin, furosemide, methotrexate) into the lumen.',
        '4. Concentration & Final Adjustment: Loop of Henle establishes medullary hypertonicity (300 → 1200 mOsm/L), allowing ADH to concentrate urine in the collecting duct.'
      ]
    },
    clinicalSignificance: [
      'Estimated GFR (eGFR) and creatinine clearance (Cockcroft-Gault) guide renal dose adjustment to prevent drug toxicity.',
      'Urinary alkalinization (NaHCO₃) traps weak acid toxins like aspirin or phenobarbital in ionized form inside the tubular lumen, accelerating excretion.',
      'Glomerular basement membrane injury manifests as proteinuria (nephrotic syndrome) or hematuria (nephritic syndrome).'
    ],
    pharmaceuticalSignificance: [
      'Primary target of major diuretic classes (CAIs at PCT, Loop diuretics at TAL NKCC2, Thiazides at DCT NCC, K⁺-sparing at Collecting Duct).',
      'Probenecid competitively inhibits OAT-mediated PCT secretion of penicillin, prolonging antibiotic plasma half-life.',
      'SGLT2 inhibitors (dapagliflozin, empagliflozin) block proximal glucose reabsorption to manage Type 2 Diabetes and heart failure.'
    ],
    applications: [
      'Renal clearance and half-life (t₁/₂) pharmacokinetic modeling in biopharmaceutics.',
      'Clinical toxicology decontamination via forced alkaline or acidic diuresis.',
      'Nephrotoxicity screening for aminoglycosides, NSAIDs, and cisplatin.'
    ],
    associatedDiseases: [
      {
        name: 'Chronic Kidney Disease (CKD)',
        summary: 'Progressive nephron loss causing reduced GFR (<60 mL/min/1.73 m²), uremia, metabolic acidosis, and renal anemia.'
      },
      {
        name: 'Glomerulonephritis & Nephrotic Syndrome',
        summary: 'Immune-complex or podocyte injury damaging filtration selectivity, causing >3.5 g/day proteinuria and edema.'
      },
      {
        name: 'Acute Kidney Injury (AKI) / Acute Tubular Necrosis',
        summary: 'Sudden GFR decline from renal ischemia or nephrotoxic drugs (aminoglycosides, NSAIDs + ACEi + diuretic triple whammy).'
      }
    ],
    importantCharacteristics: [
      'Normal GFR: ~125 mL/min (~180 L/day); >99% of filtrate is reabsorbed.',
      'Renal threshold for glucose: ~180 mg/dL (exceeding SGLT2 transport maximum causes glycosuria).',
      'Afferent arteriole is wider than efferent arteriole, maintaining high glomerular capillary hydrostatic pressure.'
    ],
    examKeyPoints: [
      'PCT performs obligatory reabsorption of ~65–70% of filtered Na⁺, Cl⁻, and water plus 100% of glucose and amino acids.',
      'Thick Ascending Limb of Loop of Henle is impermeable to water ("diluting segment") and expresses the NKCC2 cotransporter.',
      'Macula Densa (DCT) + Juxtaglomerular granular cells (afferent arteriole) form the JGA controlling renin release.',
      'Only unbound (free) drug is filtered at the glomerulus; however, active tubular secretion in PCT can clear protein-bound drugs rapidly.'
    ],
    mcqs: [
      {
        id: 'nephron_mcq_1',
        question: 'Which nephron segment reabsorbs virtually 100% of filtered glucose under normal physiological blood glucose levels (<180 mg/dL)?',
        options: [
          'Glomerular Bowman’s capsule',
          'Proximal Convoluted Tubule (PCT)',
          'Thin Descending Limb of Loop of Henle',
          'Medullary Collecting Duct'
        ],
        correctIndex: 1,
        explanation: 'The Proximal Convoluted Tubule expresses SGLT2 and SGLT1 sodium-glucose cotransporters along its microvillous brush border, reabsorbing virtually 100% of filtered glucose.'
      },
      {
        id: 'nephron_mcq_2',
        question: 'Why does alkalinizing urine with sodium bicarbonate accelerate the renal elimination of aspirin (a weak organic acid)?',
        options: [
          'It increases glomerular pore diameter',
          'It ionizes aspirin in the lumen, preventing passive lipid reabsorption (ion trapping)',
          'It blocks aquaporin-2 channels in the collecting duct',
          'It converts salicylic acid into an insoluble salt'
        ],
        correctIndex: 1,
        explanation: 'At higher urinary pH, weak acids like salicylate become predominantly ionized (charged), reducing passive back-diffusion across tubular membranes.'
      }
    ],
    relatedTopics: [
      'Renal Drug Elimination & Clearance',
      'Diuretic Pharmacology (Loop, Thiazide, K⁺-Sparing)',
      'Renin-Angiotensin-Aldosterone System (RAAS)',
      'Body Fluid Compartments & Osmolarity'
    ],
    relatedSubjectIds: ['subj_diuretic_pharmacology', 'subj_heart_anatomy'],
    pharmaLabLinks: [
      {
        id: 'link_nephron_anatomy_theory',
        moduleId: 'anatomy',
        tab: 'theory',
        label: 'BP104T Anatomy & Pathophysiology Theory',
        kind: 'department',
        description: 'Explore homeostasis, fluid balance, and physiological feedback mechanisms.'
      },
      {
        id: 'link_nephron_anatomy_cases',
        moduleId: 'anatomy',
        tab: 'cases',
        label: 'Clinical Case Files (Hypertension & Edema)',
        kind: 'case_study',
        description: 'Inspect RAAS dysregulation and antihypertensive/diuretic pharmacotherapy cases.'
      },
      {
        id: 'link_nephron_pk_plots',
        moduleId: 'pandas',
        tab: null,
        label: 'PK Elimination & Concentration-Time Curves',
        kind: 'simulator',
        description: 'Analyze renal clearance and drug elimination kinetics in BP101T Pandas plots.'
      }
    ],
    equipmentNames: ['Compound Microscope', 'Urinary Refractometer'],
    drugNames: ['Furosemide', 'Hydrochlorothiazide', 'Spironolactone', 'Acetazolamide', 'Probenecid', 'Dapagliflozin'],
    diseaseNames: ['Chronic Kidney Disease', 'Glomerulonephritis', 'Nephrotic Syndrome', 'Hypertension', 'Acute Kidney Injury'],
    textbookKeywords: ['nephron', 'glomerulus', 'bowman', 'tubule', 'filtration', 'kidney', 'renal clearance'],
    searchKeywords: [
      'filtration of blood',
      'blood filtration',
      'urine formation',
      'glomerular filtration rate',
      'gfr',
      'pct',
      'dct',
      'loop of henle',
      'collecting duct',
      'juxtaglomerular apparatus',
      'macula densa',
      'podocytes',
      'renal drug elimination',
      'ion trapping',
      'oat',
      'oct',
      'countercurrent multiplier'
    ],
    annotations: [
      {
        id: 'nephron_glomerulus',
        label: 'Glomerulus & Bowman’s Capsule',
        shortCode: '1',
        xPercent: 22.1,
        yPercent: 25.0,
        regionBox: { x: 15, y: 15, width: 15, height: 21 },
        definition:
          'High-pressure fenestrated capillary tuft invaginated into the double-walled visceral/parietal epithelial cup (Bowman’s capsule) forming the renal corpuscle.',
        location: 'Renal Cortex (vascular pole fed by wider afferent arteriole, drained by narrower efferent arteriole)',
        functionRole:
          'Performs non-selective ultrafiltration of blood plasma (~125 mL/min GFR), allowing water, ions, glucose, and unbound drugs (<60 kDa) into Bowman’s space while retaining plasma proteins and RBCs.',
        physiologicalOrClinicalImportance:
          'Net Filtration Pressure (NFP ≈ 10 mmHg) depends on afferent/efferent arteriolar tone. NSAIDs constrict the afferent arteriole and ACE inhibitors dilate the efferent arteriole, reducing intraglomerular pressure.',
        sourceNote: 'Tortora / Guyton Renal Physiology'
      },
      {
        id: 'nephron_jga',
        label: 'Juxtaglomerular Apparatus (JGA)',
        shortCode: '2',
        xPercent: 30.4,
        yPercent: 18.3,
        regionBox: { x: 25, y: 11, width: 14, height: 12 },
        definition:
          'Specialized feedback sensor formed where the thick ascending limb/early DCT (Macula Densa) contacts renin-secreting juxtaglomerular granular cells of the afferent arteriole.',
        location: 'Vascular pole of the renal corpuscle in the renal cortex',
        functionRole:
          'Monitors distal tubular NaCl delivery (tubuloglomerular feedback) and renal perfusion pressure; releases renin to activate the RAAS cascade.',
        physiologicalOrClinicalImportance:
          'Central target for antihypertensive therapy: β-blockers suppress β₁-mediated renin release, while ACE inhibitors and ARBs block downstream Angiotensin II.',
        sourceNote: 'BP104T / Katzung Renal & Cardiovascular Axis'
      },
      {
        id: 'nephron_pct',
        label: 'Proximal Convoluted Tubule (PCT)',
        shortCode: '3',
        xPercent: 39.6,
        yPercent: 25.0,
        regionBox: { x: 28, y: 18, width: 21, height: 22 },
        definition:
          'Tortuous initial tubular segment lined by simple cuboidal cells with an expansive microvillous brush border and high mitochondrial density.',
        location: 'Renal Cortex immediately continuous with Bowman’s capsule urinary pole',
        functionRole:
          'Reabsorbs ~65–70% of filtered Na⁺, K⁺, Cl⁻, and water, ~85% of HCO₃⁻ (via carbonic anhydrase), and 100% of glucose/amino acids; actively secretes organic acids and bases via OAT/OCT transporters.',
        physiologicalOrClinicalImportance:
          'Site of action for Carbonic Anhydrase Inhibitors (acetazolamide) and SGLT2 inhibitors (dapagliflozin), and primary site for active renal secretion of penicillins and loop diuretics.',
        sourceNote: 'Guyton & Hall / Tripathi Pharmacology'
      },
      {
        id: 'nephron_loop',
        label: 'Loop of Henle (Descending & Ascending Limbs)',
        shortCode: '4',
        xPercent: 46.7,
        yPercent: 68.9,
        regionBox: { x: 39, y: 49, width: 15, height: 32 },
        definition:
          'Hairpin-shaped tubular loop comprising a water-permeable thin descending limb and a water-impermeable ascending limb (thin + thick segments).',
        location: 'Extends from Renal Cortex into the Renal Medulla and returns to the Cortex',
        functionRole:
          'Establishes the corticomedullary osmotic gradient (300 → 1200 mOsm/L) via countercurrent multiplication; the Thick Ascending Limb actively reabsorbs ~25% of filtered NaCl via the NKCC2 transporter.',
        physiologicalOrClinicalImportance:
          'Thick Ascending Limb NKCC2 is inhibited by high-ceiling Loop Diuretics (furosemide, torsemide), producing potent diuresis and increased Ca²⁺/Mg²⁺ excretion.',
        sourceNote: 'Guyton & Hall / IP Pharmacology Reference'
      },
      {
        id: 'nephron_dct',
        label: 'Distal Convoluted Tubule (DCT)',
        shortCode: '5',
        xPercent: 62.1,
        yPercent: 26.1,
        regionBox: { x: 51, y: 18, width: 24, height: 14 },
        definition:
          'Cortical convoluted tubular segment following the macula densa, lined by cuboidal cells lacking a brush border.',
        location: 'Renal Cortex downstream of the Thick Ascending Limb',
        functionRole:
          'Reabsorbs ~5–8% of filtered Na⁺ and Cl⁻ via the electroneutral Na⁺-Cl⁻ cotransporter (NCC) and performs Parathyroid Hormone (PTH)-regulated Ca²⁺ reabsorption.',
        physiologicalOrClinicalImportance:
          'Target of Thiazide diuretics (hydrochlorothiazide, chlorthalidone), which block NCC and paradoxically reduce urinary calcium excretion (useful in recurrent calcium renal stones).',
        sourceNote: 'Tortora / Tripathi Diuretics'
      },
      {
        id: 'nephron_collecting_duct',
        label: 'Collecting Duct',
        shortCode: '6',
        xPercent: 77.5,
        yPercent: 52.2,
        regionBox: { x: 73, y: 15, width: 12, height: 74 },
        definition:
          'Shared terminal drainage tubule lined by Principal cells (Na⁺/K⁺/water regulation) and α/β-Intercalated cells (H⁺/HCO₃⁻ acid-base regulation).',
        location: 'Spans from Renal Cortex down through the Medullary Pyramid to the Renal Papilla',
        functionRole:
          'Fine-tunes final urine volume and osmolarity under Antidiuretic Hormone (ADH inserting Aquaporin-2 channels) and Aldosterone (upregulating ENaC and ROMK channels).',
        physiologicalOrClinicalImportance:
          'Site of action for Potassium-sparing diuretics (spironolactone, amiloride); ADH deficiency or V2 receptor resistance causes Diabetes Insipidus.',
        sourceNote: 'Guyton & Hall / BP104T Curriculum'
      }
    ],
    references: [
      {
        title: 'Principles of Anatomy and Physiology (Urinary System)',
        sourceType: 'textbook',
        citation: 'Tortora, G. J., & Derrickson, B. — Standard reference for nephron histology, glomerular filtration, and tubular transport.'
      },
      {
        title: 'Textbook of Medical Physiology (Renal Filtration & Urine Concentration)',
        sourceType: 'textbook',
        citation: 'Hall, J. E. (Guyton and Hall) — Starling forces, countercurrent multiplier, and acid-base regulation.'
      },
      {
        title: 'PharmaLab BP104T / Pharmacokinetics Curriculum Guide',
        sourceType: 'curriculum',
        citation: 'PCI B.Pharm Semester I–II integrated renal physiology and pharmacokinetic clearance framework.'
      }
    ],
    contentStatus: 'verified-curriculum',
    accuracyNotes:
      'Anatomical landmarks and physiological metrics are aligned with standard B.Pharm (PCI BP104T) anatomy/physiology textbooks. Supplementary pharmacokinetic notes link glomerular filtration and tubular transport to renal drug clearance.'
  },

  subj_heart_anatomy: {
    id: 'subj_heart_anatomy',
    domain: 'anatomy',
    defaultCategory: 'anatomy',
    departments: ['anatomy', 'psychology'],
    identification: {
      primaryName: 'Human Heart — Chambers, Valves & Great Vessels',
      scientificOrChemicalName: 'Cor (Four-Chambered Muscular Cardiovascular Pump)',
      commonNames: ['Human Heart', 'Cardiac Pump', 'Heart Cross-Section'],
      classification: 'Cardiovascular System — Hollow Fibromuscular Organ',
      taxonomyOrCode: 'BP104T Unit V / BP109P Exp 14–16a'
    },
    definition:
      'The human heart is a four-chambered muscular organ in the middle mediastinum that maintains unidirectional pulmonary and systemic blood circulation via coordinated electrical conduction and pressure-driven heart valves.',
    introduction:
      'Divided functionally into a low-pressure right pump (receiving deoxygenated systemic venous blood and ejecting it to the lungs) and a high-pressure left pump (receiving oxygenated pulmonary venous blood and ejecting it through the aorta to systemic tissues). Four valves prevent retrograde flow during the cardiac cycle.',
    locationOrOrigin:
      'Middle mediastinum between the lungs, tilted obliquely with two-thirds of its mass left of the midline; apex rests near the left 5th intercostal space at the midclavicular line.',
    structureSummary:
      'Wall consists of epicardium, thick striated myocardium, and smooth endothelial endocardium; encloses two superior receiving atria, two inferior pumping ventricles, interventricular septum, two AV valves (tricuspid, mitral), and two semilunar valves (pulmonary, aortic).',
    components: [
      { name: 'Right Atrium & SA Node', description: 'Receives deoxygenated blood from SVC/IVC and coronary sinus; houses the Sinoatrial pacemaker (70–80 bpm).' },
      { name: 'Tricuspid Valve (Right AV)', description: 'Three-cusp valve anchored by chordae tendineae and papillary muscles preventing backflow during RV systole.' },
      { name: 'Right Ventricle & Pulmonary Trunk', description: 'Thinner crescentic chamber pumping blood at ~25/8 mmHg through the pulmonary valve toward the lungs.' },
      { name: 'Left Atrium & Mitral (Bicuspid) Valve', description: 'Receives oxygenated blood from 4 pulmonary veins and delivers it across the two-leaflet mitral valve into the LV.' },
      { name: 'Left Ventricle & Aortic Valve', description: 'Thickest myocardial chamber (~3× RV wall) generating ~120 mmHg systolic pressure to eject blood into the aortic arch.' }
    ],
    functions: [
      'Generates pulsatile arterial pressure driving tissue perfusion (Cardiac Output = HR × SV ≈ 5.0 L/min at rest).',
      'Separates deoxygenated pulmonary blood from oxygenated systemic blood.',
      'Produces S1 ("lub", AV valve closure) and S2 ("dub", semilunar valve closure) heart sounds.',
      'Coordinates atrial-before-ventricular contraction via the SA node → AV node (~0.1 s delay) → Bundle of His → Purkinje network.'
    ],
    physiologicalRole:
      'Sustains oxygen, nutrient, and drug distribution across systemic organs while maintaining venous return and arterial baroreceptor homeostasis.',
    associatedOrgansOrSystems: [
      'Pulmonary Gas Exchange Circuit (Lungs)',
      'Systemic Arterial & Venous Vasculature',
      'Autonomic Nervous System (Sympathetic β₁ increases HR/contractility; Vagus M₂ slows SA/AV nodes)'
    ],
    mechanism: {
      title: 'Cardiac Cycle & Electrical Conduction Sequence',
      summary:
        'Spontaneous pacemaker depolarization in the SA node initiates sequential atrial and ventricular systole synchronized with valve opening and closure.',
      steps: [
        '1. SA Node Firing (P Wave on ECG): Action potential spreads across both atria, triggering atrial contraction (final 20% ventricular filling).',
        '2. AV Nodal Delay (~0.10 s, PR Interval): Slow conduction ensures complete ventricular filling before ventricular depolarization.',
        '3. Ventricular Depolarization & Systole (QRS Complex): Rapid spread via Bundle of His and Purkinje fibers closes AV valves (S1 sound) and opens semilunar valves when LV pressure exceeds aortic diastolic pressure (~80 mmHg).',
        '4. Ventricular Repolarization & Diastole (T Wave): Pressure drops, closing aortic/pulmonary semilunar valves (S2 sound), followed by passive ventricular refilling.'
      ]
    },
    clinicalSignificance: [
      'ST-segment elevation on ECG indicates acute transmural myocardial ischemia/infarction (STEMI) from coronary artery occlusion.',
      'Valvular stenosis or regurgitation produces audible cardiac murmurs and ventricular hypertrophy.',
      'Auscultation and sphygmomanometry (Korotkoff sounds) assess systolic/diastolic arterial blood pressure.'
    ],
    pharmaceuticalSignificance: [
      'Target of β₁-blockers (metoprolol, atenolol), Ca²⁺ channel blockers (amlodipine, verapamil), cardiac glycosides (digoxin), and antiarrhythmics.',
      'Hepatic/cardiac output changes directly alter first-pass clearance and volume of distribution of high-extraction drugs.'
    ],
    associatedDiseases: [
      { name: 'Myocardial Infarction & Angina Pectoris', summary: 'Coronary atherosclerosis and plaque rupture depriving myocardium of O₂.' },
      { name: 'Heart Failure & Arrhythmias', summary: 'Impaired pumping ejection fraction (<40% HFrEF) or disorganized atrial/ventricular conduction.' },
      { name: 'Systemic Hypertension', summary: 'Chronically elevated afterload (>140/90 mmHg) driving left ventricular hypertrophy.' }
    ],
    examKeyPoints: [
      'Left ventricular wall is ~3× thicker than the right ventricle to overcome high systemic vascular resistance.',
      'Mitral (bicuspid) valve has 2 cusps; tricuspid, aortic, and pulmonary valves each have 3 cusps.',
      'First heart sound (S1) = AV valve closure at start of systole; Second heart sound (S2) = semilunar valve closure at start of diastole.',
      'Note on bundled illustration: labels printed inside the AI-rendered raster plate contain minor text typos on two upper vessel callouts; use the verified interactive pins for accurate anatomical study.'
    ],
    mcqs: [
      {
        id: 'heart_mcq_1',
        question: 'Which valve separates the left atrium from the left ventricle and prevents retrograde blood flow during ventricular systole?',
        options: ['Tricuspid valve', 'Pulmonary semilunar valve', 'Mitral (Bicuspid) valve', 'Aortic semilunar valve'],
        correctIndex: 2,
        explanation: 'The mitral (bicuspid) valve guards the left atrioventricular orifice and prevents backflow into the left atrium when the left ventricle contracts.'
      },
      {
        id: 'heart_mcq_2',
        question: 'What physiological purpose is served by the ~0.10 second conduction delay at the Atrioventricular (AV) node?',
        options: [
          'It triggers closure of the aortic valve',
          'It allows the atria to finish contracting and emptying blood into the ventricles before ventricular systole begins',
          'It increases coronary venous return',
          'It suppresses parasympathetic vagal tone'
        ],
        correctIndex: 1,
        explanation: 'The AV nodal delay ensures atrial systole completes ventricular filling prior to ventricular contraction.'
      }
    ],
    relatedTopics: ['ECG Waveform & Arrhythmias', 'Cardiac Output Calculator', 'Antihypertensive Drugs', 'Blood Pressure & Pulse'],
    relatedSubjectIds: ['subj_nephron'],
    pharmaLabLinks: [
      {
        id: 'link_heart_diagrams',
        moduleId: 'anatomy',
        tab: 'diagrams',
        label: 'BP104T Heart & Conduction 2D/3D Diagram',
        kind: 'topic',
        description: 'Compare with the interactive 9-pin cardiac conduction schematic.'
      },
      {
        id: 'link_heart_ecg',
        moduleId: 'anatomy',
        tab: 'cardio',
        label: 'BP109P Exp 14–16: ECG & Blood Pressure Analyzer',
        kind: 'simulator',
        description: 'Inspect Sinus, Bradycardia, Tachycardia, and STEMI ECG waveforms.'
      },
      {
        id: 'link_heart_theory',
        moduleId: 'anatomy',
        tab: 'theory',
        label: 'BP104T Theory & Cardiac Output Calculator',
        kind: 'calculator',
        description: 'Compute Cardiac Output (CO = HR × SV) and Ejection Fraction.'
      },
      {
        id: 'link_heart_cases',
        moduleId: 'anatomy',
        tab: 'cases',
        label: 'Clinical Case Files (Exp 17)',
        kind: 'case_study',
        description: 'Review clinical hypertension and cardiovascular case presentations.'
      }
    ],
    equipmentNames: ['ECG Monitor', 'Sphygmomanometer', 'Stethoscope'],
    drugNames: ['Digoxin', 'Metoprolol', 'Amlodipine', 'Nitroglycerin'],
    diseaseNames: ['Myocardial Infarction', 'Hypertension', 'Heart Failure', 'Arrhythmia'],
    textbookKeywords: ['heart', 'ventricle', 'atrium', 'mitral', 'tricuspid', 'aorta', 'cardiac output', 'ecg'],
    searchKeywords: [
      'cardiac pump',
      'pumping blood',
      'oxygenated blood',
      'deoxygenated blood',
      'sa node',
      'av node',
      'purkinje',
      'semilunar valve',
      'bicuspid valve',
      'systole',
      'diastole',
      'coronary'
    ],
    annotations: [
      {
        id: 'heart_svc',
        label: 'Superior Vena Cava',
        shortCode: '1',
        xPercent: 36.2,
        yPercent: 28.5,
        definition: 'Large valveless venous trunk returning deoxygenated blood from the head, neck, upper limbs, and thorax.',
        location: 'Superior right mediastinum entering the superior wall of the Right Atrium',
        functionRole: 'Delivers systemic upper-body venous return directly to the right atrium.',
        physiologicalOrClinicalImportance: 'Central venous pressure (CVP) catheters are positioned near the SVC-right atrial junction.'
      },
      {
        id: 'heart_aortic_arch',
        label: 'Aortic Arch',
        shortCode: '2',
        xPercent: 50.0,
        yPercent: 23.5,
        definition: 'Curved superior continuation of the ascending aorta giving rise to three major systemic branches.',
        location: 'Superior mediastinum arching over the pulmonary trunk',
        functionRole: 'Supplies oxygenated blood via the brachiocephalic trunk, left common carotid artery, and left subclavian artery.',
        physiologicalOrClinicalImportance: 'Houses aortic arch baroreceptors (CN X) regulating acute blood pressure reflexes.'
      },
      {
        id: 'heart_pulmonary_trunk',
        label: 'Pulmonary Trunk',
        shortCode: '3',
        xPercent: 52.8,
        yPercent: 36.0,
        definition: 'Major arterial vessel exiting the right ventricle and bifurcating into left and right pulmonary arteries.',
        location: 'Anterior and inferior to the aortic arch',
        functionRole: 'Carries deoxygenated venous blood to the alveolar capillary beds of both lungs.',
        physiologicalOrClinicalImportance: 'Obstruction by deep-vein thromboembolism causes life-threatening Pulmonary Embolism.'
      },
      {
        id: 'heart_ra',
        label: 'Right Atrium',
        shortCode: '4',
        xPercent: 37.2,
        yPercent: 50.5,
        definition: 'Thin-walled upper right receiving chamber containing pectinate muscles and the SA node.',
        location: 'Right superior border of the heart',
        functionRole: 'Collects systemic venous blood from SVC, IVC, and coronary sinus; initiates cardiac electrical rhythm at the SA node.',
        physiologicalOrClinicalImportance: 'Atrial fibrillation originates from disorganized atrial impulses, increasing thromboembolic stroke risk.'
      },
      {
        id: 'heart_tricuspid',
        label: 'Tricuspid Valve (Right AV)',
        shortCode: '5',
        xPercent: 40.5,
        yPercent: 63.8,
        definition: 'Three-leaflet atrioventricular valve anchored by chordae tendineae to right ventricular papillary muscles.',
        location: 'Right atrioventricular orifice between Right Atrium and Right Ventricle',
        functionRole: 'Opens during ventricular diastole and snaps shut during systole to prevent backflow into the right atrium.'
      },
      {
        id: 'heart_rv',
        label: 'Right Ventricle',
        shortCode: '6',
        xPercent: 50.0,
        yPercent: 75.5,
        definition: 'Crescent-shaped lower pumping chamber with moderate myocardial thickness (~3–5 mm).',
        location: 'Forms most of the anterior (sternocostal) surface of the heart',
        functionRole: 'Ejects deoxygenated blood across the pulmonary semilunar valve into the low-resistance pulmonary circulation.'
      },
      {
        id: 'heart_aortic_valve',
        label: 'Aortic Semilunar Valve',
        shortCode: '7',
        xPercent: 47.0,
        yPercent: 52.0,
        definition: 'Tri-cuspid pocket valve guarding the outflow tract from the left ventricle into the ascending aorta.',
        location: 'Central fibrous skeleton between LV outflow tract and ascending aorta',
        functionRole: 'Opens when LV systolic pressure exceeds aortic diastolic pressure; closes cleanly on diastole (S2 sound) to maintain coronary perfusion.'
      },
      {
        id: 'heart_la',
        label: 'Left Atrium',
        shortCode: '8',
        xPercent: 59.0,
        yPercent: 45.8,
        definition: 'Posterior smooth-walled receiving chamber fed by four pulmonary veins.',
        location: 'Upper posterior-left base of the heart',
        functionRole: 'Receives freshly oxygenated blood from the lungs and delivers it across the mitral valve into the left ventricle.'
      },
      {
        id: 'heart_mitral',
        label: 'Mitral (Bicuspid) Valve',
        shortCode: '9',
        xPercent: 59.5,
        yPercent: 56.2,
        definition: 'Two-cusp left atrioventricular valve (anterior and posterior leaflets) tethered by strong chordae tendineae.',
        location: 'Between Left Atrium and Left Ventricle',
        functionRole: 'Prevents high-pressure systolic regurgitation into the left atrium and pulmonary veins.',
        physiologicalOrClinicalImportance: 'Rheumatic heart disease classically damages the mitral valve, causing mitral stenosis or regurgitation.'
      },
      {
        id: 'heart_lv',
        label: 'Left Ventricle',
        shortCode: '10',
        xPercent: 62.5,
        yPercent: 71.0,
        definition: 'Conical, thick-walled muscular chamber (~10–15 mm myocardium) forming the cardiac apex.',
        location: 'Left inferior border extending to the apex',
        functionRole: 'Generates ~120 mmHg systolic pressure to perfuse all systemic organs including brain, kidneys, and myocardium.',
        physiologicalOrClinicalImportance: 'Left ventricular ejection fraction (LVEF, normal 55–70%) is the key clinical metric of systolic heart failure.'
      }
    ],
    references: [
      {
        title: 'Principles of Anatomy and Physiology (The Cardiovascular System: The Heart)',
        sourceType: 'textbook',
        citation: 'Tortora, G. J., & Derrickson, B. — Standard B.Pharm BP104T cardiovascular anatomy and cardiac cycle reference.'
      },
      {
        title: 'Ross & Wilson Anatomy and Physiology in Health and Illness',
        sourceType: 'textbook',
        citation: 'Waugh, A., & Grant, A. — Cardiac valves, conduction system, and heart sound correlations.'
      }
    ],
    contentStatus: 'verified-curriculum',
    accuracyNotes:
      'Interactive pin coordinates were directly calibrated on the bundled plate. Note: two text strings printed directly inside the raster illustration contain spelling/anatomical artifacts; the interactive pins provide the verified anatomical labels.'
  },

  subj_eukaryotic_cell: {
    id: 'subj_eukaryotic_cell',
    domain: 'anatomy',
    defaultCategory: 'anatomy',
    departments: ['anatomy', 'pharmacognosy'],
    identification: {
      primaryName: 'Eukaryotic Cell Ultrastructure',
      scientificOrChemicalName: 'Cellula Eukaryotica (Membrane-Bound Organelle System)',
      commonNames: ['Animal / Eukaryotic Cell', 'Cellular Ultrastructure'],
      classification: 'BP104T Unit I — Cellular Level of Organization',
      taxonomyOrCode: 'BP104T Unit I'
    },
    definition:
      'A eukaryotic cell is the fundamental membrane-bound structural and metabolic unit of higher organisms, characterized by a double-membraned true nucleus and specialized cytoplasmic organelles.',
    introduction:
      'Understanding eukaryotic membrane transport, organelle specialization, and intracellular signaling is foundational in pharmacy because virtually all drugs cross phospholipid bilayers, bind membrane receptors/transporters, or alter intracellular metabolic organelles.',
    locationOrOrigin: 'Found throughout human tissues (epithelial, connective, muscular, nervous) and higher plant tissues (with additional cell wall & plastids).',
    structureSummary:
      'Bounded by a selectively permeable Fluid-Mosaic Phospholipid Bilayer enclosing cytosol, cytoskeleton, genetic nucleus, endomembrane synthesis system (RER, SER, Golgi, lysosomes), and bioenergetic mitochondria.',
    components: [
      { name: 'Plasma Membrane', description: 'Fluid-mosaic phospholipid bilayer with cholesterol, ion channels, GPCRs, and active pumps (Na⁺/K⁺-ATPase).' },
      { name: 'Nucleus & Nucleolus', description: 'Double nuclear envelope with nuclear pores housing DNA chromatin and ribosomal RNA assembly site.' },
      { name: 'Rough & Smooth Endoplasmic Reticulum', description: 'RER (80S ribosomes) translates secretory/membrane proteins; SER synthesizes lipids/steroids and houses CYP450 drug-metabolizing enzymes (especially in hepatocytes).' },
      { name: 'Golgi Apparatus', description: 'Polarized cis-to-trans cisternae performing glycosylation, sulfation, and vesicular sorting.' },
      { name: 'Mitochondria', description: 'Double-membraned cristae organelles executing Krebs cycle, β-oxidation, oxidative phosphorylation (ATP), and intrinsic apoptosis.' },
      { name: 'Lysosomes & Centrosome', description: 'Acidic hydrolase vesicles (pH ~4.8) for macromolecule breakdown; microtubule-organizing centrosome for mitosis.' }
    ],
    functions: [
      'Selective transmembrane solute and drug transport (passive diffusion, facilitated carriers, active ATPases, endocytosis).',
      'Gene transcription (DNA → mRNA) and ribosomal polypeptide synthesis.',
      'Aerobic ATP generation (~30–32 ATP per glucose molecule) in mitochondria.',
      'Xenobiotic biotransformation in smooth ER cytochrome P450 monooxygenases.'
    ],
    physiologicalRole:
      'Maintains cellular homeostasis, resting membrane potential (Na⁺/K⁺-ATPase), tissue regeneration (mitosis), and programmed cell death (apoptosis).',
    mechanism: {
      title: 'Secretory Protein Pathway & Transmembrane Drug Transport',
      summary: 'Proteins destined for secretion or membranes travel through the endomembrane pathway, while drugs cross membranes primarily via pH-partition lipid diffusion or carrier transport.',
      steps: [
        '1. Nuclear Transcription: DNA transcribes mRNA which exits nuclear pores to cytosolic or RER-bound 80S ribosomes.',
        '2. RER Folding & N-Glycosylation: Nascent polypeptides enter the ER lumen for folding and disulfide bonding.',
        '3. Golgi Processing: Transport vesicles fuse with cis-Golgi, undergo post-translational modification, and bud from trans-Golgi toward lysosomes or plasma membrane exocytosis.'
      ]
    },
    clinicalSignificance: [
      'Lysosomal storage disorders arise from inherited hydrolase deficiencies.',
      'Mitochondrial dysfunction and cytochrome c leakage trigger apoptotic cell loss in ischemic injury.'
    ],
    pharmaceuticalSignificance: [
      'Smooth ER (SER) in liver hepatocytes houses CYP450 enzymes responsible for Phase I oxidative drug metabolism and enzyme induction/inhibition interactions.',
      'Ion-trapping of weak bases (e.g., chloroquine) inside acidic lysosomes (pH ~4.8) underlies antimalarial and immunomodulatory pharmacology.',
      'Vinca alkaloids and paclitaxel target mitotic spindle microtubules organized by the centrosome.'
    ],
    associatedDiseases: [
      { name: 'Necrosis vs Apoptosis Disorders', summary: 'Dysregulated apoptosis contributes to oncogenesis or neurodegenerative cell loss.' },
      { name: 'Lysosomal Storage Diseases', summary: 'Enzyme defects leading to undegraded substrate accumulation inside lysosomes.' }
    ],
    examKeyPoints: [
      'Eukaryotic ribosomes are 80S (60S + 40S subunits), whereas prokaryotic and mitochondrial ribosomes are 70S.',
      'Smooth ER lacks ribosomes and is abundant in hepatocytes (CYP450 drug detoxification) and steroidogenic cells.',
      'Lysosomal lumen maintains pH ~4.5–5.0 via vacuolar H⁺-ATPase proton pumps.'
    ],
    mcqs: [
      {
        id: 'cell_mcq_1',
        question: 'Which organelle is most enriched in hepatocytes to carry out Cytochrome P450-mediated Phase I drug metabolism?',
        options: ['Golgi apparatus', 'Smooth Endoplasmic Reticulum (SER)', 'Centrosome', 'Lysosome'],
        correctIndex: 1,
        explanation: 'The Smooth Endoplasmic Reticulum houses membrane-bound CYP450 monooxygenases and UDP-glucuronosyltransferases responsible for xenobiotic metabolism.'
      }
    ],
    relatedTopics: ['Membrane Transport & pH Partitioning', 'Cytochrome P450 Metabolism', 'Cell Division & Mitosis'],
    pharmaLabLinks: [
      {
        id: 'link_cell_diagrams',
        moduleId: 'anatomy',
        tab: 'diagrams',
        label: 'BP104T Cell Organelles Diagram',
        kind: 'topic',
        description: 'Open the Anatomy module interactive cell diagram.'
      },
      {
        id: 'link_cell_theory',
        moduleId: 'anatomy',
        tab: 'theory',
        label: 'BP104T Unit I: Cell Physiology & Transport',
        kind: 'department',
        description: 'Review membrane transport, homeostasis, and cellular junctions.'
      }
    ],
    equipmentNames: ['Compound Microscope', 'Transmission Electron Microscope'],
    drugNames: ['Paclitaxel', 'Vincristine', 'Chloroquine', 'Phenobarbital'],
    diseaseNames: ['Cancer', 'Lysosomal Storage Disorders', 'Ischemic Cell Injury'],
    textbookKeywords: ['cell', 'organelle', 'plasma membrane', 'mitochondria', 'endoplasmic reticulum', 'golgi', 'nucleus'],
    searchKeywords: [
      'phospholipid bilayer',
      'atp synthesis',
      'protein synthesis',
      'cyp450',
      'ribosome',
      'lysosome',
      'autophagy',
      'membrane transport',
      'fluid mosaic'
    ],
    annotations: [
      {
        id: 'cell_membrane',
        label: 'Plasma Membrane (Phospholipid Bilayer)',
        shortCode: '1',
        xPercent: 16.5,
        yPercent: 32.0,
        definition: 'Selectively permeable ~7.5 nm amphipathic lipid bilayer embedded with transmembrane channels, receptors, and pumps.',
        location: 'Outer boundary enclosing the entire cell',
        functionRole: 'Controls nutrient uptake, ion gradients (Na⁺/K⁺-ATPase), signal transduction (GPCRs), and passive/carrier-mediated drug permeation.'
      },
      {
        id: 'cell_mitochondrion',
        label: 'Mitochondrion',
        shortCode: '2',
        xPercent: 54.0,
        yPercent: 72.0,
        definition: 'Double-membraned bioenergetic organelle featuring folded inner cristae and its own circular mitochondrial DNA.',
        location: 'Distributed throughout metabolically active cytoplasm',
        functionRole: 'Synthesizes ATP via oxidative phosphorylation and electron transport chain; regulates intrinsic apoptosis via cytochrome c.'
      },
      {
        id: 'cell_golgi',
        label: 'Golgi Apparatus',
        shortCode: '3',
        xPercent: 35.0,
        yPercent: 54.0,
        definition: 'Stack of flattened membrane-bound cisternae with receiving cis-face and shipping trans-face.',
        location: 'Perinuclear cytoplasm adjacent to the endoplasmic reticulum',
        functionRole: 'Modifies, glycosylates, sorts, and packages proteins/lipids into secretory vesicles or lysosomes.'
      },
      {
        id: 'cell_rer',
        label: 'Rough Endoplasmic Reticulum (RER)',
        shortCode: '4',
        xPercent: 50.0,
        yPercent: 41.0,
        definition: 'Interconnected flattened membrane sheets studded with cytosolic 80S ribosomes.',
        location: 'Continuous with the outer nuclear envelope',
        functionRole: 'Synthesizes, folds, and performs initial N-linked glycosylation of membrane and secretory proteins.'
      },
      {
        id: 'cell_nucleus',
        label: 'Nucleus & Nucleolus',
        shortCode: '5',
        xPercent: 63.0,
        yPercent: 30.0,
        definition: 'Double-membraned control organelle perforated by nuclear pore complexes enclosing chromatin DNA and the dense nucleolus.',
        location: 'Central/paracentral region of the cell',
        functionRole: 'Stores genomic DNA, coordinates replication and mRNA transcription, and assembles ribosomal subunits inside the nucleolus.'
      },
      {
        id: 'cell_ser',
        label: 'Smooth Endoplasmic Reticulum (SER)',
        shortCode: '6',
        xPercent: 71.0,
        yPercent: 55.0,
        definition: 'Ribosome-free branching tubular membrane network.',
        location: 'Cytoplasm continuous with rough ER',
        functionRole: 'Synthesizes phospholipids and steroid hormones, stores Ca²⁺, and hosts hepatic CYP450 enzymes for drug detoxification.'
      },
      {
        id: 'cell_centrosome',
        label: 'Centrosome / Centrioles',
        shortCode: '7',
        xPercent: 33.0,
        yPercent: 30.0,
        definition: 'Paired barrel-shaped microtubule triplets (9×3 arrangement) forming the microtubule-organizing center.',
        location: 'Near the nucleus and Golgi apparatus',
        functionRole: 'Nucleates spindle fibers during mitosis to segregate chromosomes accurately; targeted by antimitotic vinca alkaloids.'
      },
      {
        id: 'cell_lysosome',
        label: 'Lysosome',
        shortCode: '8',
        xPercent: 56.0,
        yPercent: 63.0,
        definition: 'Single-membrane spherical vesicle packed with ~50 acid hydrolases active at pH ~4.8.',
        location: 'Dispersed in cytoplasm',
        functionRole: 'Digests worn-out organelles (autophagy), phagocytosed pathogens, and endocytosed macromolecules.'
      }
    ],
    references: [
      {
        title: 'Principles of Anatomy and Physiology (Cellular Level of Organization)',
        sourceType: 'textbook',
        citation: 'Tortora, G. J., & Derrickson, B. — Eukaryotic organelle structure and membrane transport.'
      },
      {
        title: 'Molecular Biology of the Cell (Endomembrane & Bioenergetics)',
        sourceType: 'textbook',
        citation: 'Alberts, B. et al. — Reference for RER/Golgi sorting, mitochondria, and nuclear transport.'
      }
    ],
    contentStatus: 'verified-curriculum',
    accuracyNotes:
      'Coordinates verified directly against the bundled cellular cutaway plate. Biochemical functions reflect standard B.Pharm Unit I cell biology.'
  },

  subj_compound_microscope: {
    id: 'subj_compound_microscope',
    domain: 'equipment',
    defaultCategory: 'apparatus',
    departments: ['anatomy', 'pharmacognosy'],
    identification: {
      primaryName: 'Binocular Compound Brightfield Microscope',
      scientificOrChemicalName: 'Dual-Stage Optical Light Microscope (40×–1000× Total Magnification)',
      commonNames: ['Compound Microscope', 'Brightfield Microscope'],
      classification: 'Optical Analytical & Histological Laboratory Instrument',
      taxonomyOrCode: 'BP109P Exp 1, 6, 8 / BP110P Exp 2–5, 8, 12'
    },
    definition:
      'A multi-lens optical instrument that uses transmitted visible light and two magnifying lens systems (objective lens + ocular eyepiece) to resolve microscopic anatomical cells, blood elements, and botanical crude drug diagnostic characters.',
    introduction:
      'Unlike a simple magnifying glass, a compound microscope forms an inverted, magnified real intermediate image via the objective lens, which is subsequently magnified as a virtual image by the ocular lens. Total magnification equals Objective Magnification × Ocular Magnification.',
    equipmentProfile: {
      principle:
        'Transmitted brightfield illumination is focused through the specimen by an Abbe condenser; light rays passing through the specimen are refracted by a short-focal-length objective lens to form a magnified real image, which is further enlarged by the ocular eyepiece.',
      construction:
        'Comprises a rigid C-shaped arm and heavy base housing an LED/halogen illuminator, an Abbe condenser with iris diaphragm beneath a vernier X-Y mechanical stage, a revolving nosepiece carrying 4×/10×/40×/100× achromatic objectives, binocular prism head, and coaxial coarse/fine rack-and-pinion focus knobs.',
      workingMechanism:
        '1. Light from the base illuminator passes through the collector lens and iris diaphragm into the Abbe condenser.\n2. The condenser focuses a uniform cone of light matching the objective numerical aperture (NA) through the mounted slide.\n3. The objective forms an inverted magnified primary image inside the body tube.\n4. The 10× ocular lens magnifies this primary image for observation (e.g., 10× × 40× = 400× total; 10× × 100× oil = 1000×).',
      advantages: [
        'Enables rapid routine visualization of stained blood smears, Neubauer chambers, and botanical leaf/powder histology.',
        'Oil immersion (100×, refractive index n ≈ 1.515 matching crown glass) eliminates air-interface refraction for ~0.2 µm resolution.',
        'Supports calibrated eyepiece micrometry for quantitative starch grain, fiber, and calcium oxalate measurements.'
      ],
      limitations: [
        'Diffraction limit of visible light restricts theoretical resolution to ~0.2 µm (cannot resolve viruses or organelle ultrastructure).',
        'Unstained transparent specimens show low contrast unless iris diaphragm or staining (Leishman, phloroglucinol-HCl, safranin) is applied.'
      ],
      maintenanceAndSafety: [
        'Always start focusing at 4× or 10× using the coarse knob; never use coarse focus under 40× or 100× to prevent crushing the slide and objective front lens.',
        'Wipe cedarwood/synthetic immersion oil off the 100× objective immediately after use using lens tissue moistened with xylene-free lens cleaner (never harsh alcohol on lens cement).',
        'Carry the microscope upright with one hand firmly gripping the arm and the other supporting the base.'
      ]
    },
    components: [
      { name: 'Ocular Eyepieces (10×)', description: 'Paired viewing lenses with diopter adjustment; one eyepiece holds the calibrated ocular micrometer disc in BP110P Exp 12.' },
      { name: 'Revolving Nosepiece & Objectives', description: 'Parfocal turret mounting 4× (scanning), 10× (low power), 40× (high dry), and 100× (oil immersion) objectives.' },
      { name: 'X-Y Mechanical Stage', description: 'Flat specimen platform with spring slide clip and vernier coordinates for systematic Neubauer counting and stomatal scanning.' },
      { name: 'Abbe Condenser & Iris Diaphragm', description: 'Two-lens sub-stage condenser controlling cone illumination angle, contrast, and numerical aperture.' },
      { name: 'Coaxial Coarse & Fine Focus', description: 'Concentric knobs adjusting stage height; fine focus moves in ~2 µm increments for crisp high-power focusing.' }
    ],
    functions: [
      'Resolves RBCs, WBCs, and platelets on a Neubauer hemocytometer grid (BP109P Exp 6–10).',
      'Identifies Differential Leukocyte Count (DLC) morphology on Leishman-stained blood smears (BP109P Exp 8).',
      'Measures stomatal number, stomatal index, vein-islet number, and powder drug cell dimensions via stage/ocular micrometry (BP110P Exp 8, 9, 12).'
    ],
    applications: [
      'Hematology cell counting & peripheral smear evaluation.',
      'Pharmacognosy crude drug authentication and adulteration detection.',
      'Clinical microbiology Gram-stained bacterial smear identification.'
    ],
    examKeyPoints: [
      'Resolving power (d) = 0.61 λ / NA; shorter wavelength (blue filter) and higher numerical aperture (oil immersion) improve resolution.',
      'Total Magnification = Ocular (typically 10×) × Objective (4×, 10×, 40×, or 100×).',
      'Refractive index of immersion oil (~1.515) matches glass slides to prevent light ray bending away from the 100× objective.'
    ],
    mcqs: [
      {
        id: 'scope_mcq_1',
        question: 'Why is cedarwood or synthetic immersion oil placed between the coverslip and the 100× objective lens?',
        options: [
          'To chemically stain bacterial cell walls',
          'To match the refractive index of glass (~1.515) and prevent refraction loss of wide-angle light rays',
          'To lubricate the mechanical stage vernier',
          'To increase the wavelength of incident light'
        ],
        correctIndex: 1,
        explanation: 'Immersion oil eliminates the air gap between glass and lens, matching refractive index (~1.515) to maximize numerical aperture and resolution.'
      }
    ],
    relatedTopics: ['Neubauer Hemocytometry', 'Eyepiece & Stage Micrometry', 'Leaf Constants (Stomatal Index)'],
    relatedSubjectIds: ['subj_botanical_microscopy', 'subj_gram_bacteria'],
    pharmaLabLinks: [
      {
        id: 'link_scope_anatomy',
        moduleId: 'anatomy',
        tab: 'microscopy',
        label: 'BP109P Exp 1–3: Microscopy & Histology',
        kind: 'experiment',
        description: 'Inspect microscope parts, epithelial/connective tissues, and neuron histology.'
      },
      {
        id: 'link_scope_hematology',
        moduleId: 'anatomy',
        tab: 'hematology',
        label: 'BP109P Exp 6–13: Hemocytometry & DLC',
        kind: 'experiment',
        description: 'Perform WBC, RBC, DLC, and hemoglobin calculations using the Neubauer grid.'
      },
      {
        id: 'link_scope_leaf',
        moduleId: 'pharmacognosy',
        tab: 'leaf_constants',
        label: 'BP110P Exp 8, 9, 12: Micrometry & Leaf Constants',
        kind: 'calculator',
        description: 'Calculate stomatal index, vein-islet number, and ocular micrometer calibration.'
      }
    ],
    equipmentNames: ['Compound Microscope', 'Neubauer Chamber', 'Ocular Micrometer', 'Stage Micrometer'],
    drugNames: [],
    diseaseNames: [],
    textbookKeywords: ['microscope', 'condenser', 'objective', 'ocular', 'magnification', 'numerical aperture', 'micrometry'],
    searchKeywords: [
      'brightfield',
      'oil immersion',
      'resolving power',
      'abbe condenser',
      'iris diaphragm',
      'fine focus',
      'neubauer',
      'micrometer'
    ],
    annotations: [
      {
        id: 'scope_ocular',
        label: 'Ocular Lenses (Eyepieces, 10×)',
        shortCode: '1',
        xPercent: 28.0,
        yPercent: 12.0,
        definition: 'Top viewing lenses (typically 10× widefield) housing optional calibrated ocular micrometer reticles.',
        location: 'Binocular head at top of optical path',
        functionRole: 'Produces the final magnified virtual image seen by the observer; total magnification = ocular × objective.'
      },
      {
        id: 'scope_objectives',
        label: 'Revolving Nosepiece & Objectives (4×/10×/40×/100×)',
        shortCode: '2',
        xPercent: 52.0,
        yPercent: 39.0,
        definition: 'Rotating parfocal turret holding color-coded objective lenses (4× red, 10× yellow, 40× blue, 100× oil white).',
        location: 'Directly above the specimen slide',
        functionRole: 'Collects transmitted light from the specimen to generate the primary magnified real image and determines resolving power.'
      },
      {
        id: 'scope_stage',
        label: 'Mechanical Stage & Slide Clip',
        shortCode: '3',
        xPercent: 50.0,
        yPercent: 53.0,
        definition: 'Black anodized horizontal platform fitted with spring slide clamps and dual X-Y coaxial vernier drives.',
        location: 'Mid-frame below the objective turret',
        functionRole: 'Holds glass slides or Neubauer counting chambers flat and translates fields smoothly for cell counting.'
      },
      {
        id: 'scope_condenser',
        label: 'Abbe Condenser & Iris Diaphragm',
        shortCode: '4',
        xPercent: 45.0,
        yPercent: 64.0,
        definition: 'Sub-stage optical lens assembly with an adjustable aperture lever.',
        location: 'Immediately beneath the mechanical stage aperture',
        functionRole: 'Concentrates illumination onto the specimen and optimizes contrast versus resolution.'
      },
      {
        id: 'scope_illuminator',
        label: 'Base Collector & Illuminator',
        shortCode: '5',
        xPercent: 47.0,
        yPercent: 74.0,
        definition: 'Built-in light source with rheostat brightness control and field collector lens.',
        location: 'Microscope base directly aligned with condenser axis',
        functionRole: 'Provides steady, uniform brightfield light intensity through the specimen.'
      },
      {
        id: 'scope_focus',
        label: 'Coaxial Coarse & Fine Focus Knobs',
        shortCode: '6',
        xPercent: 69.0,
        yPercent: 64.0,
        definition: 'Outer large coarse adjustment ring paired with inner fine-pitch micrometer drum.',
        location: 'Lower lateral arm',
        functionRole: 'Raises/lowers the stage rapidly at 4×/10× (coarse) and achieves exact focal sharpness at 40×/100× (fine).'
      }
    ],
    references: [
      {
        title: 'Practical Human Anatomy and Physiology Lab Manual (BP109P)',
        sourceType: 'curriculum',
        citation: 'PCI B.Pharm Semester I Practical — Study of Compound Microscope & Hemocytometry.'
      },
      {
        title: 'Practical Pharmacognosy (Microscopy & Micrometry)',
        sourceType: 'textbook',
        citation: 'Khandelwal, K. R. — Calibration of ocular micrometer using stage micrometer and leaf constant microscopy.'
      }
    ],
    contentStatus: 'verified-curriculum',
    accuracyNotes:
      'Coordinates matched directly to the bundled binocular microscope illustration. Optical specs and SOP reflect standard Indian pharmacy lab practice.'
  },

  subj_botanical_microscopy: {
    id: 'subj_botanical_microscopy',
    domain: 'histology_microscopy',
    defaultCategory: 'microscopy',
    departments: ['pharmacognosy'],
    identification: {
      primaryName: 'Diagnostic Botanical Leaf & Crude Drug Powder Microscopy',
      scientificOrChemicalName: 'Epidermal Stomata, Trichomes, Lignified Xylem & Calcium Oxalate Inclusions',
      commonNames: ['Powder Microscopy Plate', 'Pharmacognosy Histology Markers'],
      classification: 'Pharmacognostic Histological Evaluation (BP105T / BP110P)',
      taxonomyOrCode: 'BP110P Exp 2–5, 8–9'
    },
    definition:
      'Microscopic identification of diagnostic cellular structures—including stomatal types, covering/glandular trichomes, lignified vascular vessels, and calcium oxalate crystals—used to authenticate crude herbal drugs and detect adulterants.',
    introduction:
      'Because powdered crude drugs lose gross morphological traits (shape, venation, margin), pharmacopoeias rely on qualitative and quantitative microscopy. Clearing agents like chloral hydrate dissolve starch and chlorophyll so epidermal stomata, trichomes, xylem thickenings, and oxalate crystals stand out clearly.',
    histologyProfile: {
      tissueOrSpecimen: 'Cleared leaf lamina epidermis, vascular bundle longitudinal elements, and parenchymatous cortex/mesophyll',
      structuralCharacteristics: [
        'Stomatal complexes classified by subsidiary cell arrangement (Diacytic in Tulsi/Mentha; Paracytic in Senna; Anisocytic in Belladonna/Datura; Anomocytic in Digitalis).',
        'Trichomes (epidermal outgrowths): covering (unicellular/multicellular, warty, stellate) vs glandular (secretory head storing volatile oil).',
        'Vascular elements: spiral, annular, reticulate, or pitted xylem vessels stained pink-red with phloroglucinol + concentrated HCl (lignin test).',
        'Calcium oxalate crystals: rosette/cluster druses (Arjuna, Senna, Clove), prisms, acicular raphides, or microsphenoidal sandy crystals.'
      ],
      importantRegions: [
        'Top-Left: Leaf epidermis showing stomatal guard cells & multicellular capitate glandular trichome.',
        'Bottom-Left: Uniseriate stalked glandular trichome projecting from leaf margin.',
        'Top-Right: Longitudinal helical/spiral thickened xylem vessels.',
        'Bottom-Right: Mesophyll parenchyma containing rosette/cluster calcium oxalate crystals.'
      ],
      normalVsAbnormal: {
        normal: 'Authentic drug exhibits characteristic stomatal index range (e.g., Indian Senna 17–20), uniform glandular trichome morphology, and expected crystal shape.',
        abnormal: 'Presence of foreign stone cells, unexpected starch granules (stained blue with N/50 iodine), foreign trichomes, or altered stomatal ratio indicates substitution or adulteration.'
      }
    },
    functions: [
      'Stomata regulate foliar gas exchange (CO₂ uptake, transpiration) via turgor-driven guard cell aperture changes.',
      'Glandular trichomes synthesize and secrete essential oils (e.g., eugenol/methyl eugenol in Tulsi, menthol in Peppermint) deterring herbivores.',
      'Lignified spiral xylem vessels provide tensile water-transport conduits capable of longitudinal leaf expansion.',
      'Calcium oxalate crystals sequester excess metabolic oxalic acid and deter herbivory.'
    ],
    pharmaceuticalSignificance: [
      'Official pharmacopoeial identity test in IP / WHO Quality Control Methods for Medicinal Plant Materials.',
      'Quantitative leaf constants (Stomatal Number, Stomatal Index, Vein-Islet Number, Palisade Ratio) distinguish closely related species such as Cassia angustifolia vs Cassia acutifolia.',
      'Lycopodium spore method determines percentage purity of powdered drugs containing known diagnostic particles.'
    ],
    applications: [
      'Routine QC screening of Tulsi (Ocimum tenuiflorum), Senna, Arjuna, Brahmi, and Turmeric powders.',
      'Microchemical staining verification: Phloroglucinol + HCl (pink lignin), Sudan III (red volatile oil/cuticle), Iodine (blue starch), Ruthenium red (pink mucilage).'
    ],
    examKeyPoints: [
      'Stomatal Index (I) = [S / (E + S)] × 100, where S = stomata per unit area and E = epidermal cells in the same area (independent of leaf size or age).',
      'Diacytic (cross-celled) stomata are diagnostic of Lamiaceae herbs like Tulsi and Peppermint.',
      'Phloroglucinol + Conc. HCl turns lignified xylem vessels, fibers, and stone cells crimson/magenta pink.'
    ],
    mcqs: [
      {
        id: 'botany_mcq_1',
        question: 'Which microchemical reagent specifically stains lignified spiral xylem vessels and stone cells pink-to-magenta?',
        options: [
          'N/50 Iodine solution',
          'Phloroglucinol + Concentrated HCl',
          'Sudan III reagent',
          'Fehling’s A & B solution'
        ],
        correctIndex: 1,
        explanation: 'Phloroglucinol in concentrated hydrochloric acid reacts with coniferaldehyde groups in lignin to produce a characteristic pink/magenta stain.'
      }
    ],
    relatedTopics: ['Powder Microscopy of Tulsi & Arjuna', 'Stomatal Index & Palisade Ratio', 'Crude Drug Adulteration'],
    relatedSubjectIds: ['subj_compound_microscope'],
    pharmaLabLinks: [
      {
        id: 'link_bot_powder',
        moduleId: 'pharmacognosy',
        tab: 'powder',
        label: 'BP110P Exp 2–5: Powder Microscopy Bench',
        kind: 'experiment',
        description: 'Inspect Tulsi, Ashwagandha, Amla, Arjuna, Turmeric & Brahmi microscopy.'
      },
      {
        id: 'link_bot_constants',
        moduleId: 'pharmacognosy',
        tab: 'leaf_constants',
        label: 'BP110P Exp 8–13: Stomatal Index & Micrometry',
        kind: 'calculator',
        description: 'Calculate Stomatal Index, Vein-Islet, and Lycopodium spore purity.'
      },
      {
        id: 'link_bot_theory',
        moduleId: 'pharmacognosy',
        tab: 'theory',
        label: 'BP105T Unit III: Quality Control & Adulteration',
        kind: 'topic',
        description: 'Review organoleptic, microscopic, and physicochemical QC evaluation.'
      }
    ],
    equipmentNames: ['Compound Microscope', 'Glass Slides & Coverslips', 'Stage & Ocular Micrometer'],
    drugNames: ['Ocimum tenuiflorum (Tulsi)', 'Terminalia arjuna', 'Cassia angustifolia (Senna)'],
    diseaseNames: [],
    textbookKeywords: ['stomata', 'trichome', 'xylem', 'calcium oxalate', 'powder microscopy', 'phloroglucinol', 'stomatal index'],
    searchKeywords: [
      'diacytic',
      'paracytic',
      'glandular trichome',
      'rosette crystal',
      'druse',
      'spiral vessel',
      'lignin',
      'crude drug authentication',
      'adulteration'
    ],
    annotations: [
      {
        id: 'bot_stomata',
        label: 'Epidermal Stomata (Guard Cells)',
        shortCode: '1',
        xPercent: 23.0,
        yPercent: 48.0,
        definition: 'Paired kidney-shaped chlorophyllous guard cells framing a stomatal pore surrounded by subsidiary epidermal cells.',
        location: 'Top-left quadrant — foliar epidermis',
        functionRole: 'Regulates CO₂ uptake and transpiration; subsidiary cell geometry (diacytic, paracytic, anomocytic) serves as a primary taxonomic marker.'
      },
      {
        id: 'bot_glandular_trichome',
        label: 'Multicellular Glandular Trichome',
        shortCode: '2',
        xPercent: 40.0,
        yPercent: 20.0,
        definition: 'Epidermal hair with a multi-celled secretory head atop a stalk.',
        location: 'Top-left quadrant projecting from epidermal surface',
        functionRole: 'Synthesizes and stores volatile terpenoid/phenolic oils (e.g., Lamiaceae aromatic leaves like Tulsi).'
      },
      {
        id: 'bot_uniseriate_trichome',
        label: 'Uniseriate Stalked Trichome',
        shortCode: '3',
        xPercent: 24.0,
        yPercent: 80.0,
        definition: 'Single-row multicellular epidermal trichome with rounded terminal head.',
        location: 'Bottom-left quadrant along leaf margin',
        functionRole: 'Provides physical barrier defense and diagnostic species-specific hair architecture in powdered leaf microscopy.'
      },
      {
        id: 'bot_xylem',
        label: 'Spiral (Helical) Xylem Vessels',
        shortCode: '4',
        xPercent: 76.0,
        yPercent: 25.0,
        definition: 'Elongated tracheary conduits reinforced internally by helical lignified secondary wall bands.',
        location: 'Top-right quadrant — vascular bundle longitudinal section',
        functionRole: 'Conducts water and dissolved minerals while permitting longitudinal stretching; stains magenta with phloroglucinol-HCl.'
      },
      {
        id: 'bot_oxalate',
        label: 'Calcium Oxalate Rosette (Cluster) Crystals',
        shortCode: '5',
        xPercent: 82.0,
        yPercent: 75.0,
        definition: 'Radiating stellate crystal aggregates of calcium oxalate housed within idioblast parenchyma cells.',
        location: 'Bottom-right quadrant — mesophyll/cortex parenchyma',
        functionRole: 'Insoluble oxalate sequestration; diagnostic ergastic inclusion in Arjuna bark, Senna, Clove, and Rhubarb.'
      }
    ],
    references: [
      {
        title: 'Textbook of Pharmacognosy (Microscopic Evaluation)',
        sourceType: 'textbook',
        citation: 'Kokate, C. K., Purohit, A. P., & Gokhale, S. B. — Diagnostic characters of organized crude drugs.'
      },
      {
        title: 'Practical Pharmacognosy',
        sourceType: 'textbook',
        citation: 'Khandelwal, K. R. — Leaf constants, clearing with chloral hydrate, and microchemical staining.'
      }
    ],
    contentStatus: 'verified-curriculum',
    accuracyNotes:
      'Annotations mapped accurately to each quadrant of the bundled microscopy composite plate. Botanical staining & stomatal index formulas match BP110P curriculum.'
  },

  subj_volumetric_titration: {
    id: 'subj_volumetric_titration',
    domain: 'equipment',
    defaultCategory: 'apparatus',
    departments: ['inorganic', 'general_pharmacy'],
    identification: {
      primaryName: 'Volumetric Burette Assembly & Matched Nessler Cylinders',
      scientificOrChemicalName: 'Class-A Borosilicate Volumetric Glassware & Optical Limit-Test Comparators',
      commonNames: ['Titration Setup', 'Burette & Conical Flask', 'Nessler Comparator'],
      classification: 'Pharmaceutical Quantitative & Limit-Test Glassware (BP106T / BP111P)',
      taxonomyOrCode: 'BP111P Exp 1a–1d & Exp 4a–4g'
    },
    definition:
      'Combined analytical glassware comprising a graduated 50 mL burette with Erlenmeyer flask for stoichiometric titrimetric assays and matched flat-bottomed 50 mL Nessler cylinders for Pharmacopoeial inorganic impurity limit tests.',
    introduction:
      'Quantitative pharmaceutical quality control depends on precise volume delivery during volumetric assays (acid-base, redox, complexometric, precipitation) and identical optical path-length comparison during IP limit tests for Chloride, Sulphate, and Iron.',
    equipmentProfile: {
      principle:
        'Burette titrimetry determines analyte concentration by measuring the exact volume of standardized titrant required to reach a stoichiometric equivalence endpoint. Nessler comparison matches turbidity/opalescence or color intensity vertically across two cylinders of identical bore and meniscus height.',
      construction:
        'A vertical 50 mL borosilicate burette (0.1 mL graduations, PTFE/ground-glass stopcock) is clamped plumb on a retort stand above a 250 mL conical flask on a white porcelain tile. Beside it, two matched 50 mL Nessler cylinders sit upright in a rack.',
      workingMechanism:
        '1. Rinse burette with titrant, fill above 0.00 mL, expel air bubble from nozzle tip, and read concave meniscus at eye level (top meniscus for KMnO₄/I₂).\n2. Deliver titrant dropwise near endpoint while swirling conical flask over a white tile.\n3. For Limit Tests, prepare Test and Standard solutions to the 50 mL mark in matched Nessler cylinders and view vertically after 5 minutes against black (AgCl/BaSO₄ turbidity) or white (Fe-thioglycolate color) backgrounds.',
      advantages: [
        'High reproducibility (±0.05 mL burette tolerance) without electronic instrumentation.',
        'Matched Nessler cylinders eliminate path-length bias in visual semi-quantitative limit testing.'
      ],
      limitations: [
        'Parallax error if meniscus is viewed above or below eye level.',
        'Alkaline titrants (NaOH) can freeze ground-glass stopcocks if left unwashed (use PTFE stopcocks).'
      ],
      maintenanceAndSafety: [
        'Never leave strong NaOH in a burette overnight; rinse thoroughly with distilled water and store inverted or filled with distilled water.',
        'Remove funnel from top of burette before zeroing to avoid stray drops altering initial reading.',
        'Handle corrosive acids/silver nitrate with safety goggles and avoid mouth pipetting.'
      ]
    },
    components: [
      { name: '50 mL Class-A Graduated Burette', description: 'Calibrated glass cylinder with 0.1 mL subdivisions delivering variable titrant volumes.' },
      { name: 'PTFE Stopcock Valve', description: 'Chemically inert rotary plug enabling controlled dropwise addition near endpoint.' },
      { name: 'Erlenmeyer Conical Flask', description: 'Tapered sides allow vigorous swirling without splashing analyte solution.' },
      { name: 'Matched 50 mL Nessler Cylinders', description: 'Identical-diameter flat-bottom tubes for side-by-side IP limit test turbidity/color comparison.' }
    ],
    functions: [
      'Executes IP volumetric assays (HCl vs NaOH, Cerimetry, Iodometry, EDTA, Volhard, Permanganometry).',
      'Performs IP Limit Tests for Chloride (AgNO₃ turbidity), Sulphate (BaCl₂ turbidity), and Iron (thioglycolic acid purple complex).'
    ],
    applications: [
      'Assay and percentage purity (% w/w) calculation of pharmaceutical APIs and excipients.',
      'Semi-quantitative trace impurity pass/fail screening per Indian Pharmacopoeia.'
    ],
    examKeyPoints: [
      'Read the LOWER meniscus for colorless solutions (HCl, NaOH, EDTA) and the UPPER meniscus for deeply colored solutions (KMnO₄, I₂).',
      'In IP Chloride/Sulphate limit tests, view Nessler cylinders horizontally/vertically against a BLACK background; for Iron limit test, view against a WHITE background.',
      'Pass criterion in IP Limit Test: Test turbidity/color intensity MUST BE LESS than the Standard.'
    ],
    mcqs: [
      {
        id: 'chem_app_mcq_1',
        question: 'When performing the Indian Pharmacopoeia Limit Test for Chloride in matched Nessler cylinders, which viewing background makes faint white AgCl opalescence easiest to compare?',
        options: ['Bright yellow background', 'Black background', 'Red filter background', 'Amber glass backing'],
        correctIndex: 1,
        explanation: 'White AgCl (and BaSO₄) opalescence/turbidity scatters light and contrasts most clearly against a dark/black background.'
      }
    ],
    relatedTopics: ['Meniscus Parallax & Calibration', 'IP Limit Tests (Cl⁻, SO₄²⁻, Fe)', 'Primary vs Secondary Standards'],
    relatedSubjectIds: ['subj_gutzeit_arsenic'],
    pharmaLabLinks: [
      {
        id: 'link_chem_titration',
        moduleId: 'inorganic',
        tab: 'titration',
        label: 'BP111P Exp 4a–4g: Live Burette Simulator',
        kind: 'simulator',
        description: 'Run interactive dropwise Acid-Base, EDTA, Cerimetry, and Volhard titrations.'
      },
      {
        id: 'link_chem_limit',
        moduleId: 'inorganic',
        tab: 'limit_tests',
        label: 'BP111P Exp 1a–1e: IP Limit Tests Simulator',
        kind: 'experiment',
        description: 'Compare Nessler cylinder opalescence & ppm limits for Cl⁻, SO₄²⁻, Fe, Pb, and As.'
      },
      {
        id: 'link_chem_diagrams',
        moduleId: 'inorganic',
        tab: 'diagrams',
        label: 'BP106T Apparatus & Curves Diagrams',
        kind: 'topic',
        description: 'Inspect meniscus parallax, accuracy vs precision, and neutralization curves.'
      }
    ],
    equipmentNames: ['50 mL Burette', 'Nessler Cylinders', 'Erlenmeyer Flask', 'Retort Stand'],
    drugNames: ['Sodium Chloride', 'Ferrous Sulphate', 'Potassium Iodide'],
    diseaseNames: [],
    textbookKeywords: ['burette', 'nessler cylinder', 'titration', 'limit test', 'meniscus', 'erlenmeyer', 'assay'],
    searchKeywords: [
      'volumetric analysis',
      'turbidity comparison',
      'opalescence',
      'chloride limit test',
      'sulphate limit test',
      'iron limit test',
      'parallax error',
      'stopcock'
    ],
    annotations: [
      {
        id: 'chem_retort',
        label: 'Retort Stand & Double Burette Clamp',
        shortCode: '1',
        xPercent: 22.0,
        yPercent: 28.0,
        definition: 'Weighted base rod with dual-jaw spring clamp holding the burette strictly vertical.',
        location: 'Left frame supporting burette',
        functionRole: 'Keeps burette plumb so meniscus readings align accurately with graduation rings.'
      },
      {
        id: 'chem_burette',
        label: '50 mL Graduated Burette',
        shortCode: '2',
        xPercent: 36.0,
        yPercent: 21.0,
        definition: 'Class-A borosilicate cylinder graduated from 0.00 mL (top) to 50.00 mL (bottom) in 0.1 mL increments.',
        location: 'Clamped vertically above the titration flask',
        functionRole: 'Delivers exact measured volumes of standardized titrant into the analyte.'
      },
      {
        id: 'chem_stopcock',
        label: 'PTFE / Glass Stopcock',
        shortCode: '3',
        xPercent: 36.0,
        yPercent: 51.0,
        definition: 'Precision tapered rotary valve controlling titrant flow rate.',
        location: 'Lower stem of the burette above the delivery tip',
        functionRole: 'Allows rapid initial addition followed by controlled single-drop (0.05 mL) delivery near the endpoint.'
      },
      {
        id: 'chem_flask',
        label: 'Erlenmeyer Conical Flask',
        shortCode: '4',
        xPercent: 36.0,
        yPercent: 76.0,
        definition: '250 mL flat-bottomed conical glass vessel containing pipetted analyte and indicator.',
        location: 'Directly beneath the burette tip',
        functionRole: 'Sloped walls prevent sample loss during vigorous swirling or magnetic stirring.'
      },
      {
        id: 'chem_tile',
        label: 'White Porcelain Base Tile',
        shortCode: '5',
        xPercent: 31.0,
        yPercent: 89.0,
        definition: 'Matte white ceramic base plate resting on the retort stand.',
        location: 'Beneath the conical flask',
        functionRole: 'Provides neutral high-contrast illumination to detect subtle pale-pink or faint-blue indicator transitions.'
      },
      {
        id: 'chem_nessler',
        label: 'Matched 50 mL Nessler Cylinders',
        shortCode: '6',
        xPercent: 62.0,
        yPercent: 55.0,
        definition: 'Pair of identical optical-grade borosilicate cylinders etched at 50 mL.',
        location: 'Wooden rack at center-right',
        functionRole: 'Equalizes path length between Test and Standard solutions for visual comparison in IP Limit Tests.'
      },
      {
        id: 'chem_reagent',
        label: 'Stoppered Reagent & Wash Bottles',
        shortCode: '7',
        xPercent: 77.0,
        yPercent: 71.0,
        definition: 'Ground-glass reagent bottle and LDPE distilled-water squeeze wash bottle.',
        location: 'Right bench area',
        functionRole: 'Used to rinse flask walls of stray titrant drops near the endpoint without altering analyte moles.'
      }
    ],
    references: [
      {
        title: 'Vogel’s Textbook of Quantitative Chemical Analysis',
        sourceType: 'textbook',
        citation: 'Mendham, J. et al. — Calibration and proper operation of Class-A volumetric glassware.'
      },
      {
        title: 'Indian Pharmacopoeia (Limit Tests for Chlorides, Sulphates & Iron)',
        sourceType: 'pharmacopoeia',
        citation: 'IP General Chapters — Specification for matched 50 mL Nessler cylinders and visual comparison.'
      }
    ],
    contentStatus: 'verified-curriculum',
    accuracyNotes:
      'Coordinates aligned directly to the bundled glassware plate. Analytical protocols match IP and BP111P practical syllabus.'
  },

  subj_gutzeit_arsenic: {
    id: 'subj_gutzeit_arsenic',
    domain: 'equipment',
    defaultCategory: 'apparatus',
    departments: ['inorganic'],
    identification: {
      primaryName: 'Gutzeit Apparatus (IP Limit Test for Arsenic)',
      scientificOrChemicalName: 'Pharmacopoeial Arsine Gas Evolution & HgCl₂ Stain Comparator Assembly',
      commonNames: ['Gutzeit Apparatus', 'Arsenic Limit Test Assembly'],
      classification: 'Specialized Pharmacopoeial Trace-Impurity Apparatus (BP111P Exp 1e)',
      taxonomyOrCode: 'BP106T Unit I / BP111P Exp 1e'
    },
    definition:
      'A specialized all-glass pharmacopoeial reaction and gas-delivery assembly designed to reduce trace inorganic arsenic impurities into volatile arsine gas (AsH₃) and quantify them via the yellow-brown stain formed on a mercuric chloride paper disc.',
    introduction:
      'Unlike Chloride, Sulphate, or Iron limit tests that rely on solution turbidity/color in Nessler cylinders, trace arsenic (10 ppm IP limit) cannot be detected visually in solution. The Gutzeit apparatus isolates arsenic cleanly in the gas phase while scrubbing interfering H₂S.',
    equipmentProfile: {
      principle:
        'Pentavalent arsenic (As⁵⁺) is first reduced to trivalent arsenious acid (As³⁺) using potassium iodide and stannous chloride (stannated HCl), then reduced by nascent hydrogen (Zn + HCl) to volatile Arsine gas (AsH₃↑), which stains HgCl₂ paper yellow-to-brown.',
      construction:
        'Consists of a 120 mL wide-mouthed glass reaction bottle sealed with a rubber bung carrying a vertical glass delivery tube (200 mm long × 6.5 mm internal diameter) with a lower 2 mm lateral vent hole, packed loosely with lead acetate cotton wool, and topped by two flat-ground circular flanges clamping a mercuric chloride paper disc.',
      workingMechanism:
        '1. Sample + stannated HCl + KI + 10 g granulated zinc react in the 120 mL bottle for ~40 minutes (often warmed gently or at controlled temperature).\n2. Nascent hydrogen sweeps AsH₃ gas upward through the 2 mm side opening into the delivery tube.\n3. Lead acetate cotton wool scrubs any trace H₂S gas as black PbS precipitate.\n4. Pure AsH₃ passes through the 6.5 mm orifice and reacts with HgCl₂ paper forming [As(HgCl)₃] stain.\n5. Test stain is compared against a simultaneously prepared 10 ppm Standard Arsenic stain.',
      advantages: [
        'Detects microgram quantities (ppm level) of arsenic cleanly separated from colored or turbid sample matrices.',
        'Standardized 6.5 mm internal bore ensures reproducible gas velocity and stain area.'
      ],
      limitations: [
        'Highly sensitive to sulphide interference if lead acetate cotton wool is omitted or exhausted.',
        'Mercuric chloride (HgCl₂) and arsine gas are toxic; requires fume-hood operation and hazardous waste disposal.'
      ],
      maintenanceAndSafety: [
        'Perform in a well-ventilated fume hood — AsH₃ is an extremely toxic hemolytic gas.',
        'Use arsenic-free granulated zinc (AsT grade) and stannated HCl (AsT grade) to avoid false positive stains.',
        'Pack lead acetate cotton wool loosely so gas flow is never obstructed, and keep the upper paper disc completely dry.'
      ]
    },
    components: [
      { name: '120 mL Wide-Mouth Bottle', description: 'Houses test/standard solution, KI, stannated HCl, and 10 g granulated zinc.' },
      { name: 'Rubber Bung & 2 mm Vent Hole', description: 'Seals bottle neck while lower tube lateral hole lets rising gas enter and condensed moisture drain.' },
      { name: 'Lead Acetate Cotton Wool Plug', description: 'Traps interfering H₂S as insoluble black PbS so only AsH₃ reaches the detector disc.' },
      { name: '200 mm × 6.5 mm Glass Tube', description: 'Standardized vertical chimney ensuring uniform arsine flux across the paper disc.' },
      { name: 'HgCl₂ Paper Disc & Flange Clamp', description: 'Flat-ground glass flanges held by rubber band/spring clip forcing all gas through the sensitized disc.' }
    ],
    functions: [
      'Detects trace arsenic contamination against pharmacopoeial safety limits (typically ≤ 2–10 ppm).'
    ],
    applications: [
      'IP/BP impurity limit testing of inorganic salts, phosphoric acid, iron compounds, and excipients.'
    ],
    examKeyPoints: [
      'Exact IP dimensions: 120 mL bottle; glass tube 200 mm length × 6.5 mm internal diameter; lower lateral hole 2 mm.',
      'Role of Stannous Chloride (SnCl₂) + KI: reduces As⁵⁺ → As³⁺ and forms a Zn-Sn couple accelerating steady hydrogen evolution.',
      'Role of Lead Acetate cotton wool: removes H₂S gas impurity; must NOT be packed too tightly.'
    ],
    mcqs: [
      {
        id: 'gutzeit_mcq_1',
        question: 'In the Gutzeit Limit Test for Arsenic, why is cotton wool moistened with lead acetate placed inside the vertical delivery tube?',
        options: [
          'To catalyze the oxidation of arsine back to arsenate',
          'To trap interfering Hydrogen Sulphide (H₂S) gas as black PbS so it does not falsely stain HgCl₂ paper',
          'To absorb excess hydrochloric acid vapor and speed up zinc dissolution',
          'To generate nascent hydrogen inside the tube'
        ],
        correctIndex: 1,
        explanation: 'Trace sulphides generate H₂S gas which would also darken HgCl₂ paper; lead acetate reacts with H₂S to form non-volatile black PbS.'
      }
    ],
    relatedTopics: ['IP Limit Tests (Cl⁻, SO₄²⁻, Fe, Pb, As)', 'Arsenic Toxicity & Antidotes (BAL)'],
    relatedSubjectIds: ['subj_volumetric_titration'],
    pharmaLabLinks: [
      {
        id: 'link_gutzeit_sim',
        moduleId: 'inorganic',
        tab: 'limit_tests',
        label: 'BP111P Exp 1e: Arsenic Limit Test Simulator',
        kind: 'simulator',
        description: 'Run the interactive Arsenic Gutzeit pass/fail limit test simulator.'
      },
      {
        id: 'link_gutzeit_diag',
        moduleId: 'inorganic',
        tab: 'diagrams',
        label: 'BP106T Gutzeit Interactive Schematic',
        kind: 'topic',
        description: 'View the interactive Inorganic Chemistry diagram bench.'
      }
    ],
    equipmentNames: ['Gutzeit Apparatus', '120 mL Reaction Bottle', 'HgCl₂ Test Paper'],
    drugNames: ['Dimercaprol (BAL)', 'Sodium Thiosulphate'],
    diseaseNames: ['Arsenicosis (Heavy Metal Toxicity)'],
    textbookKeywords: ['gutzeit', 'arsenic', 'arsine', 'mercuric chloride', 'lead acetate', 'stannated hcl'],
    searchKeywords: [
      'ash3',
      'limit test for arsenic',
      '200 mm',
      '6.5 mm',
      'h2s scrubber',
      'trace impurity',
      'granulated zinc'
    ],
    annotations: [
      {
        id: 'gutzeit_bottle',
        label: '120 mL Wide-Mouthed Reaction Bottle',
        shortCode: '1',
        xPercent: 45.0,
        yPercent: 75.0,
        regionBox: { x: 35, y: 56, width: 20, height: 32 },
        definition: 'Borosilicate reaction vessel containing test/standard solution, KI, stannated HCl, and 10 g granulated AsT zinc.',
        location: 'Base of the Gutzeit assembly',
        functionRole: 'Reduces As⁵⁺ → As³⁺ and generates nascent hydrogen to evolve volatile arsine gas (AsH₃↑).'
      },
      {
        id: 'gutzeit_bung',
        label: 'Rubber Bung & 2 mm Vent Hole',
        shortCode: '2',
        xPercent: 45.0,
        yPercent: 59.0,
        definition: 'Tight-fitting rubber stopper supporting the delivery tube whose lower tip has a 2 mm lateral hole.',
        location: 'Neck of the 120 mL bottle',
        functionRole: 'Prevents gas escape around the neck while allowing condensed droplets to drain back and gas to enter cleanly.'
      },
      {
        id: 'gutzeit_lead_wool',
        label: 'Lead Acetate Cotton Wool Plug',
        shortCode: '3',
        xPercent: 45.0,
        yPercent: 47.5,
        regionBox: { x: 42, y: 42, width: 6, height: 11 },
        definition: 'Loosely packed cotton pledget soaked in lead acetate solution and dried.',
        location: 'Lower section of the 200 mm vertical glass tube',
        functionRole: 'Selectively scrubs interfering Hydrogen Sulphide (H₂S → black PbS↓) without obstructing AsH₃ passage.'
      },
      {
        id: 'gutzeit_tube',
        label: 'Vertical Glass Tube (200 mm × 6.5 mm ID)',
        shortCode: '4',
        xPercent: 45.0,
        yPercent: 32.0,
        definition: 'Standardized 200 mm long glass delivery tube with uniform 6.5 mm internal diameter.',
        location: 'Central vertical gas column',
        functionRole: 'Controls gas velocity and evenly directs arsine onto the mercuric chloride paper disc.'
      },
      {
        id: 'gutzeit_hgcl2',
        label: 'HgCl₂ Paper Disc & Flange Clamp',
        shortCode: '5',
        xPercent: 45.0,
        yPercent: 19.5,
        regionBox: { x: 40, y: 15, width: 11, height: 8 },
        definition: 'Circular filter paper soaked in saturated mercuric chloride solution, clamped tightly between flat-ground glass flanges.',
        location: 'Upper end of the delivery tube',
        functionRole: 'Reacts with AsH₃ to yield a yellow-to-brown [As(HgCl)₃] stain compared against a 10 ppm Arsenic Standard.'
      }
    ],
    references: [
      {
        title: 'Indian Pharmacopoeia (Limit Test for Arsenic — Apparatus A)',
        sourceType: 'pharmacopoeia',
        citation: 'IP Monograph Appendix — Gutzeit apparatus dimensions, stannated HCl, and standard 10 ppm As preparation.'
      },
      {
        title: 'Pharmaceutical Inorganic Chemistry',
        sourceType: 'textbook',
        citation: 'Chatwal, G. R. / Beckett & Stenlake — Principle and reactions of the Gutzeit arsenic test.'
      }
    ],
    contentStatus: 'verified-curriculum',
    accuracyNotes:
      'Vector plate generated with exact coordinates matching IP Apparatus A specifications.'
  },

  subj_aspirin_structure: {
    id: 'subj_aspirin_structure',
    domain: 'chemistry',
    defaultCategory: 'chemistry',
    departments: ['general_pharmacy', 'inorganic', 'anatomy'],
    identification: {
      primaryName: 'Acetylsalicylic Acid (Aspirin)',
      scientificOrChemicalName: '2-Acetoxybenzoic Acid',
      commonNames: ['Aspirin', 'ASA', 'Acetylsalicylate'],
      classification: 'Non-Steroidal Anti-Inflammatory Drug (NSAID) · Salicylate Ester · Antiplatelet Agent',
      formulaOrIupac: 'C₉H₈O₄ · MW: 180.16 g/mol · IUPAC: 2-(acetyloxy)benzoic acid'
    },
    definition:
      'Acetylsalicylic acid is an aromatic organic ester synthesized by O-acetylation of salicylic acid; chemically it combines an ionizable carboxylic acid group and a reactive phenolic acetoxy ester on a benzene ring.',
    introduction:
      'Aspirin is a classic bridge between pharmaceutical organic chemistry, pharmaceutics (hydrolysis stability & buffered/enteric tablets), and pharmacology (irreversible COX-1/COX-2 acetylation).',
    chemistryProfile: {
      molecularStructureSummary:
        'Planar disubstituted benzene ring carrying a carboxylic acid (-COOH) at C-1 and an ortho-acetoxy ester (-OCOCH₃) at C-2.',
      functionalGroups: [
        'Aromatic Benzene Ring (lipophilic planar core enabling membrane permeation and hydrophobic COX channel binding)',
        'Carboxylic Acid (-COOH, pKa ≈ 3.5): confers weak acidity, salt-forming water solubility, and ionic interaction with Arg-120 inside COX active site',
        'Acetoxy Ester (-OCOCH₃): labile acetyl donor that irreversibly acetylates Ser-530 in COX-1/COX-2; also prone to moisture-induced ester hydrolysis'
      ],
      physicochemicalProperties: [
        'White crystalline powder or needles; slightly soluble in water (~3.3 mg/mL at 25°C), freely soluble in ethanol and alkaline hydroxide/carbonate solutions.',
        'Weak acid (pKa 3.5): predominantly unionized in acidic gastric fluid (pH 1.5–2.0), favoring passive stomach absorption, and ionized in alkaline intestine/blood.',
        'Melting point: ~135–138°C (with decomposition).'
      ],
      reactionMechanism:
        'Synthesis (O-Acetylation): Salicylic acid phenolic -OH attacks the electrophilic carbonyl carbon of acetic anhydride under acid catalysis (H₂SO₄/H₃PO₄), forming acetylsalicylic acid and acetic acid.\nBiological Acetylation: The ortho-acetoxy carbonyl transfers its acetyl group covalently to the hydroxyl oxygen of Ser-530 in cyclooxygenase (COX-1/COX-2), permanently blocking arachidonic acid binding.'
    },
    functions: [
      'Antiplatelet (low dose 75–150 mg/day): irreversibly inhibits platelet COX-1 for the entire 7–10 day platelet lifespan, suppressing Thromboxane A₂ (TXA₂) aggregation.',
      'Analgesic & Antipyretic (325–650 mg): reduces peripheral nociceptive sensitization (PGE₂) and hypothalamic fever set-point.',
      'Anti-inflammatory (high dose): suppresses prostaglandin synthesis at inflamed joints.'
    ],
    pharmaceuticalSignificance: [
      'Moisture-sensitive ester hydrolysis yields salicylic acid + acetic acid (detectable by vinegar odor and purple color with FeCl₃); requires dry packaging, desiccants, or enteric-coated/dispersible formulations.',
      'Cannot be stored in unbuffered aqueous solutions for long shelf life due to rapid ester cleavage.',
      'Free salicylic acid impurity limit is tested pharmacopoeially using Ferric Ammonium Sulphate / FeCl₃ (violet complex with free phenolic -OH).'
    ],
    clinicalSignificance: [
      'First-line secondary prevention in myocardial infarction, unstable angina, and ischemic stroke.',
      'Toxicology: overdose causes mixed respiratory alkalosis (central hyperventilation) and metabolic acidosis (salicylate uncoupling of oxidative phosphorylation); treated with urinary alkalinization.',
      'Contraindicated in children/adolescents with viral infections (risk of Reye’s syndrome) and active peptic ulcer disease.'
    ],
    applications: [
      'Cardioprotective antiplatelet therapy (75–81 mg daily).',
      'Model weak-acid drug for pH-partition absorption and first-order ester hydrolysis stability practicals.'
    ],
    associatedDiseases: [
      { name: 'Peptic Ulcer & GI Bleeding', summary: 'Loss of gastroprotective COX-1 prostaglandins (PGE₂/PGI₂) + local mucosal ion-trapping injury.' },
      { name: 'Reye’s Syndrome', summary: 'Rare fatal hepatic encephalopathy associated with salicylate use during pediatric viral illness.' }
    ],
    examKeyPoints: [
      'pKa = 3.5 (weak acid) — unionized fraction is >99% at gastric pH 1.5, yet total surface area of small intestine makes duodenum/jejunum the major absorption site.',
      'Aspirin is the ONLY NSAID that irreversibly inhibits COX via covalent Ser-530 acetylation.',
      'Pure aspirin gives NO violet color with neutral FeCl₃ because the phenolic -OH is masked as an ester; violet color indicates hydrolytic salicylic acid impurity!'
    ],
    mcqs: [
      {
        id: 'aspirin_mcq_1',
        question: 'Why does moisture contamination cause stored aspirin tablets to develop a vinegar odor and give a violet color with FeCl₃ reagent?',
        options: [
          'Oxidation of the benzene ring to phenol',
          'Hydrolysis of the acetoxy ester into salicylic acid (phenolic -OH) and acetic acid (vinegar)',
          'Decarboxylation of the -COOH group into acetanilide',
          'Polymerization into salicylic acid anhydride'
        ],
        correctIndex: 1,
        explanation: 'Ester hydrolysis cleaves aspirin into free acetic acid (vinegar odor) and salicylic acid whose unmasked phenolic -OH complexes with Fe³⁺ to produce a violet color.'
      }
    ],
    relatedTopics: ['pH-Partition Theory & Weak Acid Absorption', 'Ester Hydrolysis & Shelf-Life Stability', 'NSAID & Antiplatelet Pharmacology'],
    relatedSubjectIds: ['subj_nephron'],
    pharmaLabLinks: [
      {
        id: 'link_aspirin_compounding',
        moduleId: 'general_pharmacy',
        tab: 'experiments',
        label: 'BP107P Formulations & Stability Concepts',
        kind: 'experiment',
        description: 'Explore aqueous/powder compounding and dosage form stability considerations.'
      },
      {
        id: 'link_aspirin_cases',
        moduleId: 'anatomy',
        tab: 'cases',
        label: 'Hemophilia & Bleeding Contraindications (Exp 17)',
        kind: 'case_study',
        description: 'Review clinical case noting why aspirin/NSAIDs are avoided in bleeding disorders.'
      }
    ],
    equipmentNames: ['Melting Point Apparatus', 'UV Spectrophotometer', 'HPLC'],
    drugNames: ['Aspirin (Acetylsalicylic Acid)', 'Salicylic Acid', 'Clopidogrel'],
    diseaseNames: ['Myocardial Infarction', 'Peptic Ulcer Disease', 'Reye’s Syndrome', 'Gout'],
    textbookKeywords: ['aspirin', 'acetylsalicylic acid', 'salicylic acid', 'ester hydrolysis', 'cox-1', 'pka 3.5'],
    searchKeywords: [
      '2-acetoxybenzoic acid',
      'c9h8o4',
      'carboxylic acid',
      'acetoxy ester',
      'antiplatelet',
      'nsaid',
      'ferric chloride test',
      'acetylation'
    ],
    annotations: [
      {
        id: 'aspirin_benzene',
        label: 'Aromatic Benzene Ring',
        shortCode: '1',
        xPercent: 40.0,
        yPercent: 49.0,
        regionBox: { x: 29, y: 33, width: 22, height: 32 },
        definition: 'Planar 6-carbon conjugated aromatic scaffold supporting ortho-1,2 substitution.',
        location: 'Central molecular core',
        functionRole: 'Provides hydrophobic π-interactions inside the cyclooxygenase active-site channel and membrane lipid solubility.'
      },
      {
        id: 'aspirin_cooh',
        label: 'Carboxylic Acid Group (-COOH)',
        shortCode: '2',
        xPercent: 42.0,
        yPercent: 22.5,
        regionBox: { x: 32, y: 15, width: 20, height: 16 },
        definition: 'Ionizable weak-acid carboxyl moiety (pKa ≈ 3.5) attached at C-1.',
        location: 'C-1 position (top of benzene ring)',
        functionRole: 'Forms critical electrostatic salt bridge with Arg-120 of COX enzymes and governs pH-dependent GI absorption & renal ion trapping.'
      },
      {
        id: 'aspirin_ester',
        label: 'Acetoxy Ester Group (-OCOCH₃)',
        shortCode: '3',
        xPercent: 67.0,
        yPercent: 40.5,
        regionBox: { x: 53, y: 30, width: 28, height: 20 },
        definition: 'Ortho phenolic ester formed by O-acetylation of salicylic acid.',
        location: 'C-2 (ortho) position',
        functionRole: 'Acts as the reactive acetyl donor that covalently modifies Ser-530 on COX-1/COX-2; site of hydrolytic instability in moist air.'
      }
    ],
    references: [
      {
        title: 'Foye’s Principles of Medicinal Chemistry (Salicylates & NSAIDs)',
        sourceType: 'textbook',
        citation: 'Lemke, T. L., & Williams, D. A. — Structure-activity relationships (SAR) of acetylsalicylic acid and COX acetylation.'
      },
      {
        title: 'Indian Pharmacopoeia (Aspirin Monograph)',
        sourceType: 'pharmacopoeia',
        citation: 'IP Monograph for Aspirin — Assay, limit of free salicylic acid (ferric ammonium sulphate), and storage in airtight containers.'
      }
    ],
    contentStatus: 'verified-curriculum',
    accuracyNotes:
      '2D chemical geometry and annotations reflect exact structural coordinates and official pharmacopoeial SAR/stability principles.'
  },

  subj_gram_bacteria: {
    id: 'subj_gram_bacteria',
    domain: 'microbiology',
    defaultCategory: 'microbiology' as unknown as VisualCategory, // Note: mapped cleanly to 'clinical' or 'microscopy' on VisualMediaItem
    departments: ['general_pharmacy', 'anatomy'],
    identification: {
      primaryName: 'Gram-Positive vs Gram-Negative Bacterial Cell Envelope',
      scientificOrChemicalName: 'Prokaryotic Peptidoglycan & Lipopolysaccharide (LPS) Cell Wall Architecture',
      commonNames: ['Bacterial Cell Wall', 'Gram Stain Structural Comparison'],
      classification: 'Pharmaceutical Microbiology — Prokaryotic Envelope Taxonomy',
      taxonomyOrCode: 'Pharmaceutical Microbiology / Aseptic Sterilization'
    },
    definition:
      'Comparative architecture of the two major eubacterial cell wall envelopes that govern Gram differential staining, mechanical osmotic protection, endotoxin pyrogenicity, and antibiotic susceptibility.',
    introduction:
      'In pharmaceutical microbiology and sterile manufacturing, distinguishing Gram-positive and Gram-negative bacteria is critical both for antimicrobial selection and for pyrogen control—because Gram-negative outer membrane Lipopolysaccharide (Lipid A endotoxin) survives routine autoclaving and causes febrile reactions in parenterals.',
    microbiologyProfile: {
      morphology:
        'Gram-positive bacteria possess a single cytoplasmic lipid bilayer encased in a thick (20–80 nm) multi-layered peptidoglycan meshwork interwoven with teichoic and lipoteichoic acids. Gram-negative bacteria have a thin (2–7 nm) peptidoglycan layer inside a periplasmic space, shielded externally by an asymmetric outer membrane rich in Lipopolysaccharide (LPS) and porin channels.',
      characteristics: [
        'Peptidoglycan (murein) consists of alternating N-acetylglucosamine (NAG) and N-acetylmuramic acid (NAM) chains cross-linked by tetrapeptide bridges via penicillin-binding proteins (PBPs / transpeptidases).',
        'Gram-Positive (e.g., Staphylococcus aureus, Bacillus subtilis): traps crystal violet-iodine complex during ethanol decolorization → stains purple/violet.',
        'Gram-Negative (e.g., Escherichia coli, Pseudomonas aeruginosa): alcohol dissolves outer lipid membrane and washes crystal violet out of thin peptidoglycan → counterstains safranin pink/red.'
      ],
      pathogenicity:
        'Gram-negative Lipid A (endotoxin) triggers intense macrophage TLR4 activation, IL-1/TNF-α cytokine storm, fever, and septic shock upon bacterial lysis. Gram-positive lipoteichoic acids also trigger immune inflammation, while exotoxins are actively secreted.',
      laboratorySignificance:
        'Gram staining (Crystal Violet → Gram’s Iodine → Acetone/Alcohol Decolorizer → Safranin) is the rapid first-step diagnostic triage; LAL (Limulus Amebocyte Lysate) and rabbit pyrogen tests detect Gram-negative endotoxins in sterile injectables.'
    },
    functions: [
      'Protects bacterial protoplast from osmotic lysis against high internal turgor pressure.',
      'Outer membrane porins (OmpF/OmpC) regulate passive entry of hydrophilic nutrients and small β-lactam antibiotics.',
      'Periplasmic space concentrates hydrolytic enzymes and β-lactamases that inactivate susceptible penicillins/cephalosporins.'
    ],
    pharmaceuticalSignificance: [
      'Target of cell-wall synthesis inhibitors: β-lactams (penicillins, cephalosporins, carbapenems) inhibit PBP transpeptidation; vancomycin binds D-Ala-D-Ala (too large to pass Gram-negative porins, hence Gram-positive selective).',
      'Depyrogenation of parenteral glassware requires dry heat (250°C for 30–60 min) because Gram-negative LPS endotoxins are heat-stable and survive standard 121°C moist-heat autoclaving.',
      'Disinfectants/antiseptics (quaternary ammonium compounds, chlorhexidine) disrupt the cytoplasmic phospholipid bilayer.'
    ],
    clinicalSignificance: [
      'Porin loss or mutation in Pseudomonas aeruginosa and Klebsiella confers broad multidrug resistance.',
      'Endotoxin shock during Gram-negative bacteremia requires rapid fluid resuscitation and targeted antimicrobials.'
    ],
    associatedDiseases: [
      { name: 'Gram-Negative Endotoxic Shock', summary: 'Lipid A-driven systemic inflammatory cascade and hypotension.' },
      { name: 'MRSA / Gram-Positive Infections', summary: 'Altered PBP2a in S. aureus confers resistance to most β-lactams (requires vancomycin or linezolid).' }
    ],
    examKeyPoints: [
      'Gram stain sequence: Crystal Violet (1° stain) → Gram’s Iodine (mordant) → 95% Ethanol/Acetone (decolorizer, critical step) → Safranin (counterstain).',
      'Teichoic acids are unique to Gram-positive walls; Lipopolysaccharide (LPS / Lipid A) and periplasmic space are hallmarks of Gram-negative walls.',
      'Vancomycin (~1450 Da) cannot cross narrow Gram-negative outer membrane porins, limiting its spectrum to Gram-positive organisms.'
    ],
    mcqs: [
      {
        id: 'gram_mcq_1',
        question: 'Which component of the Gram-negative bacterial cell envelope acts as a heat-stable pyrogenic endotoxin in parenteral formulations?',
        options: [
          'Teichoic acid',
          'Lipid A moiety of Lipopolysaccharide (LPS)',
          'Peptidoglycan NAM-NAG backbone',
          '70S ribosomal RNA'
        ],
        correctIndex: 1,
        explanation: 'Lipid A anchored in the outer leaflet of the Gram-negative outer membrane is the biologically active endotoxin that triggers fever and requires 250°C dry-heat depyrogenation.'
      }
    ],
    relatedTopics: ['Gram Staining Mechanism', 'Pyrogens & LAL Endotoxin Testing', 'β-Lactam & Glycopeptide Antibiotics'],
    pharmaLabLinks: [
      {
        id: 'link_gram_sterile',
        moduleId: 'general_pharmacy',
        tab: 'theory',
        label: 'BP102T Unit IV–V: Dosage Forms & Sterile QC',
        kind: 'department',
        description: 'Connect bacterial contamination control to pharmaceutical preparations and pharmacopoeial standards.'
      }
    ],
    equipmentNames: ['Compound Microscope (100× Oil Immersion)', 'Autoclave', 'Hot Air Oven (Depyrogenation)'],
    drugNames: ['Penicillin G', 'Ceftriaxone', 'Vancomycin', 'Polymyxin B', 'Chlorhexidine'],
    diseaseNames: ['Endotoxic Septic Shock', 'MRSA Bacteremia', 'Urinary Tract Infection'],
    textbookKeywords: ['gram positive', 'gram negative', 'peptidoglycan', 'lipopolysaccharide', 'endotoxin', 'porin', 'teichoic'],
    searchKeywords: [
      'cell wall',
      'crystal violet',
      'safranin',
      'lipid a',
      'periplasmic space',
      'beta lactamase',
      'pyrogen',
      'lal test',
      'pbp'
    ],
    annotations: [
      {
        id: 'gram_pg_thick',
        label: 'Thick Peptidoglycan (Gram-Positive)',
        shortCode: '1',
        xPercent: 26.0,
        yPercent: 35.0,
        regionBox: { x: 7, y: 23, width: 38, height: 25 },
        definition: 'Multi-layered (20–80 nm) cross-linked NAG-NAM glycan polymer constituting up to 90% of Gram-positive wall dry weight.',
        location: 'Gram-Positive outer wall (left)',
        functionRole: 'Resists osmotic turgor and dehydrates during alcohol wash, trapping the crystal violet-iodine complex purple.'
      },
      {
        id: 'gram_teichoic',
        label: 'Teichoic & Lipoteichoic Acids',
        shortCode: '2',
        xPercent: 38.0,
        yPercent: 22.0,
        definition: 'Anionic polyol-phosphate polymers spanning peptidoglycan (teichoic) or anchored to the cytoplasmic membrane (lipoteichoic).',
        location: 'Exclusively in Gram-Positive cell walls',
        functionRole: 'Provides negative cell-surface charge, binds Mg²⁺/Ca²⁺, and mediates host tissue adherence.'
      },
      {
        id: 'gram_lps',
        label: 'Outer Membrane & LPS (Lipid A Endotoxin)',
        shortCode: '3',
        xPercent: 73.0,
        yPercent: 27.0,
        regionBox: { x: 55, y: 23, width: 38, height: 7 },
        definition: 'Asymmetric lipid bilayer featuring Lipid A, core polysaccharide, and O-antigen chains on the outer leaflet.',
        location: 'Outermost surface of Gram-Negative bacteria (right)',
        functionRole: 'Forms a hydrophobic permeability barrier against large antibiotics (vancomycin) and acts as potent heat-stable pyrogenic endotoxin.'
      },
      {
        id: 'gram_porin',
        label: 'Outer Membrane Porin Channel (OmpF/C)',
        shortCode: '4',
        xPercent: 71.5,
        yPercent: 22.0,
        definition: 'Trimeric β-barrel protein channels spanning the Gram-negative outer membrane.',
        location: 'Embedded in Gram-Negative outer membrane',
        functionRole: 'Permits passive diffusion of small hydrophilic solutes (<600–700 Da) and polar β-lactams like ampicillin/imipenem.'
      },
      {
        id: 'gram_periplasm',
        label: 'Periplasmic Space & Thin Peptidoglycan',
        shortCode: '5',
        xPercent: 74.0,
        yPercent: 38.0,
        regionBox: { x: 55, y: 30, width: 38, height: 17 },
        definition: 'Gel-like compartment between outer and inner membranes housing a thin (2–7 nm) peptidoglycan monolayer and defensive enzymes.',
        location: 'Between Gram-Negative outer and cytoplasmic membranes',
        functionRole: 'Concentrates β-lactamase enzymes that hydrolyze penicillins/cephalosporins before they reach inner-membrane PBPs.'
      },
      {
        id: 'gram_cyto_mem',
        label: 'Cytoplasmic Phospholipid Bilayer',
        shortCode: '6',
        xPercent: 50.0,
        yPercent: 53.0,
        definition: 'Inner selectively permeable phospholipid bilayer carrying respiratory electron transport enzymes and PBPs.',
        location: 'Present in BOTH Gram-Positive and Gram-Negative bacteria',
        functionRole: 'Executes ATP synthesis, active nutrient transport, and final peptidoglycan transpeptidation.'
      }
    ],
    references: [
      {
        title: 'Pelczar Microbiology (Prokaryotic Cell Structure)',
        sourceType: 'textbook',
        citation: 'Pelczar, M. J., Chan, E. C. S., & Krieg, N. R. — Gram-positive vs Gram-negative cell wall chemistry and staining mechanism.'
      },
      {
        title: 'Hugo and Russell’s Pharmaceutical Microbiology',
        sourceType: 'textbook',
        citation: 'Denyer, S. P. et al. — Endotoxin pyrogenicity, sterilization, and antibiotic outer-membrane penetration.'
      }
    ],
    contentStatus: 'verified-curriculum',
    accuracyNotes:
      'Schematic proportions illustrate structural contrast clearly; biological dimensions (20–80 nm vs 2–7 nm) are noted quantitatively in component descriptions.'
  },

  subj_diuretic_pharmacology: {
    id: 'subj_diuretic_pharmacology',
    domain: 'pharmacology',
    defaultCategory: 'clinical',
    departments: ['anatomy', 'general_pharmacy'],
    identification: {
      primaryName: 'Diuretic Drug Classes — Nephron Sites of Action',
      scientificOrChemicalName: 'Renal Tubular Ion-Transport Inhibitors (CAIs, Loop, Thiazide, K⁺-Sparing)',
      commonNames: ['Diuretics Along the Nephron', 'Renal Pharmacology Sites'],
      classification: 'Cardiovascular-Renal Pharmacology',
      taxonomyOrCode: 'Pharmacology / Clinical Therapeutics'
    },
    definition:
      'Diuretics are pharmacological agents that increase net renal excretion of sodium (natriuresis) and water (diuresis) by inhibiting specific ion transporters along distinct segments of the nephron.',
    introduction:
      'Because different nephron segments reabsorb markedly different percentages of filtered Na⁺ (PCT ~65%, Thick Ascending Limb ~25%, DCT ~5–8%, Collecting Duct ~2–3%), the anatomical site of transporter inhibition directly determines diuretic ceiling efficacy as well as K⁺, Ca²⁺, and acid-base adverse effects.',
    pharmacologyProfile: {
      drugClass:
        '1. Carbonic Anhydrase Inhibitors (Acetazolamide) · 2. Loop / High-Ceiling Diuretics (Furosemide, Bumetanide, Torsemide) · 3. Thiazide & Thiazide-like Diuretics (Hydrochlorothiazide, Chlorthalidone) · 4. Potassium-Sparing Diuretics (Spironolactone, Eplerenone, Amiloride, Triamterene)',
      mechanismOfAction:
        'Each class reaches its tubular luminal target (mostly via active OAT secretion in the PCT, except spironolactone which enters basolaterally) and blocks specific Na⁺-coupled transporters: CA II/IV in PCT, NKCC2 in Thick Ascending Limb, NCC in Early DCT, and ENaC/Mineralocorticoid Receptor in Collecting Duct.',
      pharmacologicalEffects: [
        'Loop diuretics abolish the medullary hypertonic gradient and inhibit paracellular Ca²⁺/Mg²⁺ reabsorption (↑ urinary Ca²⁺).',
        'Thiazides enhance basolateral Na⁺/Ca²⁺ exchange in DCT, decreasing urinary Ca²⁺ excretion (hypocalciuric effect).',
        'High distal Na⁺ delivery from Loop/Thiazide diuretics stimulates Collecting Duct principal-cell K⁺ and H⁺ wasting (hypokalemic metabolic alkalosis).',
        'K⁺-sparing diuretics blunt ENaC-driven lumen-negative potential, retaining K⁺.'
      ],
      therapeuticUses: [
        'Acute pulmonary edema, heart failure fluid overload, and nephrotic/cirrhotic edema (Loop diuretics).',
        'Essential hypertension and idiopathic hypercalciuria / calcium oxalate kidney stones (Thiazides).',
        'Open-angle glaucoma, acute mountain sickness, and metabolic alkalosis (Acetazolamide).',
        'Hyperaldosteronism, HFrEF mortality reduction, and cirrhotic ascites (Spironolactone).'
      ],
      adverseEffects: [
        'Loop Diuretics: Hypokalemia, hypomagnesemia, hypocalcemia, metabolic alkalosis, hyperuricemia (gout), dose-dependent ototoxicity (especially with aminoglycosides).',
        'Thiazides: Hypokalemia, hyponatremia, hyperuricemia, hyperglycemia, hyperlipidemia, sulfonamide hypersensitivity.',
        'K⁺-Sparing: Life-threatening hyperkalemia (especially when combined with ACE inhibitors/ARBs), metabolic acidosis, gynecomastia (spironolactone).',
        'Acetazolamide: Hyperchloremic metabolic acidosis, paresthesias, renal stones.'
      ],
      contraindications: [
        'Anuria or severe pre-existing hypovolemia/electrolyte depletion.',
        'K⁺-sparing diuretics contraindicated in hyperkalemia (K⁺ > 5.0–5.5 mEq/L) or severe renal failure.',
        'Concurrent furosemide + aminoglycosides increases irreversible ototoxicity risk.'
      ]
    },
    functions: [
      'Reduces intravascular blood volume, preload, and peripheral vascular resistance.',
      'Reverses pulmonary and peripheral pitting edema.'
    ],
    clinicalSignificance: [
      'Combining a loop or thiazide diuretic with a K⁺-sparing agent (e.g., hydrochlorothiazide + amiloride/spironolactone) counterbalances serum potassium shifts.',
      'Sequential nephron blockade (loop + thiazide such as metolazone) overcomes diuretic resistance in refractory edema.'
    ],
    pharmaceuticalSignificance: [
      'Loop and thiazide diuretics are weak acids requiring OAT secretion in the PCT; NSAIDs compete at OATs and blunt diuretic efficacy.',
      'Furosemide is light-sensitive and formulated in amber/light-resistant packaging.'
    ],
    examKeyPoints: [
      'Loop diuretics are "high-ceiling" (excreting up to 25% of filtered Na⁺) because the Thick Ascending Limb absorbs a huge fraction of Na⁺ and has limited downstream compensation.',
      'Loop diuretics INCREASE urinary Ca²⁺ (useful in acute hypercalcemia); Thiazides DECREASE urinary Ca²⁺ (useful in calcium kidney stones).',
      'Spironolactone is an aldosterone mineralocorticoid receptor antagonist that causes anti-androgenic gynecomastia; Eplerenone is selective with minimal gynecomastia.'
    ],
    mcqs: [
      {
        id: 'diuretic_mcq_1',
        question: 'Which diuretic class inhibits the NKCC2 (Na⁺-K⁺-2Cl⁻) cotransporter in the Thick Ascending Limb and increases urinary calcium excretion?',
        options: [
          'Hydrochlorothiazide',
          'Furosemide (Loop diuretic)',
          'Acetazolamide',
          'Amiloride'
        ],
        correctIndex: 1,
        explanation: 'Loop diuretics (furosemide, torsemide) block NKCC2 in the Thick Ascending Limb, abolishing the lumen-positive potential that normally drives paracellular Ca²⁺/Mg²⁺ reabsorption.'
      }
    ],
    relatedTopics: ['Human Nephron Filtration & Tubular Transport', 'RAAS & Antihypertensive Therapy', 'Electrolyte Balance'],
    relatedSubjectIds: ['subj_nephron', 'subj_heart_anatomy'],
    pharmaLabLinks: [
      {
        id: 'link_diuretic_cases',
        moduleId: 'anatomy',
        tab: 'cases',
        label: 'BP109P Exp 17: Hypertension & Pharmacotherapy Cases',
        kind: 'case_study',
        description: 'Connect thiazide & RAAS management to clinical hypertension cases.'
      },
      {
        id: 'link_diuretic_cardio',
        moduleId: 'anatomy',
        tab: 'cardio',
        label: 'Blood Pressure & Cardiovascular Vitals Bench',
        kind: 'simulator',
        description: 'Inspect systemic blood pressure & cardiovascular hemodynamics.'
      }
    ],
    equipmentNames: ['Sphygmomanometer', 'Flame Photometer / Electrolyte Analyzer'],
    drugNames: ['Furosemide', 'Torsemide', 'Hydrochlorothiazide', 'Chlorthalidone', 'Acetazolamide', 'Spironolactone', 'Amiloride'],
    diseaseNames: ['Hypertension', 'Heart Failure', 'Pulmonary Edema', 'Glaucoma', 'Hypokalemia', 'Gout'],
    textbookKeywords: ['diuretic', 'furosemide', 'thiazide', 'spironolactone', 'acetazolamide', 'nkcc2', 'ncc', 'enac'],
    searchKeywords: [
      'loop diuretic',
      'high ceiling diuretic',
      'potassium sparing',
      'carbonic anhydrase inhibitor',
      'aldosterone antagonist',
      'ototoxicity',
      'hypokalemia',
      'hyperkalemia',
      'renal pharmacology'
    ],
    annotations: [
      {
        id: 'diuretic_cai',
        label: 'Site 1: CA Inhibitors — PCT (Acetazolamide)',
        shortCode: '1',
        xPercent: 32.7,
        yPercent: 20.9,
        regionBox: { x: 22, y: 14, width: 21, height: 14 },
        definition: 'Inhibitors of luminal and intracellular Carbonic Anhydrase (CA IV/II) in the Proximal Convoluted Tubule.',
        location: 'Proximal Convoluted Tubule (Site 1)',
        functionRole: 'Prevents HCO₃⁻ reabsorption, causing self-limiting alkaline diuresis and mild metabolic acidosis.',
        physiologicalOrClinicalImportance: 'Used primarily for open-angle glaucoma (lowers aqueous humor) and acute mountain sickness rather than edema.'
      },
      {
        id: 'diuretic_loop',
        label: 'Site 2: Loop Diuretics — Thick Ascending Limb (Furosemide)',
        shortCode: '2',
        xPercent: 29.0,
        yPercent: 57.3,
        regionBox: { x: 16, y: 50, width: 26, height: 15 },
        definition: 'High-ceiling sulfonamide/phenoxyacetic inhibitors of the luminal NKCC2 (Na⁺-K⁺-2Cl⁻) cotransporter.',
        location: 'Thick Ascending Limb of Loop of Henle (Site 2)',
        functionRole: 'Eliminates up to 25% of filtered Na⁺ load, collapses medullary osmotic gradient, and increases Ca²⁺/Mg²⁺ excretion.',
        physiologicalOrClinicalImportance: 'Drug of choice for acute pulmonary edema and severe heart failure; watch for hypokalemia and ototoxicity.'
      },
      {
        id: 'diuretic_thiazide',
        label: 'Site 3: Thiazides — Early DCT (Hydrochlorothiazide)',
        shortCode: '3',
        xPercent: 58.5,
        yPercent: 20.5,
        regionBox: { x: 47, y: 14, width: 23, height: 14 },
        definition: 'Moderate-efficacy inhibitors of the electroneutral Na⁺-Cl⁻ cotransporter (NCC).',
        location: 'Early Distal Convoluted Tubule (Site 3)',
        functionRole: 'Excretes ~5–8% of filtered Na⁺ while stimulating distal Ca²⁺ reabsorption (reducing urinary calcium).',
        physiologicalOrClinicalImportance: 'First-line antihypertensive agents and preventive therapy for recurrent calcium kidney stones.'
      },
      {
        id: 'diuretic_k_sparing',
        label: 'Site 4: K⁺-Sparing — Collecting Duct (Spironolactone / Amiloride)',
        shortCode: '4',
        xPercent: 86.5,
        yPercent: 54.0,
        regionBox: { x: 76, y: 46, width: 21, height: 15 },
        definition: 'Mineralocorticoid receptor antagonists (spironolactone) and direct ENaC Na⁺-channel blockers (amiloride, triamterene).',
        location: 'Late DCT & Cortical Collecting Duct Principal Cells (Site 4)',
        functionRole: 'Blocks aldosterone-driven Na⁺ reabsorption and prevents lumen-negative voltage-driven K⁺/H⁺ loss.',
        physiologicalOrClinicalImportance: 'Retains serum K⁺; improves survival in HFrEF and cirrhotic ascites; avoid combining carelessly with ACEi/ARBs due to hyperkalemia.'
      }
    ],
    references: [
      {
        title: 'Essentials of Medical Pharmacology (Diuretics)',
        sourceType: 'textbook',
        citation: 'Tripathi, K. D. — Classification, nephron sites of action, electrolyte shifts, and clinical uses of diuretics.'
      },
      {
        title: 'Basic & Clinical Pharmacology (Diuretic Agents)',
        sourceType: 'textbook',
        citation: 'Katzung, B. G. — Segmental nephron pharmacology and transporter targets.'
      }
    ],
    contentStatus: 'verified-curriculum',
    accuracyNotes:
      'Diuretic sites and transporter profiles align with Tripathi and Katzung pharmacology references. Links directly to the reusable Human Nephron anatomical subject.'
  }
};

export function getAcademicSubject(subjectId?: string | null): AcademicSubjectResource | null {
  if (!subjectId) return null;
  return ACADEMIC_SUBJECTS[subjectId] || null;
}

export function inferDomainFromCategory(category: VisualCategory): AcademicDomain {
  switch (category) {
    case 'anatomy':
      return 'anatomy';
    case 'apparatus':
      return 'equipment';
    case 'chemistry':
      return 'chemistry';
    case 'microscopy':
    case 'botany':
      return 'histology_microscopy';
    case 'formulation':
      return 'formulation';
    case 'clinical':
    default:
      return 'clinical';
  }
}

function splitCleanLines(val?: string): string[] | undefined {
  if (!val) return undefined;
  const lines = val
    .split(/\n|;/)
    .map((s) => s.trim())
    .filter(Boolean);
  return lines.length > 0 ? lines : undefined;
}

export function getAvailableTabsForContext(
  ctx: Omit<ResolvedAcademicContext, 'availableTabs'>
): Array<{ id: AcademicTabId; label: string }> {
  const tabs: Array<{ id: AcademicTabId; label: string }> = [
    { id: 'overview', label: 'Overview' }
  ];

  const hasStructure = Boolean(
    ctx.structureSummary ||
      (ctx.components && ctx.components.length > 0) ||
      ctx.annotations.length > 0 ||
      ctx.chemistryProfile?.functionalGroups?.length ||
      ctx.equipmentProfile?.construction ||
      ctx.microbiologyProfile?.morphology ||
      ctx.histologyProfile?.structuralCharacteristics?.length
  );
  if (hasStructure) {
    tabs.push({ id: 'structure', label: 'Structure' });
  }

  const hasFunction = Boolean(
    (ctx.functions && ctx.functions.length > 0) ||
      ctx.physiologicalRole ||
      ctx.chemistryProfile?.physicochemicalProperties?.length ||
      ctx.histologyProfile?.normalVsAbnormal ||
      ctx.pharmacologyProfile?.pharmacologicalEffects?.length
  );
  if (hasFunction) {
    tabs.push({ id: 'function', label: 'Function' });
  }

  const hasMechanism = Boolean(
    ctx.mechanism ||
      ctx.equipmentProfile?.principle ||
      ctx.equipmentProfile?.workingMechanism ||
      ctx.pharmacologyProfile?.mechanismOfAction ||
      ctx.chemistryProfile?.reactionMechanism
  );
  if (hasMechanism) {
    tabs.push({ id: 'mechanism', label: 'Mechanism' });
  }

  const hasClinical = Boolean(
    (ctx.clinicalSignificance && ctx.clinicalSignificance.length > 0) ||
      (ctx.associatedDiseases && ctx.associatedDiseases.length > 0) ||
      ctx.pharmacologyProfile?.adverseEffects?.length ||
      ctx.pharmacologyProfile?.contraindications?.length ||
      ctx.microbiologyProfile?.pathogenicity
  );
  if (hasClinical) {
    tabs.push({ id: 'clinical', label: 'Clinical' });
  }

  const hasPharma = Boolean(
    (ctx.pharmaceuticalSignificance && ctx.pharmaceuticalSignificance.length > 0) ||
      (ctx.applications && ctx.applications.length > 0) ||
      ctx.pharmacologyProfile?.therapeuticUses?.length ||
      ctx.equipmentProfile?.advantages?.length ||
      ctx.equipmentProfile?.maintenanceAndSafety?.length
  );
  if (hasPharma) {
    tabs.push({ id: 'pharmaceutical', label: 'Pharmaceutical' });
  }

  const hasExam = Boolean(
    (ctx.importantCharacteristics && ctx.importantCharacteristics.length > 0) ||
      (ctx.examKeyPoints && ctx.examKeyPoints.length > 0) ||
      (ctx.mcqs && ctx.mcqs.length > 0) ||
      (ctx.relatedTopics && ctx.relatedTopics.length > 0)
  );
  if (hasExam) {
    tabs.push({ id: 'exam_notes', label: 'Exam Notes' });
  }

  // Always include References & Connected Resources tab so sources, textbook links, and missing sections are clear
  tabs.push({ id: 'references', label: 'Resources' });

  return tabs;
}

export function resolveAcademicContextForVisual(item: VisualMediaItem): ResolvedAcademicContext {
  const baseSubject = getAcademicSubject(item.subjectId);
  const enrichment: UserAcademicEnrichment | undefined = item.academicData;
  const domain: AcademicDomain =
    enrichment?.domain || item.academicDomain || baseSubject?.domain || inferDomainFromCategory(item.category);

  // Merge annotations: curated subject annotations + any user-added annotations
  const baseAnnotations = baseSubject?.annotations || [];
  const customAnnotations = item.annotations || [];
  const annotationsMap = new Map<string, InteractiveAnnotation>();
  for (const ann of baseAnnotations) annotationsMap.set(ann.id, ann);
  for (const ann of customAnnotations) annotationsMap.set(ann.id, ann);
  const annotations = Array.from(annotationsMap.values());

  // Build verified provenance references without fabricating anything
  const refs: AcademicReference[] = [];
  if (baseSubject?.references) {
    refs.push(...baseSubject.references);
  }
  if (item.sourceType === 'open-access' || item.sourceUrl) {
    refs.push({
      title: item.sourceName || 'External Open-Access Source',
      sourceType: 'open-access',
      citation: [item.creator, item.license, item.attribution].filter(Boolean).join(' · ') || 'External repository record',
      url: item.sourceUrl,
      reliabilityNote: 'Verify external repository metadata and license before academic redistribution.'
    });
  } else if (item.sourceType === 'textbook-crop') {
    refs.push({
      title: item.sourceName || 'Uploaded Textbook Extract',
      sourceType: 'textbook',
      citation: item.attribution || `Extracted from uploaded PDF textbook (Page ${item.linkedBookPage || '?'})`,
      reliabilityNote: 'Derived from your locally uploaded PDF textbook.'
    });
  } else if (item.sourceType === 'upload' && !baseSubject) {
    refs.push({
      title: item.sourceName || 'User Uploaded Media',
      sourceType: 'curriculum',
      citation: [item.creator, item.license].filter(Boolean).join(' · ') || 'Local user upload',
      reliabilityNote: 'User-provided visual; academic sections below reflect only supplied or enriched notes.'
    });
  }

  if (enrichment?.referenceCitation?.trim()) {
    refs.push({
      title: 'User-Added Academic Reference',
      sourceType: 'curriculum',
      citation: enrichment.referenceCitation.trim()
    });
  }

  // Resolve PharmaLab module links based on subject OR visual departments
  const pharmaLabLinks: RelatedPharmaLabLink[] = baseSubject?.pharmaLabLinks
    ? [...baseSubject.pharmaLabLinks]
    : buildDepartmentFallbackLinks(item);

  const definition = enrichment?.definition?.trim() || baseSubject?.definition;
  const introduction =
    enrichment?.introduction?.trim() ||
    baseSubject?.introduction ||
    (item.description && item.description !== item.caption ? item.description : item.caption) ||
    undefined;

  const classificationDetails = enrichment?.classification?.trim()
    ? [{ label: 'Classification', detail: enrichment.classification.trim() }]
    : baseSubject?.classificationDetails;

  const locationOrOrigin = enrichment?.locationOrOrigin?.trim() || baseSubject?.locationOrOrigin;
  const structureSummary = enrichment?.structureSummary?.trim() || baseSubject?.structureSummary;
  const functions = splitCleanLines(enrichment?.functionsText) || baseSubject?.functions;
  const mechanism = enrichment?.mechanismSummary?.trim()
    ? {
        title: baseSubject?.mechanism?.title || 'Working / Action Mechanism',
        summary: enrichment.mechanismSummary.trim(),
        steps: baseSubject?.mechanism?.steps
      }
    : baseSubject?.mechanism;
  const clinicalSignificance =
    splitCleanLines(enrichment?.clinicalSignificanceText) || baseSubject?.clinicalSignificance;
  const pharmaceuticalSignificance =
    splitCleanLines(enrichment?.pharmaceuticalSignificanceText) || baseSubject?.pharmaceuticalSignificance;
  const examKeyPoints =
    splitCleanLines(enrichment?.examKeyPointsText) || baseSubject?.examKeyPoints;

  // Completeness & missing sections honesty check
  const sectionChecks: Array<{ label: string; present: boolean }> = [
    { label: 'Definition', present: Boolean(definition) },
    { label: 'Introduction / Overview', present: Boolean(introduction) },
    { label: 'Structure & Components', present: Boolean(structureSummary || baseSubject?.components?.length || annotations.length > 0) },
    { label: 'Functions / Physiological Role', present: Boolean(functions?.length || baseSubject?.physiologicalRole || baseSubject?.chemistryProfile?.physicochemicalProperties?.length) },
    { label: 'Mechanism / Working Principle', present: Boolean(mechanism || baseSubject?.equipmentProfile?.workingMechanism || baseSubject?.pharmacologyProfile?.mechanismOfAction || baseSubject?.chemistryProfile?.reactionMechanism) },
    { label: 'Clinical Significance / Diseases', present: Boolean(clinicalSignificance?.length || baseSubject?.associatedDiseases?.length || baseSubject?.pharmacologyProfile?.adverseEffects?.length) },
    { label: 'Pharmaceutical Applications', present: Boolean(pharmaceuticalSignificance?.length || baseSubject?.applications?.length || baseSubject?.pharmacologyProfile?.therapeuticUses?.length || baseSubject?.equipmentProfile?.maintenanceAndSafety?.length) },
    { label: 'Exam Key Points', present: Boolean(examKeyPoints?.length || baseSubject?.importantCharacteristics?.length) },
    { label: 'Academic References', present: refs.length > 0 }
  ];

  const availableSections = sectionChecks.filter((s) => s.present).map((s) => s.label);
  const missingSections = sectionChecks.filter((s) => !s.present).map((s) => s.label);
  const completenessPercent = Math.round((availableSections.length / sectionChecks.length) * 100);

  const hasEnrichment = Boolean(
    enrichment &&
      (enrichment.definition ||
        enrichment.structureSummary ||
        enrichment.functionsText ||
        enrichment.mechanismSummary ||
        enrichment.clinicalSignificanceText ||
        enrichment.pharmaceuticalSignificanceText ||
        enrichment.examKeyPointsText)
  );

  const contentStatus = baseSubject
    ? baseSubject.contentStatus
    : hasEnrichment
      ? 'user-contributed'
      : item.description || item.caption
        ? 'partial-metadata'
        : 'unverified';

  const accuracyNotes = baseSubject
    ? baseSubject.accuracyNotes
    : hasEnrichment
      ? 'Includes user-contributed academic notes layered onto image metadata. Verify citations against standard textbooks.'
      : 'Only verified image metadata from the upload/repository record is shown. Missing academic sections are left blank intentionally rather than fabricated—use "Enrich Academic Info" or link an existing subject resource.';

  const partialCtx: Omit<ResolvedAcademicContext, 'availableTabs'> = {
    subjectId: baseSubject?.id,
    domain,
    identification: {
      primaryName: baseSubject?.identification.primaryName || item.title,
      scientificOrChemicalName:
        enrichment?.scientificOrChemicalName?.trim() || baseSubject?.identification.scientificOrChemicalName,
      commonNames: baseSubject?.identification.commonNames,
      classification:
        enrichment?.classification?.trim() ||
        baseSubject?.identification.classification ||
        ACADEMIC_DOMAIN_LABELS[domain],
      taxonomyOrCode: baseSubject?.identification.taxonomyOrCode,
      formulaOrIupac: baseSubject?.identification.formulaOrIupac
    },
    definition,
    introduction,
    classificationDetails,
    locationOrOrigin,
    structureSummary,
    components: baseSubject?.components,
    functions,
    physiologicalRole: baseSubject?.physiologicalRole,
    associatedOrgansOrSystems: baseSubject?.associatedOrgansOrSystems,
    mechanism,
    equipmentProfile: baseSubject?.equipmentProfile,
    chemistryProfile: baseSubject?.chemistryProfile,
    pharmacologyProfile: baseSubject?.pharmacologyProfile,
    microbiologyProfile: baseSubject?.microbiologyProfile,
    histologyProfile: baseSubject?.histologyProfile,
    clinicalSignificance,
    pharmaceuticalSignificance,
    applications: baseSubject?.applications,
    associatedDiseases: baseSubject?.associatedDiseases,
    importantCharacteristics: baseSubject?.importantCharacteristics,
    examKeyPoints,
    mcqs: baseSubject?.mcqs,
    relatedTopics: baseSubject?.relatedTopics || (item.topics.length > 0 ? item.topics : undefined),
    relatedSubjectIds: baseSubject?.relatedSubjectIds,
    pharmaLabLinks,
    equipmentNames: baseSubject?.equipmentNames || item.equipment,
    drugNames: baseSubject?.drugNames || [],
    diseaseNames: baseSubject?.diseaseNames || [],
    textbookKeywords: baseSubject?.textbookKeywords || [
      ...item.topics,
      ...item.tags,
      item.title.split(' ')[0] || ''
    ].filter((t) => t.length >= 3),
    annotations,
    references: refs,
    contentStatus,
    accuracyNotes,
    completeness: {
      availableSections,
      missingSections,
      completenessPercent,
      hasVerifiedAnnotations: annotations.length > 0
    }
  };

  return {
    ...partialCtx,
    availableTabs: getAvailableTabsForContext(partialCtx)
  };
}

function buildDepartmentFallbackLinks(item: VisualMediaItem): RelatedPharmaLabLink[] {
  const links: RelatedPharmaLabLink[] = [];
  for (const dept of item.departments) {
    if (dept === 'anatomy') {
      links.push({
        id: 'dept_anatomy',
        moduleId: 'anatomy',
        tab: 'theory',
        label: 'Human Anatomy & Physiology (BP104T / BP109P)',
        kind: 'department',
        description: 'Open anatomy diagrams, histology, hematology, and clinical case files.'
      });
    } else if (dept === 'inorganic') {
      links.push({
        id: 'dept_inorganic',
        moduleId: 'inorganic',
        tab: 'diagrams',
        label: 'Inorganic & Analytical Chemistry (BP106T / BP111P)',
        kind: 'department',
        description: 'Open volumetric assays, limit tests, and apparatus schematics.'
      });
    } else if (dept === 'pharmacognosy') {
      links.push({
        id: 'dept_pharmacognosy',
        moduleId: 'pharmacognosy',
        tab: 'powder',
        label: 'Pharmacognosy & Microscopy (BP105T / BP110P)',
        kind: 'department',
        description: 'Open plant morphology, powder microscopy, and leaf constants.'
      });
    } else if (dept === 'general_pharmacy') {
      links.push({
        id: 'dept_pharmaceutics',
        moduleId: 'general_pharmacy',
        tab: 'experiments',
        label: 'Pharmaceutics Bench (BP102T / BP107P)',
        kind: 'department',
        description: 'Open compounding formulations, posology, and calculations.'
      });
    } else if (dept === 'psychology') {
      links.push({
        id: 'dept_psychology',
        moduleId: 'psychology',
        tab: 'cases',
        label: 'Healthcare Psychology & Comm. (BP103T / BP108P)',
        kind: 'department',
        description: 'Open clinical role-plays, case discussions, and theory.'
      });
    } else if (dept === 'python') {
      links.push({
        id: 'dept_python',
        moduleId: 'pandas',
        tab: null,
        label: 'Python & PK Data Science (BP101T)',
        kind: 'department',
        description: 'Open Python IDE and pharmacokinetic Pandas analysis.'
      });
    }
  }
  return links;
}

export function findCandidateSubjectsForVisual(item: VisualMediaItem): AcademicSubjectResource[] {
  if (item.subjectId) return [];
  const hay = [item.title, item.caption, item.description, ...item.topics, ...item.tags]
    .join(' ')
    .toLowerCase();

  const matches: Array<{ subject: AcademicSubjectResource; score: number }> = [];
  for (const subject of Object.values(ACADEMIC_SUBJECTS)) {
    let score = 0;
    const keywords = [
      subject.identification.primaryName.toLowerCase(),
      ...(subject.identification.commonNames || []).map((c) => c.toLowerCase()),
      ...subject.textbookKeywords.map((k) => k.toLowerCase())
    ];
    for (const kw of keywords) {
      if (kw.length >= 4 && hay.includes(kw)) score += 10;
    }
    if (score >= 10) {
      matches.push({ subject, score });
    }
  }
  return matches.sort((a, b) => b.score - a.score).map((m) => m.subject).slice(0, 3);
}
