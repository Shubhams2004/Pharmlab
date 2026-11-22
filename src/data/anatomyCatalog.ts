import { AnatomicalStructureEntity } from '../types/academicEngine';

export const ANATOMY_CATALOG: AnatomicalStructureEntity[] = [
  {
    id: 'anat_01_brain',
    catalogNumber: 1,
    name: 'Brain',
    scientificName: 'Encephalon',
    alternateNames: ['Cerebrum, Cerebellum & Brainstem', 'Intracranial CNS'],
    primaryCategory: 'nervous',
    categories: ['nervous'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_nervous_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_02_spinal_cord', 'anat_37_pituitary_gland', 'anat_39_pineal_gland', 'anat_54_nervous_tissue'],
    overview: 'Command center of the central nervous system integrating sensory perception, cognition, motor coordination, autonomic homeostasis, and consciousness.',
    definition: 'The anterior expanded portion of the central nervous system enclosed within the cranial cavity, divided into forebrain (cerebrum and diencephalon), midbrain, pons, medulla oblongata, and cerebellum.',
    anatomicalLocation: 'Cranial cavity enveloped by three meninges (dura mater, arachnoid mater, pia mater) and cushioned by cerebrospinal fluid (CSF) in the subarachnoid space.',
    structure: 'Organized into outer folded gray matter (cerebral cortex ~2–4 mm thick containing ~86 billion neurons total across brain) and inner myelinated white matter tracts (corpus callosum, internal capsule), deep basal nuclei, thalamus/hypothalamus, brainstem nuclei, and four CSF-filled ventricles.',
    components: [
      { name: 'Cerebral Cortex & Lobes', role: 'Frontal (executive motor/Broca speech), Parietal (somatosensory), Temporal (auditory/Wernicke/hippocampus), and Occipital (visual processing).' },
      { name: 'Thalamus & Hypothalamus', role: 'Thalamus relays sensory traffic; hypothalamus controls temperature, hunger, thirst, circadian drive, and pituitary hormone release.' },
      { name: 'Brainstem (Midbrain, Pons, Medulla)', role: 'Houses cranial nerve nuclei III–XII and vital medullary respiratory/vasomotor centers.' },
      { name: 'Cerebellum', role: 'Coordinates posture, balance, muscle tone, and smooth skilled motor timing without initiating movement.' }
    ],
    functions: [
      'Higher cognitive processing, memory consolidation, language, and voluntary motor initiation',
      'Autonomic cardiovascular, respiratory, and thermoregulatory control',
      'Neuroendocrine integration via the hypothalamic-pituitary axis',
      'Extrapyramidal fine-tuning of posture and equilibrium'
    ],
    physiology: 'Receives ~15% of cardiac output (~750 mL/min) and consumes ~20% of resting body oxygen and glucose almost exclusively via aerobic glycolysis. Tight endothelial junctions with astrocyte foot processes form the lipophilic Blood-Brain Barrier (BBB).',
    clinicalSignificance: [
      'Ischemic or hemorrhagic stroke causes focal neurological deficits matching cerebral arterial territories (MCA, ACA, PCA).',
      'Dopaminergic nigrostriatal degeneration produces Parkinsonism (bradykinesia, resting tremor, rigidity); GABA/glutamate imbalance triggers epilepsy.'
    ],
    pharmaceuticalRelevance: [
      'Blood-Brain Barrier restricts hydrophilic ionized drugs (e.g., dopamine, peripheral quaternary antimuscarinics) while allowing lipophilic drugs or carrier-mediated transport (levodopa via LAT1).',
      'Target organ for CNS depressants, anxiolytics (GABA-A positive allosteric modulators), antipsychotics (D₂ antagonists), antidepressants, and antiepileptics.'
    ],
    examEssentials: [
      'Cerebrospinal fluid (~150 mL total, ~500 mL produced daily) is secreted mainly by the choroid plexus and absorbed via arachnoid villi.',
      'Medulla oblongata houses vital respiratory and cardiac vasomotor centers; cerebellar lesions cause ipsilateral ataxia and intention tremor.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson', 'tb_guyton'],
    searchKeywords: ['brain', 'encephalon', 'cerebrum', 'cerebellum', 'brainstem', 'bbb', 'csf', 'cns']
  },
  {
    id: 'anat_02_spinal_cord',
    catalogNumber: 2,
    name: 'Spinal cord',
    scientificName: 'Medulla spinalis',
    alternateNames: ['Spinal CNS', 'Intrathecal Cord'],
    primaryCategory: 'nervous',
    categories: ['nervous'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_nervous_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_01_brain', 'anat_49_bone_tissue', 'anat_54_nervous_tissue'],
    overview: 'Cylindrical neural conduit extending from the foramen magnum to L1–L2 that conducts ascending sensory and descending motor tracts and executes spinal reflexes.',
    definition: 'The elongated caudal division of the central nervous system housed inside the vertebral canal, giving rise to 31 pairs of mixed spinal nerves.',
    anatomicalLocation: 'Extends from the medulla oblongata at the foramen magnum down to the conus medullaris at the L1–L2 vertebral border in adults; cauda equina continues to the coccyx.',
    structure: 'Central H-shaped gray matter (dorsal sensory horns, lateral sympathetic horns at T1–L2, ventral motor horns) surrounded by myelinated white matter funiculi carrying ascending (dorsal columns, spinothalamic) and descending (corticospinal) tracts.',
    components: [
      { name: 'Dorsal (Posterior) Horn & Ganglion', role: 'Receives somatic and visceral sensory afferents (pain, temperature, touch, proprioception).' },
      { name: 'Ventral (Anterior) Horn', role: 'Houses α- and γ-motor neuron cell bodies innervating skeletal muscle fibers.' },
      { name: '31 Pairs of Spinal Nerves', role: '8 cervical, 12 thoracic, 5 lumbar, 5 sacral, and 1 coccygeal mixed nerve pairs.' }
    ],
    functions: [
      'Bidirectional conduction of sensory impulses to the brain and motor commands to effectors',
      'Integration of monosynaptic stretch reflexes and polysynaptic withdrawal reflexes',
      'Origin of sympathetic preganglionic fibers (thoracolumbar T1–L2) and sacral parasympathetic outflow (S2–S4)'
    ],
    physiology: 'Sensory fibers enter via dorsal roots while motor axons exit via ventral roots (Bell-Magendie law). Pain signals are modulated at the dorsal horn substantia gelatinosa before ascending the spinothalamic tract.',
    clinicalSignificance: [
      'Spinal cord transection produces complete motor paralysis and sensory loss below the injury level.',
      'Lumbar puncture (spinal tap) is performed safely at L3–L4 or L4–L5 below the adult conus medullaris.'
    ],
    pharmaceuticalRelevance: [
      'Intrathecal and epidural local anesthetics (bupivacaine, lidocaine) block voltage-gated Na⁺ channels on spinal nerve roots for regional anesthesia.',
      'Opioid receptors (μ) in the dorsal horn substantia gelatinosa mediate spinal analgesia; baclofen acts on spinal GABA-B receptors to relieve spasticity.'
    ],
    examEssentials: [
      'Adults have 31 spinal nerve pairs; cord terminates at L1–L2 (safe lumbar puncture site: L3–L4 / L4–L5).',
      'Dorsal root = sensory only; Ventral root = motor only; Dorsal + Ventral form mixed spinal nerve.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['spinal cord', 'medulla spinalis', 'reflex arc', 'dorsal horn', 'ventral horn', 'cauda equina', 'lumbar puncture']
  },
  {
    id: 'anat_03_heart',
    catalogNumber: 3,
    name: 'Heart',
    scientificName: 'Cor',
    alternateNames: ['Cardiac Pump', 'Myocardium'],
    primaryCategory: 'cardiovascular',
    categories: ['cardiovascular'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_cardiovascular_system',
    subtopicIds: ['subtopic_heart_chambers', 'subtopic_cardiac_conduction'],
    relatedStructureIds: ['anat_60_heart_valves', 'anat_47_cardiac_muscle', 'anat_04_lungs', 'anat_52_blood'],
    overview: 'Four-chambered fibromuscular cardiovascular pump driving continuous pulmonary oxygenation and systemic arterial perfusion.',
    definition: 'A hollow, cone-shaped muscular organ enclosed within the pericardial sac that propels deoxygenated blood through the lungs and oxygenated blood throughout the body.',
    anatomicalLocation: 'Middle mediastinum between the lungs, posterior to the sternum, with ~two-thirds of its mass left of the midline and apex at the left 5th intercostal space (midclavicular line).',
    structure: 'Three wall layers—outer epicardium, thick contractile myocardium (3× thicker in left ventricle than right), and inner endothelial endocardium—partitioned into right/left atria and right/left ventricles separated by septa and four one-way valves.',
    components: [
      { name: 'Right Atrium & Right Ventricle', role: 'Receives systemic venous return (SVC, IVC, coronary sinus) and pumps low-pressure blood (~25/8 mmHg) to lungs via pulmonary trunk.' },
      { name: 'Left Atrium & Left Ventricle', role: 'Receives oxygenated blood from 4 pulmonary veins and ejects high-pressure blood (~120/80 mmHg) into the aorta.' },
      { name: 'Intrinsic Conduction Network', role: 'SA node pacemaker (70–80 bpm) → internodal pathways → AV node (~0.1 s delay) → Bundle of His → Purkinje fibers.' },
      { name: 'Coronary Circulation', role: 'Left and right coronary arteries arising from aortic sinuses supply myocardium primarily during ventricular diastole.' }
    ],
    functions: [
      'Generates pulsatile systemic and pulmonary blood flow (Cardiac Output = HR × SV ≈ 5.0 L/min)',
      'Separates oxygenated and deoxygenated blood across pulmonary and systemic circuits',
      'Maintains arterial perfusion pressure for brain, kidneys, and visceral organs',
      'Secretes Atrial Natriuretic Peptide (ANP) in response to atrial stretch'
    ],
    physiology: 'Each ~0.8 s cardiac cycle comprises atrial systole (ECG P wave), ventricular systole (QRS complex; S1 AV closure; ejection), and ventricular diastole (T wave; S2 semilunar closure; passive filling).',
    clinicalSignificance: [
      'Coronary plaque rupture causes acute myocardial infarction (ST-elevation/Troponin rise); reduced ventricular ejection causes heart failure.',
      'ECG rhythm abnormalities reflect SA/AV conduction blocks, atrial fibrillation, or ventricular arrhythmias.'
    ],
    pharmaceuticalRelevance: [
      'Sympathetic β₁-receptors increase heart rate/contractility (target of β-blockers like metoprolol); parasympathetic vagal M₂ receptors slow SA/AV nodes.',
      'Site of action for cardiac glycosides (digoxin inhibiting Na⁺/K⁺-ATPase), calcium channel blockers, antiarrhythmics, and organic nitrates (coronary vasodilation).'
    ],
    examEssentials: [
      'Normal resting HR 72 bpm × SV 70 mL ≈ 5,040 mL/min Cardiac Output; Ejection Fraction normal = 55–70%.',
      'AV node ~0.10 s conduction delay allows complete ventricular filling before ventricular contraction.'
    ],
    visualIds: ['builtin_heart_anatomy'],
    anatomyDiagramKey: 'heart',
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson', 'tb_guyton'],
    searchKeywords: ['heart', 'cor', 'cardiac output', 'sa node', 'av node', 'ecg', 'ventricle', 'atrium', 'myocardium']
  },
  {
    id: 'anat_04_lungs',
    catalogNumber: 4,
    name: 'Lungs',
    scientificName: 'Pulmones',
    alternateNames: ['Pulmonary Parenchyma', 'Alveoli'],
    primaryCategory: 'respiratory',
    categories: ['respiratory'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_respiratory_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_17_trachea', 'anat_18_bronchi', 'anat_59_diaphragm', 'anat_03_heart'],
    overview: 'Paired spongy thoracic organs containing ~300 million alveoli where pulmonary O₂ uptake and CO₂ elimination occur across the respiratory membrane.',
    definition: 'Paired conical organs occupying the right and left pleural cavities of the thorax, responsible for external respiration, acid-base CO₂ buffering, and pulmonary angiotensin conversion.',
    anatomicalLocation: 'Thoracic cavity lateral to the heart and mediastinum, extending from above the first rib (apex) down to the diaphragmatic dome (base), enclosed by visceral and parietal pleura.',
    structure: 'Asymmetric lobation: Right lung has 3 lobes (superior, middle, inferior) separated by oblique and horizontal fissures; Left lung has 2 lobes (superior, inferior) and a cardiac notch.Terminal bronchioles branch into respiratory bronchioles, alveolar ducts, and capillary-wrapped alveoli.',
    components: [
      { name: 'Right Lung (3 Lobes) & Left Lung (2 Lobes)', role: 'Right lung is broader and slightly shorter over the liver; left lung accommodates the heart apex.' },
      { name: 'Type I & Type II Pneumocytes', role: 'Squamous Type I cells form the 0.5 μm gas-exchange barrier; cuboidal Type II cells secrete dipalmitoylphosphatidylcholine (DPPC) surfactant.' },
      { name: 'Pleural Membrane & Cavity', role: 'Double serous layer holding negative intrapleural pressure (-4 mmHg) to prevent alveolar collapse.' }
    ],
    functions: [
      'External respiration: passive alveolar-capillary diffusion of O₂ into blood and CO₂ out',
      'Regulates arterial blood pH by adjusting CO₂ elimination rate (respiratory buffer)',
      'Synthesizes pulmonary surfactant to lower alveolar surface tension (Laplace law)',
      'Endothelial Angiotensin-Converting Enzyme (ACE) activates Angiotensin I → II and inactivates bradykinin'
    ],
    physiology: 'Diaphragm and external intercostal contraction expands thoracic volume, dropping intra-alveolar pressure below atmospheric pressure (Boyle’s law) to draw air in (~500 mL tidal volume; ~350 mL alveolar ventilation per breath).',
    clinicalSignificance: [
      'Surfactant deficiency in premature neonates causes Infant Respiratory Distress Syndrome (IRDS).',
      'Alveolar destruction (emphysema), fluid edema, pneumonia, or pulmonary embolism impairs arterial oxygenation (hypoxemia).'
    ],
    pharmaceuticalRelevance: [
      'Inhalation aerosols (salbutamol, budesonide, ipratropium) deliver high local lung concentrations directly while minimizing systemic toxicity.',
      'Pulmonary capillary endothelium expresses abundant ACE—targeted by ACE inhibitors (enalapril, ramipril), whose bradykinin accumulation causes dry cough.'
    ],
    examEssentials: [
      'Right lung = 3 lobes; Left lung = 2 lobes + cardiac notch.',
      'Type II alveolar cells secrete surfactant (lecithin/DPPC); normal Tidal Volume ≈ 500 mL, Vital Capacity ≈ 4,800 mL.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson', 'tb_guyton'],
    searchKeywords: ['lungs', 'pulmones', 'alveoli', 'surfactant', 'pleura', 'gas exchange', 'spirometry', 'tidal volume']
  },
  {
    id: 'anat_05_liver',
    catalogNumber: 5,
    name: 'Liver',
    scientificName: 'Hepar',
    alternateNames: ['Hepatic Parenchyma', 'Hepatocytes'],
    primaryCategory: 'digestive',
    categories: ['digestive'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_digestive_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_33_gallbladder', 'anat_31_pancreas', 'anat_07_small_intestine', 'anat_59_diaphragm'],
    overview: 'Largest internal visceral organ and primary metabolic powerhouse performing bile synthesis, nutrient homeostasis, plasma protein production, and CYP450 drug biotransformation.',
    definition: 'A dual-blood-supply (~75% portal vein, ~25% hepatic artery) wedge-shaped gland in the right upper abdomen organized into hexagonal hepatic lobules.',
    anatomicalLocation: 'Right upper quadrant (right hypochondriac and epigastric regions) immediately beneath the diaphragm and protected by the lower right rib cage.',
    structure: 'Four anatomical lobes (right, left, caudate, quadrate) composed of hexagonal hepatic lobules centered around a central vein. Cords of hepatocytes flank blood-filled sinusoids lined by phagocytic Kupffer cells; bile canaliculi drain peripherally toward portal triads.',
    components: [
      { name: 'Hepatocytes', role: 'Synthesize bile salts, albumin, clotting factors (I, II, VII, IX, X), glycogen, urea, and express Phase I/II drug-metabolizing enzymes.' },
      { name: 'Hepatic Sinusoids & Kupffer Cells', role: 'Fenestrated low-pressure capillaries where resident macrophages clear gut bacteria and senescent RBCs.' },
      { name: 'Portal Triad', role: 'Branches of hepatic portal vein, hepatic artery proper, and bile ductule at each lobule corner.' }
    ],
    functions: [
      'Produces bile (~600–1,000 mL/day) for dietary lipid emulsification and bilirubin excretion',
      'Regulates blood glucose via glycogenesis, glycogenolysis, and gluconeogenesis',
      'Synthesizes plasma albumin and coagulation factors and detoxifies ammonia via the urea cycle',
      'Performs Phase I (CYP450 oxidation/reduction/hydrolysis) and Phase II (glucuronidation/sulfation) drug metabolism'
    ],
    physiology: 'Venous blood draining the GI tract enters the liver via the hepatic portal vein before reaching the systemic circulation via the inferior vena cava, exposing orally absorbed drugs to pre-systemic hepatic extraction.',
    clinicalSignificance: [
      'Hepatocellular necrosis (viral hepatitis, alcohol, paracetamol overdose) elevates serum ALT/AST and causes jaundice, hypoalbuminemia, and coagulopathy.',
      'Portal hypertension in cirrhosis produces ascites, splenomegaly, and esophageal varices.'
    ],
    pharmaceuticalRelevance: [
      'Primary determinant of oral drug first-pass metabolism (high-extraction drugs such as propranolol, lidocaine, nitroglycerin show markedly lower oral bioavailability).',
      'CYP450 inducers (rifampicin, phenytoin) and inhibitors (ketoconazole, erythromycin) cause major clinical drug-drug interactions.'
    ],
    examEssentials: [
      'Dual blood supply: ~75% nutrient-rich Portal Vein + ~25% oxygen-rich Hepatic Artery.',
      'Vitamin K–dependent hepatic clotting factors: II, VII, IX, and X; Kupffer cells are resident hepatic macrophages.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson', 'tb_guyton'],
    searchKeywords: ['liver', 'hepar', 'hepatocytes', 'portal vein', 'first pass metabolism', 'cyp450', 'bile', 'kupffer']
  },
  {
    id: 'anat_06_stomach',
    catalogNumber: 6,
    name: 'Stomach',
    scientificName: 'Gaster (Ventriculus)',
    alternateNames: ['Gastric Chamber'],
    primaryCategory: 'digestive',
    categories: ['digestive'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_digestive_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_25_esophagus', 'anat_07_small_intestine', 'anat_05_liver', 'anat_31_pancreas'],
    overview: 'J-shaped muscular reservoir that churns food with hydrochloric acid and pepsin into semi-liquid chyme while secreting intrinsic factor for Vitamin B₁₂ absorption.',
    definition: 'The dilated muscular segment of the alimentary canal between the esophagus and duodenum specialized for temporary storage, mechanical mixing, acid sterilization, and initial proteolysis.',
    anatomicalLocation: 'Left upper quadrant (epigastric, umbilical, and left hypochondriac regions) just inferior to the diaphragm.',
    structure: 'Divided into Cardia, Fundus, Body, and Pylorus (ending at the pyloric sphincter). Features three smooth muscle layers (longitudinal, circular, plus unique inner oblique layer) and internal mucosal folds (rugae) with deep gastric pits.',
    components: [
      { name: 'Parietal (Oxyntic) Cells', role: 'Secrete HCl (pH 1.5–2.0 via H⁺/K⁺-ATPase proton pump) and Intrinsic Factor required for ileal Vitamin B₁₂ uptake.' },
      { name: 'Chief (Zymogenic) Cells', role: 'Secrete pepsinogen (activated by HCl to pepsin) and gastric lipase.' },
      { name: 'Mucous Neck & G Cells', role: 'Mucus + HCO₃⁻ form protective mucosal barrier; antral G cells secrete gastrin.' }
    ],
    functions: [
      'Temporary food reservoir and mechanical churning into acidic chyme',
      'Pathogen destruction and protein denaturation via gastric HCl (pH ~1.5–2.0)',
      'Initial enzymatic protein cleavage via pepsin',
      'Secretion of Intrinsic Factor essential for erythropoiesis (Vitamin B₁₂ absorption)'
    ],
    physiology: 'Gastric secretion proceeds through cephalic (vagal), gastric (gastrin/histamine H₂), and intestinal feedback phases; pyloric emptying rate controls downstream duodenal drug dissolution and absorption.',
    clinicalSignificance: [
      'Helicobacter pylori infection or NSAID prostaglandin suppression erodes the mucous-bicarbonate barrier causing peptic ulcer disease.',
      'Autoimmune parietal cell destruction causes pernicious anemia from Intrinsic Factor deficiency.'
    ],
    pharmaceuticalRelevance: [
      'Site of action for Proton Pump Inhibitors (omeprazole blocking H⁺/K⁺-ATPase), H₂-antagonists (famotidine), antacids, and cytoprotectants (sucralfate).',
      'Acid-labile drugs (penicillin G, erythromycin, omeprazole) require enteric coating to survive gastric pH until reaching the small intestine.'
    ],
    examEssentials: [
      'Parietal cells = HCl + Intrinsic Factor; Chief cells = Pepsinogen; G cells = Gastrin.',
      'Only GI organ with 3 smooth muscle layers (oblique, circular, longitudinal); minimal solid drug absorption compared to small intestine.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['stomach', 'gaster', 'parietal cell', 'hcl', 'intrinsic factor', 'pepsin', 'proton pump', 'enteric coated']
  },
  {
    id: 'anat_07_small_intestine',
    catalogNumber: 7,
    name: 'Small intestine',
    scientificName: 'Intestinum tenue',
    alternateNames: ['Duodenum, Jejunum & Ileum'],
    primaryCategory: 'digestive',
    categories: ['digestive'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_digestive_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_06_stomach', 'anat_08_large_intestine', 'anat_05_liver', 'anat_31_pancreas'],
    overview: 'Coiled ~6-meter GI tract segment (duodenum, jejunum, ileum) providing >90% of nutrient and oral drug absorption across circular folds, villi, and microvilli.',
    definition: 'The principal site of chemical digestion and intestinal absorption extending from the pyloric sphincter to the ileocecal valve.',
    anatomicalLocation: 'Occupies the central and lower abdominal cavity, framed by the large intestine and suspended by the mesentery.',
    structure: 'Comprises C-shaped Duodenum (~25 cm receiving bile and pancreatic ducts), Jejunum (~2.5 m, thickest plicae circulares/villi), and Ileum (~3.5 m containing Peyer’s patches). Surface area is amplified ~600× by plicae circulares, finger-like villi, and enterocyte brush-border microvilli.',
    components: [
      { name: 'Duodenum & Brunner’s Glands', role: 'Neutralizes acidic chyme with alkaline mucus, secretin/CCK signaling, and pancreatic/biliary secretions.' },
      { name: 'Jejunum', role: 'Primary absorptive segment for amino acids, monosaccharides, water-soluble vitamins, and most oral drugs.' },
      { name: 'Ileum & Peyer’s Patches', role: 'Absorbs Vitamin B₁₂–Intrinsic Factor complexes and recycles bile salts; GALT lymphoid surveillance.' }
    ],
    functions: [
      'Final enzymatic digestion via pancreatic enzymes and brush-border disaccharidases/peptidases',
      'Absorption of ~90% of dietary nutrients, electrolytes, water, and orally administered drugs',
      'Endocrine release of secretin, cholecystokinin (CCK), and incretin GLP-1',
      'Enterohepatic bile salt recycling in the terminal ileum'
    ],
    physiology: 'Chyme pH rises from ~5.5 in duodenum to ~7.4 in ileum. Nutrient and drug uptake occurs via passive transcellular diffusion, carrier transporters (PEPT1, OATP), and chylomicron transport into central lacteals.',
    clinicalSignificance: [
      'Celiac disease flattens duodenal/jejunal villi causing malabsorption and iron/folate deficiency.',
      'Ileal resection disrupts Vitamin B₁₂ and bile acid reabsorption leading to megaloblastic anemia and steatorrhea.'
    ],
    pharmaceuticalRelevance: [
      'Dominant site of oral drug absorption due to vast (~200 m²) absorptive surface area, high mesenteric perfusion, and favorable pH (5.5–7.5).',
      'Enterocyte CYP3A4 enzymes and P-glycoprotein (P-gp) efflux pumps actively limit oral bioavailability of substrates (e.g., cyclosporine, digoxin, statins).'
    ],
    examEssentials: [
      'Order: Duodenum → Jejunum → Ileum; Peyer’s patches are characteristic of Ileum; Brunner’s glands of Duodenum.',
      'Primary site of oral drug absorption (~90%); Enteric-coated tablets dissolve here.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson', 'tb_guyton'],
    searchKeywords: ['small intestine', 'duodenum', 'jejunum', 'ileum', 'villi', 'microvilli', 'drug absorption', 'peyer']
  },
  {
    id: 'anat_08_large_intestine',
    catalogNumber: 8,
    name: 'Large intestine',
    scientificName: 'Intestinum crassum',
    alternateNames: ['Colon & Cecum'],
    primaryCategory: 'digestive',
    categories: ['digestive'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_digestive_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_07_small_intestine', 'anat_34_appendix', 'anat_09_rectum', 'anat_10_anus'],
    overview: 'Terminal ~1.5-meter GI segment (cecum, ascending/transverse/descending/sigmoid colon) that reclaims residual water and electrolytes, hosts vitamin-producing microbiota, and compacts feces.',
    definition: 'The wider-diameter distal segment of the digestive tract extending from the ileocecal junction to the rectum, lacking villi and featuring teniae coli and haustra.',
    anatomicalLocation: 'Frames the small intestine around the perimeter of the abdominal and pelvic cavities.',
    structure: 'Comprises Cecum (bearing the vermiform appendix), Ascending colon, Transverse colon, Descending colon, and S-shaped Sigmoid colon. Outer longitudinal muscle is condensed into three ribbon bands (teniae coli) creating sacculated pouches (haustra); mucosa contains abundant goblet cells.',
    components: [
      { name: 'Cecum & Haustra', role: 'Pouch receiving ileal chyme via the ileocecal valve; slow haustral churning maximizes water reabsorption.' },
      { name: 'Colonic Goblet Cells', role: 'Secrete lubricating alkaline mucus protecting mucosa and binding fecal matter.' },
      { name: 'Commensal Microbiota', role: 'Ferments undigested fiber into short-chain fatty acids and synthesizes Vitamin K and biotin.' }
    ],
    functions: [
      'Reabsorbs remaining water (~1.4 L/day) and Na⁺/Cl⁻ electrolytes to form solid feces',
      'Microbial synthesis and absorption of Vitamin K₂ and B-complex vitamins',
      'Propulsive mass movements shifting fecal contents into the rectum'
    ],
    physiology: 'Slow transit (12–36 hours) allows complete fluid desiccation and bacterial fermentation; aldosterone increases colonic Na⁺ reabsorption and K⁺ secretion.',
    clinicalSignificance: [
      'Ulcerative colitis, Crohn’s colitis, diverticulitis, and colorectal adenocarcinoma commonly involve the colonic mucosa.',
      'Broad-spectrum antibiotics deplete normal flora, risking Clostridioides difficile pseudomembranous colitis.'
    ],
    pharmaceuticalRelevance: [
      'Target site for colon-targeted drug delivery (e.g., 5-ASA prodrugs like sulfasalazine cleaved by colonic bacterial azoreductases for ulcerative colitis).',
      'Stimulant laxatives (senna sennosides, bisacodyl) and osmotic laxatives (lactulose, PEG) act primarily in the colon.'
    ],
    examEssentials: [
      'Lacks villi and plicae circulares; distinguished grossly by teniae coli, haustra, and epiploic appendages.',
      'Sulfasalazine requires colonic bacterial azoreductase cleavage to release active 5-aminosalicylic acid.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['large intestine', 'colon', 'cecum', 'haustra', 'teniae coli', 'microbiota', 'colon targeted', 'sulfasalazine']
  },
  {
    id: 'anat_09_rectum',
    catalogNumber: 9,
    name: 'Rectum',
    scientificName: 'Rectum',
    alternateNames: ['Rectal Ampulla', 'Lower GI Reservoir'],
    primaryCategory: 'digestive',
    categories: ['digestive'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_digestive_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_08_large_intestine', 'anat_10_anus', 'anat_15_urinary_bladder'],
    overview: 'Distal ~12–15 cm pelvic reservoir of the alimentary canal serving fecal storage prior to defecation and functioning as a critical non-oral route for rectal suppositories.',
    definition: 'The relatively straight, muscular terminal segment of the large intestine extending from the sigmoid colon (S3 level) to the anal canal.',
    anatomicalLocation: 'True pelvic cavity immediately anterior to the sacrum and coccyx, posterior to the urinary bladder (and uterus/vagina in females or prostate/seminal vesicles in males).',
    structure: 'Lacks teniae coli and haustra; possesses a complete longitudinal smooth muscle coat and three internal transverse mucosal folds (valves of Houston) supporting fecal weight, plus rich superior, middle, and inferior rectal venous plexuses.',
    components: [
      { name: 'Rectal Ampulla & Transverse Folds', role: 'Distensible lower segment with stretch mechanoreceptors triggering the defecation reflex.' },
      { name: 'Rectal Venous Plexus', role: 'Dual venous drainage: superior rectal vein → portal vein (liver); middle & inferior rectal veins → internal iliac vein → IVC (bypasses liver).' }
    ],
    functions: [
      'Temporary storage of compacted feces until socially convenient elimination',
      'Initiates parasympathetic pelvic defecation reflex upon wall distension',
      'Absorbs locally or systemically administered rectal medications'
    ],
    physiology: 'Mass peristalsis distends the rectal wall, activating sacral S2–S4 stretch reflexes that contract rectal smooth muscle and relax the internal anal sphincter.',
    clinicalSignificance: [
      'Engorgement of submucosal rectal venous cushions produces internal hemorrhoids.',
      'Digital rectal examination and proctoscopy assess rectal masses, bleeding, and adjacent prostatic contour.'
    ],
    pharmaceuticalRelevance: [
      'Major route for suppositories and enemas (paracetamol, diazepam, mesalamine, bisacodyl) in vomiting, unconscious, or pediatric patients.',
      'Lower rectal absorption via middle/inferior rectal veins partially (~50%) bypasses hepatic first-pass metabolism.'
    ],
    examEssentials: [
      'Middle and inferior rectal veins drain into systemic IVC (bypassing hepatic first-pass metabolism ~50%); superior rectal vein enters the portal vein.',
      'Suppository bases (cocoa butter, PEG, glycero-gelatin) melt or dissolve at 37 °C inside the rectal ampulla.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['rectum', 'rectal', 'suppository', 'hemorrhoidal veins', 'first pass bypass', 'defecation']
  },
  {
    id: 'anat_10_anus',
    catalogNumber: 10,
    name: 'Anus',
    scientificName: 'Canalis analis et Anus',
    alternateNames: ['Anal Canal & Sphincters', 'Terminal GI Orifice'],
    primaryCategory: 'digestive',
    categories: ['digestive'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_digestive_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_09_rectum', 'anat_08_large_intestine', 'anat_45_skeletal_muscle', 'anat_46_smooth_muscle'],
    overview: 'Terminal ~3–4 cm anal canal and external orifice guarded by involuntary smooth (internal) and voluntary skeletal (external) sphincters maintaining fecal continence.',
    definition: 'The final exit canal of the digestive tract running from the anorectal junction through the pelvic floor to the perianal skin orifice.',
    anatomicalLocation: 'Perineum between the buttocks, inferior to the pelvic diaphragm (levator ani).',
    structure: 'Divided at the pectinate (dentate) line: superior half has columnar epithelium, autonomic innervation, and portal/systemic venous drainage; inferior half has stratified squamous epithelium, somatic pudendal pain sensitivity, and systemic drainage. Surrounded by Internal Anal Sphincter (involuntary smooth muscle) and External Anal Sphincter (voluntary skeletal muscle).',
    components: [
      { name: 'Internal Anal Sphincter', role: 'Thickened involuntary circular smooth muscle maintaining ~70–85% of resting anal tone; relaxes reflexively via nitric oxide during rectal filling.' },
      { name: 'External Anal Sphincter', role: 'Voluntary skeletal muscle collar innervated by pudendal nerve (S2–S4) enabling conscious continence.' },
      { name: 'Pectinate (Dentate) Line', role: 'Histological landmark dividing visceral (painless) superior mucosa from somatic (pain-sensitive) inferior anoderm.' }
    ],
    functions: [
      'Maintains resting fecal and flatus continence via dual tonic sphincters',
      'Permits controlled voluntary evacuation upon external sphincter relaxation',
      'Discriminates solid, liquid, and gas contents via somatic sensory endings'
    ],
    physiology: 'Rectal distension triggers the rectoanal inhibitory reflex (relaxation of internal sphincter), while conscious contraction of the external anal sphincter and puborectalis preserves continence until defecation.',
    clinicalSignificance: [
      'Venous dilatation above the pectinate line forms painless internal hemorrhoids; below the line causes painful external hemorrhoids or anal fissures.',
      'Traumatic or neurological pudendal injury produces fecal incontinence.'
    ],
    pharmaceuticalRelevance: [
      'Topical anorectal ointments/creams combine local anesthetics (lidocaine), vasoconstrictors (phenylephrine), hydrocortisone, or nitroglycerin/diltiazem (relaxing internal smooth sphincter spasm in anal fissures).',
      'Lubricated insertion technique minimizes pain when administering rectal suppositories across the sensitive anal canal.'
    ],
    examEssentials: [
      'Internal anal sphincter = involuntary smooth muscle; External anal sphincter = voluntary skeletal muscle (pudendal nerve S2–S4).',
      'Pectinate line marks the shift from columnar (visceral, insensitive to somatic pain) to stratified squamous epithelium (somatic pain sensitive).'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['anus', 'anal canal', 'anal sphincter', 'pectinate line', 'hemorrhoids', 'fissure', 'continence']
  },
  {
    id: 'anat_11_right_kidney',
    catalogNumber: 11,
    name: 'Right kidney',
    scientificName: 'Ren dexter',
    alternateNames: ['Right Renal Parenchyma'],
    primaryCategory: 'urinary',
    categories: ['urinary'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_urinary_system',
    subtopicIds: ['subtopic_nephron'],
    relatedStructureIds: ['anat_12_left_kidney', 'anat_13_right_ureter', 'anat_05_liver', 'anat_38_adrenal_glands'],
    overview: 'Right retroperitoneal bean-shaped excretory organ positioned slightly lower than the left kidney beneath the right hepatic lobe, housing ~1 million filtration nephrons.',
    definition: 'The right urinary organ that filters blood plasma, maintains fluid-electrolyte and acid-base balance, secretes erythropoietin and renin, and eliminates water-soluble drugs into the right ureter.',
    anatomicalLocation: 'Right retroperitoneal paravertebral gutter spanning approximately T12 to L3 vertebrae—typically 1–2 cm lower than the left kidney because of the large right lobe of the liver superiorly.',
    structure: 'Encased in fibrous renal capsule and perirenal fat; divided internally into outer granular renal cortex (renal corpuscles, PCT, DCT) and inner striated renal medulla (renal pyramids terminating at papillae) draining into minor/major calyces and the right renal pelvis. Features a shorter right renal vein (entering the IVC) and longer right renal artery passing posterior to the IVC.',
    components: [
      { name: 'Renal Cortex & Medullary Pyramids', role: 'Houses ~1.0–1.2 million nephrons (~85% cortical, ~15% juxtamedullary) performing filtration and urine concentration.' },
      { name: 'Right Renal Hilum & Vessels', role: 'Concave medial cleft transmitting shorter right renal vein (to adjacent IVC), longer right renal artery, and right renal pelvis.' },
      { name: 'Nephrons (Functional Subtopic)', role: 'Microscopic filtration-reabsorption-secretion units transforming plasma ultrafiltrate into urine.' }
    ],
    functions: [
      'Ultrafiltration of plasma wastes (urea, creatinine, uric acid) and unbound water-soluble drugs',
      'Homeostatic regulation of ECF volume, Na⁺/K⁺/Ca²⁺/PO₄³⁻ balance, and arterial blood pH',
      'Endocrine production of Renin (BP via RAAS), Erythropoietin (RBC maturation), and Calcitriol (active Vitamin D)',
      'Receives ~10–12% of total cardiac output (~550–600 mL/min renal blood flow per kidney)'
    ],
    physiology: 'Both kidneys together receive ~20–25% of cardiac output, generating a combined normal GFR of ~125 mL/min (~180 L/day filtrate) with >99% tubular water reabsorption to yield ~1.5 L/day urine.',
    clinicalSignificance: [
      'Lower anatomic position beneath the liver makes the right kidney more palpable in thin patients and susceptible to subhepatic pathology or right flank nephrolithiasis.',
      'Decreased renal blood flow or nephron loss reduces creatinine clearance and precipitates uremia and drug accumulation.'
    ],
    pharmaceuticalRelevance: [
      'Creatinine clearance (Cockcroft-Gault) guides dose reduction for renally cleared drugs (aminoglycosides, vancomycin, digoxin, metformin).',
      'Target organ for diuretics (furosemide, hydrochlorothiazide, spironolactone, acetazolamide) and SGLT2 inhibitors.'
    ],
    examEssentials: [
      'Right kidney lies ~1–2 cm LOWER than the left kidney due to the right lobe of the liver; right renal vein is shorter than the left.',
      'Combined normal GFR ≈ 125 mL/min; 1 million nephrons per kidney.'
    ],
    visualIds: ['builtin_nephron_anatomy'],
    anatomyDiagramKey: 'nephron',
    textbookRefIds: ['tb_tortora', 'tb_guyton', 'tb_sembulingam'],
    searchKeywords: ['right kidney', 'ren dexter', 'kidney', 'nephron', 'gfr', 'renal clearance', 'liver lower']
  },
  {
    id: 'anat_12_left_kidney',
    catalogNumber: 12,
    name: 'Left kidney',
    scientificName: 'Ren sinister',
    alternateNames: ['Left Renal Parenchyma'],
    primaryCategory: 'urinary',
    categories: ['urinary'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_urinary_system',
    subtopicIds: ['subtopic_nephron'],
    relatedStructureIds: ['anat_11_right_kidney', 'anat_14_left_ureter', 'anat_32_spleen', 'anat_38_adrenal_glands'],
    overview: 'Left retroperitoneal excretory organ situated slightly higher than the right kidney beneath the spleen and stomach, possessing a longer left renal vein preferred for donor transplantation.',
    definition: 'The left paired bean-shaped urinary organ filtering blood plasma via ~1 million nephrons and draining urine into the left ureter.',
    anatomicalLocation: 'Left retroperitoneal paravertebral region extending higher than the right kidney (approximately T11 to L2–L3 vertebrae), related anteriorly to the stomach, pancreatic tail, spleen, and left colic flexure.',
    structure: 'Identical internal nephron/cortical/medullary architecture to the right kidney, but anatomically exhibits a longer left renal vein (~7.5 cm) crossing anteriorly over the abdominal aorta (beneath the superior mesenteric artery) to reach the IVC, and a shorter left renal artery.',
    components: [
      { name: 'Cortical & Juxtamedullary Nephrons', role: 'Perform glomerular ultrafiltration, OAT/OCT drug secretion in PCT, countercurrent concentration in Loop of Henle, and ADH water adjustment.' },
      { name: 'Long Left Renal Vein', role: 'Drains left renal hilum plus left adrenal and left gonadal veins across the aorta into the inferior vena cava.' },
      { name: 'Renal Pelvis & Calyces', role: 'Funnel urine collected at medullary papillae directly into the left ureter.' }
    ],
    functions: [
      'Plasma ultrafiltration (~125 mL/min combined GFR) and active tubular excretion of organic acid/base drugs',
      'Acid-base regulation via HCO₃⁻ reabsorption and H⁺/NH₄⁺ excretion',
      'Secretion of Renin (JGA), Erythropoietin, and 1,25-(OH)₂ Vitamin D₃ activation'
    ],
    physiology: 'Maintains autoregulated renal perfusion pressure across systemic MAP 80–180 mmHg via myogenic afferent arteriolar constriction and macula densa tubuloglomerular feedback.',
    clinicalSignificance: [
      'Compression of the long left renal vein between the aorta and superior mesenteric artery causes Nutcracker Syndrome (left flank pain and hematuria).',
      'Left kidney is typically selected in living-donor nephrectomy because its longer renal vein simplifies surgical anastomosis.'
    ],
    pharmaceuticalRelevance: [
      'NSAIDs block vasodilatory renal prostaglandins (PGE₂/PGI₂), constricting afferent arterioles and reducing GFR—especially hazardous alongside ACE inhibitors and diuretics.',
      'Urinary pH alteration modifies tubular reabsorption of weak acids (aspirin) and weak bases (amphetamines) via ion trapping.'
    ],
    examEssentials: [
      'Left kidney sits slightly HIGHER (T11–L2) than right kidney; left renal vein is longer and crosses anterior to the abdominal aorta.',
      'Hilum anteroposterior order (both kidneys): Vein → Artery → Pelvis (V-A-P).'
    ],
    visualIds: ['builtin_nephron_anatomy'],
    anatomyDiagramKey: 'nephron',
    textbookRefIds: ['tb_tortora', 'tb_guyton', 'tb_sembulingam'],
    searchKeywords: ['left kidney', 'ren sinister', 'kidney', 'nephron', 'left renal vein', 'nutcracker', 'renal clearance']
  },
  {
    id: 'anat_13_right_ureter',
    catalogNumber: 13,
    name: 'Right ureter',
    scientificName: 'Ureter dexter',
    alternateNames: ['Right Uretero-Pelvic Conduit'],
    primaryCategory: 'urinary',
    categories: ['urinary'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_urinary_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_11_right_kidney', 'anat_14_left_ureter', 'anat_15_urinary_bladder', 'anat_46_smooth_muscle'],
    overview: 'Right retroperitoneal ~25–30 cm fibromuscular tube propelling urine from the right renal pelvis down to the urinary bladder via smooth muscle peristalsis.',
    definition: 'The narrow muscular conduit draining urine unidirectionally from the right kidney into the right posterior wall of the urinary bladder.',
    anatomicalLocation: 'Descends retroperitoneally anterior to the right psoas major muscle (posterior to descending duodenum and right colic/ileocolic vessels), crossing the right common iliac artery bifurcation before entering the bladder base.',
    structure: 'Three tissue layers: transitional epithelium (urothelium) mucosa allowing stretch, helical/longitudinal smooth muscle muscularis generating peristaltic waves, and outer fibrous adventitia. Exhibits three physiological narrowings where kidney stones lodge: ureteropelvic junction, pelvic brim crossing, and ureterovesical junction.',
    components: [
      { name: 'Urothelium (Transitional Epithelium)', role: 'Urine-impermeable folded mucosa protecting underlying tissues from hypertonic acidic urine.' },
      { name: 'Smooth Muscle Muscularis', role: 'Generates rhythmic peristaltic contractions (1–5 waves/min) independent of gravity.' },
      { name: 'Oblique Intramural Tunnel', role: 'Flap-valve course through bladder detrusor wall preventing vesicoureteral reflux during micturition.' }
    ],
    functions: [
      'Unidirectional active peristaltic transport of urine from right renal pelvis to urinary bladder',
      'Anti-reflux closure of the right ureterovesical orifice during bladder contraction'
    ],
    physiology: 'Pacemaker cells in minor calyces initiate myogenic peristaltic waves traveling down the right ureter at ~2–3 cm/s.',
    clinicalSignificance: [
      'Right-sided renal colic radiates from loin to groin when calculi obstruct any of the three ureteral narrowings; can clinically mimic acute appendicitis.',
      'Intramural tunnel incompetence causes vesicoureteral reflux and ascending pyelonephritis.'
    ],
    pharmaceuticalRelevance: [
      'α₁A-adrenergic blockers (tamsulosin) relax distal ureteral smooth muscle to facilitate Medical Expulsive Therapy (MET) for small stones (<10 mm).',
      'Smooth muscle antispasmodics and NSAIDs (ketorolac/diclofenac) relieve acute ureteral colic.'
    ],
    examEssentials: [
      'Three physiological constrictions: (1) Ureteropelvic junction, (2) Crossing common iliac vessels at pelvic brim, (3) Ureterovesical junction.',
      'Lined by transitional epithelium (urothelium); slightly shorter than left ureter due to lower right kidney position.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['right ureter', 'ureter dexter', 'peristalsis', 'renal colic', 'urothelium', 'tamsulosin']
  },
  {
    id: 'anat_14_left_ureter',
    catalogNumber: 14,
    name: 'Left ureter',
    scientificName: 'Ureter sinister',
    alternateNames: ['Left Uretero-Pelvic Conduit'],
    primaryCategory: 'urinary',
    categories: ['urinary'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_urinary_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_12_left_kidney', 'anat_13_right_ureter', 'anat_15_urinary_bladder', 'anat_46_smooth_muscle'],
    overview: 'Left retroperitoneal ~25–30 cm peristaltic smooth muscle tube draining urine from the higher left kidney downward into the left base of the urinary bladder.',
    definition: 'The paired muscular conduit conducting urine from the left renal pelvis to the left ureteral orifice at the trigone of the urinary bladder.',
    anatomicalLocation: 'Descends retroperitoneally along the left psoas major muscle behind the left colic vessels and sigmoid mesocolon, crossing the left common iliac bifurcation into the pelvis; slightly longer (~1 cm) than the right ureter due to the higher left kidney.',
    structure: 'Lined by waterproof transitional epithelium surrounded by smooth muscle peristaltic layers and outer adventitia; shares the three anatomical narrowing points (UPJ, iliac brim crossing, UVJ).',
    components: [
      { name: 'Left Renal Pelvic Origin (UPJ)', role: 'Narrowest proximal point transitioning from left renal pelvis into tubular ureter.' },
      { name: 'Peristaltic Smooth Muscle Coat', role: 'Propels urine boluses downward toward the bladder trigone every ~10–60 seconds.' },
      { name: 'Left Ureterovesical Junction', role: 'Oblique intramural entry sealing shut when intravesical voiding pressure rises.' }
    ],
    functions: [
      'Propels urine actively from left renal pelvis to urinary bladder against any posture',
      'Prevents retrograde urine backflow into the left kidney during bladder voiding'
    ],
    physiology: 'Urine stretches proximal smooth muscle, initiating coordinated peristalsis modulated by autonomic tone (sympathetic α₁ excitation vs α-blockade relaxation).',
    clinicalSignificance: [
      'Left flank-to-groin colicky pain with microscopic hematuria indicates left ureteral calculus impaction.',
      'Close anatomical relationship to the sigmoid colon and left uterine artery creates surgical vulnerability during pelvic operations ("water under the bridge").'
    ],
    pharmaceuticalRelevance: [
      'Medical expulsive therapy utilizes α₁-blockers (tamsulosin) or calcium channel blockers (nifedipine) to relax distal ureteral smooth muscle.',
      'Adequate hydration prevents crystallization of poorly soluble drugs/metabolites (sulfonamides, acyclovir, methotrexate, indinavir) inside the ureters.'
    ],
    examEssentials: [
      'Left ureter is slightly longer than the right ureter because the left kidney sits higher.',
      'Passes posterior to the uterine artery in females ("water under the bridge").'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['left ureter', 'ureter sinister', 'ureteral stone', 'peristalsis', 'trigone', 'transitional epithelium']
  },
  {
    id: 'anat_15_urinary_bladder',
    catalogNumber: 15,
    name: 'Urinary bladder',
    scientificName: 'Vesica urinaria',
    alternateNames: ['Detrusor Reservoir'],
    primaryCategory: 'urinary',
    categories: ['urinary'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_urinary_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_13_right_ureter', 'anat_14_left_ureter', 'anat_16_urethra', 'anat_46_smooth_muscle'],
    overview: 'Distensible extraperitoneal muscular sac storing ~400–600 mL of urine comfortably until autonomic/voluntary micturition empties it through the urethra.',
    definition: 'Hollow muscular organ in the anterior pelvis lined by transitional epithelium and powered by the detrusor smooth muscle.',
    anatomicalLocation: 'Anterior pelvic cavity posterior to the pubic symphysis; rises into the lower abdomen only when markedly distended.',
    structure: 'Three-layered interwoven Detrusor smooth muscle wall lined by rugated transitional epithelium (urothelium) except at the smooth triangular Trigone bounded by the two ureteral orifices and the internal urethral orifice.',
    components: [
      { name: 'Detrusor Smooth Muscle', role: 'Relaxes during filling (sympathetic β₃) and contracts powerfully during voiding (parasympathetic M₃ acetylcholine receptors).' },
      { name: 'Trigone & Urothelium', role: 'Smooth, non-rugated triangular floor directing urine toward the internal urethral sphincter; urothelium thins from 6 layers to 3 when stretched.' },
      { name: 'Internal Urethral Sphincter', role: 'Involuntary α₁-adrenergic smooth muscle ring keeping the bladder neck closed during storage.' }
    ],
    functions: [
      'Low-pressure storage of renal urine (~400–600 mL functional capacity; urge begins ~200–300 mL)',
      'Coordinated detrusor contraction and internal sphincter relaxation for complete voiding'
    ],
    physiology: 'Storage phase: sympathetic β₃ relaxation of detrusor + α₁ contraction of internal sphincter. Voiding phase: pelvic nerve (S2–S4) parasympathetic M₃ activation contracts detrusor while pudendal somatic inhibition relaxes external urethral sphincter.',
    clinicalSignificance: [
      'Bladder outlet obstruction (BPH) or neurogenic bladder leads to urinary retention, hypertrophy, and recurrent UTIs.',
      'Detrusor overactivity produces urgency and urge urinary incontinence.'
    ],
    pharmaceuticalRelevance: [
      'Overactive bladder is treated with antimuscarinics (oxybutynin, tolterodine, solifenacin blocking M₃) or β₃-agonists (mirabegron relaxing detrusor).',
      'Urinary retention is treated with muscarinic agonists (bethanechol) or α₁-blockers (prazosin, tamsulosin) to relax the bladder neck.'
    ],
    examEssentials: [
      'Parasympathetic M₃ contracts detrusor (voiding); Sympathetic β₃ relaxes detrusor and α₁ constricts internal sphincter (storage).',
      'Lined by Transitional Epithelium (urothelium) capable of extreme distension without tearing.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson', 'tb_guyton'],
    searchKeywords: ['urinary bladder', 'vesica urinaria', 'detrusor', 'trigone', 'micturition', 'oxybutynin', 'mirabegron']
  },
  {
    id: 'anat_16_urethra',
    catalogNumber: 16,
    name: 'Urethra',
    scientificName: 'Urethra',
    alternateNames: ['Urethral Tract'],
    primaryCategory: 'urinary',
    categories: ['urinary'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_urinary_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_15_urinary_bladder', 'anat_11_right_kidney', 'anat_46_smooth_muscle', 'anat_56_epithelial_tissue'],
    overview: 'Fibromuscular terminal urinary tube conveying urine from the bladder neck to the external urethral orifice, guarded by internal smooth and external skeletal sphincters.',
    definition: 'The final tubular passage of the urinary tract extending from the internal urethral orifice of the bladder to the exterior meatus.',
    anatomicalLocation: 'Inferior to the urinary bladder, piercing the urogenital diaphragm/pelvic floor; ~4 cm long in females (anterior to vaginal wall) and ~18–20 cm long in males (prostatic, membranous, and spongy/penile segments).',
    structure: 'Mucosa transitions from urothelium proximally to pseudostratified columnar and non-keratinized stratified squamous epithelium distally, surrounded by smooth muscle and the voluntary skeletal External Urethral Sphincter at the deep perineal pouch.',
    components: [
      { name: 'Internal Urethral Sphincter (Smooth)', role: 'Involuntary sympathetic α₁-adrenergic collar at bladder neck preventing urine leakage.' },
      { name: 'External Urethral Sphincter (Skeletal)', role: 'Voluntary striated muscle controlled by pudendal nerve (S2–S4) permitting conscious hold/release of voiding.' },
      { name: 'Sex-Specific Length Difference', role: 'Short female urethra (~4 cm) vs 3-part male urethra (~20 cm: prostatic, membranous, spongy) serving both urinary and seminal transport.' }
    ],
    functions: [
      'Terminal conduit discharging stored bladder urine outside the body',
      'Provides voluntary sphincter control over urinary continence',
      'Serves combined urinary and reproductive passage in males'
    ],
    physiology: 'Relaxation of both internal smooth and external skeletal sphincters accompanies detrusor contraction to establish laminar urine flow out of the meatus.',
    clinicalSignificance: [
      'The short (~4 cm) female urethra near the perineum accounts for a much higher incidence of ascending bacterial cystitis/UTI in women.',
      'Prostatic enlargement narrows the male prostatic urethra, causing hesitancy, weak stream, and incomplete emptying.'
    ],
    pharmaceuticalRelevance: [
      'α₁-Adrenergic antagonists (tamsulosin, alfuzosin) relax prostatic and internal urethral smooth muscle tone to restore urinary flow.',
      'Topical lidocaine urethral jelly lubricates and anesthetizes mucosa prior to catheterization; phenazopyridine provides local urinary tract analgesia.'
    ],
    examEssentials: [
      'Female urethra ~4 cm; Male urethra ~18–20 cm (prostatic, membranous, spongy).',
      'External urethral sphincter = voluntary skeletal muscle (pudendal nerve S2–S4).'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['urethra', 'urethral sphincter', 'uti', 'prostatic urethra', 'tamsulosin', 'voiding']
  },
  {
    id: 'anat_17_trachea',
    catalogNumber: 17,
    name: 'Trachea',
    scientificName: 'Trachea',
    alternateNames: ['Windpipe', 'Tracheal Mucociliary Tube'],
    primaryCategory: 'respiratory',
    categories: ['respiratory'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_respiratory_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_19_larynx', 'anat_18_bronchi', 'anat_04_lungs', 'anat_48_cartilage'],
    overview: 'Rigid yet flexible ~10–12 cm cartilaginous airway supported by 16–20 C-shaped hyaline cartilage rings conducting air from the larynx to the carina.',
    definition: 'The median cylindrical conducting airway extending from the lower cricoid cartilage of the larynx (C6) to its bifurcation into primary bronchi at the carina (T4–T5).',
    anatomicalLocation: 'Anterior to the esophagus in the inferior neck and superior mediastinum, palpable below the cricoid cartilage.',
    structure: 'Reinforced by 16–20 incomplete C-shaped hyaline cartilage rings linked posteriorly by the smooth trachealis muscle (allowing esophageal expansion during swallowing). Lined internally by pseudostratified ciliated columnar epithelium with mucus-producing goblet cells.',
    components: [
      { name: 'C-Shaped Hyaline Cartilage Rings', role: 'Maintain permanent airway patency during inspiratory negative pressure.' },
      { name: 'Trachealis Muscle', role: 'Posterior smooth muscle band narrowing lumen to increase cough velocity and yielding during esophageal bolus passage.' },
      { name: 'Mucociliary Escalator', role: 'Pseudostratified ciliated columnar cells + goblet cells trap inhaled particulates and sweep mucus upward to the pharynx.' }
    ],
    functions: [
      'Low-resistance conduit delivering warmed, humidified, and filtered air to the bronchi',
      'Clears inhaled dust, microbes, and debris via coordinated upward ciliary beating',
      'Carinal bifurcation triggers vigorous cough reflexes upon irritation'
    ],
    physiology: 'Dead space conducting zone (~150 mL combined anatomical dead space) conditions inspired air to 37 °C and 100% relative humidity before reaching respiratory alveoli.',
    clinicalSignificance: [
      'Tracheostomy is placed below the cricoid cartilage (typically 2nd–4th tracheal rings) during prolonged mechanical ventilation or upper airway obstruction.',
      'Smoking paralyzes tracheal cilia, forcing reliance on chronic smoker’s cough to clear mucus.'
    ],
    pharmaceuticalRelevance: [
      'Aerosol particle aerodynamic size (>5–10 μm impacts trachea/pharynx; 1–5 μm reaches bronchioles/alveoli) governs inhaler efficiency.',
      'Mucolytics (N-acetylcysteine, ambroxol) and antitussives (dextromethorphan, codeine) modulate tracheal mucus viscosity and cough reflexes.'
    ],
    examEssentials: [
      '16–20 C-shaped hyaline cartilage rings; open posteriorly against esophagus (trachealis muscle).',
      'Lined by Pseudostratified Ciliated Columnar Epithelium (respiratory epithelium); bifurcates at Carina (T4–T5).'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['trachea', 'windpipe', 'carina', 'hyaline cartilage', 'mucociliary escalator', 'trachealis']
  },
  {
    id: 'anat_18_bronchi',
    catalogNumber: 18,
    name: 'Bronchi',
    scientificName: 'Bronchi',
    alternateNames: ['Bronchial Tree', 'Mainstem & Segmental Bronchi'],
    primaryCategory: 'respiratory',
    categories: ['respiratory'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_respiratory_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_17_trachea', 'anat_04_lungs', 'anat_46_smooth_muscle', 'anat_48_cartilage'],
    overview: 'Branching intrapulmonary airways (primary, lobar, and segmental bronchi) lined by smooth muscle and cartilage plates regulating airflow distribution into pulmonary lobes.',
    definition: 'The hierarchical arborization of conducting airways branching from the tracheal carina into the right and left lungs until transitioning into cartilage-free bronchioles.',
    anatomicalLocation: 'Enter the right and left pulmonary hila at T5 and ramify throughout all lobes and bronchopulmonary segments of both lungs.',
    structure: 'Right main bronchus is wider, shorter (~2.5 cm), and more vertical than the left main bronchus (~5 cm, passing beneath aortic arch). Progressively cartilage rings shift to irregular plates while spiraling smooth muscle encircles the lumen beneath ciliated mucosa.',
    components: [
      { name: 'Right & Left Main (Primary) Bronchi', role: 'Feed each lung; right main bronchus’s steeper vertical angle predisposes to aspirated foreign bodies entering the right lung.' },
      { name: 'Lobar & Segmental Bronchi', role: 'Right divides into 3 lobar / 10 segmental; left divides into 2 lobar / 8–10 segmental airways.' },
      { name: 'Bronchial Smooth Muscle', role: 'Controls airway diameter—dilated by sympathetic β₂-agonists and constricted by parasympathetic M₃ and leukotrienes/histamine.' }
    ],
    functions: [
      'Distributes inspired air evenly across pulmonary lobes and bronchopulmonary segments',
      'Regulates airway resistance through autonomic bronchodilation and bronchoconstriction',
      'Maintains mucociliary clearance and local mucosal IgA immunity'
    ],
    physiology: 'By Poiseuille’s law (R ∝ 1/r⁴), even modest bronchial smooth muscle constriction sharply elevates airway resistance and work of breathing.',
    clinicalSignificance: [
      'Asthma and COPD involve chronic bronchial inflammation, goblet cell mucus hypersecretion, and reversible/partially reversible bronchospasm.',
      'Aspirated tablets or food particles lodge preferentially in the wider, straighter right main bronchus.'
    ],
    pharmaceuticalRelevance: [
      'Primary pharmacological site of action for inhaled β₂-agonists (salbutamol, formoterol), muscarinic M₃ antagonists (ipratropium, tiotropium), and inhaled corticosteroids (budesonide, fluticasone).',
      'Non-selective β-blockers (propranolol) precipitate severe bronchospasm in asthmatic patients by blocking bronchial β₂ relaxation.'
    ],
    examEssentials: [
      'Right main bronchus is WIDER, SHORTER, and MORE VERTICAL → common site of aspirated foreign bodies.',
      'Bronchi contain cartilage plates; Bronchioles (<1 mm) lack cartilage completely and have proportionally thicker smooth muscle.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson', 'tb_guyton'],
    searchKeywords: ['bronchi', 'bronchial tree', 'bronchodilation', 'bronchospasm', 'asthma', 'salbutamol', 'ipratropium']
  },
  {
    id: 'anat_19_larynx',
    catalogNumber: 19,
    name: 'Larynx',
    scientificName: 'Larynx',
    alternateNames: ['Voice Box', 'Glottis & Epiglottis'],
    primaryCategory: 'respiratory',
    categories: ['respiratory'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_respiratory_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_20_pharynx', 'anat_17_trachea', 'anat_48_cartilage', 'anat_35_thyroid_gland'],
    overview: 'Cartilaginous voice box connecting the pharynx to the trachea that safeguards the lower airway during swallowing and vibrates vocal folds for phonation.',
    definition: 'A specialized musculo-cartilaginous airway organ positioned between the laryngopharynx and trachea housing the epiglottis and true vocal cords.',
    anatomicalLocation: 'Anterior midline of the neck spanning C3–C6 vertebrae, suspended below the hyoid bone and flanked laterally by the thyroid gland lobes.',
    structure: 'Nine cartilages: 3 unpaired (Thyroid cartilage/"Adam’s apple", leaf-shaped elastic Epiglottis, signet-ring Cricoid cartilage—only complete cartilage ring in the airway) and 3 paired (Arytenoid, Corniculate, Cuneiform), interconnected by ligaments and intrinsic striated muscles.',
    components: [
      { name: 'Epiglottis (Elastic Cartilage)', role: 'Folds posteriorly over the laryngeal inlet during swallowing to divert food/fluid into the esophagus.' },
      { name: 'Vocal Folds (True Vocal Cords)', role: 'Stratified squamous–covered elastic bands stretched between thyroid and arytenoid cartilages generating voice frequency and pitch.' },
      { name: 'Thyroid & Cricoid Cartilages', role: 'Shield and maintain an uncollapsible patent upper tracheal inlet.' }
    ],
    functions: [
      'Prevents aspiration of food, liquids, and saliva into the trachea during deglutition',
      'Produces speech phonation and pitch modulation via vocal fold tension and length',
      'Generates elevated intrathoracic pressure (Valsalva) and forceful coughing bursts'
    ],
    physiology: 'Expired air vibrating adducted vocal folds produces fundamental voice pitch (modulated by tension via cricothyroid and thyroarytenoid muscles) before resonance in the pharynx, oral cavity, and nasal sinuses.',
    clinicalSignificance: [
      'Acute laryngeal edema during anaphylaxis or croup rapidly narrows the glottis, producing stridor and life-threatening airway obstruction.',
      'Vagus recurrent laryngeal nerve injury causes hoarseness or vocal cord paralysis.'
    ],
    pharmaceuticalRelevance: [
      'Inhaled corticosteroids (budesonide, fluticasone) deposit on laryngeal mucosa, causing dysphonia (hoarseness) and oral/laryngeal candidiasis unless patients rinse and gargle water after dosing.',
      'Intramuscular epinephrine rapidly reverses histamine-mediated laryngeal angioedema in anaphylaxis.'
    ],
    examEssentials: [
      'Cricoid cartilage is the ONLY complete circumferential hyaline ring around the airway; Epiglottis = Elastic cartilage (prevents aspiration).',
      'True vocal cords are lined by stratified squamous epithelium to withstand vibratory friction.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['larynx', 'voice box', 'epiglottis', 'vocal cords', 'thyroid cartilage', 'cricoid', 'stridor']
  },
  {
    id: 'anat_20_pharynx',
    catalogNumber: 20,
    name: 'Pharynx',
    scientificName: 'Pharynx',
    alternateNames: ['Throat', 'Nasopharynx, Oropharynx & Laryngopharynx'],
    primaryCategory: 'respiratory',
    categories: ['respiratory', 'digestive'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_respiratory_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_27_nasal_cavity', 'anat_19_larynx', 'anat_25_esophagus', 'anat_41_tonsils'],
    overview: 'Funnel-shaped ~13 cm fibromuscular shared crossroads of the respiratory and digestive tracts linking nasal/oral cavities to the larynx and esophagus.',
    definition: 'A muscular tube lined by stratified and ciliated epithelia extending from the skull base to the C6 inferior cricoid border.',
    anatomicalLocation: 'Posterior to the nasal cavity, oral cavity, and larynx, and immediately anterior to the cervical vertebral bodies.',
    structure: 'Three continuous divisions: Nasopharynx (posterior to nasal cavity; ciliated respiratory epithelium; houses pharyngeal tonsil/adenoids and Eustachian tube openings), Oropharynx (posterior to mouth; stratified squamous; palatine and lingual tonsils), and Laryngopharynx (conducts food to esophagus and air to larynx). Surrounded by superior, middle, and inferior pharyngeal constrictor skeletal muscles.',
    components: [
      { name: 'Nasopharynx', role: 'Purely respiratory zone equalizing middle ear pressure via auditory (Eustachian) tubes.' },
      { name: 'Oropharynx', role: 'Shared bolus and air corridor walled by Waldeyer’s tonsillar lymphoid ring.' },
      { name: 'Laryngopharynx (Hypopharynx)', role: 'Funnel directing solids/liquids posteriorly toward esophagus and air anteriorly into larynx.' }
    ],
    functions: [
      'Shared airway and food-bolus conduit coordinated by the pharyngeal swallowing reflex',
      'Vocal resonance chamber shaping vowel/consonant acoustics',
      'Middle ear pressure equalization via nasopharyngeal Eustachian ostia',
      'First-line mucosal antigen sampling via Waldeyer’s lymphoid ring'
    ],
    physiology: 'During the involuntary pharyngeal phase of swallowing, the soft palate elevates to seal the nasopharynx, respiration pauses briefly (~1 s), and sequential constrictor contraction drives the bolus over the closed epiglottis into the esophagus.',
    clinicalSignificance: [
      'Streptococcal pharyngitis, viral sore throat, and obstructive sleep apnea commonly involve oropharyngeal mucosa and soft tissue collapse.',
      'Dysphagia or neurological stroke impairs pharyngeal coordination, risking silent aspiration pneumonia.'
    ],
    pharmaceuticalRelevance: [
      'Throat lozenges, antiseptic gargles (povidone-iodine, chlorhexidine), and benzydamine/lidocaine sprays act directly on inflamed oropharyngeal mucosa.',
      'Spacer devices on Metered Dose Inhalers (MDIs) dramatically reduce unwanted drug impaction on the posterior pharynx.'
    ],
    examEssentials: [
      'Nasopharynx = respiratory only (pseudostratified ciliated columnar + Eustachian opening); Oropharynx & Laryngopharynx = shared respiratory/digestive (stratified squamous).',
      'Pharyngeal phase of deglutition is involuntary and mediated by CN IX & X.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['pharynx', 'throat', 'nasopharynx', 'oropharynx', 'laryngopharynx', 'deglutition', 'eustachian']
  },
  {
    id: 'anat_21_tongue',
    catalogNumber: 21,
    name: 'Tongue',
    scientificName: 'Lingua',
    alternateNames: ['Lingual Organ', 'Sublingual Mucosa'],
    primaryCategory: 'digestive',
    categories: ['digestive', 'sensory'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_digestive_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_22_teeth', 'anat_23_gums', 'anat_24_salivary_glands', 'anat_20_pharynx'],
    overview: 'Mobile skeletal-muscle floor-of-mouth organ essential for mastication, bolus propulsion, speech articulation, gustatory taste sensation, and rapid sublingual drug absorption.',
    definition: 'A highly vascularized muscular accessory digestive and special-sense organ covered by specialized stratified squamous mucosa bearing lingual papillae and taste buds.',
    anatomicalLocation: 'Floor of the oral cavity anchored posteriorly to the hyoid bone and mandible and attached inferiorly by the lingual frenulum.',
    structure: 'Intrinsic skeletal muscle fibers (longitudinal, transverse, vertical) alter tongue shape while extrinsic muscles (genioglossus, hyoglossus, styloglossus, palatoglossus) move its position. Dorsal surface carries filiform (tactile, no taste buds), fungiform, foliate, and V-shaped circumvallate papillae; thin, richly vascularized ventral mucosa lines the sublingual floor.',
    components: [
      { name: 'Lingual Papillae & Taste Buds', role: 'Microvillous gustatory receptor cells detecting sweet, salty, sour, bitter, and umami tastants.' },
      { name: 'Intrinsic & Extrinsic Muscles', role: 'Coordinate food positioning between molars, bolus formation, and crisp consonant speech.' },
      { name: 'Sublingual Vascular Bed', role: 'Thin non-keratinized epithelium overlying deep lingual veins draining straight into the internal jugular/SVC.' }
    ],
    functions: [
      'Positions food for chewing and initiates voluntary oral phase of swallowing',
      'Transduces five primary taste modalities via CN VII (anterior 2/3) and CN IX (posterior 1/3)',
      'Shapes phonetic speech articulation',
      'Enables rapid sublingual systemic absorption bypassing hepatic first-pass metabolism'
    ],
    physiology: 'Tastants dissolved in saliva depolarize taste receptor cells; anterior 2/3 taste runs via chorda tympani (CN VII), posterior 1/3 via glossopharyngeal (CN IX), general sensation via trigeminal lingual nerve (CN V₃), and motor control via hypoglossal (CN XII).',
    clinicalSignificance: [
      'Glossitis (smooth, red, sore tongue) accompanies Vitamin B₁₂, folate, or iron deficiency anemia; oral candidiasis (thrush) leaves scrapable white plaques.',
      'Cyanosis, dehydration, or unilateral CN XII deviation ("licks the lesion") provide rapid bedside diagnostic signs.'
    ],
    pharmaceuticalRelevance: [
      'Sublingual tablets/sprays (nitroglycerin, buprenorphine, zolmitriptan) dissolve beneath the tongue for rapid 1–3 minute onset and complete bypass of gastric acid and hepatic first-pass metabolism.',
      'Sublingual immunotherapy (SLIT) and pediatric palatable masking rely on lingual taste receptor profiles.'
    ],
    examEssentials: [
      'Motor nerve to tongue = Hypoglossal (CN XII) [except palatoglossus = CN X]; Taste anterior 2/3 = CN VII; posterior 1/3 = CN IX.',
      'Sublingual route drains directly into systemic venous return (bypasses liver first-pass extraction).'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['tongue', 'lingua', 'taste buds', 'papillae', 'sublingual', 'nitroglycerin', 'hypoglossal']
  },
  {
    id: 'anat_22_teeth',
    catalogNumber: 22,
    name: 'Teeth',
    scientificName: 'Dentes',
    alternateNames: ['Dentition', 'Incisors, Canines, Premolars & Molars'],
    primaryCategory: 'digestive',
    categories: ['digestive'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_digestive_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_23_gums', 'anat_21_tongue', 'anat_24_salivary_glands', 'anat_49_bone_tissue'],
    overview: 'Hard mineralized masticatory organs anchored in maxillary and mandibular alveoli that cut, tear, and grind food mechanically before swallowing.',
    definition: 'Specialized calcified ectomesenchymal structures arranged in upper and lower dental arches (20 deciduous primary teeth; 32 permanent adult teeth).',
    anatomicalLocation: 'Anchored in the alveolar sockets (gomphoses) of the maxilla and mandible by the fibrous periodontal ligament.',
    structure: 'Three gross regions—Crown, Neck, and Root—composed of four tissues: acellular Enamel (~96% hydroxyapatite, hardest biological substance in the body), calcified Dentin forming the bulk around the neurovascular Pulp cavity, and bone-like Cementum covering the root.',
    components: [
      { name: 'Enamel', role: 'Acellular crystalline calcium hydroxyapatite sheath protecting the crown from masticatory wear and acids.' },
      { name: 'Dentin & Pulp Cavity', role: 'Living tubular calcified matrix enclosing sensory trigeminal nerves, arterioles, and odontoblasts.' },
      { name: 'Cementum & Periodontal Ligament', role: 'Anchors root fibers securely into alveolar jawbone while absorbing biting shock.' }
    ],
    functions: [
      'Mechanical mastication (incisors cut, canines tear, premolars and molars crush/grind food)',
      'Increases food surface area to accelerate salivary amylase and gastric enzyme digestion',
      'Supports facial vertical dimension and clear labiodental speech phonation'
    ],
    physiology: 'Deciduous dentition (20 teeth) erupts ~6–24 months; adult permanent dental formula per quadrant is I 2/2, C 1/1, PM 2/2, M 3/3 = 32 teeth total.',
    clinicalSignificance: [
      'Streptococcus mutans fermenting dietary sucrose produces lactic acid that demineralizes enamel into dental caries (pH < 5.5).',
      'Pulpitis triggers intense throbbing trigeminal pain; loss of periodontal attachment leads to tooth mobility.'
    ],
    pharmaceuticalRelevance: [
      'Tetracyclines chelate calcium in developing tooth buds and cause permanent yellow-brown enamel discoloration (contraindicated in pregnancy and children <8 years).',
      'Fluoride toothpaste converts hydroxyapatite into acid-resistant fluorapatite; pediatric liquid syrups require sugar-free formulations or post-dose rinsing to prevent caries.'
    ],
    examEssentials: [
      'Human permanent dental formula: 2-1-2-3 per quadrant (32 teeth total); Deciduous = 20 teeth (no premolars).',
      'Enamel = hardest human tissue (96% hydroxyapatite); Tetracyclines stain developing teeth.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['teeth', 'dentes', 'enamel', 'dentin', 'fluoride', 'tetracycline', 'dental formula', 'mastication']
  },
  {
    id: 'anat_23_gums',
    catalogNumber: 23,
    name: 'Gums',
    scientificName: 'Gingivae',
    alternateNames: ['Gingival Mucosa', 'Periodontal Soft Tissue'],
    primaryCategory: 'digestive',
    categories: ['digestive'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_digestive_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_22_teeth', 'anat_21_tongue', 'anat_56_epithelial_tissue'],
    overview: 'Dense keratinized mucosal collars enveloping the alveolar jawbone and sealing tightly around tooth necks to block oral bacterial entry into the periodontal space.',
    definition: 'The fibrous vascular masticatory mucosa covering the maxillary and mandibular alveolar ridges and encircling the cervical necks of teeth.',
    anatomicalLocation: 'Surrounding the cervical necks of all erupted teeth and adherent to the alveolar bone periosteum inside the oral cavity.',
    structure: 'Comprises Free (marginal) gingiva forming a 1–3 mm gingival sulcus, Attached gingiva (firmly bound, stippled, keratinized stratified squamous epithelium over dense collagenous lamina propria), and triangular Interdental papillae filling spaces between adjacent teeth.',
    components: [
      { name: 'Junctional & Sulcular Epithelium', role: 'Forms a biological attachment seal against the tooth crown and secretes antimicrobial gingival crevicular fluid.' },
      { name: 'Attached Gingiva', role: 'Firm, coral-pink keratinized tissue resisting mechanical friction from chewing and brushing.' },
      { name: 'Lamina Propria Microvasculature', role: 'Supplies immune leukocytes and nutritional perfusion to the superficial oral barrier.' }
    ],
    functions: [
      'Forms a protective epithelial seal preventing oral flora invasion into alveolar bone and periodontal ligaments',
      'Withstands mechanical shearing forces during mastication',
      'Produces gingival crevicular fluid containing complement and neutrophils'
    ],
    physiology: 'Healthy gingiva exhibits minimal sulcus depth (≤3 mm), stippled pink texture, and absent bleeding on probing; continuous epithelial turnover maintains the periodontal seal.',
    clinicalSignificance: [
      'Subgingival dental plaque biofilm triggers gingivitis (erythema, edema, bleeding), which if untreated progresses to destructive periodontitis and alveolar bone loss.',
      'Gingival bleeding is an early clinical sign of scurvy (Vitamin C deficiency impairing collagen) or thrombocytopenia.'
    ],
    pharmaceuticalRelevance: [
      'Drug-induced gingival hyperplasia (overgrowth) is a classic adverse effect of phenytoin, nifedipine/amlodipine, and cyclosporine.',
      'Chlorhexidine mouthwashes, metronidazole/minocycline periodontal gels, and benzocaine topical gels manage gingival infection and localized pain.'
    ],
    examEssentials: [
      'Three major drugs causing gingival hyperplasia: Phenytoin, Calcium Channel Blockers (nifedipine), and Cyclosporine.',
      'Attached gingiva is keratinized stratified squamous epithelium bound tightly to alveolar periosteum.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['gums', 'gingiva', 'gingivitis', 'periodontitis', 'gingival hyperplasia', 'phenytoin', 'cyclosporine']
  },
  {
    id: 'anat_24_salivary_glands',
    catalogNumber: 24,
    name: 'Salivary glands',
    scientificName: 'Glandulae salivariae',
    alternateNames: ['Exocrine Oral Glands (Parotid, Submandibular & Sublingual)'],
    primaryCategory: 'digestive',
    categories: ['digestive'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_digestive_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_30_parotid_glands', 'anat_21_tongue', 'anat_22_teeth', 'anat_20_pharynx'],
    overview: 'Paired exocrine glands (parotid, submandibular, sublingual plus minor oral glands) producing ~1.0–1.5 L/day of enzyme-rich, buffering saliva for digestion and oral defense.',
    definition: 'Compound tubuloacinar exocrine glands discharging serous and mucous saliva through ducts into the oral cavity.',
    anatomicalLocation: 'Distributed around the oral cavity: Parotid (pre-auricular/cheek, #30), Submandibular (floor beneath mandibular body, ~65–70% of resting saliva via Wharton’s duct), and Sublingual (submucosa of floor of mouth via Rivinus ducts).',
    structure: 'Organized into lobules containing secretory serous acini (watery enzyme-rich fluid), mucous acini (viscous mucin), and mixed seromucous demilunes surrounded by contractile myoepithelial cells draining into intercalated, striated (ion-modifying), and excretory ducts.',
    components: [
      { name: 'Parotid Glands (Purely Serous)', role: 'Largest glands; rich in α-amylase (ptyalin), contributing ~25% of total daily saliva (detailed in Catalog #30).' },
      { name: 'Submandibular Glands (Mixed Seromucous)', role: 'Produce ~65–70% of unstimulated saliva via Wharton’s duct lateral to lingual frenulum.' },
      { name: 'Sublingual Glands (Predominantly Mucous)', role: 'Smallest major pair (~5% of saliva) providing lubricating mucins across floor of mouth.' }
    ],
    functions: [
      'Lubricates oral mucosa, solubilizes taste chemicals, and binds chewed food into a swallowable bolus',
      'Initiates starch hydrolysis via salivary α-amylase (ptyalin, optimal pH 6.8) and minor lipid digestion via lingual lipase',
      'Buffers dietary and bacterial acids via HCO₃⁻/phosphate systems (salivary pH 6.3–7.4)',
      'Provides antimicrobial defense through lysozyme, lactoferrin, and secretory IgA'
    ],
    physiology: 'Both parasympathetic (muscarinic M₃—abundant watery saliva) and sympathetic (viscous protein-rich saliva) innervation stimulate secretion; parasympathetic salivatory nuclei dominate daily volume (~1–1.5 L/day).',
    clinicalSignificance: [
      'Xerostomia (dry mouth) increases dental caries, oral candidiasis, and dysphagia (e.g., Sjögren’s syndrome, head/neck radiation).',
      'Submandibular Wharton’s duct is the most common site for obstructive salivary calculi (sialolithiasis).'
    ],
    pharmaceuticalRelevance: [
      'Anticholinergic drugs (atropine, tricyclic antidepressants, first-generation antihistamines, oxybutynin) block M₃ salivary receptors causing xerostomia; pilocarpine/cevimeline restore salivation.',
      'Saliva is required to dissolve sublingual, buccal, and orally disintegrating tablets (ODTs).'
    ],
    examEssentials: [
      'Daily saliva output ≈ 1.0–1.5 L/day (pH ~6.8); Submandibular gland supplies ~70% of resting volume.',
      'Salivary α-amylase (ptyalin) cleaves starch → maltose; Parasympathetic M₃ stimulation produces profuse watery saliva.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['salivary glands', 'saliva', 'amylase', 'ptyalin', 'submandibular', 'sublingual', 'xerostomia', 'pilocarpine']
  },
  {
    id: 'anat_25_esophagus',
    catalogNumber: 25,
    name: 'Esophagus',
    scientificName: 'Oesophagus',
    alternateNames: ['Food Pipe', 'Gullet'],
    primaryCategory: 'digestive',
    categories: ['digestive'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_digestive_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_20_pharynx', 'anat_06_stomach', 'anat_59_diaphragm', 'anat_46_smooth_muscle'],
    overview: 'Collapsible ~25 cm fibromuscular tube lined by stratified squamous epithelium that propels swallowed boluses via peristalsis from pharynx to stomach while preventing acid reflux.',
    definition: 'The tubular segment of the alimentary canal extending from the laryngopharynx (C6) through the posterior mediastinum and diaphragm (T10) into the gastric cardia.',
    anatomicalLocation: 'Posterior to the trachea in the neck and thorax, descending through the posterior mediastinum and piercing the right crus of the diaphragm at the T10 esophageal hiatus.',
    structure: 'Lined by tough non-keratinized stratified squamous epithelium with submucosal lubricating mucus glands; lacks a serosa (covered instead by fibrous adventitia). Muscularis externa shifts progressively from skeletal muscle (upper third) → mixed (middle third) → smooth muscle (lower third), guarded by Upper and Lower Esophageal Sphincters.',
    components: [
      { name: 'Upper Esophageal Sphincter (Cricopharyngeus)', role: 'Striated muscle cuff preventing air entry during breathing and regurgitation into pharynx.' },
      { name: 'Peristaltic Muscularis Body', role: 'Primary and secondary peristaltic waves clear food boluses and refluxed gastric acid downward.' },
      { name: 'Lower Esophageal Sphincter (LES)', role: 'Physiological smooth muscle tone barrier preventing gastroesophageal acid reflux.' }
    ],
    functions: [
      'Rapid (~5–8 s) gravity-assisted peristaltic transport of food and tablets from pharynx to stomach',
      'Prevents regurgitation of corrosive gastric HCl and pepsin via LES closure',
      'Secretes lubricating mucus reducing epithelial abrasion'
    ],
    physiology: 'Primary peristalsis is triggered by swallowing; vagal nitric oxide/VIP relaxes the LES ahead of the arriving bolus so chyme enters the stomach smoothly.',
    clinicalSignificance: [
      'LES incompetence causes Gastroesophageal Reflux Disease (GERD), heartburn, esophagitis, and Barrett’s metaplasia.',
      'Portal hypertension dilates distal submucosal esophageal veins into bleeding esophageal varices.'
    ],
    pharmaceuticalRelevance: [
      'Oral tablets lodged in the esophagus (doxycycline, alendronate, NSAIDs, KCl) cause corrosive pill esophagitis—counsel patients to take with a full glass of water and remain upright ≥30 minutes.',
      'Smooth muscle relaxants (nitrates, CCBs, theophylline) lower LES pressure and worsen GERD.'
    ],
    examEssentials: [
      'Length ~25 cm; passes through diaphragmatic hiatus at T10; lined by Non-Keratinized Stratified Squamous epithelium.',
      'Muscle transition: Upper 1/3 skeletal → Middle 1/3 mixed → Lower 1/3 smooth; lacks outer serosa (has adventitia).'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['esophagus', 'oesophagus', 'les', 'gerd', 'peristalsis', 'pill esophagitis', 'hiatus']
  },
  {
    id: 'anat_26_nose',
    catalogNumber: 26,
    name: 'Nose',
    scientificName: 'Nasus externus',
    alternateNames: ['External Nose', 'Nasal Pyramid & Nostrils'],
    primaryCategory: 'respiratory',
    categories: ['respiratory', 'sensory'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_respiratory_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_27_nasal_cavity', 'anat_48_cartilage', 'anat_44_skin', 'anat_20_pharynx'],
    overview: 'Pyramidal osteocartilaginous facial portal framing the external nares (nostrils) that intakes, funnels, and pre-filters inspired air into the nasal cavity.',
    definition: 'The external osteocartilaginous respiratory structure protruding centrally on the face, opening inferiorly at the paired anterior nares (nostrils) into the nasal vestibules.',
    anatomicalLocation: 'Central mid-face between the orbits above and the upper lip below.',
    structure: 'Supported superiorly by paired nasal bones and frontal processes of the maxilla, and inferiorly by flexible hyaline cartilage plates (septal, lateral, and major/minor alar cartilages) covered externally by sebaceous-rich skin and internally at the vestibule by hair-bearing (vibrissae) skin.',
    components: [
      { name: 'Nasal Bones & Bridge', role: 'Rigid bony upper root protecting the anterior cranial/nasal entry.' },
      { name: 'Alar & Septal Hyaline Cartilages', role: 'Flexible cartilaginous frame keeping nostrils open during forceful inspiration.' },
      { name: 'Anterior Nares (Nostrils) & Vibrissae', role: 'Coarse guard hairs inside the nasal vestibule trap large airborne dust particles and insects.' }
    ],
    functions: [
      'Primary facial portal funneling inspired air smoothly toward nasal conchae',
      'Coarse mechanical particulate filtration via vestibule vibrissae',
      'Provides facial skeletal contour and vocal resonance support'
    ],
    physiology: 'Alar dilator muscles flare the nostrils to decrease external nasal valve resistance during exercise or respiratory distress.',
    clinicalSignificance: [
      'Nasal bone trauma is the most common facial fracture; septal hematoma requires prompt drainage to prevent cartilage necrosis ("saddle nose").',
      'Staphylococcus aureus frequently colonizes the anterior nasal vestibule (managed pre-operatively with topical mupirocin).'
    ],
    pharmaceuticalRelevance: [
      'Correct nasal spray nozzle orientation (aiming slightly laterally away from the nasal septum toward the outer eye corner) prevents septal irritation and epistaxis.',
      'Topical mupirocin nasal ointment eradicates MRSA carriage in the anterior nares.'
    ],
    examEssentials: [
      'Upper bridge = Nasal bones; Lower flexible apex/alae = Hyaline cartilage.',
      'Nasal vestibule is lined by keratinized stratified squamous skin with coarse hairs (vibrissae) prior to entering the Nasal Cavity (#27).'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['nose', 'nasus', 'nostrils', 'nares', 'vibrissae', 'alar cartilage', 'mupirocin']
  },
  {
    id: 'anat_27_nasal_cavity',
    catalogNumber: 27,
    name: 'Nasal cavity',
    scientificName: 'Cavitas nasi',
    alternateNames: ['Internal Nasal Chambers', 'Conchae & Olfactory Mucosa'],
    primaryCategory: 'respiratory',
    categories: ['respiratory', 'sensory'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_respiratory_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_26_nose', 'anat_20_pharynx', 'anat_19_larynx', 'anat_56_epithelial_tissue'],
    overview: 'Dual vascularized internal chambers divided by the nasal septum and sculpted by three turbinates (conchae) to warm, humidify, clean air, detect odors, and absorb nasal drugs.',
    definition: 'The large air-conditioning and olfactory space extending from the nasal vestibule anteriorly to the posterior choanae opening into the nasopharynx.',
    anatomicalLocation: 'Mid-skull between the anterior cranial fossa/cribriform plate superiorly and the hard palate inferiorly, flanked by paranasal sinuses and orbits.',
    structure: 'Midline nasal septum (perpendicular ethmoid plate, vomer, septal cartilage) splits the cavity into two chambers. Lateral walls project Superior, Middle, and Inferior Nasal Conchae (turbinates) creating underlying meatuses where paranasal sinuses and the nasolacrimal duct drain. Roof houses specialized olfactory epithelium; lower respiratory region carries richly vascularized ciliated mucosa.',
    components: [
      { name: 'Nasal Conchae & Meatuses', role: 'Scroll-like shelves inducing turbulent airflow to maximize mucosal contact for warming, humidifying, and particle trapping.' },
      { name: 'Olfactory Mucosa (Roof)', role: 'Bipolar olfactory receptor neurons projecting axons through the ethmoid cribriform plate as CN I.' },
      { name: 'Kiesselbach’s Plexus', role: 'Rich arterial anastomosis on the anteroinferior septum responsible for >90% of nosebleeds (epistaxis).' }
    ],
    functions: [
      'Warms inspired air toward body temperature and saturates it with water vapor',
      'Traps microbes/particulates in mucociliary blanket swept backward to pharynx',
      'Transduces volatile odorants via CN I olfactory neuroepithelium',
      'Drains paranasal sinuses and tears (via nasolacrimal duct under inferior concha)'
    ],
    physiology: 'Submucosal venous cavernous sinusoids swell under parasympathetic dilation and shrink under sympathetic α-adrenergic vasoconstriction, regulating nasal airflow resistance ("nasal cycle").',
    clinicalSignificance: [
      'IgE-mediated mast cell degranulation swells turbinate mucosa causing allergic rhinitis, rhinorrhea, and nasal congestion.',
      'Epistaxis arises most frequently from Kiesselbach’s area (Little’s area) on the anterior nasal septum.'
    ],
    pharmaceuticalRelevance: [
      'Topical nasal sprays deliver decongestants (oxymetazoline α-agonist—limit ≤3–5 days to prevent rhinitis medicamentosa) and intranasal corticosteroids (fluticasone, mometasone).',
      'Vascular respiratory mucosa permits rapid needle-free systemic peptide/CNS delivery (intranasal calcitonin, desmopressin, sumatriptan, naloxone) bypassing hepatic first-pass metabolism.'
    ],
    examEssentials: [
      'Three conchae (Superior, Middle, Inferior) create turbulence; Nasolacrimal duct opens into the INFERIOR meatus.',
      'Roof contains Olfactory epithelium (CN I); >90% of epistaxis occurs at Kiesselbach’s plexus.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['nasal cavity', 'conchae', 'turbinates', 'olfactory', 'kiesselbach', 'oxymetazoline', 'intranasal']
  },
  {
    id: 'anat_28_eyes',
    catalogNumber: 28,
    name: 'Eyes',
    scientificName: 'Oculi',
    alternateNames: ['Ocular Globes', 'Visual Apparatus'],
    primaryCategory: 'sensory',
    categories: ['sensory'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_sensory_organs',
    subtopicIds: ['subtopic_eye_ear_senses'],
    relatedStructureIds: ['anat_57_cornea', 'anat_58_retina', 'anat_01_brain', 'anat_45_skeletal_muscle'],
    overview: 'Paired ~24 mm spheroidal photoreceptor organs housed in bony orbits that refract light, regulate pupil diameter and aqueous pressure, and project binocular visual signals to the brain.',
    definition: 'Complex three-layered sensory globes responsible for image focusing, phototransduction, and ocular hydrodynamics.',
    anatomicalLocation: 'Suspended within the protective bony orbital cavities of the skull cushioned by retro-orbital fat and moved by six extraocular skeletal muscles.',
    structure: 'Three concentric tunics: outer fibrous Sclera and transparent Cornea (#57); middle vascular Uvea (choroid, ciliary body secreting aqueous humor and controlling lens accommodation, and pigmented Iris regulating pupil aperture); inner neural Retina (#58). Divided internally into anterior aqueous chambers and posterior vitreous body.',
    components: [
      { name: 'Iris & Pupil', role: 'Sphincter pupillae (parasympathetic M₃ miosis) and Dilator pupillae (sympathetic α₁ mydriasis) control retinal illumination.' },
      { name: 'Ciliary Body & Crystalline Lens', role: 'Ciliary epithelium secretes aqueous humor (~2–3 μL/min); ciliary muscle relaxes zonules to thicken lens for near focus.' },
      { name: 'Trabecular Meshwork & Canal of Schlemm', role: 'Drains anterior chamber aqueous humor at the iridocorneal angle to stabilize intraocular pressure (10–21 mmHg).' }
    ],
    functions: [
      'Collects and focuses light rays precisely onto the retinal fovea centralis',
      'Regulates retinal light intensity via autonomic pupillary light reflexes',
      'Maintains globe shape and normal intraocular pressure (IOP 10–21 mmHg)',
      'Performs rapid coordinated conjugate eye tracking via cranial nerves III, IV, and VI'
    ],
    physiology: 'Aqueous humor flows from posterior chamber through the pupil into the anterior chamber and drains via the trabecular meshwork/Canal of Schlemm; ciliary contraction (CN III) increases lens curvature for near accommodation.',
    clinicalSignificance: [
      'Impaired aqueous drainage elevates IOP (>21 mmHg), compressing optic nerve axons in Glaucoma; lens protein opacification causes Cataract.',
      'Myopia, hyperopia, and astigmatism represent refractive focal mismatches.'
    ],
    pharmaceuticalRelevance: [
      'Glaucoma eyedrops lower IOP by reducing aqueous production (timolol β-blocker, dorzolamide CAI, brimonidine α₂-agonist) or enhancing uveoscleral/trabecular outflow (latanoprost PGF₂α, pilocarpine).',
      'Mydriatics/cycloplegics (tropicamide, cyclopentolate, phenylephrine) facilitate fundoscopic examination; sterile ophthalmic drops require isotonicity (0.9% NaCl eq.) and tear-matched pH.'
    ],
    examEssentials: [
      'Normal Intraocular Pressure (IOP) = 10–21 mmHg; Pupil: M₃ causes miosis (constriction), α₁ causes mydriasis (dilation).',
      'Extraocular motor rule: LR₆ SO₄ All-others₃ (Lateral Rectus = CN VI; Superior Oblique = CN IV; remainder = CN III).'
    ],
    visualIds: [],
    anatomyDiagramKey: 'senses',
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['eyes', 'oculi', 'iris', 'pupil', 'aqueous humor', 'glaucoma', 'iop', 'cataract', 'ophthalmic']
  },
  {
    id: 'anat_29_ears',
    catalogNumber: 29,
    name: 'Ears',
    scientificName: 'Aures',
    alternateNames: ['Auditory & Vestibular Organs'],
    primaryCategory: 'sensory',
    categories: ['sensory'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_sensory_organs',
    subtopicIds: ['subtopic_eye_ear_senses'],
    relatedStructureIds: ['anat_28_eyes', 'anat_01_brain', 'anat_48_cartilage', 'anat_20_pharynx'],
    overview: 'Dual special-sense organs transducing airborne acoustic waves into hearing (cochlea) and sensing linear/rotational head acceleration for equilibrium (vestibular apparatus).',
    definition: 'Paired mechanosensory organs divided into external, middle, and inner compartments housed primarily within the petrous temporal bone.',
    anatomicalLocation: 'External pinna projects laterally on the head; external meatus, middle ear tympanic cavity, and inner bony labyrinth lie inside the temporal bone.',
    structure: 'External ear (elastic cartilage pinna + S-shaped canal with ceruminous glands) ends at the tympanic membrane; air-filled Middle ear bridges vibrations across three tiny ossicles (Malleus, Incus, Stapes) and equalizes pressure via the Eustachian tube; fluid-filled Inner ear houses the snail-shaped Cochlea (Organ of Corti), Vestibule (utricle/saccule), and 3 orthogonal Semicircular Canals.',
    components: [
      { name: 'Tympanic Membrane & Ossicles', role: 'Amplifies sound pressure ~20-fold from large eardrum onto the tiny oval window membrane.' },
      { name: 'Cochlea & Organ of Corti', role: 'Frequency-mapped basilar membrane hair cells depolarize via K⁺ influx into cochlear CN VIII fibers.' },
      { name: 'Vestibule & Semicircular Canals', role: 'Otoliths sense gravity/linear tilt (utricle/saccule); semicircular ampullary cristae detect angular rotation.' }
    ],
    functions: [
      'Conducts, amplifies, and tonotopically transduces sound frequencies (20–20,000 Hz)',
      'Maintains static equilibrium (head position) and dynamic equilibrium (rotational motion)',
      'Equalizes middle ear atmospheric pressure via Eustachian tube opening'
    ],
    physiology: 'Stapes piston motion creates perilymph traveling waves along the basilar membrane; bending stereocilia against the tectorial membrane opens mechanosensitive K⁺ channels, triggering CN VIII action potentials.',
    clinicalSignificance: [
      'Middle ear infection (otitis media) or cerumen impaction causes conductive hearing loss; cochlear hair-cell damage causes sensorineural hearing loss.',
      'Endolymphatic hydrops triggers Ménière’s disease (vertigo, tinnitus, fluctuating deafness).'
    ],
    pharmaceuticalRelevance: [
      'Aminoglycosides (gentamicin, streptomycin), loop diuretics (furosemide—high IV doses), cisplatin, and high-dose salicylates cause ototoxicity (cochlear or vestibular hair-cell injury).',
      'Otic drops (ciprofloxacin, polymyxin, glycerin/carbamide peroxide wax softeners) require warming to body temperature before instillation to avoid caloric vertigo.'
    ],
    examEssentials: [
      'Three auditory ossicles in order: Malleus → Incus → Stapes (smallest bone in the body; articulates with oval window).',
      'Cochlea = hearing; Semicircular canals & Vestibule = balance; Major ototoxic drugs = Aminoglycosides, Loop diuretics, Cisplatin.'
    ],
    visualIds: [],
    anatomyDiagramKey: 'senses',
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson', 'tb_guyton'],
    searchKeywords: ['ears', 'aures', 'cochlea', 'ossicles', 'semicircular canals', 'ototoxicity', 'vertigo', 'tympanic']
  },
  {
    id: 'anat_30_parotid_glands',
    catalogNumber: 30,
    name: 'Parotid glands',
    scientificName: 'Glandulae parotideae',
    alternateNames: ['Stensen’s Duct Glands', 'Purely Serous Salivary Pair'],
    primaryCategory: 'digestive',
    categories: ['digestive'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_digestive_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_24_salivary_glands', 'anat_21_tongue', 'anat_22_teeth', 'anat_42_lymph_nodes'],
    overview: 'Largest pair of salivary glands composed exclusively of serous acini secreting watery, α-amylase–rich saliva into the oral vestibule opposite the upper second molar.',
    definition: 'The paired anterior pre-auricular major exocrine salivary glands producing clear serous enzymatic saliva delivered via the parotid (Stensen’s) duct.',
    anatomicalLocation: 'Wedge-shaped parotid bed on each side of the face inferior and anterior to the external ear, overlying the masseter muscle and wrapping behind the mandibular ramus.',
    structure: 'Encapsulated purely serous tubuloacinar tissue traversed internally (without innervating it) by the Facial Nerve (CN VII) branches, retromandibular vein, and external carotid artery. Secretions drain anteriorly across the masseter and pierce the buccinator via Stensen’s duct opposite the upper 2nd molar.',
    components: [
      { name: 'Purely Serous Acini', role: 'Secrete watery saliva high in salivary α-amylase (ptyalin), proline-rich proteins, and electrolytes.' },
      { name: 'Parotid (Stensen’s) Duct', role: 'Long excretory duct opening at a small papilla on the inner cheek opposite the maxillary 2nd molar.' },
      { name: 'CN IX Secretomotor Fibers', role: 'Parasympathetic glossopharyngeal (otic ganglion) stimulation drives stimulated chewing salivation.' }
    ],
    functions: [
      'Supplies ~25% of baseline saliva and up to ~50% of stimulated saliva during mastication',
      'Secretes high-concentration salivary α-amylase initiating carbohydrate digestion',
      'Flushes the upper buccal vestibule and assists in oral clearance'
    ],
    physiology: 'Acidic foods and mechanical jaw movement reflexively activate glossopharyngeal (CN IX) parasympathetics via the otic ganglion, releasing watery amylase-rich fluid from serous acini.',
    clinicalSignificance: [
      'Paramyxovirus infection (Mumps) causes painful bilateral parotid swelling (stretching the tight parotid fascia) and fever.',
      'Parotid tumors or surgery risk injuring the traversing Facial Nerve (CN VII), causing ipsilateral facial paralysis.'
    ],
    pharmaceuticalRelevance: [
      'Live-attenuated MMR vaccine prevents infectious parotitis (mumps) and complications such as orchitis.',
      'Drug-induced sialadenitis or xerostomia from anticholinergics noticeably reduces parotid stimulated salivary flow.'
    ],
    examEssentials: [
      'Parotid = LARGEST salivary gland, PURELY SEROUS, drains via Stensen’s duct opposite upper 2nd molar.',
      'Secretomotor nerve = Glossopharyngeal (CN IX) via otic ganglion; Facial nerve (CN VII) passes through it anatomically.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['parotid glands', 'stensen duct', 'serous', 'mumps', 'amylase', 'glossopharyngeal', 'facial nerve']
  },
  {
    id: 'anat_31_pancreas',
    catalogNumber: 31,
    name: 'Pancreas',
    scientificName: 'Pancreas',
    alternateNames: ['Exocrine Acini & Islets of Langerhans'],
    primaryCategory: 'endocrine',
    categories: ['endocrine', 'digestive'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_endocrine_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_07_small_intestine', 'anat_05_liver', 'anat_33_gallbladder', 'anat_06_stomach'],
    overview: 'Mixed retroperitoneal gland serving both ~98% exocrine digestion (bicarbonate + protease/lipase/amylase juice) and endocrine blood glucose regulation via Islets of Langerhans.',
    definition: 'An elongated retroperitoneal heterocrine organ (head, neck, body, tail) combining digestive enzyme secretion into the duodenum with systemic insulin/glucagon hormone release.',
    anatomicalLocation: 'Transversely across the posterior abdominal wall behind the stomach, with its head nestled in the C-loop of the duodenum and tail abutting the splenic hilum.',
    structure: 'Compound lobulated gland: ~98% exocrine acinar clusters releasing zymogens into the main pancreatic duct (of Wirsung, joining the common bile duct at the Hepatopancreatic Ampulla of Vater); ~1–2% scattered Islets of Langerhans containing α (glucagon), β (insulin, ~65–75%), δ (somatostatin), and PP cells.',
    components: [
      { name: 'Exocrine Acini & Ducts', role: 'Secrete ~1.5 L/day of alkaline (pH 8) HCO₃⁻-rich juice containing trypsinogen, chymotrypsinogen, amylase, and lipase.' },
      { name: 'Islet β-Cells (Insulin)', role: 'Detect glucose rise via GLUT2/ATP-sensitive K⁺ channels and exocytose insulin to promote cellular glucose uptake and glycogenesis.' },
      { name: 'Islet α- & δ-Cells', role: 'α-cells secrete glucagon (fasting glycogenolysis/gluconeogenesis); δ-cells secrete inhibitory somatostatin.' }
    ],
    functions: [
      'Neutralizes gastric chyme in the duodenum via secretin-stimulated HCO₃⁻ secretion',
      'Supplies essential digestive enzymes for carbohydrates, proteins, fats, and nucleic acids',
      'Maintains narrow fasting blood glucose homeostasis (70–110 mg/dL) via balanced insulin/glucagon secretion'
    ],
    physiology: 'Enterokinase on duodenal brush borders cleaves inactive trypsinogen → active trypsin (preventing autodigestion inside the pancreas); oral glucose triggers stronger insulin release than IV glucose due to gut incretins (GLP-1).',
    clinicalSignificance: [
      'Autoimmune β-cell destruction causes Type 1 Diabetes Mellitus; peripheral insulin resistance plus progressive β-cell exhaustion causes Type 2 Diabetes.',
      'Premature intrapancreatic trypsinogen activation produces severe acute pancreatitis (elevated serum amylase & lipase).'
    ],
    pharmaceuticalRelevance: [
      'Target of insulin preparations, sulfonylureas (glimepiride, glipizide closing β-cell K_ATP channels), GLP-1 agonists (liraglutide, semaglutide), DPP-4 inhibitors (sitagliptin), and enteric pancreatic enzyme replacements (pancrelipase).',
      'Exocrine pancreatitis may be triggered rarely by valproate, thiazides, or azathioprine.'
    ],
    examEssentials: [
      'Dual gland: ~98% Exocrine (acini → trypsinogen, amylase, lipase, HCO₃⁻) + ~2% Endocrine (Islets of Langerhans: α = Glucagon, β = Insulin, δ = Somatostatin).',
      'Trypsinogen is activated specifically in the duodenum by enterokinase (enteropeptidase).'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson', 'tb_guyton'],
    searchKeywords: ['pancreas', 'islets of langerhans', 'insulin', 'glucagon', 'diabetes', 'amylase', 'lipase', 'trypsinogen']
  },
  {
    id: 'anat_32_spleen',
    catalogNumber: 32,
    name: 'Spleen',
    scientificName: 'Lien (Splen)',
    alternateNames: ['Splenic Organ', 'Red & White Pulp'],
    primaryCategory: 'lymphatic',
    categories: ['lymphatic', 'cardiovascular'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_lymphatic_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_42_lymph_nodes', 'anat_43_bone_marrow', 'anat_52_blood', 'anat_12_left_kidney'],
    overview: 'Largest secondary lymphoid organ filtering bloodborne pathogens, clearing senescent 120-day erythrocytes, recycling iron, and storing platelets.',
    definition: 'An encapsulated left-upper-quadrant vascular lymphoid organ uniquely perfused by arterial blood (rather than lymph) and partitioned into immunologic white pulp and erythrocyte-filtering red pulp.',
    anatomicalLocation: 'Left hypochondriac region tucked beneath ribs 9–11, superior to the left kidney and lateral to the gastric fundus.',
    structure: 'Protected by a dense fibroelastic capsule projecting trabeculae inward; parenchyma consists of White Pulp (periarteriolar T-cell sheaths and B-cell lymphoid follicles around central arterioles) and Red Pulp (venous sinusoids and splenic cords of Billroth packed with macrophages).',
    components: [
      { name: 'White Pulp', role: 'Monitors systemic blood for antigens and mounts humoral (B-cell antibody) and T-cell immune responses.' },
      { name: 'Red Pulp (Cords & Sinusoids)', role: 'Rigid aged RBCs (~120 days) rupture squeezing through narrow endothelial slits and are phagocytosed by macrophages, freeing iron and heme.' },
      { name: 'Platelet & RBC Reservoir', role: 'Sequesters approximately ~30% of circulating platelets in dynamic reserve.' }
    ],
    functions: [
      'Mechanical filtration and macrophage clearance of senescent or malformed erythrocytes ("graveyard of RBCs")',
      'Immune surveillance and opsonized clearance of encapsulated bacteria directly from blood',
      'Heme iron salvage for bone marrow erythropoiesis',
      'Emergency fetal hematopoiesis and peripheral platelet storage'
    ],
    physiology: 'Blood enters the splenic cords via penicillar arterioles ("open circulation") and must deform through 2–3 μm interendothelial slits to re-enter venous sinuses; non-deformable sickle cells or spherocytes are trapped and destroyed.',
    clinicalSignificance: [
      'Hypersplenism/splenomegaly traps excess platelets and blood cells (portal hypertension, thalassemia, malaria, infectious mononucleosis).',
      'Splenectomy leaves Howell-Jolly bodies inside circulating RBCs and creates lifelong vulnerability to overwhelming sepsis by encapsulated bacteria (S. pneumoniae, H. influenzae, N. meningitidis).'
    ],
    pharmaceuticalRelevance: [
      'Asplenic patients require prophylactic vaccinations (pneumococcal, meningococcal, Hib) and standby antibiotic protocols.',
      'Immune thrombocytopenia (ITP) is treated with corticosteroids/IVIG (blocking splenic Fc-mediated platelet phagocytosis) or splenectomy if refractory.'
    ],
    examEssentials: [
      'Largest lymphoid organ; filters BLOOD (unlike lymph nodes, which filter lymph).',
      'White pulp = immune T/B surveillance; Red pulp = RBC destruction (~120 days) & ~30% platelet reservoir.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson', 'tb_sembulingam'],
    searchKeywords: ['spleen', 'lien', 'red pulp', 'white pulp', 'splenomegaly', 'rbc graveyard', 'howell jolly', 'encapsulated']
  },
  {
    id: 'anat_33_gallbladder',
    catalogNumber: 33,
    name: 'Gallbladder',
    scientificName: 'Vesica biliaris',
    alternateNames: ['Biliary Sac'],
    primaryCategory: 'digestive',
    categories: ['digestive'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_digestive_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_05_liver', 'anat_07_small_intestine', 'anat_31_pancreas', 'anat_46_smooth_muscle'],
    overview: 'Pear-shaped muscular sac beneath the right hepatic lobe that stores, concentrates (5–10×), and contracts to eject bile into the duodenum upon fatty meal ingestion.',
    definition: 'A ~30–50 mL hollow biliary storage organ connected to the common hepatic duct via the spiral cystic duct.',
    anatomicalLocation: 'Nestled in the cystic fossa on the visceral inferior surface of the right lobe of the liver; fundus projects near the right 9th costal cartilage.',
    structure: 'Fundus, Body, and Neck draining into the Cystic Duct (bearing the spiral valve of Heister). Wall has folded simple columnar epithelium (lacking muscularis mucosae and submucosa), responsive smooth muscle coat, and serosa.',
    components: [
      { name: 'Columnar Concentrating Mucosa', role: 'Actively pumps NaCl and HCO₃⁻ out so water follows osmotically, concentrating hepatic bile 5–10 fold.' },
      { name: 'Smooth Muscle Muscularis', role: 'Contracts forcefully in response to cholecystokinin (CCK) while relaxing the Sphincter of Oddi.' },
      { name: 'Cystic & Common Bile Duct', role: 'Bidirectional cystic duct allows hepatic bile filling during fasting and concentrated bile ejection during meals.' }
    ],
    functions: [
      'Stores hepatic bile between meals when the Sphincter of Oddi is closed',
      'Concentrates bile salts, cholesterol, and bilirubin 5–10× via mucosal Na⁺/water absorption',
      'Contracts under CCK stimulation to emulsify dietary lipids and fat-soluble vitamins (A, D, E, K)'
    ],
    physiology: 'Duodenal I-cells sense dietary long-chain fatty acids and amino acids, releasing CCK into blood; CCK contracts gallbladder smooth muscle and relaxes the hepatopancreatic Sphincter of Oddi.',
    clinicalSignificance: [
      'Cholesterol supersaturation or biliary stasis precipitates gallstones (cholelithiasis), causing post-fatty-meal right upper quadrant pain (biliary colic), Murphy’s sign, or obstructive jaundice.',
      'Impacted gallstones at the ampulla can trigger acute pancreatitis.'
    ],
    pharmaceuticalRelevance: [
      'Ursodeoxycholic acid (ursodiol) reduces biliary cholesterol saturation to dissolve small radiolucent cholesterol gallstones.',
      'Ceftriaxone can precipitate as calcium-ceftriaxone biliary sludge; fat-soluble drug/vitamin (ADEK, griseofulvin, ciclosporin) absorption improves with bile secretion after fatty meals.'
    ],
    examEssentials: [
      'Liver MAKES bile; Gallbladder STORES and CONCENTRATES bile (5–10×).',
      'Cholecystokinin (CCK) contracts the gallbladder and relaxes the Sphincter of Oddi.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['gallbladder', 'vesica biliaris', 'bile', 'cck', 'cholelithiasis', 'ursodiol', 'cystic duct']
  },
  {
    id: 'anat_34_appendix',
    catalogNumber: 34,
    name: 'Appendix',
    scientificName: 'Appendix vermiformis',
    alternateNames: ['Vermiform Appendix', 'Cecal GALT Organ'],
    primaryCategory: 'digestive',
    categories: ['digestive', 'lymphatic'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_digestive_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_08_large_intestine', 'anat_07_small_intestine', 'anat_42_lymph_nodes', 'anat_41_tonsils'],
    overview: 'Narrow ~8–10 cm blind-ended tubular pouch at the base of the cecum densely packed with gut-associated lymphoid tissue (GALT) acting as an immunological and microbiota reservoir.',
    definition: 'A worm-like mucosal-lymphoid diverticulum arising posteromedially from the cecum just below the ileocecal junction.',
    anatomicalLocation: 'Right iliac fossa (right lower quadrant), whose base projects classically onto McBurney’s point (one-third of the distance from the right anterior superior iliac spine to the umbilicus).',
    structure: 'Lacks teniae coli externally (the three cecal teniae converge onto its base as a surgical landmark). Submucosa and lamina propria are filled with confluent lymphoid follicles containing B and T lymphocytes and IgA plasma cells surrounding a narrow blind lumen.',
    components: [
      { name: 'Confluent Submucosal Lymphoid Follicles', role: 'Part of GALT sampling luminal bacteria, generating mucosal IgA, and seeding intestinal immune tolerance.' },
      { name: 'Narrow Blind-Ended Lumen', role: 'Protects commensal biofilm beneficial bacteria as a "safe house" capable of repopulating the colon after diarrheal washout.' },
      { name: 'Mesoappendix & Appendicular Artery', role: 'End-artery blood supply rendering the appendix susceptible to rapid ischemic gangrene when obstructed.' }
    ],
    functions: [
      'Gut-associated lymphoid (GALT) mucosal IgA production and enteric bacterial immune priming',
      'Safe-house biofilm reservoir preserving beneficial colonic microbiota during enteric infections'
    ],
    physiology: 'Mucus and lymphoid tissue continuously turn over luminal contents, though luminal narrowing in youth increases risk of fecalith stasis.',
    clinicalSignificance: [
      'Luminal obstruction (fecalith or lymphoid hyperplasia) causes venous congestion, bacterial proliferation, ischemia, and acute appendicitis—classic periumbilical pain migrating to McBurney’s point.',
      'Rupture leads to localized abscess or diffuse bacterial peritonitis.'
    ],
    pharmaceuticalRelevance: [
      'Pre-operative/peri-operative broad-spectrum antibiotics covering Gram-negative rods and anaerobes (cefazolin/ceftriaxone + metronidazole, or piperacillin-tazobactam) prevent postoperative peritonitis.',
      'Delayed diagnosis in patients receiving analgesics or steroids risks masking peritoneal irritation.'
    ],
    examEssentials: [
      'Surface landmark: McBurney’s point (right lower quadrant); convergence of the 3 cecal teniae coli marks the appendix base.',
      'Rich in GALT lymphoid follicles and supplied by the terminal end-artery appendicular branch (high perforation risk).'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['appendix', 'vermiform appendix', 'mcburney point', 'appendicitis', 'galt', 'cecum']
  },
  {
    id: 'anat_35_thyroid_gland',
    catalogNumber: 35,
    name: 'Thyroid gland',
    scientificName: 'Glandula thyroidea',
    alternateNames: ['Thyroid Follicles & Parafollicular C-Cells'],
    primaryCategory: 'endocrine',
    categories: ['endocrine'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_endocrine_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_36_parathyroid_glands', 'anat_37_pituitary_gland', 'anat_19_larynx', 'anat_17_trachea'],
    overview: 'Butterfly-shaped cervical endocrine gland synthesizing iodine-containing metabolic hormones (T₄, T₃) and calcium-lowering calcitonin.',
    definition: 'A highly vascular bilobed endocrine gland wrapping around the anterior trachea that regulates basal metabolic rate, thermogenesis, and neurodevelopment.',
    anatomicalLocation: 'Anterior lower neck spanning C5–T1 vertebrae, immediately inferior to the thyroid cartilage of the larynx; right and left lobes are joined across tracheal rings 2–4 by the median isthmus.',
    structure: 'Microscopically organized into spherical Thyroid Follicles lined by cuboidal follicular cells enclosing pink thyroglobulin colloid (the only endocrine gland storing large extracellular hormone reserves), interspersed with parafollicular (C) cells.',
    components: [
      { name: 'Thyroid Follicular Cells', role: 'Trap dietary iodide (via NIS), iodinate thyroglobulin tyrosine residues (via TPO), and secrete T₄ (~90%) and active T₃ (~10%).' },
      { name: 'Colloid Storage Lumen', role: 'Extracellular thyroglobulin reservoir sufficient for ~2–3 months of basal thyroid hormone demand.' },
      { name: 'Parafollicular (C) Cells', role: 'Secrete peptide hormone Calcitonin when serum Ca²⁺ rises, inhibiting osteoclastic bone resorption.' }
    ],
    functions: [
      'Elevates basal metabolic rate (BMR), mitochondrial O₂ consumption, and Na⁺/K⁺-ATPase thermogenesis',
      'Essential for fetal/neonatal CNS myelination and linear skeletal growth',
      'Upregulates cardiac β₁-adrenergic receptors, enhancing cardiac output and heart rate',
      'Calcitonin lowers acutely elevated plasma calcium (minor physiological role vs PTH)'
    ],
    physiology: 'Hypothalamic TRH stimulates anterior pituitary TSH, driving follicular iodine trapping, thyroglobulin iodination, and T₄/T₃ exocytosis; free T₃/T₄ exerts negative feedback on both TSH and TRH. Peripheral 5’-deiodinase converts prohormone T₄ into active T₃.',
    clinicalSignificance: [
      'Hypothyroidism (Hashimoto’s, iodine deficiency) causes weight gain, cold intolerance, bradycardia, myxedema, and neonatal cretinism.',
      'Hyperthyroidism (Graves’ disease) causes tachycardia, heat intolerance, weight loss, tremor, and exophthalmos; iodine deficiency produces compensatory goiter.'
    ],
    pharmaceuticalRelevance: [
      'Hypothyroidism is treated with oral levothyroxine (T₄)—take on an empty stomach separated from calcium/iron supplements that chelate absorption.',
      'Hyperthyroidism is managed with thioamides (carbimazole/methimazole, propylthiouracil inhibiting thyroid peroxidase), radioiodine (¹³¹I), and β-blockers (propranolol).'
    ],
    examEssentials: [
      'Only endocrine gland storing massive extracellular hormone (~2–3 months) as colloid; T₃ is ~4× more potent than T₄.',
      'Follicular cells → T₃/T₄; Parafollicular C-cells → Calcitonin; Levothyroxine requires empty-stomach dosing.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson', 'tb_guyton'],
    searchKeywords: ['thyroid gland', 'thyroxine', 't3', 't4', 'calcitonin', 'tsh', 'levothyroxine', 'goiter']
  },
  {
    id: 'anat_36_parathyroid_glands',
    catalogNumber: 36,
    name: 'Parathyroid glands',
    scientificName: 'Glandulae parathyroideae',
    alternateNames: ['Parathyroid Chief Cells', 'PTH Glands'],
    primaryCategory: 'endocrine',
    categories: ['endocrine'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_endocrine_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_35_thyroid_gland', 'anat_49_bone_tissue', 'anat_11_right_kidney', 'anat_07_small_intestine'],
    overview: 'Four tiny rice-grain endocrine glands on the posterior thyroid capsule acting as the master positive regulator of extracellular calcium and phosphate homeostasis via PTH.',
    definition: 'Usually four small yellowish-brown endocrine glands embedded along the posterior surface of the thyroid lobes that secrete Parathyroid Hormone (PTH).',
    anatomicalLocation: 'Posterior aspect of the superior and inferior poles of the right and left thyroid lobes inside the pretracheal fascia.',
    structure: 'Organized into densely vascularized cords of Principal (Chief) cells—sensing plasma ionized Ca²⁺ directly via membrane Calcium-Sensing Receptors (CaSR)—and larger eosinophilic Oxyphil cells of unknown mature function.',
    components: [
      { name: 'Chief (Principal) Cells', role: 'Synthesize and secrete 84-amino-acid Parathyroid Hormone (PTH) inversely proportional to plasma Ca²⁺.' },
      { name: 'Calcium-Sensing Receptor (CaSR)', role: 'GPCR detecting tiny drops in ionized serum Ca²⁺ (<8.5 mg/dL) without pituitary TSH feedback.' }
    ],
    functions: [
      'Raises low plasma Ca²⁺ into the narrow physiological range (8.5–10.5 mg/dL)',
      'Stimulates bone remodeling and indirect osteoclast Ca²⁺/PO₄³⁻ release via osteoblast RANKL',
      'Increases renal DCT Ca²⁺ reabsorption while inhibiting PCT phosphate reabsorption (phosphaturic)',
      'Activates renal 1α-hydroxylase to convert 25-(OH)-D₃ into active Calcitriol (boosting intestinal Ca²⁺ uptake)'
    ],
    physiology: 'Unlike thyroid or adrenal axes, PTH is controlled directly by plasma ionized calcium (hypocalcemia stimulates PTH; hypercalcemia suppresses PTH) independent of the pituitary gland.',
    clinicalSignificance: [
      'Accidental surgical removal during thyroidectomy produces acute hypoparathyroidism, hypocalcemia, neuromuscular tetany (Chvostek/Trousseau signs), and laryngospasm.',
      'Primary hyperparathyroidism (adenoma) causes hypercalcemia, kidney stones, bone resorption, and peptic symptoms ("stones, bones, groans").'
    ],
    pharmaceuticalRelevance: [
      'Recombinant PTH analog teriparatide (intermittent low-dose daily injection) stimulates osteoblastic bone formation in severe osteoporosis.',
      'Calcimimetic cinacalcet activates parathyroid CaSR to suppress excessive PTH in secondary hyperparathyroidism of CKD; hypocalcemia requires IV calcium gluconate + calcitriol.'
    ],
    examEssentials: [
      'PTH RAISES serum Ca²⁺ and LOWERS serum PO₄³⁻ via bone resorption, renal DCT Ca²⁺ reabsorption, and Calcitriol activation.',
      'Controlled directly by serum ionized Ca²⁺ (NOT controlled by pituitary); surgical loss triggers hypocalcemic tetany.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson', 'tb_guyton'],
    searchKeywords: ['parathyroid glands', 'pth', 'calcium homeostasis', 'tetany', 'calcitriol', 'teriparatide', 'cinacalcet']
  },
  {
    id: 'anat_37_pituitary_gland',
    catalogNumber: 37,
    name: 'Pituitary gland',
    scientificName: 'Hypophysis',
    alternateNames: ['Hypophysis', 'Adenohypophysis & Neurohypophysis'],
    primaryCategory: 'endocrine',
    categories: ['endocrine', 'nervous'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_endocrine_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_01_brain', 'anat_35_thyroid_gland', 'anat_38_adrenal_glands', 'anat_39_pineal_gland'],
    overview: 'Pea-sized master neuroendocrine gland nestled in the sella turcica that translates hypothalamic signals into tropic hormones governing growth, metabolism, stress, lactation, and water balance.',
    definition: 'A dual-origin endocrine gland suspended beneath the hypothalamus by the infundibulum, comprising glandular Anterior Pituitary (adenohypophysis) and neural Posterior Pituitary (neurohypophysis).',
    anatomicalLocation: 'Hypophyseal fossa of the sphenoid bone (sella turcica) at the skull base, immediately inferior to the optic chiasm.',
    structure: 'Anterior lobe (adenohypophysis, derived from oral Rathke’s pouch) receives hypothalamic releasing/inhibiting hormones via the hypophyseal portal veins and houses 5 tropic cell lineages; Posterior lobe (neurohypophysis, neural downgrowth) stores unmyelinated hypothalamic axon terminals releasing ADH and oxytocin.',
    components: [
      { name: 'Anterior Pituitary (6 Hormones)', role: 'Synthesizes GH (Somatotropin), TSH, ACTH, FSH, LH, and Prolactin (PRL) under hypothalamic portal control.' },
      { name: 'Posterior Pituitary (2 Stored Neurohormones)', role: 'Releases hypothalamus-made Antidiuretic Hormone (ADH/Vasopressin) and Oxytocin directly into systemic capillaries.' },
      { name: 'Hypophyseal Portal System', role: 'Microvascular portal shunt carrying nanomolar TRH, CRH, GnRH, GHRH, and dopamine directly to anterior lobe cells.' }
    ],
    functions: [
      'Coordinates downstream thyroid, adrenal cortical, and gonadal endocrine glands',
      'Drives longitudinal bone/soft-tissue growth via GH and hepatic IGF-1',
      'Regulates plasma osmolarity and arterial volume via posterior ADH (collecting duct AQP2 channels)',
      'Mediates uterine contraction and milk ejection reflex via oxytocin'
    ],
    physiology: 'Hypothalamic dopamine continuously inhibits Prolactin (tonic inhibition), whereas releasing hormones stimulate GH, TSH, ACTH, and gonadotropins; supraoptic and paraventricular nuclei synthesize ADH/oxytocin transported down the infundibulum.',
    clinicalSignificance: [
      'Pituitary adenomas compressing the overlying optic chiasm cause classic bitemporal hemianopia ("tunnel vision"); excess GH causes gigantism (child) or acromegaly (adult).',
      'ADH deficiency produces central Diabetes Insipidus (polyuria, polydipsia with dilute urine).'
    ],
    pharmaceuticalRelevance: [
      'Antipsychotics (D₂ antagonists) and metoclopramide block hypothalamic dopamine inhibition, causing hyperprolactinemia and galactorrhea; bromocriptine/cabergoline suppress prolactinomas.',
      'Clinical pituitary-axis drugs include desmopressin (V₂ agonist for DI), oxytocin (labor induction), somatropin (GH), and octreotide (somatostatin analog for acromegaly).'
    ],
    examEssentials: [
      'Anterior pituitary MAKES 6 hormones: GH, TSH, ACTH, FSH, LH, Prolactin (Prolactin is tonically INHIBITED by dopamine).',
      'Posterior pituitary only STORES & RELEASES 2 hypothalamus-made hormones: ADH (vasopressin) and Oxytocin.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson', 'tb_guyton'],
    searchKeywords: ['pituitary gland', 'hypophysis', 'adenohypophysis', 'neurohypophysis', 'adh', 'oxytocin', 'prolactin', 'sella turcica']
  },
  {
    id: 'anat_38_adrenal_glands',
    catalogNumber: 38,
    name: 'Adrenal glands',
    scientificName: 'Glandulae suprarenales',
    alternateNames: ['Suprarenal Glands', 'Adrenal Cortex & Medulla'],
    primaryCategory: 'endocrine',
    categories: ['endocrine'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_endocrine_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_11_right_kidney', 'anat_12_left_kidney', 'anat_37_pituitary_gland', 'anat_03_heart'],
    overview: 'Paired retroperitoneal caps atop each kidney uniting an outer steroidogenic cortex (aldosterone, cortisol, androgens) with an inner sympathetic medulla secreting epinephrine and norepinephrine.',
    definition: 'Bilateral endocrine organs crowning the superior renal poles, structurally and embryologically split into mesodermal Adrenal Cortex and neural-crest Adrenal Medulla.',
    anatomicalLocation: 'Retroperitoneally embedded in perirenal fat on the superomedial aspect of the right (#11, pyramidal) and left (#12, semilunar) kidneys.',
    structure: 'Outer Adrenal Cortex (~80–90%) arranged into three concentric zones: Zona Glomerulosa (mineralocorticoids), Zona Fasciculata (glucocorticoids), and Zona Reticularis (androgens); inner Adrenal Medulla (~10–20%) packed with modified postganglionic sympathetic chromaffin cells.',
    components: [
      { name: 'Zona Glomerulosa → Aldosterone', role: 'Regulated primarily by RAAS (Angiotensin II) and high serum K⁺; promotes renal Na⁺/H₂O retention and K⁺/H⁺ excretion.' },
      { name: 'Zona Fasciculata → Cortisol', role: 'Regulated by pituitary ACTH; elevates blood glucose, suppresses inflammation, and sensitizes vessels to catecholamines.' },
      { name: 'Zona Reticularis → DHEA / Androgens', role: 'Weak adrenal sex steroid precursors regulated by ACTH.' },
      { name: 'Adrenal Medulla → Catecholamines', role: 'Preganglionic sympathetic acetylcholine triggers chromaffin release of ~80% Epinephrine and ~20% Norepinephrine.' }
    ],
    functions: [
      'Sustains blood pressure and blood volume via aldosterone-driven Na⁺ reabsorption and catecholamine vasoconstriction',
      'Mediates both rapid "fight-or-flight" sympathetic surge (epinephrine) and prolonged metabolic stress adaptation (cortisol)',
      'Maintains fasting glucose via cortisol-induced gluconeogenesis and anti-inflammatory immune restraint'
    ],
    physiology: 'Cholesterol is converted to cortical steroid hormones on demand (no large intracellular storage), whereas medullary chromaffin granules store preformed epinephrine/norepinephrine ready for instant exocytosis.',
    clinicalSignificance: [
      'Adrenal cortical destruction causes Addison’s disease (hypotension, hyponatremia, hyperkalemia, skin hyperpigmentation); cortisol excess causes Cushing’s syndrome.',
      'Chromaffin cell tumors (pheochromocytoma) trigger paroxysmal severe hypertension, palpitations, and sweating.'
    ],
    pharmaceuticalRelevance: [
      'Exogenous corticosteroids (prednisolone, dexamethasone, hydrocortisone) suppress hypothalamic CRH and pituitary ACTH—abrupt cessation after prolonged therapy precipitates life-threatening adrenal crisis.',
      'Spironolactone/eplerenone competitively antagonize aldosterone mineralocorticoid receptors; epinephrine is first-line life-saving therapy for anaphylaxis.'
    ],
    examEssentials: [
      'Cortex zones (outside → inside, "GFR"): Glomerulosa (Mineralocorticoids/Aldosterone) → Fasciculata (Glucocorticoids/Cortisol) → Reticularis (Androgens).',
      'Adrenal Medulla secretes ~80% Epinephrine + ~20% Norepinephrine; acts as modified sympathetic ganglion.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson', 'tb_guyton'],
    searchKeywords: ['adrenal glands', 'suprarenal', 'cortisol', 'aldosterone', 'epinephrine', 'cushing', 'addison', 'corticosteroid']
  },
  {
    id: 'anat_39_pineal_gland',
    catalogNumber: 39,
    name: 'Pineal gland',
    scientificName: 'Glandula pinealis (Epiphysis cerebri)',
    alternateNames: ['Epiphysis Cerebri', 'Melatonin Gland'],
    primaryCategory: 'endocrine',
    categories: ['endocrine', 'nervous'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_endocrine_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_01_brain', 'anat_37_pituitary_gland', 'anat_28_eyes'],
    overview: 'Pinecone-shaped midline epithalamic endocrine gland synthesizing melatonin in response to darkness to entrain human circadian sleep-wake rhythms.',
    definition: 'A small (~5–8 mm) neuroendocrine organ attached to the roof of the third ventricle that transduces environmental light-dark cycles into nocturnal melatonin secretion.',
    anatomicalLocation: 'Midline posterior roof of the diencephalon (epithalamus) tucked immediately superior to the midbrain superior colliculi.',
    structure: 'Pia-covered lobules containing secretory parenchymal Pinealocytes, supportive interstitial glial cells, and characteristic calcified concretions ("brain sand" / corpora arenacea) accumulating after childhood outside the blood-brain barrier.',
    components: [
      { name: 'Pinealocytes', role: 'Enzymatically convert serotonin (5-HT) via N-acetyltransferase into nocturnal melatonin.' },
      { name: 'Retinohypothalamic-SCG Pathway', role: 'Light → retinal melanopsin ganglion cells → Suprachiasmatic Nucleus (SCN) → sympathetic Superior Cervical Ganglion → pineal β₁/α₁ control.' }
    ],
    functions: [
      'Secretes melatonin rhythmically during darkness (peaking ~2:00–4:00 AM) to synchronize circadian sleep-wake cycles',
      'Modulates seasonal biological rhythms and modest pubertal GnRH timing suppression'
    ],
    physiology: 'Daylight hitting retinal intrinsically photosensitive ganglion cells stimulates the SCN to inhibit sympathetic drive to the pineal gland; darkness removes this inhibition, releasing norepinephrine onto pinealocytes to trigger melatonin synthesis.',
    clinicalSignificance: [
      'Calcified pineal gland serves as a reliable midline radiographic landmark on skull X-ray/CT; pineal tumors compressing the midbrain tectum cause Parinaud’s syndrome (upward gaze palsy) and obstructive hydrocephalus.',
      'Shift work and evening blue light suppress melatonin secretion, disrupting circadian sleep onset.'
    ],
    pharmaceuticalRelevance: [
      'Oral melatonin and synthetic MT₁/MT₂ receptor agonists (ramelteon, tasimelteon, agomelatine) treat circadian jet lag, delayed sleep phase, and insomnia without GABA-A dependence.',
      'β-blockers (especially lipophilic propranolol) can blunt nocturnal melatonin synthesis and disturb sleep.'
    ],
    examEssentials: [
      'Melatonin is synthesized from Serotonin inside Pinealocytes; secretion rises in DARKNESS and is suppressed by LIGHT via the SCN.',
      'Frequently calcifies with age ("brain sand" / corpora arenacea) as a normal midline CT marker.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['pineal gland', 'melatonin', 'circadian', 'suprachiasmatic nucleus', 'serotonin', 'ramelteon']
  },
  {
    id: 'anat_40_thymus',
    catalogNumber: 40,
    name: 'Thymus',
    scientificName: 'Thymus',
    alternateNames: ['Thymic Primary Lymphoid Organ'],
    primaryCategory: 'lymphatic',
    categories: ['lymphatic', 'endocrine'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_lymphatic_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_43_bone_marrow', 'anat_42_lymph_nodes', 'anat_32_spleen', 'anat_03_heart'],
    overview: 'Bilobed anterior mediastinal primary lymphoid organ where bone marrow–derived T-cell precursors undergo positive/negative selection into self-tolerant CD4⁺/CD8⁺ T lymphocytes.',
    definition: 'A specialized encapsulated primary lymphoid and endocrine organ prominent in infancy and childhood that involutes progressively into fibro-fatty tissue after puberty.',
    anatomicalLocation: 'Superior and anterior mediastinum posterior to the manubrium of the sternum and anterior to the aortic arch and upper heart.',
    structure: 'Two asymmetric lobulated lobes divided by fibrous septa into an outer densely packed Cortex (immature proliferating thymocytes, epithelial nurse cells, blood-thymus barrier) and paler inner Medulla (mature CD4⁺/CD8⁺ T cells and whorled Hassall’s corpuscles).',
    components: [
      { name: 'Thymic Cortex & Blood-Thymus Barrier', role: 'Protects developing T cells from premature foreign antigen exposure during positive MHC selection.' },
      { name: 'Thymic Medulla & Hassall’s Corpuscles', role: 'Site of negative selection eliminating strongly self-reactive T cells to prevent autoimmunity.' },
      { name: 'Thymic Hormones (Thymosin, Thymopoietin)', role: 'Local peptides promoting intrathymic T-lymphocyte maturation.' }
    ],
    functions: [
      'Primary site of T-lymphocyte maturation, TCR rearrangement, and self/non-self immune tolerance (~95% of thymocytes undergo apoptosis during selection)',
      'Generates naive helper (CD4⁺) and cytotoxic (CD8⁺) T cells seeding spleen and lymph nodes',
      'Secretes paracrine thymic maturation factors (thymosin)'
    ],
    physiology: 'Hematopoietic lymphoid progenitors migrate from red bone marrow to the thymus, rearrange T-cell receptors, survive positive (MHC recognition) and negative (no self-reactivity) selection, and enter blood as immunocompetent T cells.',
    clinicalSignificance: [
      'Congenital thymic aplasia (DiGeorge syndrome, 22q11.2 deletion) causes severe T-cell immunodeficiency and hypocalcemia.',
      'Thymomas and thymic hyperplasia are frequently associated with autoimmune Myasthenia Gravis (anti-acetylcholine receptor antibodies).'
    ],
    pharmaceuticalRelevance: [
      'T-cell immunosuppressive agents (cyclosporine, tacrolimus inhibiting calcineurin/IL-2; mycophenolate) suppress peripheral T-cell activation in organ transplantation.',
      'Thymectomy can induce remission in generalized Myasthenia Gravis alongside pyridostigmine.'
    ],
    examEssentials: [
      'Thymus matures T-lymphocytes (Bone marrow matures B-lymphocytes); Hassall’s corpuscles are diagnostic of thymic medulla.',
      'Reaches peak relative size in childhood and undergoes physiological fatty involution after puberty; associated with Myasthenia Gravis.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['thymus', 't cell', 'thymosin', 'hassall corpuscles', 'myasthenia gravis', 'involution', 'primary lymphoid']
  },
  {
    id: 'anat_41_tonsils',
    catalogNumber: 41,
    name: 'Tonsils',
    scientificName: 'Tonsillae',
    alternateNames: ['Palatine, Pharyngeal & Lingual Tonsils', 'Waldeyer’s Ring'],
    primaryCategory: 'lymphatic',
    categories: ['lymphatic', 'respiratory'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_lymphatic_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_20_pharynx', 'anat_42_lymph_nodes', 'anat_32_spleen', 'anat_34_appendix'],
    overview: 'Uncapsulated ring of mucosal secondary lymphoid nodules guarding the entrance of the pharynx against inhaled and ingested pathogens.',
    definition: 'Aggregations of mucosa-associated lymphoid tissue (MALT) arranged around the oropharyngeal and nasopharyngeal portals (Waldeyer’s lymphatic ring).',
    anatomicalLocation: 'Encircling the pharyngeal inlet: paired Palatine tonsils between palatoglossal/palatopharyngeal arches, single Pharyngeal tonsil ("adenoid") in the nasopharyngeal roof, paired Lingual tonsils on the posterior tongue base, and tubal tonsils.',
    structure: 'Partially encapsulated or unencapsulated lymphoid follicles rich in B-cell germinal centers and interfollicular T cells; luminal surface dips deeply into invaginated Tonsillar Crypts lined by stratified squamous or respiratory epithelium that trap microbes and antigens.',
    components: [
      { name: 'Palatine Tonsils', role: 'Largest visible oral-margin pair between faucial pillars; most frequent site of clinical tonsillitis.' },
      { name: 'Pharyngeal Tonsil (Adenoid)', role: 'Midline nasopharyngeal roof pad; hypertrophy in children blocks nasal breathing and Eustachian drainage.' },
      { name: 'Tonsillar Crypts', role: 'Deep mucosal pockets bringing airborne/food antigens directly to M-cells and follicular lymphocytes.' }
    ],
    functions: [
      'First-line mucosal antigen trapping and secretory IgA / memory B-cell generation',
      'Local innate and adaptive defense at the shared aerodigestive threshold'
    ],
    physiology: 'Antigens sampled inside tonsillar crypts activate germinal center B-cell clonal expansion and plasma cell differentiation; unlike lymph nodes, tonsils possess efferent lymphatics only (no afferent lymphatics).',
    clinicalSignificance: [
      'Acute bacterial tonsillitis (commonly Group A Streptococcus pyogenes) causes fever, exudates, odynophagia, and tender cervical lymphadenopathy.',
      'Adenoid hypertrophy causes chronic mouth-breathing, snoring, pediatric sleep apnea, and recurrent otitis media.'
    ],
    pharmaceuticalRelevance: [
      'Group A streptococcal tonsillopharyngitis is treated promptly with penicillin V or amoxicillin (macrolides/cephalosporins in penicillin allergy) to prevent acute rheumatic fever.',
      'Topical antiseptic/anesthetic lozenges and NSAIDs/paracetamol relieve acute pharyngeal pain.'
    ],
    examEssentials: [
      'Waldeyer’s ring components: Pharyngeal (adenoid), Tubal (×2), Palatine (×2), and Lingual tonsils.',
      'Lack afferent lymphatics (antigen enters directly via crypt epithelium, not via lymph vessels).'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['tonsils', 'palatine tonsils', 'adenoid', 'waldeyer ring', 'tonsillitis', 'malt', 'crypts']
  },
  {
    id: 'anat_42_lymph_nodes',
    catalogNumber: 42,
    name: 'Lymph nodes',
    scientificName: 'Nodi lymphatici',
    alternateNames: ['Lymph Glands', 'Cervical, Axillary & Inguinal Nodes'],
    primaryCategory: 'lymphatic',
    categories: ['lymphatic'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_lymphatic_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_32_spleen', 'anat_40_thymus', 'anat_41_tonsils', 'anat_43_bone_marrow'],
    overview: 'Bean-shaped encapsulated secondary lymphoid filters positioned along lymphatic vessels to cleanse interstitial lymph of pathogens/debris and initiate adaptive T/B immune responses.',
    definition: 'Hundreds (~600) of small (1–25 mm) kidney-shaped lymphoid organs arranged in regional chains along collecting lymphatic channels.',
    anatomicalLocation: 'Concentrated in superficial and deep regional clusters: cervical (head/neck), axillary (upper limb/breast), mediastinal, mesenteric, and inguinal (lower limb/pelvis) chains.',
    structure: 'Fibrous capsule sends trabeculae inward around three functional zones: outer Cortex (B-cell lymphoid follicles with germinal centers), Paracortex (T-cell zone with high endothelial venules), and inner Medulla (medullary cords of plasma cells and macrophage-lined sinuses). Multiple afferent lymphatics enter the convex surface; fewer efferent vessels exit the hilum.',
    components: [
      { name: 'Subcapsular & Medullary Sinuses', role: 'Slow-flow endothelial channels where resident macrophages phagocytose ~99% of bacteria, soot, and cellular debris in lymph.' },
      { name: 'Cortical Follicles & Paracortex', role: 'Compartmentalized B-cell humoral (cortex) and T-cell cellular (paracortex) antigen activation zones.' },
      { name: 'One-Way Afferent → Efferent Flow', role: 'Multiple afferent inlets converging onto fewer hilar efferent outlets slow lymph transit for thorough immune inspection.' }
    ],
    functions: [
      'Biological filtration of interstitial lymph before return via thoracic duct to subclavian veins',
      'Antigen presentation and clonal activation of T and B lymphocytes',
      'Antibody production and memory lymphocyte recirculation'
    ],
    physiology: 'Interstitial fluid (~2–4 L/day) enters blind lymphatic capillaries, ascends valved collectors, slows inside sequential lymph node chains for dendritic/macrophage antigen presentation, and rejoins venous blood at the venous angles.',
    clinicalSignificance: [
      'Tender, mobile, enlarged nodes indicate acute regional infection (reactive lymphadenopathy); firm, painless, fixed nodes suggest lymphoma or metastatic carcinoma.',
      'Surgical nodal dissection or parasitic obstruction (Wuchereria bancrofti filariasis) produces severe regional lymphedema.'
    ],
    pharmaceuticalRelevance: [
      'High-molecular-weight lipophilic drugs, monoclonal antibodies (subcutaneous), and lipid-based nanoparticles enter initial lymphatics preferentially and accumulate in regional lymph nodes.',
      'Antifilarial therapy (diethylcarbamazine / albendazole + ivermectin) targets lymphatic filariasis.'
    ],
    examEssentials: [
      'Lymph nodes are the ONLY lymphoid organs possessing BOTH afferent and efferent lymphatic vessels.',
      'Cortex = B cells (follicles); Paracortex = T cells; Medulla = plasma cells & macrophages.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['lymph nodes', 'lymphadenopathy', 'afferent lymphatic', 'germinal center', 'paracortex', 'lymphedema']
  },
  {
    id: 'anat_43_bone_marrow',
    catalogNumber: 43,
    name: 'Bone marrow',
    scientificName: 'Medulla ossium',
    alternateNames: ['Red & Yellow Marrow', 'Hematopoietic Niche'],
    primaryCategory: 'lymphatic',
    categories: ['lymphatic', 'musculoskeletal'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_lymphatic_system',
    subtopicIds: ['subtopic_hematopoiesis'],
    relatedStructureIds: ['anat_49_bone_tissue', 'anat_52_blood', 'anat_32_spleen', 'anat_40_thymus'],
    overview: 'Spongy vascularized medullary tissue inside trabecular bones acting as the adult cradle of hematopoiesis—generating all erythrocytes, leukocytes, platelets, and immature B cells.',
    definition: 'The soft reticular stromal tissue filling bone marrow cavities, functionally divided into actively hematopoietic Red Marrow and adipocyte-rich Yellow Marrow.',
    anatomicalLocation: 'In adults, active Red Marrow is concentrated in axial spongy (trabecular) bones—sternum, ribs, vertebrae, pelvic iliac crest, skull diploë, and proximal femur/humerus epiphyses—while long-bone diaphyses hold Yellow Marrow.',
    structure: 'Reticular connective stroma, adipocytes, and discontinuous fenestrated sinusoids supporting Pluripotent Hematopoietic Stem Cells (HSCs) differentiated along Myeloid (erythroblasts, megakaryocytes, granulocytes, monocytes) and Lymphoid (B cells, NK cells, thymic T precursors) lineages.',
    components: [
      { name: 'Red Bone Marrow (Medulla ossium rubra)', role: 'Produces ~2 million RBCs per second plus all platelets, neutrophils, monocytes, and naive B-lymphocytes.' },
      { name: 'Yellow Bone Marrow (Medulla ossium flava)', role: 'Lipid storage reserve capable of reverting back to active red marrow during severe chronic hemorrhage or hypoxia.' },
      { name: 'Megakaryocytes', role: 'Giant polyploid marrow cells shedding cytoplasmic fragments across sinusoids to release ~150,000–450,000 platelets/μL.' }
    ],
    functions: [
      'Lifelong adult hematopoiesis sustaining erythrocytes, all leukocytes, and thrombocytes',
      'Primary lymphoid organ supporting B-lymphocyte maturation and receptor tolerance selection',
      'Macrophage iron storage (ferritin/hemosiderin) for hemoglobin synthesis'
    ],
    physiology: 'Growth factors—Erythropoietin (kidney), Thrombopoietin (liver), and G-CSF/GM-CSF—regulate lineage proliferation and release of mature cells through wide sinusoidal endothelial pores into systemic circulation.',
    clinicalSignificance: [
      'Bone marrow suppression produces pancytopenia (anemia, neutropenic infections, thrombocytopenic bleeding).',
      'Posterior iliac crest aspiration and trephine biopsy diagnose leukemia, aplastic anemia, and multiple myeloma.'
    ],
    pharmaceuticalRelevance: [
      'Major dose-limiting toxicity organ (myelosuppression) for cytotoxic chemotherapy (cyclophosphamide, doxorubicin, methotrexate), chloramphenicol (aplastic anemia), clozapine (agranulocytosis), and carbimazole.',
      'Recombinant marrow stimulants include epoetin alfa (EPO) and filgrastim (G-CSF) for anemia and chemotherapy-induced neutropenia.'
    ],
    examEssentials: [
      'Red bone marrow = primary site of adult hematopoiesis AND B-cell maturation; adult biopsy site = Posterior Iliac Crest (or sternum).',
      'Major myelosuppressive drugs: cytotoxic antineoplastics, chloramphenicol, clozapine, zidovudine.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_sembulingam', 'tb_ross_wilson'],
    searchKeywords: ['bone marrow', 'hematopoiesis', 'red marrow', 'yellow marrow', 'megakaryocytes', 'myelosuppression', 'filgrastim']
  },
  {
    id: 'anat_44_skin',
    catalogNumber: 44,
    name: 'Skin',
    scientificName: 'Cutis (Integumentum commune)',
    alternateNames: ['Integumentary Organ', 'Epidermis & Dermis'],
    primaryCategory: 'sensory',
    categories: ['sensory'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_sensory_organs',
    subtopicIds: ['subtopic_integumentary_skin'],
    relatedStructureIds: ['anat_56_epithelial_tissue', 'anat_55_connective_tissue', 'anat_53_adipose_tissue', 'anat_54_nervous_tissue'],
    overview: 'Largest external body organ (~1.6–2.0 m²) forming a waterproof protective barrier, cutaneous sensory interface, Vitamin D₃ photobiosynthesis site, and transdermal drug delivery membrane.',
    definition: 'The continuous external covering comprising avascular keratinized Epidermis, vascularized fibrous Dermis, and underlying subcutaneous adipose tissue.',
    anatomicalLocation: 'Covers the entire external body surface, continuous with mucous membranes at body orifices.',
    structure: 'Two primary layers: superficial Epidermis (keratinized stratified squamous epithelium arranged bottom-to-top: Stratum Basale, Spinosum, Granulosum, Lucidum [palms/soles], and dead flat lipid-sealed Stratum Corneum, hosting melanocytes, Langerhans, and Merkel cells) and deep vascularized Dermis (collagen/elastin papillary & reticular layers housing hair follicles, sebaceous/sweat glands, and tactile corpuscles).',
    components: [
      { name: 'Stratum Corneum (Rate-Limiting Barrier)', role: '15–20 layers of dead keratinized corneocytes embedded in ceramide lipid mortar preventing water loss and regulating topical permeation.' },
      { name: 'Dermis & Appendages', role: 'Houses thermoregulatory capillary plexus, eccrine/apocrine sweat glands, sebaceous glands, and hair follicles.' },
      { name: 'Cutaneous Sensory Receptors', role: 'Meissner’s (light touch), Pacinian (deep vibration/pressure), Ruffini (stretch), and free nerve endings (pain/temperature).' }
    ],
    functions: [
      'Physical, chemical, antimicrobial (acid mantle pH ~4.5–5.5), and UV melanin protection',
      'Thermoregulation via eccrine sweat evaporation and dermal arteriovenous vasodilation/constriction',
      'Somatic touch, vibration, pressure, pain, and thermal sensation',
      'UV-B conversion of 7-dehydrocholesterol into cholecalciferol (Vitamin D₃ precursor)'
    ],
    physiology: 'Epidermal basal stem cells migrate upward and keratinize over ~28 days; sympathetic cholinergic fibers trigger eccrine sweating while sympathetic noradrenergic tone regulates cutaneous blood flow.',
    clinicalSignificance: [
      'Rule of Nines estimates burn surface area affecting fluid loss, thermoregulation, and infection risk.',
      'Atopic dermatitis, psoriasis, contact urticaria, and bacterial/fungal infections disrupt epidermal barrier integrity.'
    ],
    pharmaceuticalRelevance: [
      'Stratum corneum is the rate-limiting barrier for topical ointments/creams and transdermal patches (fentanyl, nitroglycerin, nicotine, scopolamine, estradiol—requiring low MW <500 Da and balanced lipophilicity).',
      'Subcutaneous (SC) and intradermal (ID) injections target the hypodermis and dermis respectively; hydration/occlusion enhances percutaneous absorption.'
    ],
    examEssentials: [
      'Epidermal strata (deep → superficial): Basale → Spinosum → Granulosum → Lucidum (thick skin only) → Corneum.',
      'Stratum corneum is the rate-limiting barrier for transdermal patches; Dermis is vascular, Epidermis is avascular.'
    ],
    visualIds: [],
    anatomyDiagramKey: 'skin',
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['skin', 'cutis', 'epidermis', 'dermis', 'stratum corneum', 'transdermal', 'sweat gland', 'sebaceous']
  },
  {
    id: 'anat_45_skeletal_muscle',
    catalogNumber: 45,
    name: 'Skeletal muscle',
    scientificName: 'Textus muscularis striatus skeletalis',
    alternateNames: ['Voluntary Striated Muscle'],
    primaryCategory: 'musculoskeletal',
    categories: ['musculoskeletal', 'tissues'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_musculoskeletal_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_49_bone_tissue', 'anat_50_tendons', 'anat_46_smooth_muscle', 'anat_47_cardiac_muscle'],
    overview: 'Voluntary, multinucleated, cross-striated contractile tissue (~40% of body mass) generating locomotion, posture, respiratory ventilation, and serving as the primary site of intramuscular depot injections.',
    definition: 'Striated voluntary muscle tissue composed of cylindrical unbranched syncytial fibers anchored to bones via tendons and innervated by somatic α-motor neurons.',
    anatomicalLocation: 'Attached across joints throughout the axial and appendicular skeleton (including diaphragm, intercostals, limb flexors/extensors, deltoid, gluteus maximus, and vastus lateralis).',
    structure: 'Long cylindrical non-branching fibers containing multiple peripheral nuclei beneath the sarcolemma, wrapped sequentially in endomysium, perimysium, and epimysium. Packed with myofibrils exhibiting alternating A (dark myosin) and I (light actin) bands organized into sarcomeres (Z-disc to Z-disc) alongside T-tubules and Ca²⁺-storing sarcoplasmic reticulum.',
    components: [
      { name: 'Sarcomere (Actin & Myosin Filaments)', role: 'Functional contractile unit shortening as myosin heads pull thin actin filaments via ATP hydrolysis and Ca²⁺–Troponin C binding.' },
      { name: 'Neuromuscular Junction (Motor Endplate)', role: 'Somatic α-motor neuron releases ACh onto Nicotinic N_M receptors triggering depolarization and SR Ca²⁺ release.' },
      { name: 'Type I vs Type II Fibers', role: 'Slow-oxidative red fibers (posture/endurance) vs fast-glycolytic white fibers (rapid sprints).' }
    ],
    functions: [
      'Voluntary locomotion, posture maintenance, facial expression, and joint stabilization',
      'Thoracic respiratory pump mechanics (diaphragm and intercostal muscles)',
      'Thermogenesis (shivering & resting tone) and venous/lymphatic return pumping',
      'Primary glucose disposal sink (~75% of insulin-stimulated glucose uptake via GLUT4)'
    ],
    physiology: 'Action potential propagates down T-tubules → dihydropyridine/ryanodine receptor coupling releases SR Ca²⁺ → Ca²⁺ binds Troponin C → tropomyosin exposes actin binding sites → cross-bridge cycling (sliding filament mechanism).',
    clinicalSignificance: [
      'Duchenne muscular dystrophy, myasthenia gravis, rhabdomyolysis (myoglobinuria), and malignant hyperthermia affect skeletal muscle.',
      'Muscle wasting (sarcopenia/cachexia) alters volume of distribution and serum creatinine baseline.'
    ],
    pharmaceuticalRelevance: [
      'Nicotinic N_M receptors at the neuromuscular junction are blocked by non-depolarizing muscle relaxants (rocuronium, vecuronium) and depolarizing succinylcholine during surgical anesthesia; reversed by neostigmine/sugammadex.',
      'Deltoid, vastus lateralis, and gluteal muscles provide rapid or sustained systemic absorption for intramuscular (IM) vaccines and depot antipsychotics/steroids; statins rarely cause myalgia/rhabdomyolysis.'
    ],
    examEssentials: [
      'Skeletal muscle = Voluntary, Striated, Unbranched, MULTINUCLEATED with PERIPHERAL nuclei; NO gap junctions or intercalated discs.',
      'Ca²⁺ binds TROPONIN C in skeletal/cardiac muscle; N_M nicotinic receptors mediate contraction at the neuromuscular junction.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_guyton', 'tb_ross_wilson'],
    searchKeywords: ['skeletal muscle', 'sarcomere', 'actin', 'myosin', 'troponin', 'nmj', 'nicotinic', 'intramuscular']
  },
  {
    id: 'anat_46_smooth_muscle',
    catalogNumber: 46,
    name: 'Smooth muscle',
    scientificName: 'Textus muscularis nonstriatus',
    alternateNames: ['Visceral Involuntary Muscle'],
    primaryCategory: 'tissues',
    categories: ['tissues', 'musculoskeletal'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_cellular_tissue_biology',
    topicId: 'topic_tissues',
    subtopicIds: [],
    relatedStructureIds: ['anat_45_skeletal_muscle', 'anat_47_cardiac_muscle', 'anat_06_stomach', 'anat_18_bronchi'],
    overview: 'Involuntary, non-striated spindle-shaped contractile tissue lining hollow viscera, blood vessels, airways, ureters, and iris to sustain slow, energy-efficient tonic contraction and peristalsis.',
    definition: 'Unstriated involuntary muscle composed of fusiform mononucleated cells regulated by the autonomic nervous system, local hormones, and stretch.',
    anatomicalLocation: 'Walls of blood vessels (tunica media), gastrointestinal tract, bronchi/bronchioles, ureters, urinary bladder detrusor, uterus, and ocular iris/ciliary body.',
    structure: 'Small spindle-shaped cells (single central oval nucleus) lacking sarcomeres and T-tubules; thin actin filaments anchor to cytoplasmic dense bodies and membrane caveolae. Subdivided into Single-Unit (visceral) smooth muscle linked by gap junctions for synchronized peristalsis, and Multi-Unit smooth muscle (iris, large arteries) allowing fine graded control.',
    components: [
      { name: 'Calmodulin & MLCK Activation', role: 'Lacks troponin; intracellular Ca²⁺ binds Calmodulin to activate Myosin Light-Chain Kinase (MLCK) for cross-bridge attachment.' },
      { name: 'Gap Junctions (Single-Unit)', role: 'Spread slow pacemaker slow-waves synchronously across GI, ureteral, and uterine sheets.' }
    ],
    functions: [
      'Propels luminal contents along GI tract, ureters, and bile ducts via peristalsis',
      'Regulates systemic blood pressure and organ perfusion via arteriolar vascular tone',
      'Controls bronchial airflow caliber, bladder emptying, and pupillary light aperture'
    ],
    physiology: 'Ca²⁺ enters largely from extracellular fluid via L-type Ca²⁺ channels and sarcoplasmic reticulum; Ca²⁺-calmodulin activates MLCK. Latch-bridge state sustains prolonged tone (arterioles, sphincters) with minimal ATP consumption; NO/cGMP and β₂/cAMP promote relaxation.',
    clinicalSignificance: [
      'Hyper-reactive bronchial smooth muscle causes asthma; excessive arteriolar smooth muscle tone drives hypertension; uterine smooth muscle spasm causes dysmenorrhea.'
    ],
    pharmaceuticalRelevance: [
      'Primary target of antihypertensive vasodilators (amlodipine L-type CCB, nitrates releasing NO → cGMP, hydralazine), bronchodilators (salbutamol β₂, ipratropium M₃), GI/urinary antispasmodics (dicyclomine, tamsulosin), and tocolytics/uterotonics (oxytocin, nifedipine).',
      'Because smooth muscle uses Calmodulin–MLCK instead of Troponin, drugs modifying cAMP/cGMP dramatically control visceral relaxation.'
    ],
    examEssentials: [
      'Smooth muscle = Involuntary, NON-STRIATED, Spindle-shaped, Single CENTRAL nucleus; lacks Troponin (uses Ca²⁺–Calmodulin → MLCK).',
      'Single-unit visceral muscle contains gap junctions; Multi-unit (iris, vas deferens, large arteries) fires independently.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_guyton', 'tb_ross_wilson'],
    searchKeywords: ['smooth muscle', 'calmodulin', 'mlck', 'peristalsis', 'vasodilation', 'bronchodilation', 'single unit']
  },
  {
    id: 'anat_47_cardiac_muscle',
    catalogNumber: 47,
    name: 'Cardiac muscle',
    scientificName: 'Textus muscularis striatus cardiacus',
    alternateNames: ['Myocardium'],
    primaryCategory: 'tissues',
    categories: ['tissues', 'cardiovascular', 'musculoskeletal'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_cellular_tissue_biology',
    topicId: 'topic_tissues',
    subtopicIds: [],
    relatedStructureIds: ['anat_03_heart', 'anat_45_skeletal_muscle', 'anat_46_smooth_muscle', 'anat_60_heart_valves'],
    overview: 'Involuntary, striated, branching myocytes joined end-to-end by intercalated discs to form an electrically coupled functional syncytium powering lifelong rhythmic heartbeats.',
    definition: 'Specialized striated involuntary muscle tissue restricted exclusively to the heart wall (myocardium) and proximal great vessel cuffs.',
    anatomicalLocation: 'Middle thick muscular layer (myocardium) of the right/left atria and ventricles of the heart (#3).',
    structure: 'Short, branched cylindrical cardiomyocytes containing 1–2 central nuclei, abundant mitochondria (~25–35% of cell volume for fatigue resistance), organized actin-myosin sarcomeres, large T-tubules at Z-discs, and step-like Intercalated Discs housing mechanical desmosomes and electrical connexin-43 gap junctions.',
    components: [
      { name: 'Intercalated Discs', role: 'Desmosomes prevent cellular separation under high systolic tension; Gap junctions pass action potentials rapidly across cells as a functional syncytium.' },
      { name: 'L-Type Ca²⁺ Plateau & CICR', role: 'Extracellular Ca²⁺ influx during Phase 2 action potential plateau triggers Calcium-Induced Calcium Release (CICR) from the SR.' }
    ],
    functions: [
      'Synchronized myogenic contraction generating systolic blood ejection (~3 billion beats per lifetime without fatigue)',
      'Propagates SA/AV pacemaker impulses uniformly across atrial and ventricular syncytia',
      'Long refractory period prevents tetanic contraction, guaranteeing diastolic ventricular filling'
    ],
    physiology: 'Unlike skeletal muscle, cardiac contraction strictly requires extracellular Ca²⁺ influx (Phase 2 plateau ~200–300 ms) to trigger SR Ca²⁺ release and prevent lethal tetany; relies heavily on aerobic fatty acid/lactate metabolism.',
    clinicalSignificance: [
      'Cardiomyocytes are terminally differentiated with minimal regenerative capacity—ischemic necrosis heals via non-contractile fibrous scar tissue.',
      'Re-entry circuits across scarred myocardium precipitate ventricular arrhythmias.'
    ],
    pharmaceuticalRelevance: [
      'Calcium channel blockers (verapamil, diltiazem), β₁-blockers, Vaughan-Williams Class I–IV antiarrhythmics, and digoxin (increasing intracellular SR Ca²⁺ via Na⁺/K⁺-ATPase inhibition) directly modulate cardiac action potentials and inotropy.',
      'Troponin I/T and CK-MB released from injured cardiomyocytes serve as gold-standard serum biomarkers for acute myocardial infarction.'
    ],
    examEssentials: [
      'Cardiac muscle = Involuntary, Striated, BRANCHED, 1–2 CENTRAL nuclei, joined by INTERCALATED DISCS (desmosomes + gap junctions).',
      'Long plateau action potential (L-type Ca²⁺ influx) produces a long absolute refractory period that PREVENTS tetany.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_guyton', 'tb_ross_wilson'],
    searchKeywords: ['cardiac muscle', 'myocardium', 'intercalated discs', 'functional syncytium', 'cicr', 'troponin i', 'digoxin']
  },
  {
    id: 'anat_48_cartilage',
    catalogNumber: 48,
    name: 'Cartilage',
    scientificName: 'Textus cartilagineus',
    alternateNames: ['Hyaline, Elastic & Fibrocartilage'],
    primaryCategory: 'musculoskeletal',
    categories: ['musculoskeletal', 'tissues'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_musculoskeletal_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_49_bone_tissue', 'anat_55_connective_tissue', 'anat_17_trachea', 'anat_51_ligaments'],
    overview: 'Avascular, aneural resilient specialized connective tissue rich in chondroitin sulfate and collagen providing low-friction joint cushioning and airway structural patency.',
    definition: 'A firm, flexible supportive connective tissue composed of chondrocytes housed inside matrix lacunae embedded in dense proteoglycan-collagen gel.',
    anatomicalLocation: 'Articular surfaces of synovial joints, tracheal rings/bronchi/larynx, anterior nose, costal cartilages, external ear pinna, epiglottis, intervertebral discs, and pubic symphysis.',
    structure: 'Lacks blood vessels and nerves (nutrients diffuse slowly from surrounding vascular perichondrium or synovial fluid). Classified into three types: Hyaline (Type II collagen, glassy smooth—joints, trachea, costal), Elastic (elastin fibers—pinna, epiglottis), and Fibrocartilage (dense Type I collagen bundles—intervertebral discs, knee menisci).',
    components: [
      { name: 'Chondrocytes in Lacunae', role: 'Maintain extracellular aggrecan proteoglycans and collagen fibers under low oxygen tension.' },
      { name: 'Aggrecan & Chondroitin Sulfate', role: 'Hydrated negatively charged glycosaminoglycans resisting compressive joint loads.' }
    ],
    functions: [
      'Provides ultra-low-friction shock-absorbing articular surfaces on synovial bones',
      'Maintains permanent airway openness in nose, larynx, trachea, and bronchi',
      'Forms the fetal cartilage template and childhood epiphyseal growth plates for endochondral bone elongation'
    ],
    physiology: 'Cyclical joint loading squeezes and re-absorbs synovial fluid across articular hyaline cartilage ("sponge nutrition"); avascularity dramatically slows adult cartilage repair.',
    clinicalSignificance: [
      'Progressive breakdown of articular hyaline cartilage and subchondral remodeling defines Osteoarthritis.',
      'Herniation of the intervertebral fibrocartilage annulus fibrosus compresses spinal nerve roots (sciatica).'
    ],
    pharmaceuticalRelevance: [
      'Fluoroquinolones (ciprofloxacin) accumulate in juvenile weight-bearing articular cartilage and risk chondrotoxicity (generally avoided in growing children unless essential).',
      'Osteoarthritis symptom management utilizes oral/topical NSAIDs, intra-articular corticosteroids or hyaluronic acid viscosupplements, and nutraceutical chondroitin/glucosamine.'
    ],
    examEssentials: [
      'Three types: Hyaline (most common: articular joints, trachea, nose, costal), Elastic (ear pinna, epiglottis), Fibrocartilage (strongest: intervertebral discs, menisci, pubic symphysis).',
      'Cartilage is AVASCULAR and ANEURAL → heals very slowly after injury.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['cartilage', 'hyaline', 'elastic cartilage', 'fibrocartilage', 'chondrocyte', 'osteoarthritis', 'avascular']
  },
  {
    id: 'anat_49_bone_tissue',
    catalogNumber: 49,
    name: 'Bone tissue',
    scientificName: 'Textus osseus',
    alternateNames: ['Osseous Tissue', 'Compact & Spongy Bone'],
    primaryCategory: 'musculoskeletal',
    categories: ['musculoskeletal', 'tissues'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_musculoskeletal_system',
    subtopicIds: ['subtopic_osteology_bones'],
    relatedStructureIds: ['anat_43_bone_marrow', 'anat_48_cartilage', 'anat_50_tendons', 'anat_51_ligaments'],
    overview: 'Dynamic, richly vascularized mineralized connective tissue forming the 206 bones of the human skeleton (80 axial + 126 appendicular), protecting organs and banking 99% of body calcium.',
    definition: 'Hard calcified specialized connective tissue consisting of osteoprogenitors, osteoblasts, osteocytes, and osteoclasts embedded in a Type I collagen and hydroxyapatite mineral matrix.',
    anatomicalLocation: 'Forms all 206 adult bones across Axial (skull, hyoid, ossicles, vertebrae, sternum, ribs) and Appendicular (girdles, upper and lower limbs) divisions.',
    structure: 'Organized macroscopically into dense outer Compact (Cortical) Bone built from concentric Haversian systems (osteons with central neurovascular canals and canaliculi) and inner honeycomb Spongy (Trabecular/Cancellous) Bone housing red bone marrow (#43). Matrix is ~65% inorganic calcium hydroxyapatite [Ca₁₀(PO₄)₆(OH)₂] for compressive hardness and ~35% Type I collagen for tensile flexibility.',
    components: [
      { name: 'Osteoblasts & Osteocytes', role: 'Osteoblasts secrete organic osteoid and mineralize bone; mature osteocytes inside lacunae sense mechanical load.' },
      { name: 'Osteoclasts', role: 'Multinucleated monocyte-derived cells secreting H⁺ and cathepsin K to resorb mineralized matrix during remodeling.' },
      { name: 'Compact Osteons & Trabeculae', role: 'Haversian canals, Volkmann’s transverse perforating canals, and stress-aligned spongy trabeculae.' }
    ],
    functions: [
      'Rigid structural framework, visceral protection (brain, spinal cord, heart, lungs), and muscle lever mechanics',
      'Body mineral reservoir storing ~99% of total calcium and ~85% of phosphate under PTH/Calcitriol/Calcitonin control',
      'Protects and houses hematopoietic bone marrow (#43) and produces osteocalcin'
    ],
    physiology: 'Bone remodels continuously throughout life via coupled osteoclast resorption and osteoblast deposition (~5–10% of adult skeleton replaced annually) guided by mechanical stress (Wolff’s law) and estrogen/PTH.',
    clinicalSignificance: [
      'Postmenopausal estrogen decline accelerates osteoclast bone resorption, causing Osteoporosis and fragility fractures (hip, vertebrae, wrist).',
      'Vitamin D deficiency impairs matrix mineralization, causing childhood Rickets and adult Osteomalacia.'
    ],
    pharmaceuticalRelevance: [
      'Osteoporosis therapies: Bisphosphonates (alendronate, zoledronate—inhibit osteoclasts; require upright fasting dosing with full water), denosumab (anti-RANKL mAb), teriparatide, and Vitamin D₃ + Calcium.',
      'Chronic systemic glucocorticoids induce osteoporosis and osteonecrosis; tetracyclines and heavy metals (lead, strontium) deposit in mineralizing bone.'
    ],
    examEssentials: [
      'Adult skeleton = 206 bones (80 Axial + 126 Appendicular); Compact bone structural unit = Osteon (Haversian system).',
      'Osteoblasts BUILD bone; Osteocytes MAINTAIN bone; Osteoclasts RESORB bone; Matrix = ~65% hydroxyapatite + ~35% Type I collagen.'
    ],
    visualIds: [],
    anatomyDiagramKey: 'skeleton',
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['bone tissue', 'osseous', 'osteon', 'haversian', 'osteoblast', 'osteoclast', 'osteoporosis', 'bisphosphonate', '206 bones']
  },
  {
    id: 'anat_50_tendons',
    catalogNumber: 50,
    name: 'Tendons',
    scientificName: 'Tendines',
    alternateNames: ['Muscle-to-Bone Cords', 'Aponeuroses'],
    primaryCategory: 'musculoskeletal',
    categories: ['musculoskeletal', 'tissues'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_musculoskeletal_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_45_skeletal_muscle', 'anat_49_bone_tissue', 'anat_51_ligaments', 'anat_55_connective_tissue'],
    overview: 'Inelastic, parallel-bundled dense regular fibrous connective tissue cords transmitting skeletal muscle contractile force precisely onto bone insertion sites.',
    definition: 'Strong white glistening fibrous cords (or broad flat aponeuroses) connecting skeletal muscle bellies to bone periosteum.',
    anatomicalLocation: 'At the proximal origins and distal insertions of skeletal muscles throughout the limbs and trunk (e.g., Achilles/calcaneal tendon, patellar tendon, rotator cuff, biceps tendons).',
    structure: 'Dense regular connective tissue composed of tightly packed, parallel-aligned Type I collagen fascicles interspersed with flattened fibroblasts (tenocytes), scant proteoglycans, and sparse blood supply—often gliding within synovial tendon sheaths over joints.',
    components: [
      { name: 'Parallel Type I Collagen Fascicles', role: 'Provide extraordinary unidirectional tensile strength along the line of muscle pull.' },
      { name: 'Tenocytes & Enthesis', role: 'Tenocytes maintain collagen turnover; fibrocartilaginous enthesis anchors collagen Sharpey’s fibers directly into bone.' },
      { name: 'Golgi Tendon Organs', role: 'Proprioceptive mechanoreceptors near the myotendinous junction preventing excessive muscle tension tearing.' }
    ],
    functions: [
      'Transmits contractile mechanical force from skeletal muscle to move bones across joints',
      'Stores and returns elastic strain energy during walking and running (e.g., Achilles tendon)',
      'Monitors excessive contractile tension via Golgi tendon organs to inhibit agonistic alpha-motor neurons'
    ],
    physiology: 'Relatively low vascularity and slow tenocyte collagen synthesis explain why tendonitis and tendon ruptures heal much more slowly than well-perfused skeletal muscle.',
    clinicalSignificance: [
      'Repetitive mechanical overload triggers tendinopathy/tendinitis (rotator cuff, lateral epicondylitis, Achilles); sudden eccentric load causes complete Achilles rupture (positive Thompson test).',
      'Golgi tendon reflex protects muscle-tendon units from avulsion under extreme loads.'
    ],
    pharmaceuticalRelevance: [
      'Systemic fluoroquinolones (ciprofloxacin, levofloxacin) carry a boxed warning for tendinitis and Achilles tendon rupture—risk heightened in older adults and concomitant systemic corticosteroids.',
      'Local peritendinous corticosteroid injections relieve tenosynovitis inflammation, though direct intratendinous injection weakens collagen and risks rupture.'
    ],
    examEssentials: [
      'TENDONS connect MUSCLE to BONE; LIGAMENTS connect BONE to BONE.',
      'Composed of Dense Regular Connective Tissue (parallel Type I collagen); Fluoroquinolones + steroids increase Achilles tendon rupture risk.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['tendons', 'achilles tendon', 'muscle to bone', 'dense regular connective tissue', 'tenocytes', 'fluoroquinolone']
  },
  {
    id: 'anat_51_ligaments',
    catalogNumber: 51,
    name: 'Ligaments',
    scientificName: 'Ligamenta',
    alternateNames: ['Bone-to-Bone Stabilizers', 'Articular Capsular Ligaments'],
    primaryCategory: 'musculoskeletal',
    categories: ['musculoskeletal', 'tissues'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_musculoskeletal_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_49_bone_tissue', 'anat_50_tendons', 'anat_48_cartilage', 'anat_55_connective_tissue'],
    overview: 'Tough fibrous bone-to-bone bands reinforcing synovial joint capsules, guiding normal articular motion, and preventing abnormal joint dislocation.',
    definition: 'Dense regular connective tissue bands or sheets connecting bone to bone across joints (or suspending visceral organs such as hepatic/uterine ligaments).',
    anatomicalLocation: 'Spanning skeletal articulations externally and internally (e.g., ACL/PCL inside the knee, collateral ankle ligaments, glenohumeral, and spinal longitudinal ligaments).',
    structure: 'Dense regular bundles of Type I collagen with slightly higher elastin content (e.g., spinal ligamentum flavum) and more interwoven orientation than tendons to resist multidirectional joint shear, maintained by sparse fibroblasts with limited vascularity.',
    components: [
      { name: 'Collagenous Fiber Bundles & Elastin', role: 'Restrict excessive hyperextension, valgus/varus angulation, and joint translation while allowing physiological motion.' },
      { name: 'Joint Proprioceptors', role: 'Ruffini and Pacinian endings trigger protective muscular splinting reflexes when ligaments stretch abnormally.' }
    ],
    functions: [
      'Unites articulating bones mechanically and stabilizes synovial joints passively',
      'Defines safe anatomical axes and ranges of joint motion',
      'Provides continuous articular proprioceptive feedback on joint angle and tension'
    ],
    physiology: 'Poor baseline blood supply restricts spontaneous healing of complete intra-articular ligament tears (such as the ACL), often requiring surgical autograft reconstruction.',
    clinicalSignificance: [
      'Overstretching or tearing a ligament causes a joint SPRAIN (contrast muscle/tendon STRAIN)—most commonly the anterior talofibular ankle ligament or knee ACL.',
      'Relaxin hormone late in pregnancy increases pelvic ligament laxity prior to parturition.'
    ],
    pharmaceuticalRelevance: [
      'Acute ligament sprains are managed with RICE, topical/oral NSAIDs (diclofenac, ibuprofen), and paracetamol while avoiding premature masking of mechanical instability.',
      'Repeated corticosteroid joint injections degrade periarticular collagen integrity.'
    ],
    examEssentials: [
      'LIGAMENTS connect BONE to BONE (injury = SPRAIN); TENDONS connect MUSCLE to BONE (injury = STRAIN).',
      'Dense regular connective tissue; intra-articular ligaments (e.g., ACL) have poor vascularity and limited self-healing.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['ligaments', 'bone to bone', 'sprain', 'acl', 'joint stability', 'dense regular connective tissue']
  },
  {
    id: 'anat_52_blood',
    catalogNumber: 52,
    name: 'Blood',
    scientificName: 'Sanguis',
    alternateNames: ['Circulating Fluid Connective Tissue', 'Plasma & Formed Elements'],
    primaryCategory: 'cardiovascular',
    categories: ['cardiovascular', 'tissues'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_lymphatic_system',
    subtopicIds: ['subtopic_hematopoiesis'],
    relatedStructureIds: ['anat_03_heart', 'anat_43_bone_marrow', 'anat_32_spleen', 'anat_55_connective_tissue'],
    overview: 'Specialized fluid connective tissue (~5 L, 7–8% of body weight) composed of ~55% plasma and ~45% formed elements transporting O₂, nutrients, immune leukocytes, clotting factors, and bound drugs.',
    definition: 'A circulating specialized connective tissue whose liquid extracellular matrix (plasma) suspends erythrocytes, leukocytes, and thrombocytes throughout the cardiovascular system.',
    anatomicalLocation: 'Confined within the heart chambers and systemic/pulmonary arterial, capillary, and venous vasculature.',
    structure: 'Two fractions separated by centrifugation: Plasma (~55%—91.5% water, 7% proteins including albumin, globulins, fibrinogen, plus electrolytes/solutes) and Formed Elements (~45% hematocrit—anucleate biconcave RBCs [4.5–6.0 M/μL], 5 WBC types [4,000–11,000/μL: Neutrophils, Lymphocytes, Monocytes, Eosinophils, Basophils], and Platelets [150,000–450,000/μL]).',
    components: [
      { name: 'Erythrocytes (RBCs & Hemoglobin)', role: 'Biconcave flexible discs packing ~280 million hemoglobin molecules per cell for O₂/CO₂ transport (lifespan ~120 days).' },
      { name: 'Leukocytes (WBCs — Granulocytes & Agranulocytes)', role: 'Innate phagocytosis (neutrophils, monocytes/macrophages), parasitic/allergic response (eosinophils, basophils), and adaptive immunity (T/B lymphocytes).' },
      { name: 'Platelets & Clotting Proteins', role: 'Form primary platelet plug stabilized by fibrin meshwork (clotting cascade Factors I–XIII) for hemostasis.' },
      { name: 'Plasma Albumin & α₁-Acid Glycoprotein', role: 'Maintain ~25 mmHg colloid oncotic pressure and reversibly bind circulating acidic and basic drugs.' }
    ],
    functions: [
      'Respiratory O₂ delivery (bound to Hb) and CO₂/nutrient/hormone/waste transport',
      'Thermal distribution and arterial pH buffering (7.35–7.45 via HCO₃⁻, Hb, and plasma proteins)',
      'Hemostatic coagulation preventing hemorrhage after vascular injury',
      'Cellular and humoral immune defense against pathogens'
    ],
    physiology: 'Blood viscosity (~3.5–4.5× water) depends on hematocrit; plasma osmotic pressure draws interstitial fluid back into venules (Starling forces). ABO/Rh surface antigens determine transfusion compatibility.',
    clinicalSignificance: [
      'Reduced hemoglobin/RBCs causes anemia; elevated WBCs indicate infection/leukemia; low platelets cause petechiae/hemorrhage; elevated ESR indicates systemic inflammation.',
      'Incompatible ABO transfusion causes immediate intravascular IgM hemolysis.'
    ],
    pharmaceuticalRelevance: [
      'Albumin binds acidic drugs (warfarin, phenytoin, diazepam, NSAIDs); α₁-acid glycoprotein binds basic drugs (propranolol, lidocaine)—only the UNBOUND free fraction (f_u) exerts pharmacological action and undergoes glomerular filtration.',
      'Hematological bench target of anticoagulants (warfarin inhibiting Vitamin K epoxide reductase; heparin activating Antithrombin III), antiplatelets (aspirin, clopidogrel), and fibrinolytics (alteplase).'
    ],
    examEssentials: [
      'Arterial pH = 7.35–7.45; Normal total blood volume ≈ 5–6 L; Hematocrit ≈ 45% (males) / 42% (females).',
      'WBC differential mnemonic ("Never Let Monkeys Eat Bananas"): Neutrophils (60–70%) > Lymphocytes (20–30%) > Monocytes (3–8%) > Eosinophils (2–4%) > Basophils (<1%).'
    ],
    visualIds: [],
    anatomyDiagramKey: 'microscope',
    textbookRefIds: ['tb_sembulingam', 'tb_tortora', 'tb_guyton'],
    searchKeywords: ['blood', 'sanguis', 'plasma', 'albumin', 'rbc', 'wbc', 'platelets', 'hematocrit', 'protein binding', 'abo']
  },
  {
    id: 'anat_53_adipose_tissue',
    catalogNumber: 53,
    name: 'Adipose tissue',
    scientificName: 'Textus adiposus',
    alternateNames: ['Fat Tissue', 'White & Brown Adipocytes'],
    primaryCategory: 'tissues',
    categories: ['tissues', 'endocrine'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_cellular_tissue_biology',
    topicId: 'topic_tissues',
    subtopicIds: [],
    relatedStructureIds: ['anat_55_connective_tissue', 'anat_44_skin', 'anat_11_right_kidney'],
    overview: 'Specialized lipid-storing connective tissue acting as energy reserve, visceral mechanical cushion, thermal insulator, active endocrine organ (leptin/adiponectin), and depot for lipophilic drugs.',
    definition: 'Loose specialized connective tissue dominated by tightly packed adipocytes storing intracellular triglycerides within sparse reticular matrix.',
    anatomicalLocation: 'Subcutaneous hypodermis (#44), perirenal fat capsule padding kidneys (#11/#12), greater omentum, mesentery, epicardium, orbital socket, and yellow bone marrow.',
    structure: 'White Adipose Tissue (unilocular—one huge lipid droplet pushing flattened nucleus and cytoplasm to the cell rim as a "signet-ring" profile) predominates in adults; Brown Adipose Tissue (multilocular—multiple small lipid droplets plus abundant UCP1-expressing mitochondria) generates non-shivering heat in neonates and supraclavicular adults.',
    components: [
      { name: 'White Adipocytes (Unilocular)', role: 'Store ~9 kcal/g high-density triglycerides via insulin-stimulated lipogenesis and release free fatty acids via hormone-sensitive lipase.' },
      { name: 'Brown Adipocytes (UCP1 Thermogenin)', role: 'Uncouples mitochondrial oxidative phosphorylation via UCP1 to dissipate energy directly as warmth.' },
      { name: 'Adipokines (Leptin & Adiponectin)', role: 'Leptin signals hypothalamic satiety; adiponectin enhances peripheral insulin sensitivity.' }
    ],
    functions: [
      'Long-term caloric energy storage and fasting fatty-acid mobilization',
      'Thermal insulation (subcutaneous) and protective mechanical shock absorption (kidneys, eyes, palms/soles)',
      'Endocrine regulation of appetite, insulin sensitivity, and peripheral estrogen aromatization',
      'Non-shivering thermogenesis in neonates via brown fat'
    ],
    physiology: 'Insulin suppresses lipolysis and drives triglyceride storage; catecholamines (β₃/β₁), glucagon, and cortisol activate hormone-sensitive lipase to mobilize non-esterified fatty acids.',
    clinicalSignificance: [
      'Excess visceral abdominal adiposity secretes pro-inflammatory cytokines (TNF-α, IL-6), driving insulin resistance, Type 2 Diabetes, and metabolic syndrome.',
      'Lipodystrophy or severe cachexia eliminates subcutaneous shock padding and metabolic reserve.'
    ],
    pharmaceuticalRelevance: [
      'Highly lipophilic drugs (thiopental, propofol, diazepam, amiodarone, THC, Vitamin D/A/E/K) redistribute extensively into adipose tissue, giving a very large Volume of Distribution (V_d) and prolonged terminal elimination half-life in obesity.',
      'Subcutaneous (SC) injections (insulin, heparin, GLP-1 agonists) are deposited into the hypodermal adipose layer for steady vascular absorption.'
    ],
    examEssentials: [
      'White fat = unilocular signet-ring adipocytes (energy, insulation, leptin); Brown fat = multilocular + mitochondria + UCP1 (non-shivering thermogenesis).',
      'Obesity dramatically increases V_d and half-life of lipophilic drugs (diazepam, amiodarone).'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['adipose tissue', 'fat tissue', 'adipocytes', 'leptin', 'volume of distribution', 'lipophilic', 'subcutaneous']
  },
  {
    id: 'anat_54_nervous_tissue',
    catalogNumber: 54,
    name: 'Nervous tissue',
    scientificName: 'Textus nervosus',
    alternateNames: ['Neurons & Neuroglia'],
    primaryCategory: 'tissues',
    categories: ['tissues', 'nervous'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_cellular_tissue_biology',
    topicId: 'topic_tissues',
    subtopicIds: [],
    relatedStructureIds: ['anat_01_brain', 'anat_02_spinal_cord', 'anat_45_skeletal_muscle', 'anat_55_connective_tissue'],
    overview: 'Electrically excitable communication tissue composed of signal-conducting neurons and supportive neuroglia forming the brain, spinal cord, and peripheral nerves.',
    definition: 'One of the four primary histological tissues specialized to detect stimuli, generate action potentials, and transmit rapid electrochemical signals across synapses.',
    anatomicalLocation: 'Central nervous system (Brain #1, Spinal cord #2), Retina (#58), cranial/spinal peripheral nerves, and autonomic enteric/sympathetic ganglia.',
    structure: 'Two cell populations: Neurons (cell body/soma with Nissl RER bodies, receptive dendrites, and single long signal-conducting axon) and Neuroglia (~5–10× more numerous—CNS Astrocytes, Oligodendrocytes, Microglia, Ependymal cells; PNS Schwann cells and Satellite cells). Myelinated axons exhibit Nodes of Ranvier.',
    components: [
      { name: 'Neurons (Functional Units)', role: 'Generate resting membrane potential (-70 mV) and all-or-none Na⁺/K⁺ action potentials triggering Ca²⁺-dependent synaptic neurotransmitter release.' },
      { name: 'Oligodendrocytes (CNS) & Schwann Cells (PNS)', role: 'Wrap insulating lipid myelin sheaths around axons to accelerate saltatory conduction up to ~120 m/s.' },
      { name: 'Astrocytes & Microglia', role: 'Astrocytes maintain BBB, K⁺ homeostasis, and glutamate uptake; microglia are resident CNS macrophages.' }
    ],
    functions: [
      'Rapid sensory detection, central synaptic integration, and efferent motor/autonomic signaling',
      'Saltatory axonal impulse propagation across Nodes of Ranvier',
      'Neurotransmitter chemical signaling (ACh, NE, DA, 5-HT, GABA, Glutamate)'
    ],
    physiology: 'Depolarization past threshold (-55 mV) opens voltage-gated Na⁺ channels (+30 mV peak), followed by voltage-gated K⁺ efflux repolarization and Na⁺/K⁺-ATPase restoration; impulse jumps node-to-node in myelinated fibers.',
    clinicalSignificance: [
      'CNS oligodendrocyte demyelination produces Multiple Sclerosis; peripheral Schwann demyelination causes Guillain-Barré syndrome.',
      'Mature CNS neurons lack centrioles and do not undergo mitosis, limiting regeneration after stroke or spinal trauma.'
    ],
    pharmaceuticalRelevance: [
      'Local anesthetics (lidocaine, bupivacaine) block voltage-gated Na⁺ channels preferentially in small unmyelinated/lightly myelinated pain C/Aδ fibers.',
      'Antiepileptics (phenytoin, carbamazepine, valproate), SSRIs, benzodiazepines, and cholinesterase inhibitors act directly on neuronal ion channels and synapses.'
    ],
    examEssentials: [
      'Myelin builders: OLIGODENDROCYTES in CNS (1 cell wraps many axons); SCHWANN CELLS in PNS (1 cell wraps 1 internode).',
      'Nissl bodies = Rough ER in neuron soma; Microglia = mesoderm-derived resident CNS macrophages.'
    ],
    visualIds: [],
    anatomyDiagramKey: 'neuron',
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson', 'tb_guyton'],
    searchKeywords: ['nervous tissue', 'neuron', 'neuroglia', 'myelin', 'schwann cell', 'oligodendrocyte', 'action potential', 'synapse']
  },
  {
    id: 'anat_55_connective_tissue',
    catalogNumber: 55,
    name: 'Connective tissue',
    scientificName: 'Textus connectivus',
    alternateNames: ['Connective Tissue Proper & Specialized Matrix'],
    primaryCategory: 'tissues',
    categories: ['tissues'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_cellular_tissue_biology',
    topicId: 'topic_tissues',
    subtopicIds: [],
    relatedStructureIds: ['anat_49_bone_tissue', 'anat_48_cartilage', 'anat_52_blood', 'anat_53_adipose_tissue', 'anat_50_tendons', 'anat_51_ligaments'],
    overview: 'Most abundant and widely distributed primary tissue binding, supporting, insulating, and transporting throughout the body via scattered cells suspended in extensive extracellular matrix.',
    definition: 'Mesoderm-derived primary tissue characterized by widely spaced cells (fibroblasts, macrophages, mast cells) embedded within abundant ground substance and protein fibers (collagen, elastic, reticular).',
    anatomicalLocation: 'Subepithelial lamina propria, dermis (#44), organ capsules/stroma, mesenteries, tendons (#50), ligaments (#51), cartilage (#48), bone (#49), fat (#53), and blood (#52).',
    structure: 'Organized into three elements: Cells (fibroblasts, adipocytes, mast cells, macrophages), Fibers (strong Collagen Type I, stretchable Elastin, fine branching Reticular Type III), and Ground Substance (hyaluronic acid, proteoglycans). Classified into Connective Tissue Proper (Loose areolar/reticular/adipose and Dense regular/irregular/elastic) plus Specialized Connective Tissues (Cartilage, Bone, Blood).',
    components: [
      { name: 'Fibroblasts & Extracellular Matrix', role: 'Secrete procollagen, elastin, and glycosaminoglycans forming structural scaffolding and wound-healing scar tissue.' },
      { name: 'Mast Cells & Macrophages', role: 'Mast cells release histamine and heparin during IgE hypersensitivity; macrophages clear debris and present antigens.' },
      { name: 'Hyaluronic Acid Ground Substance', role: 'Viscous hydrated gel lubricating spaces and resisting bacterial spread unless cleaved by hyaluronidase.' }
    ],
    functions: [
      'Mechanical binding, anchoring, and structural partitioning of organs and epithelia',
      'Nutrient, metabolite, and drug diffusion bed supporting avascular overlying epithelia',
      'Immune surveillance, wound granulation, and tissue repair (fibrosis)'
    ],
    physiology: 'Vascularized loose areolar tissue beneath epithelia delivers oxygen, leukocytes, and systemic drugs via capillary filtration across the hydrated proteoglycan ground substance.',
    clinicalSignificance: [
      'Autoimmune collagen vascular disorders (SLE, rheumatoid arthritis, scleroderma) and genetic collagen/fibrillin defects (Ehlers-Danlos, Marfan syndrome) disrupt connective tissue integrity.',
      'Vitamin C deficiency halts proline/lysine hydroxylation in collagen synthesis causing Scurvy (poor wound healing and fragile capillaries).'
    ],
    pharmaceuticalRelevance: [
      'Subcutaneous co-administration of hyaluronidase depolymerizes hyaluronic acid ground substance to accelerate dispersion of injected biologics/fluids.',
      'Mast cell stabilizers (cromolyn) and antihistamines (cetirizine) block connective-tissue mast cell histamine signaling.'
    ],
    examEssentials: [
      'Connective tissue = Widely spaced cells + Abundant Extracellular Matrix (Derived from MESODERM; usually vascular EXCEPT cartilage).',
      'Vitamin C is essential cofactor for collagen hydroxylation; Histamine & heparin are stored in connective-tissue Mast Cells.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['connective tissue', 'fibroblast', 'collagen', 'elastin', 'mast cell', 'extracellular matrix', 'hyaluronic acid']
  },
  {
    id: 'anat_56_epithelial_tissue',
    catalogNumber: 56,
    name: 'Epithelial tissue',
    scientificName: 'Textus epithelialis',
    alternateNames: ['Epithelium', 'Covering, Lining & Glandular Tissue'],
    primaryCategory: 'tissues',
    categories: ['tissues'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_cellular_tissue_biology',
    topicId: 'topic_tissues',
    subtopicIds: ['subtopic_primary_tissues'],
    relatedStructureIds: ['anat_44_skin', 'anat_55_connective_tissue', 'anat_07_small_intestine', 'anat_17_trachea'],
    overview: 'Closely packed sheets of polarized cells resting on a basement membrane that line body surfaces, cavities, and glands to govern protection, absorption, filtration, and secretion.',
    definition: 'Primary tissue composed of tightly joined, avascular cells with minimal extracellular space separating external or luminal environments from underlying vascular connective tissue.',
    anatomicalLocation: 'Epidermis of skin (#44), alveoli (#4), GI mucosa (#6–9), renal tubules (#11–12), urinary tract (#13–16), blood vessel endothelium, and all exocrine/endocrine glands.',
    structure: 'Exhibits apicobasal polarity (free apical microvilli/cilia vs basal lamina anchored to basement membrane) sealed by tight junctions and desmosomes. Classified by layers (Simple 1-layer, Stratified multi-layer, Pseudostratified) × cell shape (Squamous, Cuboidal, Columnar, plus distensible Transitional urothelium).',
    components: [
      { name: 'Simple Epithelia (Diffusion & Transport)', role: 'Simple Squamous (alveoli, capillaries, Bowman’s), Cuboidal (renal PCT/thyroid), and Columnar (stomach/intestines with goblet/microvilli).' },
      { name: 'Stratified & Transitional Epithelia', role: 'Stratified Squamous resists abrasion (skin, mouth, esophagus); Transitional (urothelium) stretches safely in ureters and bladder.' },
      { name: 'Basement Membrane & Tight Junctions', role: 'Selective molecular filter and paracellular barrier compelling transcellular absorption.' }
    ],
    functions: [
      'Physical, chemical, and microbial barrier protecting underlying connective tissues',
      'Selective absorption of nutrients and oral drugs across polarized enterocyte membranes',
      'Exocrine and endocrine secretion (mucus, enzymes, sweat, hormones) and sensory reception'
    ],
    physiology: 'Completely avascular—nourished by diffusion from capillaries in the underlying connective tissue across the basement membrane—with high mitotic turnover compensating for surface wear.',
    clinicalSignificance: [
      'Over 85% of adult malignant solid tumors are Carcinomas arising from rapidly dividing epithelial tissues.',
      'Chemotherapy drugs selectively damage rapidly dividing oral/GI mucosal epithelia, causing mucositis and diarrhea.'
    ],
    pharmaceuticalRelevance: [
      'All orally, transdermally, inhaled, or ocularly administered drugs must cross at least one epithelial tight-junction barrier before reaching systemic blood.',
      'Lipophilic unionized molecules cross epithelial membranes via passive transcellular diffusion, whereas efflux P-glycoprotein limits apical absorption.'
    ],
    examEssentials: [
      'Avascular, closely packed, sits on a Basement Membrane, rapid regeneration; covers surfaces + forms glands.',
      'Key locations: Alveoli/Endothelium = Simple Squamous; Renal Tubules = Simple Cuboidal; GI = Simple Columnar; Skin/Esophagus = Stratified Squamous; Bladder = Transitional.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['epithelial tissue', 'epithelium', 'squamous', 'cuboidal', 'columnar', 'transitional', 'basement membrane', 'tight junctions']
  },
  {
    id: 'anat_57_cornea',
    catalogNumber: 57,
    name: 'Cornea',
    scientificName: 'Cornea',
    alternateNames: ['Transparent Anterior Ocular Window'],
    primaryCategory: 'sensory',
    categories: ['sensory'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_sensory_organs',
    subtopicIds: ['subtopic_eye_ear_senses'],
    relatedStructureIds: ['anat_28_eyes', 'anat_58_retina', 'anat_56_epithelial_tissue'],
    overview: 'Crystal-clear, avascular anterior fibrous dome of the eye providing ~70% (~43 diopters) of total ocular refractive power while serving as the primary portal for ophthalmic eyedrops.',
    definition: 'The transparent curved anterior sixth of the eye’s outer fibrous tunic continuous peripherally with the opaque white sclera at the limbus.',
    anatomicalLocation: 'Anterior pole of each eyeball (#28) immediately overlying the anterior chamber, aqueous humor, iris, and pupil.',
    structure: 'Five stratified layers (anterior → posterior): outer lipid-coated Non-Keratinized Stratified Squamous Epithelium (5–6 layers, rapid regeneration), Bowman’s membrane, thick avascular Stroma (~90% thickness made of orthogonally latticed collagen lamellae for optical transparency), Descemet’s membrane, and single-layer Na⁺/K⁺-ATPase Endothelium pumping water out to keep stroma dehydrated and clear. Densely innervated by sensory ophthalmic trigeminal (CN V₁) fibers.',
    components: [
      { name: 'Lipophilic Corneal Epithelium', role: 'Outer hydrophobic barrier allowing unionized lipophilic drugs to penetrate into aqueous humor.' },
      { name: 'Hydrophilic Collagen Stroma', role: 'Precision-spaced collagen fibrils transmitting >95% of visible light; requires hydrophilic permeability for full transcorneal passage.' },
      { name: 'Corneal Endothelium Pump', role: 'Maintains relative stromal deturgescence (78% hydration); endothelial failure causes milky corneal edema.' }
    ],
    functions: [
      'Refracts incoming light rays (~43 of the eye’s ~60 diopters total refractive focus) onto the lens and retina',
      'Transmits visible light transparently without blood-vessel scattering',
      'Triggers immediate protective blink and tearing reflexes via ultra-sensitive CN V₁ nociceptors'
    ],
    physiology: 'Completely avascular (oxygen enters directly from tear film/air anteriorly and nutrients from aqueous humor posteriorly); exact uniform collagen spacing cancels light scatter.',
    clinicalSignificance: [
      'Asymmetric corneal curvature causes Astigmatism; Vitamin A deficiency causes xerophthalmia and corneal ulceration (keratomalacia).',
      'Because cornea is avascular, corneal allograft transplants enjoy high immunologic privilege without HLA matching.'
    ],
    pharmaceuticalRelevance: [
      'Optimal corneal drug permeation requires biphasic lipophilic-hydrophilic balance (to traverse both lipid epithelium and aqueous stroma); only ~1–5% of an instilled eyedrop typically penetrates into the anterior chamber.',
      'Topical ophthalmic anesthetics (tetracaine, proparacaine) numb dense corneal CN V₁ nerves briefly for tonometry/foreign-body removal—chronic self-use causes severe corneal ulceration.'
    ],
    examEssentials: [
      'Cornea supplies ~70% of ocular refraction (fixed focus, ~43 D); Crystalline lens provides adjustable accommodation (~20 D).',
      'Avascular (transplants rarely reject) yet richly innervated by Trigeminal CN V₁ (corneal blink reflex).'
    ],
    visualIds: [],
    anatomyDiagramKey: 'senses',
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['cornea', 'refraction', 'avascular', 'corneal epithelium', 'stroma', 'eyedrops', 'transcorneal', 'astigmatism']
  },
  {
    id: 'anat_58_retina',
    catalogNumber: 58,
    name: 'Retina',
    scientificName: 'Retina',
    alternateNames: ['Neural Tunic', 'Rods, Cones & Macula/Fovea'],
    primaryCategory: 'sensory',
    categories: ['sensory', 'nervous'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_sensory_organs',
    subtopicIds: ['subtopic_eye_ear_senses'],
    relatedStructureIds: ['anat_28_eyes', 'anat_57_cornea', 'anat_01_brain', 'anat_54_nervous_tissue'],
    overview: 'Multilayered light-sensitive posterior neuroepithelium of the eye housing ~120 million Rods and ~6 million Cones that transduce photons into optic nerve impulses.',
    definition: 'The innermost neural layer of the posterior eyeball lining the choroid, developmentally an outgrowth of the diencephalon.',
    anatomicalLocation: 'Posterior two-thirds of the inner ocular globe (#28), extending from the ora serrata to the Optic Disc (CN II exit).',
    structure: 'Outer Retinal Pigment Epithelium (RPE—absorbs stray light, recycles Vitamin A retinaldehyde, and forms outer blood-retinal barrier) plus nine neural layers featuring Photoreceptors (Rods & Cones) → Bipolar cells → Retinal Ganglion Cells (whose axons converge at the photoreceptor-free Optic Disc/"blind spot" to exit as Optic Nerve CN II). Center features the Macula Lutea and cone-dense Fovea Centralis.',
    components: [
      { name: 'Rods (~120 million, Rhodopsin)', role: 'High-sensitivity peripheral photoreceptors mediating black-and-white dim/scotopic night vision.' },
      { name: 'Cones (~6 million, Photopsins)', role: 'Red/Green/Blue color photoreceptors concentrated inside the Fovea Centralis mediating sharp daylight visual acuity.' },
      { name: 'Retinal Pigment Epithelium (RPE)', role: 'Phagocytoses shed photoreceptor discs and regenerates 11-cis-retinal from Vitamin A.' }
    ],
    functions: [
      'Phototransduction converting light photons into graded hyperpolarizing photoreceptor potentials',
      'Retinal contrast, edge, and color integration via horizontal and amacrine interneurons',
      'Transmits visual spatial information down Optic Nerve (CN II) to lateral geniculate nucleus and occipital cortex'
    ],
    physiology: 'In darkness, high cGMP keeps Na⁺/Ca²⁺ channels open ("dark current"); light isomerizes 11-cis-retinal → all-trans-retinal, activating transducin → phosphodiesterase → cGMP breakdown → channel closure and hyperpolarization.',
    clinicalSignificance: [
      'Separation of neural retina from underlying choroidal blood supply causes Retinal Detachment; macular loss causes Age-Related Macular Degeneration (AMD).',
      'Vitamin A deficiency impairs rhodopsin regeneration causing night blindness (nyctalopia); diabetes damages retinal microvasculature (diabetic retinopathy).'
    ],
    pharmaceuticalRelevance: [
      'Hydroxychloroquine/chloroquine bind retinal melanin causing irreversible "bull’s-eye maculopathy" with chronic high cumulative dosing; ethambutol causes optic neuritis and red-green dyschromatopsia.',
      'Intravitreal anti-VEGF biologics (ranibizumab, aflibercept, bevacizumab) treat wet AMD and diabetic macular edema; sildenafil weakly inhibits retinal PDE6 causing transient blue-tinted vision.'
    ],
    examEssentials: [
      'RODS = dim/night vision (Rhodopsin, Vitamin A); CONES = color & sharp daylight acuity (concentrated in Fovea Centralis).',
      'Optic Disc lacks photoreceptors = Physiological Blind Spot; Hydroxychloroquine → maculopathy; Ethambutol → optic neuritis.'
    ],
    visualIds: [],
    anatomyDiagramKey: 'senses',
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson', 'tb_guyton'],
    searchKeywords: ['retina', 'rods', 'cones', 'fovea', 'macula', 'rhodopsin', 'vitamin a', 'optic disc', 'hydroxychloroquine']
  },
  {
    id: 'anat_59_diaphragm',
    catalogNumber: 59,
    name: 'Diaphragm',
    scientificName: 'Diaphragma',
    alternateNames: ['Thoracoabdominal Respiratory Dome'],
    primaryCategory: 'respiratory',
    categories: ['respiratory', 'musculoskeletal'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_respiratory_system',
    subtopicIds: [],
    relatedStructureIds: ['anat_04_lungs', 'anat_45_skeletal_muscle', 'anat_05_liver', 'anat_25_esophagus'],
    overview: 'Dome-shaped skeletal muscle partition separating the thoracic and abdominal cavities that serves as the principal inspiratory pump generating ~75% of quiet breathing volume.',
    definition: 'A thin musculotendinous dome forming the floor of the thorax and roof of the abdomen, converging onto a central trefoil aponeurotic tendon.',
    anatomicalLocation: 'Inferior thoracic aperture anchored circumferentially to the xiphoid process, lower six costal cartilages/ribs, and L1–L3 lumbar vertebrae (right and left crura), arching up against the heart and lung bases.',
    structure: 'Peripheral radiating skeletal muscle fibers inserting into a tough Central Tendon, innervated bilaterally by the Phrenic Nerves (C3, C4, C5). Pierced by three major apertures at T8 (Inferior Vena Cava), T10 (Esophagus + Vagus nerves), and T12 (Descending Aorta + Thoracic duct + Azygos vein).',
    components: [
      { name: 'Muscular Dome & Central Tendon', role: 'Contraction flattens the dome downward by ~1–10 cm, expanding vertical thoracic volume and lowering intrapulmonary pressure.' },
      { name: 'Phrenic Nerves (C3, C4, C5)', role: 'Sole somatic motor supply ("C3, 4, 5 keeps the diaphragm alive"); central sensory irritation refers pain to the shoulder tip.' },
      { name: 'Three Major Hiatuses (T8, T10, T12)', role: 'Transmit IVC (T8), Esophagus (T10—crural sling assists LES barrier), and Aorta (T12).' }
    ],
    functions: [
      'Generates ~70–75% of resting tidal volume during quiet inspiration',
      'Increases intra-abdominal pressure during defecation, micturition, parturition, vomiting, and coughing',
      'Aids venous and lymphatic return upward from abdomen into thorax via inspiratory pressure gradient',
      'Right diaphragmatic crus reinforces the physiological Lower Esophageal Sphincter'
    ],
    physiology: 'Quiet inspiration is active (diaphragm contracts downward, dropping alveolar pressure by ~1–2 mmHg below atmospheric pressure); quiet expiration is passive elastic recoil of the lungs and relaxed diaphragm.',
    clinicalSignificance: [
      'Spasmodic involuntary diaphragmatic contractions against a closed glottis cause hiccups (singultus); phrenic nerve palsy elevates the affected hemidiaphragm.',
      'Weakening of the T10 esophageal hiatus allows stomach herniation into the chest (hiatal hernia), worsening GERD.'
    ],
    pharmaceuticalRelevance: [
      'High-dose opioids, barbiturates, and neuromuscular blockers (rocuronium, succinylcholine) depress medullary drive or phrenic neuromuscular transmission, arresting diaphragmatic ventilation.',
      'Thoracic epidural anesthetics climbing above C3–C5 risk acute phrenic nerve diaphragmatic paralysis.'
    ],
    examEssentials: [
      'Innervation = Phrenic Nerve (C3, C4, C5 — "C3, 4, 5 keeps the diaphragm alive").',
      'Vertebral hiatus levels ("I Ate 10 Eggs At 12"): T8 = IVC; T10 = Esophagus; T12 = Aorta.'
    ],
    visualIds: [],
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson'],
    searchKeywords: ['diaphragm', 'phrenic nerve', 'inspiration', 'hiatus', 'c3 c4 c5', 'thoracic pump', 'hiatal hernia']
  },
  {
    id: 'anat_60_heart_valves',
    catalogNumber: 60,
    name: 'Heart valves',
    scientificName: 'Valvae cordis',
    alternateNames: ['Tricuspid, Mitral, Pulmonary & Aortic Valves', 'AV & Semilunar Valves'],
    primaryCategory: 'cardiovascular',
    categories: ['cardiovascular'],
    departmentIds: ['dept_anatomy'],
    subjectId: 'subj_body_systems',
    topicId: 'topic_cardiovascular_system',
    subtopicIds: ['subtopic_heart_chambers'],
    relatedStructureIds: ['anat_03_heart', 'anat_47_cardiac_muscle', 'anat_55_connective_tissue'],
    overview: 'Four avascular endocardium-covered fibrous collagen flaps ensuring strictly one-way blood flow through the cardiac chambers and generating S1 ("lub") and S2 ("dub") heart sounds.',
    definition: 'Four pressure-operated mechanical check valves (two atrioventricular and two semilunar) anchored within the fibrous cardiac skeleton of the heart.',
    anatomicalLocation: 'Positioned in a central transverse plane inside the heart (#3) guarding the right/left atrioventricular orifices and the pulmonary/aortic ventricular outflow tracts.',
    structure: 'Dense collagenous connective tissue cores lined by smooth endocardium: (1) Tricuspid Valve (right AV, 3 cusps), (2) Mitral/Bicuspid Valve (left AV, 2 cusps)—both anchored to ventricular papillary muscles by fibrous chordae tendineae to prevent systolic prolapse into atria; (3) Pulmonary Semilunar Valve (3 pocket cusps), and (4) Aortic Semilunar Valve (3 pocket cusps)—lacking chordae tendineae.',
    components: [
      { name: 'Atrioventricular Valves (Tricuspid & Mitral)', role: 'Open passively during ventricular filling; snap shut at ventricular systole onset (producing S1 "lub"), tethered against eversion by chordae tendineae.' },
      { name: 'Semilunar Valves (Pulmonary & Aortic)', role: 'Open when ventricular systolic pressure exceeds arterial pressure (~25 / ~80 mmHg); snap shut at diastole onset (producing S2 "dub") to prevent arterial backflow.' },
      { name: 'Chordae Tendineae & Papillary Muscles', role: 'Do NOT pull valves open—they brace AV leaflets taut like parachute cords so high ventricular pressure cannot blow leaflets backward.' }
    ],
    functions: [
      'Enforces unidirectional venous-to-pulmonary-to-systemic blood circulation across every beat',
      'Prevents systolic regurgitation into atria and diastolic regurgitation from aorta/pulmonary trunk',
      'Produces clinically auscultated S1 ("lub") and S2 ("dub") closure heart sounds'
    ],
    physiology: 'Heart valves open and close strictly passively along forward/backward pressure gradients (~100% mechanical efficiency); normal diastolic coronary artery perfusion occurs only while the aortic semilunar valve closes cleanly during diastole.',
    clinicalSignificance: [
      'Rheumatic fever (post-streptococcal) or age-related calcification produces valvular Stenosis (narrowed opening) or Regurgitation (leaky closure), heard on stethoscope auscultation as cardiac murmurs.',
      'Infective endocarditis forms friable bacterial vegetations on damaged endocardial valve leaflets.'
    ],
    pharmaceuticalRelevance: [
      'Mechanical prosthetic heart valves require lifelong oral anticoagulation with warfarin (target INR 2.5–3.5; DOACs are contraindicated for mechanical valves) to prevent lethal valve thrombosis.',
      'Acute streptococcal pharyngitis antibiotic treatment prevents rheumatic valvular heart disease; high-risk prosthetic-valve patients receive amoxicillin prophylaxis prior to invasive dental procedures.'
    ],
    examEssentials: [
      'Mitral (Bicuspid) = 2 cusps; Tricuspid, Aortic & Pulmonary = 3 cusps each.',
      'S1 ("lub") = closure of AV valves (start of systole); S2 ("dub") = closure of Semilunar valves (start of diastole). Chordae tendineae attach ONLY to AV valves.'
    ],
    visualIds: ['builtin_heart_anatomy'],
    anatomyDiagramKey: 'heart',
    textbookRefIds: ['tb_tortora', 'tb_ross_wilson', 'tb_guyton'],
    searchKeywords: ['heart valves', 'mitral valve', 'tricuspid valve', 'aortic valve', 'pulmonary valve', 'semilunar', 's1 s2', 'murmur', 'warfarin']
  }
];
