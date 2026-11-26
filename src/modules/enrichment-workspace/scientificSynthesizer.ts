import { ANATOMY_CATALOG } from '../../data/anatomyCatalog';
import { ENGINE_SUBTOPICS, ENGINE_TOPICS } from '../../data/academicEngineRegistry';
import { DEPARTMENT_WORKSPACES } from '../../types/academicArchitecture';
import { APPARATUS_PROFILES, EXPERIMENT_CATALOG } from '../assets-3d/experimentCatalog';
import { INTERACTIVE_EXPERIMENTS } from '../interactive-experiments/experiments';
import {
  AcquiredTopicResource,
  EnrichmentComparisonTable,
  EnrichmentDepthLevel,
  EnrichmentQuestionEntry,
  EnrichmentSectionKey,
  EnrichmentSourceAttachment,
  ExamQuestionItem,
  LearningDomainMode,
  SyllabusProfile,
  SyllabusSubjectNode,
  SyllabusTopicNode
} from '../study-mode/types';
import {
  deduplicateLinesAgainstExisting,
  deduplicateProseAgainstExisting
} from './qualityValidator';
import { SectionAssessmentState } from './sectionCatalog';
import { AttachableSourceCandidate, candidateToAttachment } from './sourceAttachmentService';
import { classifyAcquiredResourcePriority } from './sourcePolicy';
import { TextbookSearchHit } from './textbookSearchEngine';

export interface SynthesizedDraftPayload {
  prose: string;
  bullets: string[];
  formulas: string[];
  comparisonTable?: EnrichmentComparisonTable;
  importantQuestions: EnrichmentQuestionEntry[];
  suggestedAttachments: EnrichmentSourceAttachment[];
  sourceSupportNote: string;
}

interface DomainKnowledgeCue {
  domainFocus: string;
  mechanismFrame: string;
  chemicalOrBiologicalEquations: string[];
  formulas: string[];
  pharmaRelevancePoints: string[];
  clinicalOrAppliedPoints: string[];
  comparisonTable?: EnrichmentComparisonTable;
}

function resolveTopicContext(topic: SyllabusTopicNode, subject: SyllabusSubjectNode) {
  const hay = `${subject.code} ${topic.title} ${topic.unitTitle} ${topic.summary} ${topic.keywords.join(' ')} ${topic.subtopics
    .map((s) => `${s.title} ${s.summary || ''}`)
    .join(' ')}`.toLowerCase();

  const structIds = new Set<string>(topic.linkedStructureIds || []);
  topic.subtopics.forEach((st) => {
    if (st.linkedStructureId) structIds.add(st.linkedStructureId);
  });
  const linkedAnatomy = ANATOMY_CATALOG.filter((a) => structIds.has(a.id));

  const engineSubIds = new Set<string>(
    (topic.linkedEngineTopicId && ENGINE_TOPICS[topic.linkedEngineTopicId]?.subtopicIds) || []
  );
  topic.subtopics.forEach((st) => {
    if (st.linkedSubtopicId) engineSubIds.add(st.linkedSubtopicId);
  });
  const linkedEngineSubs = Array.from(engineSubIds)
    .map((id) => ENGINE_SUBTOPICS[id])
    .filter(Boolean);

  const deptMeta = Object.values(DEPARTMENT_WORKSPACES).find(
    (d) =>
      d.code.toUpperCase().includes(subject.code.toUpperCase()) ||
      d.id === topic.departmentId
  );

  const matchingExperiments = Object.values(EXPERIMENT_CATALOG).filter(
    (exp) =>
      exp.subjectCode.toUpperCase() === subject.code.toUpperCase() ||
      topic.keywords.some((kw) => `${exp.title} ${exp.setupSummary || ''}`.toLowerCase().includes(kw.toLowerCase()))
  );

  const matchingSims = INTERACTIVE_EXPERIMENTS.filter(
    (sim) =>
      sim.academicContext.subjectCode.toUpperCase().includes(subject.code.toUpperCase()) ||
      sim.academicContext.studyModeSubjectCode === subject.code
  );

  const matchingApparatus = matchingExperiments
    .flatMap((exp) => exp.apparatusIds)
    .map((id) => APPARATUS_PROFILES[id])
    .filter(Boolean);

  return {
    hay,
    linkedAnatomy,
    linkedEngineSubs,
    deptMeta,
    matchingExperiments,
    matchingSims,
    matchingApparatus
  };
}

function buildDomainKnowledgeCues(
  topic: SyllabusTopicNode,
  subject: SyllabusSubjectNode,
  hay: string
): DomainKnowledgeCue {
  const mode: LearningDomainMode = topic.domainMode;

  if (mode === 'chemistry_analysis') {
    if (/\b(limit test|impurit|chloride|sulphate|sulfate|arsenic|iron|heavy metal|nessler|gutzeit)\b/.test(hay)) {
      return {
        domainFocus: 'pharmacopoeial trace-impurity control and limit-test analytical validation',
        mechanismFrame:
          'Semi-quantitative comparison of opalescence, turbidity, or color intensity between a known pharmacopoeial standard and the test sample inside matched Nessler cylinders or a Gutzeit evolution assembly under standardized acidic, temperature, and standing-time conditions.',
        chemicalOrBiologicalEquations: [
          'Chloride limit test: Cl⁻ + AgNO₃ → AgCl↓ (white opalescence in dilute HNO₃)',
          'Sulphate limit test: SO₄²⁻ + BaCl₂ → BaSO₄↓ (turbidity in ethanolic HCl medium)',
          'Iron limit test: Fe²⁺ + 2 HSCH₂COOH → [Fe(SCH₂COO)₂]²⁻ (purple complex in ammoniacal citric acid)',
          'Arsenic (Gutzeit): As⁵⁺ → As³⁺ (KI + SnCl₂); As³⁺ + 6[H] → AsH₃↑ + 3H₂O; AsH₃ + HgCl₂ → yellow/brown stain'
        ],
        formulas: [
          'Impurity Limit (ppm) = (Mass of Standard Impurity in µg) / (Sample Weight in g)',
          'Standard Volume Equivalence: 1 mL of 10 ppm Pb standard ≡ 10 µg Pb²⁺'
        ],
        pharmaRelevancePoints: [
          'Prevents toxic heavy-metal accumulation (Pb, As) and catalytic oxidative degradation (Fe³⁺) in active pharmaceutical ingredients and excipients.',
          'Ensures raw materials comply with Indian Pharmacopoeia (IP) / British Pharmacopoeia (BP) batch-release specifications before compounding.'
        ],
        clinicalOrAppliedPoints: [
          'Eliminates heavy-metal nephrotoxicity/neurotoxicity and ferric-catalyzed stability loss of vitamins or catecholamines.'
        ],
        comparisonTable: {
          caption: 'Comparison of Key Pharmacopoeial Limit Tests',
          headers: ['Impurity', 'Reagent System', 'Observable Endpoint', 'Interference Control'],
          rows: [
            ['Chloride (Cl⁻)', 'AgNO₃ + dilute HNO₃', 'White AgCl opalescence', 'HNO₃ dissolves Ag₂CO₃/Ag₃PO₄'],
            ['Sulphate (SO₄²⁻)', 'BaCl₂ + ethanolic K₂SO₄', 'White BaSO₄ turbidity', 'Ethanol prevents supersaturation'],
            ['Iron (Fe)', 'Thioglycolic acid + NH₃', 'Purple ferro-thioglycolate', 'Citric acid masks Fe(OH)₃'],
            ['Arsenic (As)', 'AsT Zn/HCl + KI/SnCl₂ + HgCl₂', 'Yellow/brown HgCl₂ stain', 'Lead acetate cotton traps H₂S']
          ]
        }
      };
    }

    if (/\b(buffer|henderson|acid|base|isotonic|electrolyte|antacid)\b/.test(hay)) {
      return {
        domainFocus: 'aqueous acid-base equilibria, buffer capacity, and physiological tonicity regulation',
        mechanismFrame:
          'Conjugate acid–base pairs resist abrupt pH shifts upon addition of H₃O⁺ or OH⁻ by converting strong acids into weak conjugate acids and strong bases into weak conjugate bases according to equilibrium dissociation constants (pKa).',
        chemicalOrBiologicalEquations: [
          'HA(aq) + H₂O(l) ⇌ H₃O⁺(aq) + A⁻(aq);  Ka = ([H₃O⁺][A⁻]) / [HA]',
          'Neutralization (antacid): Al(OH)₃ + 3HCl → AlCl₃ + 3H₂O;  Mg(OH)₂ + 2HCl → MgCl₂ + 2H₂O'
        ],
        formulas: [
          'Henderson–Hasselbalch (acidic buffer): pH = pKa + log₁₀([A⁻] / [HA])',
          'Van Slyke Buffer Capacity: β = 2.303 · C_total · (Ka · [H⁺]) / (Ka + [H⁺])²  (unit: mol·L⁻¹·pH⁻¹)',
          'Maximum buffer capacity occurs when pH = pKa (so [A⁻] = [HA])'
        ],
        pharmaRelevancePoints: [
          'Maintains drug solubility, minimizes hydrolytic degradation of esters/amides, and prevents parenteral or ophthalmic tissue irritation.',
          'Guides selection of phosphate, acetate, or citrate buffer systems matching physiological pH (~7.4 for blood/tears).'
        ],
        clinicalOrAppliedPoints: [
          'Isotonic buffered parenteral and ophthalmic formulations prevent hemolysis or crenation of erythrocytes and stinging on instillation.'
        ],
        comparisonTable: {
          caption: 'Acidic vs Basic Buffer Systems in Pharmacy',
          headers: ['Parameter', 'Acidic Buffer', 'Basic Buffer'],
          rows: [
            ['Composition', 'Weak acid + salt with strong base (e.g., CH₃COOH + CH₃COONa)', 'Weak base + salt with strong acid (e.g., NH₄OH + NH₄Cl)'],
            ['Governing Equation', 'pH = pKa + log([Salt]/[Acid])', 'pOH = pKb + log([Salt]/[Base]); pH = 14 − pOH'],
            ['Optimal Range', 'pKa ± 1 pH unit', '(14 − pKb) ± 1 pH unit']
          ]
        }
      };
    }

    if (/\b(titration|volumetric|assay|redox|edta|complexometric|cerimetry|volhard|radiopharm|isotope)\b/.test(hay)) {
      const isRadio = /\b(radiopharm|isotope|half-life|decay|geiger|radiation)\b/.test(hay);
      if (isRadio) {
        return {
          domainFocus: 'nuclear stability, radioactive decay kinetics, radiation detection, and clinical radiopharmaceutical handling',
          mechanismFrame:
            'Unstable nuclides emit α, β⁻, β⁺, or γ radiation exponentially with characteristic decay constant (λ) and physical half-life (t₁/₂), enabling diagnostic scintigraphy or targeted radiotherapy.',
          chemicalOrBiologicalEquations: [
            'Alpha decay: ᴬ_Z X → ᴬ⁻⁴_{Z−2} Y + ⁴_2 He',
            'Beta-minus decay: n → p + e⁻ + ν̄_e  (atomic number Z increases by +1)'
          ],
          formulas: [
            'First-order decay: N(t) = N₀ · e^(−λt);  A(t) = A₀ · e^(−λt)  (SI unit: Becquerel, 1 Bq = 1 disintegration·s⁻¹)',
            'Physical half-life: t₁/₂ = ln(2) / λ ≈ 0.693 / λ',
            'Effective half-life: 1 / t_eff = (1 / t_phys) + (1 / t_biol)'
          ],
          pharmaRelevancePoints: [
            'Requires lead/tungsten shielding, ALARA distance/time controls, and radionuclidic purity verification before parenteral administration.'
          ],
          clinicalOrAppliedPoints: [
            'Diagnostic tracers (e.g., ⁹⁹ᵐTc, t₁/₂ = 6 h) minimize patient radiation dose while delivering monoenergetic 140 keV γ photons for imaging.'
          ],
          comparisonTable: {
            caption: 'Comparison of Alpha, Beta, and Gamma Emissions',
            headers: ['Radiation Type', 'Nature & Charge', 'Penetration Power', 'Primary Shielding'],
            rows: [
              ['Alpha (α)', '⁴He²⁺ nucleus (+2)', 'Very low (cm in air)', 'Sheet of paper / dead skin layer'],
              ['Beta (β⁻ / β⁺)', 'High-speed electron/positron', 'Moderate (mm in tissue)', 'Low-Z plastic / Perspex / aluminum'],
              ['Gamma (γ)', 'Electromagnetic photon (0)', 'Very high', 'High-density Lead (Pb) or concrete']
            ]
          }
        };
      }
      return {
        domainFocus: 'stoichiometric volumetric titrimetry, indicator equivalence, and pharmacopoeial assay calculations',
        mechanismFrame:
          'Standardized titrant delivered from a Class-A burette reacts quantitatively with analyte until the equivalence point, signaled visually or potentiometrically by an abrupt change in pH, redox potential, or free metal-ion concentration.',
        chemicalOrBiologicalEquations: [
          'Acid–base neutralization: H₃O⁺ + OH⁻ → 2H₂O',
          'Complexometric (EDTA): Mⁿ⁺ + H₂Y²⁻ ⇌ MY⁽ⁿ⁻⁴⁾⁺ + 2H⁺ (buffered at pH 10 with NH₃/NH₄Cl for Ca²⁺/Mg²⁺)',
          'Precipitation (Volhard): Ag⁺ + SCN⁻ → AgSCN↓;  excess SCN⁻ + Fe³⁺ → [Fe(SCN)]²⁺ (brick-red)'
        ],
        formulas: [
          'Titration equivalence: N₁ · V₁ = N₂ · V₂  (units: eq·L⁻¹ and mL)',
          'Assay % Purity = [(V_titrant × M_actual / M_nominal) × Equivalence Factor × 100] / Sample Weight (g)'
        ],
        pharmaRelevancePoints: [
          'Forms the quantitative pharmacopoeial basis for assaying raw APIs, electrolytes, and finished dosage forms against IP acceptance limits (commonly 98.0%–102.0%).'
        ],
        clinicalOrAppliedPoints: [
          'Ensures potency accuracy so therapeutic doses do not fall sub-therapeutic or reach toxic concentrations.'
        ]
      };
    }

    return {
      domainFocus: 'pharmaceutical inorganic chemistry, pharmacopoeial quality specifications, and analytical reliability',
      mechanismFrame:
        'Controlled chemical reactivity, solubility equilibria, and standardized reagent conditions isolate and quantify pharmaceutical substances and trace impurities.',
      chemicalOrBiologicalEquations: [
        'Stoichiometric mass balance: aA + bB → cC + dD  (n_A / a = n_B / b)'
      ],
      formulas: [
        'Molarity (M) = moles of solute / Volume of solution (L) = (mass_g × 1000) / (MW × V_mL)',
        'Normality (N) = Molarity × n-factor (equivalents·L⁻¹)'
      ],
      pharmaRelevancePoints: [
        'Standardizes reagent preparation, primary standard selection, and quality control compliance across IP/BP/USP monographs.'
      ],
      clinicalOrAppliedPoints: [
        'Guarantees chemical purity, electrolyte balance, and predictable therapeutic performance.'
      ]
    };
  }

  if (mode === 'pharmaceutics') {
    if (/\b(posology|dose|dosing|alligation|proof|isotonic|calculation)\b/.test(hay)) {
      return {
        domainFocus: 'pharmaceutical posology, pediatric/geriatric dose scaling, alcohol proof spirit, and compounding calculations',
        mechanismFrame:
          'Patient-specific physiological parameters (age, body weight, body surface area) and formulation concentration ratios govern accurate compounding quantities and safe therapeutic dosing.',
        chemicalOrBiologicalEquations: [
          'Alligation alternate: Parts_strong = |C_target − C_weak|;  Parts_weak = |C_strong − C_target|'
        ],
        formulas: [
          "Young's Rule (1–12 yrs): Child Dose = [Age (yrs) / (Age + 12)] × Adult Dose",
          "Dilling's Rule (4–20 yrs): Child Dose = [Age (yrs) / 20] × Adult Dose",
          "Clark's Rule: Child Dose = [Weight (lb) / 150] × Adult Dose  (or Weight_kg / 70 × Adult Dose)",
          "Fried's Rule (<2 yrs): Infant Dose = [Age (months) / 150] × Adult Dose",
          'BSA Method: Child Dose = [Patient BSA (m²) / 1.73 m²] × Adult Dose',
          'Indian Proof Spirit: 100° Proof = 57.1% v/v ethyl alcohol (factor: 1.753 × % v/v − 100 = °O.P. / °U.P.)'
        ],
        pharmaRelevancePoints: [
          'Prevents compounding dilution errors and enables exact preparation of extemporaneous mixtures, hydro-alcoholic vehicles, and isotonic eye drops.'
        ],
        clinicalOrAppliedPoints: [
          'Protects pediatric, elderly, and renally/hepatically impaired patients from narrow-therapeutic-index toxicity.'
        ],
        comparisonTable: {
          caption: 'Comparison of Pediatric Dose Calculation Rules',
          headers: ['Rule', 'Basis Variable', 'Target Age Group', 'Key Limitation'],
          rows: [
            ["Fried's Rule", 'Age (months)', 'Infants (<2 years)', 'Ignores weight variation and immature clearance'],
            ["Young's Rule", 'Age (years)', 'Children 1–12 years', 'Less accurate for obese or underweight children'],
            ["Clark's Rule", 'Body weight (lb/kg)', 'Children (general)', 'Assumes linear scaling with adult 70 kg'],
            ['BSA Method', 'Surface area (m²)', 'All pediatric / oncology', 'Requires height + weight; best correlates with metabolic rate']
          ]
        }
      };
    }

    if (/\b(emulsion|suspension|biphasic|monophasic|ointment|suppository|powder|tablet|capsule|dosage)\b/.test(hay)) {
      return {
        domainFocus: 'dosage form architecture, thermodynamic/kinetic stability, excipient selection, and drug delivery performance',
        mechanismFrame:
          'Interfacial tension reduction, rheological control, particle-size distribution, and solid/liquid excipient matrices stabilize dispersed or homogeneous systems and govern drug release kinetics.',
        chemicalOrBiologicalEquations: [
          'Work of dispersion: ΔG = γ · ΔA  (surfactants lower interfacial tension γ to reduce coalescence driving force)'
        ],
        formulas: [
          "Stokes' Law (sedimentation velocity): v = [d² · (ρ_s − ρ_0) · g] / (18 · η)  (units: m·s⁻¹)",
          'HLB Blending: HLB_mix = f_A · HLB_A + (1 − f_A) · HLB_B'
        ],
        pharmaRelevancePoints: [
          'Guides selection of wetting agents, emulsifiers (HLB 3–6 W/O vs 8–16 O/W), flocculating electrolytes, and tablet/suppository bases for physical stability and content uniformity.'
        ],
        clinicalOrAppliedPoints: [
          'Directly impacts palatability, dose uniformity per spoonful/unit, bioavailability, and patient adherence.'
        ],
        comparisonTable: {
          caption: 'Flocculated vs Deflocculated Pharmaceutical Suspensions',
          headers: ['Property', 'Flocculated Suspension', 'Deflocculated Suspension'],
          rows: [
            ['Particle State', 'Loose open aggregates (flocs)', 'Discrete individual particles'],
            ['Sedimentation Rate', 'Rapid', 'Slow'],
            ['Supernatant', 'Clear', 'Cloudy/turbid'],
            ['Sediment Cake', 'Porous, easily redispersible', 'Dense hard cake (difficult to redisperse)']
          ]
        }
      };
    }

    return {
      domainFocus: 'general pharmaceutics, compounding standards, pharmacopoeial history, and dosage-form classification',
      mechanismFrame:
        'Standardized compounding procedures transform pure APIs and excipients into stable, accurate, patient-ready dosage forms regulated by official pharmacopoeias.',
      chemicalOrBiologicalEquations: [],
      formulas: [
        'Percentage Strength (% w/v) = [Solute Mass (g) / Solution Volume (mL)] × 100',
        'Displacement Value (suppository): Mold replacement mass = Drug Weight (g) / Displacement Value'
      ],
      pharmaRelevancePoints: [
        'Establishes foundational GMP/compounding discipline, prescription interpretation, and pharmacopoeial compliance (IP, BP, USP).'
      ],
      clinicalOrAppliedPoints: [
        'Ensures safe, bioavailable, and patient-acceptable drug administration across oral, topical, parenteral, and mucosal routes.'
      ]
    };
  }

  if (mode === 'anatomy_physiology') {
    return {
      domainFocus: 'structural organization, cellular/organ-level homeostatic mechanisms, and pathophysiological correlations',
      mechanismFrame:
        'Anatomical architecture (membranes, vessels, receptors, and tissue layers) enables regulated physiological gradients, feedback loops, and organ-system homeostasis.',
      chemicalOrBiologicalEquations: [
        'Electrochemical equilibrium: Membrane potential governed by selective Na⁺, K⁺, and Ca²⁺ channel permeability and Na⁺/K⁺-ATPase (3 Na⁺ out : 2 K⁺ in)'
      ],
      formulas: [
        'Cardiac Output: CO = HR (beats·min⁻¹) × SV (mL·beat⁻¹)  (normal resting ≈ 5 L·min⁻¹)',
        'Mean Arterial Pressure: MAP ≈ DBP + 1/3 (SBP − DBP)  (mmHg)'
      ],
      pharmaRelevancePoints: [
        'Identifies anatomical barriers (skin stratum corneum, blood–brain barrier, GI mucosa) and receptor/enzyme drug targets governing absorption, distribution, and pharmacodynamics.'
      ],
      clinicalOrAppliedPoints: [
        'Explains how structural pathology alters organ function, biomarker readings (ECG, CBC, BP), and therapeutic drug selection.'
      ]
    };
  }

  if (mode === 'pharmacognosy') {
    return {
      domainFocus: 'crude drug origin, morphological/microscopical authentication, phytochemical classes, and WHO/IP quality standardization',
      mechanismFrame:
        'Secondary plant metabolites (alkaloids, glycosides, tannins, volatile oils, resins) are biosynthesized in specialized secretory tissues and verified macroscopically, microscopically, and physicochemically to prevent adulteration.',
      chemicalOrBiologicalEquations: [
        'General glycoside hydrolysis: Glycoside + H₂O (acid/enzyme) → Aglycone (genin) + Sugar moiety (glycone)'
      ],
      formulas: [
        'Stomatal Index (SI) = [S / (E + S)] × 100  (S = stomata/mm², E = epidermal cells/mm²)',
        'Loss on Drying (% LOD) = [(W_initial − W_dried) / W_initial] × 100',
        'Total Ash (% w/w) = (Weight of Ash / Weight of Air-Dried Drug) × 100'
      ],
      pharmaRelevancePoints: [
        'Detects substitution and adulteration in crude botanical drugs using quantitative microscopy (stomatal index, vein-islet number, palisade ratio, Lycopodium spore method) and ash/extractive limits.'
      ],
      clinicalOrAppliedPoints: [
        'Ensures consistent bioactive phytochemical potency and limits heavy-metal, microbial, or pesticide contamination in herbal medicines.'
      ],
      comparisonTable: {
        caption: 'Organised vs Unorganised Crude Drugs',
        headers: ['Feature', 'Organised Crude Drugs', 'Unorganised Crude Drugs'],
        rows: [
          ['Cellular Structure', 'Composed of distinct plant cells/tissues', 'Acellular exudates, juices, or extracts'],
          ['Authentication Method', 'Morphology & quantitative microscopy', 'Chemical tests, solubility, ash & physical constants'],
          ['Examples', 'Senna leaf, Cinchona bark, Clove bud, Ginger rhizome', 'Acacia gum, Aloe juice, Beeswax, Asafoetida']
        ]
      }
    };
  }

  if (mode === 'psychology_comm') {
    return {
      domainFocus: 'patient psychology, therapeutic communication models, adherence behavior, and clinical pharmacy ethics',
      mechanismFrame:
        'Perceived susceptibility, perceived severity, self-efficacy, and empathetic active listening shape patient medication adherence and interprofessional SBAR handovers.',
      chemicalOrBiologicalEquations: [],
      formulas: [],
      pharmaRelevancePoints: [
        'Improves pharmacist counseling on complex regimens (inhalers, insulin, warfarin, antibiotics) and reduces preventable medication errors during clinical handovers.'
      ],
      clinicalOrAppliedPoints: [
        'Empathetic, non-judgmental communication increases treatment adherence, reduces white-coat anxiety, and supports chronic disease outcomes.'
      ],
      comparisonTable: {
        caption: 'Comparison of Structured Clinical Communication Frameworks',
        headers: ['Framework', 'Primary Purpose', 'Core Steps'],
        rows: [
          ['SPIKES', 'Delivering sensitive/bad clinical news', 'Setting · Perception · Invitation · Knowledge · Empathy · Strategy'],
          ['SBAR', 'Interprofessional clinical handover', 'Situation · Background · Assessment · Recommendation'],
          ['Health Belief Model', 'Predicting adherence & preventive behavior', 'Susceptibility · Severity · Benefits · Barriers · Cues · Self-efficacy']
        ]
      }
    };
  }

  if (mode === 'computing_pk') {
    return {
      domainFocus: 'Python scientific computing, reproducible pharmaceutical data workflows, and quantitative pharmacokinetic/QC modeling',
      mechanismFrame:
        'Structured Python data types, vectorized NumPy arrays, Pandas DataFrames, and Matplotlib/SciPy pipelines automate pharmaceutical dosage calculations, dissolution profiles, and pharmacokinetic parameter estimation.',
      chemicalOrBiologicalEquations: [
        'First-order drug elimination: dC/dt = −k_e · C  →  C(t) = C₀ · e^(−k_e·t)'
      ],
      formulas: [
        'One-Compartment IV Bolus: C(t) = (Dose / V_d) · e^(−k_e · t)  (units: mg·L⁻¹)',
        'Oral Bateman Equation: C(t) = [F · Dose · k_a / (V_d · (k_a − k_e))] · (e^(−k_e·t) − e^(−k_a·t))',
        'Elimination Half-Life: t₁/₂ = 0.693 / k_e  (units: hours or min)'
      ],
      pharmaRelevancePoints: [
        'Replaces error-prone manual spreadsheet steps with reproducible scripts for tablet weight-variation QC, dissolution f₂ similarity, and plasma concentration-time profiling.'
      ],
      clinicalOrAppliedPoints: [
        'Supports therapeutic drug monitoring calculations (AUC, C_max, T_max, steady-state dosing intervals) across patient cohorts.'
      ],
      comparisonTable: {
        caption: 'Python Core Data Containers in Pharmaceutical Computing',
        headers: ['Structure', 'Mutability', 'Typical Pharmaceutical Use Case'],
        rows: [
          ['list', 'Mutable, ordered', 'Time-series plasma concentrations or tablet weights'],
          ['tuple', 'Immutable, ordered', 'Fixed reference thresholds (MEC, MTC) or monograph limits'],
          ['dict', 'Mutable key–value', 'Drug monograph attributes (Dose, Ka, Ke, Vd, F)'],
          ['DataFrame (Pandas)', 'Tabular 2D labeled', 'Multi-patient PK cohorts, ADR logs, QC dissolution batches']
        ]
      }
    };
  }

  return {
    domainFocus: 'pharmaceutical science fundamentals, mechanistic clarity, and B.Pharm curriculum integration',
    mechanismFrame:
      'Connects foundational terminology, mechanistic sequence, and quality/clinical significance aligned with PCI B.Pharm syllabus competencies.',
    chemicalOrBiologicalEquations: [],
    formulas: [],
    pharmaRelevancePoints: [
      'Aligns conceptual understanding with pharmaceutical quality, formulation, and clinical practice.'
    ],
    clinicalOrAppliedPoints: [
      'Reinforces safe and effective application in laboratory and patient-care settings.'
    ]
  };
}

function selectRelevantAttachments(
  candidates: AttachableSourceCandidate[],
  acquiredResources: AcquiredTopicResource[],
  sectionKey: EnrichmentSectionKey,
  textbookHits: TextbookSearchHit[] = []
): EnrichmentSourceAttachment[] {
  const picked: EnrichmentSourceAttachment[] = [];

  // 1. Priority 1: Retrieved page-exact PDF textbook passages first (unless visual/practical only)
  if (sectionKey !== 'visual_connections' && sectionKey !== 'practical_connections') {
    for (const hit of textbookHits.slice(0, 2)) {
      picked.push({
        id: `att_pdf_${hit.bookId}_p${hit.pageNumber}`,
        sourceKind: 'knowledge_pdf',
        itemId: hit.bookId,
        bookId: hit.bookId,
        pageNumber: hit.pageNumber,
        chapterHeading: hit.chapterHeading,
        priorityTier: hit.priorityTier,
        title: `${hit.bookTitle} (p. ${hit.pageNumber})`,
        subtitle: `PDF Textbook · Page ${hit.pageNumber}${
          hit.chapterHeading ? ` · ${hit.chapterHeading}` : ''
        }${hit.authors ? ` · ${hit.authors}` : ''}`,
        verified: hit.extractionQuality !== 'unsearchable',
        attachedAt: Date.now()
      });
    }
  }

  const preferredKinds = new Set<string>();
  if (sectionKey === 'visual_connections') {
    preferredKinds.add('visual_library');
    preferredKinds.add('asset_3d');
    preferredKinds.add('anatomy_catalog');
  } else if (sectionKey === 'practical_connections') {
    preferredKinds.add('experiment');
    preferredKinds.add('simulation');
  } else {
    preferredKinds.add('knowledge_pdf');
    preferredKinds.add('reference_center');
    preferredKinds.add('anatomy_catalog');
    preferredKinds.add('resource_hub');
  }

  const ranked = [...candidates].sort((a, b) => {
    const tierDiff = a.priorityTier - b.priorityTier;
    if (tierDiff !== 0) return tierDiff;
    const aPref = preferredKinds.has(a.sourceKind) ? 4 : 0;
    const bPref = preferredKinds.has(b.sourceKind) ? 4 : 0;
    return b.relevanceScore + bPref - (a.relevanceScore + aPref);
  });

  for (const c of ranked.filter((x) => x.relevanceScore > 0 || preferredKinds.has(x.sourceKind))) {
    if (picked.length >= 4) break;
    if (c.sourceKind === 'knowledge_pdf' && picked.some((p) => p.bookId === c.itemId)) continue;
    picked.push(candidateToAttachment(c));
  }

  // Also include verified acquired resources ordered by source priority tier
  const sortedAcquired = [...acquiredResources].sort(
    (a, b) => classifyAcquiredResourcePriority(a) - classifyAcquiredResourcePriority(b)
  );
  for (const ar of sortedAcquired.slice(0, 3)) {
    if (picked.length >= 5) break;
    if (ar.verificationStatus === 'unverified') continue;
    const exists = picked.some((p) => p.title.toLowerCase() === ar.title.toLowerCase());
    if (!exists) {
      picked.push({
        id: `att_acq_${ar.id}`,
        sourceKind: 'resource_hub',
        itemId: ar.id,
        title: ar.title,
        subtitle: `Acquired Source · ${ar.sourceName} (${ar.accessDate})`,
        url: ar.sourceUrl !== '#' ? ar.sourceUrl : undefined,
        verified: ar.verificationStatus !== 'encyclopedic_open',
        priorityTier: classifyAcquiredResourcePriority(ar),
        attachedAt: Date.now()
      });
    }
  }

  return picked;
}

export function synthesizeLocalScientificDraft(opts: {
  syllabus: SyllabusProfile;
  subject: SyllabusSubjectNode;
  topic: SyllabusTopicNode;
  sectionState: SectionAssessmentState;
  depth: EnrichmentDepthLevel;
  attachCandidates: AttachableSourceCandidate[];
  acquiredResources: AcquiredTopicResource[];
  topicQuestions: ExamQuestionItem[];
  textbookHits?: TextbookSearchHit[];
}): SynthesizedDraftPayload {
  const {
    syllabus,
    subject,
    topic,
    sectionState,
    depth,
    attachCandidates,
    acquiredResources,
    topicQuestions,
    textbookHits = []
  } = opts;

  const secKey = sectionState.blueprint.key;
  const ctx = resolveTopicContext(topic, subject);
  const cues = buildDomainKnowledgeCues(topic, subject, ctx.hay);
  const existingTexts = [...sectionState.existingProse, ...sectionState.existingBullets];
  const subtopicList = topic.subtopics.map((s) => s.title).filter(Boolean);
  const subtopicsPreview =
    subtopicList.length > 0 ? subtopicList.slice(0, 5).join(', ') : topic.title;

  const primaryAnatomy = ctx.linkedAnatomy[0];
  const primaryEngine = ctx.linkedEngineSubs[0];
  const verifiedAcquired = [...acquiredResources]
    .filter((r) => r.excerpt && r.verificationStatus !== 'unverified')
    .sort((a, b) => classifyAcquiredResourcePriority(a) - classifyAcquiredResourcePriority(b));

  const primaryBookHit = textbookHits[0];
  const bookGroundedNote = primaryBookHit
    ? ` Textbook verification note (${primaryBookHit.bookTitle}, p. ${primaryBookHit.pageNumber}${
        primaryBookHit.chapterHeading ? `, ${primaryBookHit.chapterHeading}` : ''
      }): ${primaryBookHit.passageExcerpt.slice(0, 175)}${
        primaryBookHit.passageExcerpt.length > 175 ? '...' : ''
      }`
    : '';

  let rawProse = '';
  let rawBullets: string[] = [];
  let formulas: string[] = [];
  let comparisonTable: EnrichmentComparisonTable | undefined;
  let importantQuestions: EnrichmentQuestionEntry[] = [];

  switch (secKey) {
    case 'learning_objectives': {
      rawProse =
        depth === 'foundation'
          ? `After studying "${topic.title}" (${subject.code}, ${topic.unitNo}), learners should be able to recognize the core terminology, state the primary purpose within ${subject.title}, and recall the key subtopics (${subtopicsPreview}).`
          : depth === 'standard'
          ? `This unit topic (${subject.code} · ${topic.unitNo}) develops B.Pharm-level competency in ${cues.domainFocus}. Learners are expected to explain underlying mechanisms, apply quantitative relationships where relevant, and connect concepts across ${subtopicsPreview}.`
          : `At an advanced level, mastery of "${topic.title}" requires integrating mechanistic reasoning, analytical/pharmacopoeial acceptance criteria, sources of experimental or clinical variability, and critical comparison across ${subtopicsPreview}.`;
      rawBullets = [
        `Define and differentiate key concepts in ${topic.title}.`,
        ...subtopicList.slice(0, depth === 'foundation' ? 3 : 5).map(
          (st) => `Explain the scientific basis and pharmaceutical application of ${st}.`
        ),
        ...(cues.formulas.length > 0
          ? [`Solve quantitative problems and interpret units relevant to ${topic.title}.`]
          : []),
        ...(ctx.matchingExperiments.length > 0
          ? [`Correlate theory principles with laboratory execution in ${ctx.matchingExperiments[0].title}.`]
          : [])
      ];
      break;
    }

    case 'definition': {
      const anatDef = primaryAnatomy?.definition;
      rawProse =
        depth === 'foundation'
          ? `${topic.title} refers to a core topic in ${subject.title} (${topic.unitNo}) concerned with ${subtopicsPreview}. ${
              anatDef ? `Specifically, it encompasses the fundamental structural and functional definition of ${primaryAnatomy.name}.` : `In foundational pharmacy practice, it establishes the baseline terminology needed to understand ${cues.domainFocus}.`
            }`
          : depth === 'standard'
          ? `In ${subject.title} (${subject.code}), "${topic.title}" is formally defined as the systematic study and application of ${subtopicsPreview}, centered on ${cues.domainFocus}. Clear boundary definitions distinguish each constituent entity, operational parameter, and pharmacopoeial or physiological standard.`
          : `"${topic.title}" (${syllabus.course} ${subject.code}, ${topic.unitNo}) comprises the rigorous scientific framework governing ${cues.domainFocus} across ${subtopicsPreview}. Formal definition requires specifying structural/chemical identity, governing equilibrium or physiological boundaries, and compendial/clinical criteria without ambiguity.`;
      rawBullets = subtopicList.slice(0, depth === 'foundation' ? 3 : 5).map((st) => {
        const subObj = topic.subtopics.find((s) => s.title === st);
        return subObj?.summary && subObj.summary !== st
          ? `${st}: ${subObj.summary}`
          : `${st}: Core sub-concept requiring formal definition within ${topic.unitNo}.`;
      });
      break;
    }

    case 'overview': {
      const acqSnippet = bookGroundedNote
        ? bookGroundedNote
        : verifiedAcquired[0]?.excerpt
        ? ` Secondary academic reference note (${verifiedAcquired[0].sourceName}): ${verifiedAcquired[0].excerpt.slice(0, 180)}.`
        : '';
      rawProse =
        depth === 'foundation'
          ? `"${topic.title}" sits inside ${topic.unitNo} (${topic.unitTitle}) of ${subject.title}. At a foundational level, it introduces students to ${subtopicsPreview} and explains why this topic matters in pharmacy.${acqSnippet}`
          : depth === 'standard'
          ? `Positioned within ${subject.code} (${topic.unitNo}: ${topic.unitTitle}), "${topic.title}" bridges fundamental principles with ${cues.domainFocus}. The topic integrates ${subtopicsPreview} so students can progress from basic definitions to mechanism, calculation, and practical application.${acqSnippet}`
          : `Within the ${syllabus.course} ${syllabus.semester} curriculum (${subject.code} · ${topic.unitNo}), "${topic.title}" provides an integrated scientific foundation in ${cues.domainFocus}. Beyond introductory definitions, this section connects ${subtopicsPreview} to analytical precision, mechanistic pathways, pharmacopoeial limits, and clinical decision-making.${acqSnippet}`;
      rawBullets = [
        `Hierarchy placement: ${syllabus.course} → ${subject.code} → ${topic.unitNo} → ${topic.title}.`,
        ...subtopicList.slice(0, 4).map((st) => `Subtopic scope: ${st}.`),
        ...(primaryBookHit
          ? [`Primary textbook pointer: ${primaryBookHit.bookTitle} (Page ${primaryBookHit.pageNumber}).`]
          : []),
        ...cues.pharmaRelevancePoints.slice(0, 1)
      ];
      break;
    }

    case 'core_concepts':
    case 'classification_types': {
      rawProse =
        depth === 'foundation'
          ? `The core building blocks of "${topic.title}" organize ${subtopicsPreview} into clear categories so beginners can identify each type and its primary role.`
          : depth === 'standard'
          ? `Systematic organization of "${topic.title}" groups ${subtopicsPreview} according to structure, mechanism, physicochemical behavior, or therapeutic utility in ${subject.title}.`
          : `Advanced classification in "${topic.title}" evaluates ${subtopicsPreview} across structural/chemical criteria, mechanistic selectivity, stability constraints, and official pharmacopoeial or clinical differentiation.`;
      rawBullets = [
        ...subtopicList.map((st, idx) => `${idx + 1}. ${st} — define distinguishing criteria and representative examples.`),
        ...(primaryAnatomy?.components.slice(0, 3).map((c) => `${c.name}: ${c.role}`) || [])
      ];
      if (cues.comparisonTable) {
        comparisonTable = cues.comparisonTable;
      }
      break;
    }

    case 'detailed_explanation': {
      const engineDetail = primaryEngine?.anatomyNotes || primaryEngine?.physiologyNotes;
      const tbContextLines = textbookHits
        .slice(0, 2)
        .map(
          (h) =>
            `${h.bookTitle} (p. ${h.pageNumber}${h.chapterHeading ? `, ${h.chapterHeading}` : ''}): ${h.passageExcerpt.slice(
              0,
              185
            )}`
        )
        .join('\n');
      const acqDetail =
        tbContextLines ||
        verifiedAcquired
          .slice(0, 2)
          .map((r) => `${r.title} (${r.sourceName}): ${r.excerpt?.slice(0, 200)}`)
          .join('\n\n');
      if (depth === 'foundation') {
        rawProse = `"${topic.title}" focuses on ${cues.domainFocus}. To build intuition step-by-step, begin by mastering the core terms across ${subtopicsPreview}, then trace how each component contributes to the overall pharmaceutical or physiological outcome.\n\n${
          acqDetail || 'Focus on plain-language cause-and-effect before memorizing detailed constants or exceptions.'
        }`;
      } else if (depth === 'standard') {
        rawProse = `In B.Pharm Semester I (${subject.code} · ${topic.unitNo}), "${topic.title}" integrates ${subtopicsPreview} through ${cues.domainFocus}.\n\n${cues.mechanismFrame}${
          engineDetail ? `\n\nAcademic synthesis note: ${engineDetail}` : ''
        }${acqDetail ? `\n\nGrounded source context:\n${acqDetail}` : ''}`;
      } else {
        rawProse = `An advanced treatment of "${topic.title}" (${subject.code} · ${topic.unitNo}) examines the quantitative, structural, and mechanistic relationships underlying ${cues.domainFocus}.\n\n${cues.mechanismFrame} Careful attention must be paid to boundary conditions, competing equilibria or physiological feedback, interfering species, and pharmacopoeial/clinical tolerances across ${subtopicsPreview}.${
          acqDetail ? `\n\nConnected reference evidence:\n${acqDetail}` : ''
        }`;
      }
      rawBullets = [
        ...subtopicList.slice(0, 4).map((st) => `Concept link (${st}): connect principle → mechanism → pharmaceutical outcome.`),
        ...cues.chemicalOrBiologicalEquations.slice(0, depth === 'foundation' ? 1 : 3),
        ...cues.pharmaRelevancePoints.slice(0, 1)
      ];
      if (depth !== 'foundation' && cues.formulas.length > 0) {
        formulas = cues.formulas.slice(0, 2);
      }
      break;
    }

    case 'mechanism_process': {
      rawProse =
        depth === 'foundation'
          ? `Step-by-step sequence in "${topic.title}": ${cues.mechanismFrame}`
          : depth === 'standard'
          ? `Mechanistic pathway for "${topic.title}" (${subject.code}): ${cues.mechanismFrame} Each stage depends on controlled physiological, chemical, or operational conditions across ${subtopicsPreview}.`
          : `Detailed mechanistic and reaction/pathway analysis for "${topic.title}": ${cues.mechanismFrame} Rate-limiting steps, selectivity factors, side-reactions or feedback regulation, and critical control parameters determine reproducibility and clinical or analytical validity.`;
      rawBullets = [
        'Step 1 (Initiation / Setup): Establish baseline reactants, physiological trigger, or sample preparation.',
        'Step 2 (Primary Transformation / Pathway): Execute key chemical interaction, receptor/ion flux, or processing stage.',
        'Step 3 (Control / Equilibrium): Maintain pH, ionic strength, temperature, or homeostatic regulation.',
        'Step 4 (Endpoint / Outcome): Observe measurable endpoint, therapeutic effect, or quality verification criterion.',
        ...cues.chemicalOrBiologicalEquations
      ];
      break;
    }

    case 'components_structure': {
      rawProse =
        depth === 'foundation'
          ? `"${topic.title}" is composed of distinct structural elements or functional components (${subtopicsPreview}) that each perform a specific role.`
          : `"${topic.title}" requires mapping every anatomical, chemical, formulation, or apparatus component in ${subtopicsPreview} directly to its structural attribute and functional responsibility.`;
      rawBullets = [
        ...(primaryAnatomy?.components.map((c) => `${c.name}: ${c.role}`) || []),
        ...(ctx.matchingApparatus.flatMap((a) =>
          (a.mainComponents || []).map((mc) => `${a.name} — ${mc}`)
        )),
        ...subtopicList.slice(0, 4).map((st) => `Component / Feature: ${st}`)
      ];
      break;
    }

    case 'examples_applications': {
      rawProse =
        depth === 'foundation'
          ? `Concrete examples make "${topic.title}" easier to recognize in textbooks, compounding labs, and clinical settings.`
          : `Representative B.Pharm examples and applied use cases for "${topic.title}" demonstrate how ${cues.domainFocus} operates across real official substances, dosage forms, and laboratory assays.`;
      rawBullets = [
        ...subtopicList.slice(0, 4).map((st) => `Applied example in ${st}: link standard pharmacopoeial or clinical entity.`),
        ...cues.pharmaRelevancePoints,
        ...cues.clinicalOrAppliedPoints
      ];
      break;
    }

    case 'pharmaceutical_relevance': {
      rawProse =
        depth === 'foundation'
          ? `Understanding "${topic.title}" helps pharmacy students connect classroom science to how medicines are formulated, tested, and dispensed safely.`
          : `In pharmaceutical sciences (${subject.code}), "${topic.title}" directly informs ${cues.domainFocus}, guiding excipient compatibility, assay validation, stability control, and regulatory compliance.`;
      rawBullets = [
        ...cues.pharmaRelevancePoints,
        'Quality Control: Supports assay precision, impurity limits, and batch-to-batch reproducibility.',
        'Formulation & Stability: Prevents physical or chemical degradation during compounding and storage.'
      ];
      break;
    }

    case 'clinical_relevance': {
      rawProse =
        depth === 'foundation'
          ? `Clinically, "${topic.title}" explains how normal function or drug quality affects patient safety and therapeutic response.`
          : `Clinical relevance of "${topic.title}" links ${cues.domainFocus} to pathophysiological disorders, biomarker interpretation, rational drug selection, and patient-safety monitoring.`;
      rawBullets = [
        ...cues.clinicalOrAppliedPoints,
        ...(primaryAnatomy?.clinicalSignificance || []),
        'Patient Safety: Highlights contraindications, toxicity thresholds, and monitoring parameters.'
      ];
      break;
    }

    case 'advantages_comparisons': {
      rawProse =
        depth === 'foundation'
          ? `Comparing options within "${topic.title}" clarifies when one method, dosage form, or concept is preferred over another.`
          : `A structured comparative evaluation for "${topic.title}" weighs analytical/therapeutic advantages against practical limitations, interference risks, and selection criteria.`;
      rawBullets = [
        'Selection Criterion: Match method or formulation choice to stability, accuracy, and patient constraints.',
        'Key Advantage: Highlight where the primary approach maximizes specificity, safety, or bioavailability.',
        'Key Limitation: Identify interferences, contraindications, or equipment/cost constraints.'
      ];
      comparisonTable = cues.comparisonTable || {
        caption: `Comparative Overview: ${topic.title}`,
        headers: ['Aspect / Parameter', 'Primary Approach', 'Alternative / Contrasting Approach'],
        rows: [
          ['Core Principle', subtopicList[0] || topic.title, subtopicList[1] || 'Comparative variant'],
          ['Key Advantage', 'Established B.Pharm standard method', 'Specialized or rapid alternative'],
          ['Primary Limitation', 'Requires strict control of conditions', 'Higher complexity or narrow scope']
        ]
      };
      break;
    }

    case 'formulas_numericals': {
      formulas =
        cues.formulas.length > 0
          ? cues.formulas
          : [
              'Concentration (% w/v) = [Solute Mass (g) / Solution Volume (mL)] × 100',
              'Dilution Equivalence: C₁ · V₁ = C₂ · V₂  (consistent concentration & volume units)'
            ];
      rawProse =
        depth === 'foundation'
          ? `Quantitative applications in "${topic.title}" rely on matching units consistently (mass in mg/g, volume in mL/L) before substituting values into the governing equation.`
          : depth === 'standard'
          ? `Numerical problem solving in "${topic.title}" (${subject.code}) applies exact stoichiometric, pharmacokinetic, or posological equations with dimensional consistency and explicit SI/pharmacopoeial units.`
          : `Advanced quantitative analysis in "${topic.title}" requires propagating unit conversions, equivalence factors, temperature/ionic corrections, and acceptance limits while checking boundary assumptions.`;
      rawBullets = [
        'Always verify unit consistency across numerator and denominator before computing.',
        'Report final pharmaceutical quantities to appropriate significant figures with explicit units.',
        ...cues.chemicalOrBiologicalEquations.slice(0, 2)
      ];
      break;
    }

    case 'exam_essentials': {
      rawProse = `High-yield revision summary for "${topic.title}" (${subject.code} · ${topic.unitNo}) covering core definitions, distinguishing criteria, equations, and frequent university exam/viva focus areas.`;
      rawBullets = [
        `Key Focus: Master ${subtopicsPreview} and state exact definitions cleanly.`,
        ...cues.chemicalOrBiologicalEquations.slice(0, 2),
        ...cues.formulas.slice(0, 2),
        'Viva Tip: Be ready to state the underlying principle, reagent/anatomical role, and one pharmaceutical application.'
      ];
      break;
    }

    case 'important_questions': {
      rawProse = `Structured university-style assessment bank for "${topic.title}" spanning short definitions, mechanistic/analytical questions, and viva prompts calibrated to ${depth} depth.`;
      const existingPrompts = new Set(topicQuestions.map((q) => q.prompt.toLowerCase()));
      const generatedQs: EnrichmentQuestionEntry[] = [
        {
          id: `enr_q_${topic.id}_def_${Date.now()}`,
          prompt: `Define and explain the core scope of ${topic.title} (${topic.unitNo}).`,
          answerGuidance: `State formal definition, list key subtopics (${subtopicsPreview}), and highlight one pharmaceutical relevance point.`,
          category: 'definition',
          marks: 2
        },
        {
          id: `enr_q_${topic.id}_short_${Date.now() + 1}`,
          prompt: `Discuss the principle, mechanism, and pharmaceutical applications of ${subtopicList[0] || topic.title}.`,
          answerGuidance: `Outline step-by-step mechanism/pathway (${cues.mechanismFrame.slice(0, 140)}...), mention governing equation or reaction if applicable, and state formulation/QC role.`,
          category: 'short_answer',
          marks: 5
        },
        ...(depth !== 'foundation'
          ? [
              {
                id: `enr_q_${topic.id}_long_${Date.now() + 2}`,
                prompt: `Write a comprehensive note on ${topic.title}, covering classification/components, governing equations or reactions, limitations, and clinical/pharmaceutical significance.`,
                answerGuidance: `Organize answer with labeled headings: Definition → Classification/Structure → Mechanism/Equations → Applications & Limitations.`,
                category: 'long_answer' as const,
                marks: 10
              }
            ]
          : []),
        ...(ctx.matchingExperiments.length > 0
          ? [
              {
                id: `enr_q_${topic.id}_viva_${Date.now() + 3}`,
                prompt: `Viva: How does ${topic.title} apply to the practical "${ctx.matchingExperiments[0].title}"?`,
                answerGuidance: `Identify key apparatus (${ctx.matchingApparatus[0]?.name || 'standard lab setup'}), principle, endpoint, and critical safety/accuracy precaution.`,
                category: 'practical_viva' as const,
                marks: 2
              }
            ]
          : [])
      ];
      importantQuestions = generatedQs.filter((q) => !existingPrompts.has(q.prompt.toLowerCase()));
      rawBullets = importantQuestions.map((q) => `[${q.marks || 5}M · ${q.category}] ${q.prompt}`);
      break;
    }

    case 'practical_connections': {
      rawProse =
        ctx.matchingExperiments.length > 0 || ctx.matchingSims.length > 0
          ? `"${topic.title}" connects directly to hands-on laboratory experiments and interactive simulations inside PharmaLab, reinforcing theory through apparatus operation and quantitative observation.`
          : `Connect "${topic.title}" to laboratory execution by identifying required glassware/instruments, standardized reagent preparation, observation checkpoints, and safety precautions.`;
      rawBullets = [
        ...ctx.matchingExperiments.slice(0, 3).map(
          (e) => `Practical ${e.code}: ${e.title} — ${e.setupSummary || 'Follow standardized procedural steps and record observations.'}`
        ),
        ...ctx.matchingApparatus.slice(0, 3).map(
          (a) => `Apparatus (${a.name}): ${a.purpose}`
        ),
        ...ctx.matchingSims.slice(0, 2).map(
          (s) => `Interactive Simulation: ${s.title} — ${s.scientificPrinciple}`
        )
      ];
      if (rawBullets.length === 0) {
        rawBullets = [
          `Bench Alignment: Map ${topic.title} principles to relevant ${subject.code} practical preparation, observation, and calculation steps.`
        ];
      }
      break;
    }

    case 'visual_connections': {
      const visCandidates = attachCandidates.filter(
        (c) => c.sourceKind === 'visual_library' || c.sourceKind === 'asset_3d' || c.sourceKind === 'anatomy_catalog'
      );
      rawProse =
        visCandidates.length > 0
          ? `Visual and 3D spatial resources in PharmaLab help students inspect structural landmarks, labeled mechanisms, and apparatus geometry for "${topic.title}".`
          : `Identify key labeled diagrams, apparatus schematics, or molecular/anatomical structures needed to visualize "${topic.title}".`;
      rawBullets = [
        ...visCandidates.slice(0, 4).map((v) => `${v.title} (${v.subtitle})`),
        `Visual Study Focus: Trace structural labels and directional flow/interactions across ${subtopicsPreview}.`
      ];
      break;
    }

    case 'references': {
      rawProse = `Textbook-first reference bibliography compiled from uploaded PDF Knowledge Library books, PharmaLab Reference Center monographs, official syllabus listings, and supplementary open literature (no fabricated citations).`;
      rawBullets = [
        ...textbookHits
          .slice(0, 3)
          .map(
            (h) =>
              `[Priority 1 · PDF Textbook] ${h.bookTitle}${
                h.authors ? ` (${h.authors})` : ''
              }${h.edition ? `, ${h.edition}` : ''} — Page ${h.pageNumber}${
                h.chapterHeading ? ` (${h.chapterHeading})` : ''
              }`
          ),
        ...subject.references.slice(0, 4),
        ...attachCandidates
          .filter((c) => c.sourceKind === 'reference_center' || c.sourceKind === 'knowledge_pdf' || c.sourceKind === 'resource_hub')
          .slice(0, 4)
          .map((c) => `[Priority ${c.priorityTier}] ${c.title} — ${c.subtitle}`)
      ];
      break;
    }
  }

  const dedupedProse = deduplicateProseAgainstExisting(rawProse, existingTexts);
  const dedupedBullets = deduplicateLinesAgainstExisting(rawBullets, existingTexts);
  const suggestedAttachments = selectRelevantAttachments(
    attachCandidates,
    acquiredResources,
    secKey,
    textbookHits
  );

  return {
    prose: dedupedProse || rawProse.trim(),
    bullets: dedupedBullets,
    formulas,
    comparisonTable,
    importantQuestions,
    suggestedAttachments,
    sourceSupportNote:
      textbookHits.length > 0
        ? `Grounded in ${textbookHits.length} retrieved PDF textbook passage(s) (Priority 1) with exact page pointers, plus ${suggestedAttachments.length} linked source(s). Review claims before merging.`
        : suggestedAttachments.length > 0
        ? `Synthesized from PharmaLab curriculum context and matched to ${suggestedAttachments.length} existing PharmaLab source(s). Upload/link PDF textbooks for page-level verification.`
        : 'Synthesized from PharmaLab syllabus/domain structure. Attach verified textbook or Reference Center sources before finalizing.'
  };
}
