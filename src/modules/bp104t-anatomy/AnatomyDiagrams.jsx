import React, { useEffect, useState } from 'react';
import { AlertTriangle, BookOpen, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Image as ImageIcon, Layers } from 'lucide-react';
import ResourceConnector from '../../components/ResourceConnector';
import { BUILT_IN_VISUALS } from '../visual-library/builtInVisuals';
import ImageViewerModal from '../visual-library/ImageViewerModal';

const PLATE_BY_DIAGRAM = {
  heart: BUILT_IN_VISUALS.find((v) => v.id === 'builtin_heart_anatomy') || null,
  nephron: BUILT_IN_VISUALS.find((v) => v.id === 'builtin_nephron_anatomy') || null,
  cell: BUILT_IN_VISUALS.find((v) => v.id === 'builtin_eukaryotic_cell') || null,
  microscope: BUILT_IN_VISUALS.find((v) => v.id === 'builtin_compound_microscope') || null
};

const SEARCH_BY_DIAGRAM = {
  heart: 'cardiac valves conduction',
  nephron: 'nephron glomerulus filtration',
  cell: 'eukaryotic cell organelles',
  skin: 'epidermis dermis integumentary',
  skeleton: 'axial appendicular skeleton',
  senses: 'retina cochlea anatomy',
  microscope: 'microscope hemocytometer',
  neuron: 'neuron action potential synapse'
};

export default function AnatomyDiagrams({ initialDiagram = null, navNonce = 0 }) {
  const [selectedDiagram, setSelectedDiagram] = useState(initialDiagram || 'heart');
  const [selectedPin, setSelectedPin] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [visualMode, setVisualMode] = useState('schematic');
  const [viewerItem, setViewerItem] = useState(null);

  useEffect(() => {
    if (initialDiagram) {
      setSelectedDiagram(initialDiagram);
      setSelectedPin(0);
    }
  }, [initialDiagram, navNonce]);

  const diagrams = {
    heart: {
      title: 'Human Heart, Valves & Conduction System (Unit V / Exp 16a)',
      subtitle: 'Click any numbered anatomical marker on the heart diagram to inspect its exact location and physiological function.',
      pins: [
        { id: 1, x: 92, y: 74, label: 'Superior Vena Cava', loc: 'Upper right mediastinum entering Right Atrium', fn: 'Returns deoxygenated venous blood from head, neck, and upper limbs into the right atrium.' },
        { id: 2, x: 112, y: 122, label: 'Right Atrium & SA Node', loc: 'Upper right chamber (SA node near SVC opening)', fn: 'Receives venous blood from SVC/IVC. The Sinoatrial (SA) node acts as the primary pacemaker (70–80 bpm).' },
        { id: 3, x: 138, y: 155, label: 'AV Node & Tricuspid Valve', loc: 'Atrioventricular septum between Right Atrium & Right Ventricle', fn: 'AV node delays impulse by ~0.1s allowing atrial emptying; Tricuspid valve (3 cusps) prevents backflow into RA during ventricular systole.' },
        { id: 4, x: 125, y: 205, label: 'Right Ventricle & Purkinje Fibers', loc: 'Inferior anterior-right chamber', fn: 'Pumps deoxygenated blood through the Pulmonary Semilunar Valve into the Pulmonary Trunk toward the lungs.' },
        { id: 5, x: 180, y: 58, label: 'Aortic Arch', loc: 'Superior curve above pulmonary trunk', fn: 'Distributes oxygenated systemic blood via brachiocephalic, left common carotid, and left subclavian arteries.' },
        { id: 6, x: 215, y: 92, label: 'Pulmonary Artery & Semilunar Valve', loc: 'Exits superior Right Ventricle', fn: 'Carries deoxygenated blood to right and left lungs for alveolar gas exchange.' },
        { id: 7, x: 240, y: 128, label: 'Left Atrium & Pulmonary Veins', loc: 'Upper left posterior chamber', fn: 'Receives freshly oxygenated blood via 4 pulmonary veins from the lungs.' },
        { id: 8, x: 222, y: 162, label: 'Mitral (Bicuspid) Valve', loc: 'Between Left Atrium and Left Ventricle', fn: 'Two-leaflet valve preventing retrograde flow into Left Atrium during high-pressure LV contraction.' },
        { id: 9, x: 210, y: 215, label: 'Left Ventricle (Thick Myocardium)', loc: 'Apex & left lower chamber (3× thicker wall than RV)', fn: 'Generates ~120 mmHg systolic pressure to pump oxygenated blood through the Aortic Valve into systemic circulation.' }
      ]
    },
    cell: {
      title: 'Eukaryotic Cell Organelles & Membrane Transport (Unit I)',
      subtitle: 'Click markers 1–8 to inspect cellular organization, intracellular transport, and organelle functions.',
      pins: [
        { id: 1, x: 64, y: 145, label: 'Plasma Membrane (Phospholipid Bilayer)', loc: 'Outer selective semipermeable boundary', fn: 'Regulates transport (passive/facilitated diffusion, osmosis, Na⁺/K⁺ ATPase active pump, endocytosis/exocytosis) and cell signalling.' },
        { id: 2, x: 185, y: 135, label: 'Nucleus & Nucleolus', loc: 'Central double-membrane organelle with nuclear pores', fn: 'Houses chromosomal DNA, coordinates gene transcription, and synthesizes ribosomal RNA (rRNA) in the nucleolus.' },
        { id: 3, x: 135, y: 105, label: 'Rough Endoplasmic Reticulum (RER)', loc: 'Continuous with outer nuclear envelope', fn: 'Studded with 80S ribosomes; synthesizes, folds, and N-glycosylates secretory and membrane proteins.' },
        { id: 4, x: 265, y: 112, label: 'Mitochondrion (Powerhouse)', loc: 'Double-membraned organelle with cristae', fn: 'Generates ATP via Krebs cycle & oxidative phosphorylation; central mediator of intrinsic apoptosis (cytochrome c).' },
        { id: 5, x: 235, y: 195, label: 'Golgi Apparatus', loc: 'Stacked cisternae near ER', fn: 'Modifies, sorts, and packages proteins/lipids into secretory vesicles or lysosomes.' },
        { id: 6, x: 115, y: 205, label: 'Lysosome', loc: 'Acidic single-membrane vesicle', fn: 'Contains hydrolytic enzymes (pH ~4.8) for autophagy, phagocytosis, and macromolecule digestion.' },
        { id: 7, x: 270, y: 170, label: 'Ribosomes (80S)', loc: 'Free in cytosol & bound to RER', fn: 'Translate mRNA codons into polypeptide chains (protein synthesis).' },
        { id: 8, x: 155, y: 190, label: 'Centrosome / Centrioles', loc: 'Perinuclear cytoplasm', fn: 'Organizes mitotic spindle microtubules during mitosis and meiosis.' }
      ]
    },
    skin: {
      title: 'Integumentary System — Skin Cross-Section (Unit II / Exp 16b)',
      subtitle: 'Click pins 1–7 to locate epidermis, dermis, appendages, and sensory receptors.',
      pins: [
        { id: 1, x: 95, y: 58, label: 'Epidermis (Stratum Corneum → Basale)', loc: 'Outermost stratified squamous keratinized layer (avascular)', fn: 'Physical waterproof barrier, UV protection via melanocytes, vitamin D synthesis, and first-line innate defense.' },
        { id: 2, x: 95, y: 125, label: 'Dermis (Papillary & Reticular Layers)', loc: 'Connective tissue beneath epidermis', fn: 'Rich in collagen/elastin fibers providing tensile strength, vascular thermoregulation, and wound granulation.' },
        { id: 3, x: 95, y: 215, label: 'Hypodermis (Subcutaneous Adipose)', loc: 'Deepest fascia anchoring skin to muscle', fn: 'Thermal insulation, mechanical shock absorption, energy reserve, and depot for subcutaneous injections.' },
        { id: 4, x: 185, y: 110, label: 'Hair Follicle & Shaft', loc: 'Invagination extending from epidermis into dermis', fn: 'Produces hair shaft; stem cells inside bulge assist epidermal re-epithelialization during wound healing.' },
        { id: 5, x: 218, y: 118, label: 'Sebaceous Gland', loc: 'Attached to hair follicle in dermis', fn: 'Secretes oily sebum (holocrine) to lubricate hair and maintain acidic skin mantle (antimicrobial).' },
        { id: 6, x: 268, y: 145, label: 'Eccrine Sweat Gland', loc: 'Coiled tubular gland in deep dermis', fn: 'Secretes hypotonic sweat onto skin surface for evaporative cooling (thermoregulation).' },
        { id: 7, x: 155, y: 140, label: 'Arrector Pili Muscle & Sensory Receptors', loc: 'Smooth muscle + Meissner/Pacinian corpuscles', fn: 'Contracts in cold/sympathetic stimulation (piloerection); corpuscles detect touch, vibration, and pressure.' }
      ]
    },
    skeleton: {
      title: 'Human Skeleton — Axial (80) & Appendicular (126) Bones (Exp 4 & 5)',
      subtitle: 'Emerald markers = Axial Skeleton (80); Amber markers = Appendicular Skeleton (126). Click any bone to inspect.',
      pins: [
        { id: 1, x: 180, y: 36, label: 'Skull (Cranium 8 + Facial 14 = 22)', loc: 'Axial Skeleton — Head', fn: 'Protects the brain and special sense organs; mandible forms only movable skull joint (TMJ).' },
        { id: 2, x: 180, y: 88, label: 'Sternum & Thoracic Rib Cage (25)', loc: 'Axial Skeleton — Anterior Thorax', fn: 'Manubrium, body, xiphoid + 12 pairs of ribs (7 true, 3 false, 2 floating) protect heart and lungs.' },
        { id: 3, x: 180, y: 132, label: 'Vertebral Column (26 bones)', loc: 'Axial Skeleton — Dorsal Axis', fn: '7 Cervical, 12 Thoracic, 5 Lumbar, Sacrum, Coccyx; protects spinal cord and supports posture.' },
        { id: 4, x: 140, y: 74, label: 'Clavicle & Scapula (Pectoral Girdle - 4)', loc: 'Appendicular — Shoulder', fn: 'Connects upper limb to axial sternum; glenoid cavity articulates with humeral head.' },
        { id: 5, x: 116, y: 112, label: 'Humerus (Upper Arm - 2)', loc: 'Appendicular — Brachium', fn: 'Longest upper-limb bone; articulates proximally at shoulder and distally with radius & ulna.' },
        { id: 6, x: 105, y: 155, label: 'Radius (Lateral) & Ulna (Medial)', loc: 'Appendicular — Forearm & Hand (60 total)', fn: 'Enable pronation/supination; radial pulse palpated over distal radius; carpals (8), metacarpals (5), phalanges (14) per hand.' },
        { id: 7, x: 180, y: 162, label: 'Pelvic Girdle (2 Coxal Bones)', loc: 'Appendicular — Hip', fn: 'Fusion of Ilium, Ischium, Pubis; acetabulum forms deep ball-and-socket joint with femur.' },
        { id: 8, x: 154, y: 205, label: 'Femur & Patella', loc: 'Appendicular — Thigh & Knee', fn: 'Femur is the longest and strongest bone in the body; Patella is the largest sesamoid bone.' },
        { id: 9, x: 156, y: 248, label: 'Tibia, Fibula & Foot Bones', loc: 'Appendicular — Lower Leg & Foot (60 total)', fn: 'Tibia bears body weight (shinbone); Fibula stabilizes ankle; tarsals (7), metatarsals (5), phalanges (14) per foot.' }
      ]
    },
    senses: {
      title: 'Special Senses: Human Eye & Ear Anatomy (Unit IV)',
      subtitle: 'Click pins 1–8 across the Eye (left) and Ear (right) diagrams to study sensory structures & disorders.',
      pins: [
        { id: 1, x: 52, y: 120, label: 'Cornea & Anterior Chamber', loc: 'Eye — Transparent anterior dome', fn: 'Provides ~70% of refractive power; aqueous humor drainage blockage at Canal of Schlemm raises IOP → Glaucoma.' },
        { id: 2, x: 84, y: 120, label: 'Iris, Pupil & Crystalline Lens', loc: 'Eye — Behind cornea', fn: 'Iris controls pupil size (parasympathetic miosis / sympathetic mydriasis); Lens accommodates focus (opacity → Cataract).' },
        { id: 3, x: 145, y: 102, label: 'Retina & Macula/Fovea', loc: 'Eye — Inner posterior neural layer', fn: 'Rods (scotopic vision) & Cones (color acuity) convert photons to electrical impulses; axial elongation causes Myopia.' },
        { id: 4, x: 168, y: 132, label: 'Optic Nerve (CN II)', loc: 'Eye — Optic disc (blind spot)', fn: 'Transmits retinal ganglion visual signals to occipital visual cortex.' },
        { id: 5, x: 215, y: 125, label: 'Pinna & External Auditory Canal', loc: 'Ear — Outer Ear', fn: 'Collects sound waves and funnels them to tympanic membrane; inflammation causes Otitis Externa.' },
        { id: 6, x: 256, y: 125, label: 'Tympanic Membrane & Ossicles', loc: 'Ear — Middle Ear (Malleus, Incus, Stapes)', fn: 'Amplifies sound vibrations ~20× onto oval window; Eustachian tube equalizes pressure (infection → Otitis Media).' },
        { id: 7, x: 298, y: 95, label: 'Semicircular Canals (Vestibule)', loc: 'Ear — Inner Ear Balance Organ', fn: 'Detects rotational & linear head acceleration; endolymph disturbance causes Vertigo.' },
        { id: 8, x: 318, y: 138, label: 'Cochlea & CN VIII', loc: 'Ear — Inner Ear Hearing Organ', fn: 'Organ of Corti hair cells transduce mechanical sound frequencies into auditory nerve signals.' }
      ]
    },
    microscope: {
      title: 'Compound Microscope & Neubauer Hemocytometer (Exp 1 & 6)',
      subtitle: 'Click markers on the Compound Microscope (left) and Neubauer Grid (right) to inspect lab apparatus.',
      pins: [
        { id: 1, x: 112, y: 36, label: 'Eyepiece (Ocular Lens, 10×)', loc: 'Top of Body Tube', fn: 'Magnifies the primary image produced by the objective lens (Total Mag = Ocular × Objective).' },
        { id: 2, x: 112, y: 92, label: 'Revolving Nosepiece & Objectives', loc: 'Above Mechanical Stage', fn: 'Holds 4×, 10×, 40× (high dry), and 100× (oil immersion) objective lenses.' },
        { id: 3, x: 112, y: 148, label: 'Mechanical Stage & Slide Clips', loc: 'Mid-frame platform', fn: 'Holds glass slide/Neubauer chamber and translates it precisely along X-Y vernier axes.' },
        { id: 4, x: 112, y: 175, label: 'Abbe Condenser & Iris Diaphragm', loc: 'Immediately beneath stage', fn: 'Concentrates light cone onto specimen and regulates contrast & numerical aperture.' },
        { id: 5, x: 162, y: 155, label: 'Coarse & Fine Focus Knobs', loc: 'Lower Arm', fn: 'Coarse brings specimen into initial focus (low power); Fine achieves crisp resolution under 40×/100×.' },
        { id: 6, x: 258, y: 80, label: 'Neubauer Corner WBC Square (1 mm²)', loc: '4 Outer Corners of 3×3 mm Grid', fn: 'Each corner square has 16 medium squares; total 4 corner squares counted for WBC enumeration (1:20 dilution).' },
        { id: 7, x: 300, y: 122, label: 'Neubauer Central RBC Area (1 mm²)', loc: 'Center of 3×3 mm Grid (25 medium squares)', fn: '4 corner + 1 central medium squares (5 total = 0.2 mm², depth 0.1 mm) counted for RBC & Platelet counts.' }
      ]
    },
    neuron: {
      title: 'Multipolar Neuron & Neuromuscular Junction (Exp 3 & Unit II/IV)',
      subtitle: 'Click pins 1–6 to trace nerve impulse propagation and muscle contraction coupling.',
      pins: [
        { id: 1, x: 64, y: 105, label: 'Dendrites', loc: 'Branched receptive processes of Soma', fn: 'Receive graded excitatory/inhibitory synaptic inputs from adjacent neurons.' },
        { id: 2, x: 105, y: 120, label: 'Cell Body (Soma) & Nissl Bodies', loc: 'Nucleated metabolic center', fn: 'Synthesizes neurotransmitters and proteins; integrates graded potentials at the Axon Hillock.' },
        { id: 3, x: 175, y: 120, label: 'Myelin Sheath (Schwann Cells)', loc: 'Insulating lipid layer along Axon', fn: 'Electrically insulates axon to prevent current leak and dramatically speed up conduction.' },
        { id: 4, x: 215, y: 120, label: 'Node of Ranvier', loc: 'Unmyelinated gaps rich in Na⁺ channels', fn: 'Enables rapid Saltatory Conduction as action potentials leap node-to-node.' },
        { id: 5, x: 295, y: 112, label: 'Axon Terminal & ACh Vesicles', loc: 'Presynaptic bulb at Neuromuscular Junction', fn: 'Depolarization opens Ca²⁺ channels → exocytosis of Acetylcholine (ACh) into synaptic cleft.' },
        { id: 6, x: 332, y: 155, label: 'Sarcolemma & Sarcomere (Actin/Myosin)', loc: 'Skeletal Muscle Fiber Motor End Plate', fn: 'ACh binds nicotinic Nm receptors → Na⁺ influx → SR Ca²⁺ release → Troponin/Tropomyosin shift → Actin-Myosin cross-bridge sliding.' }
      ]
    },
    nephron: {
      title: 'Human Nephron — Glomerular Filtration & Tubular Processing (Renal Physiology)',
      subtitle: 'Click pins 1–6 to trace ultrafiltration, countercurrent concentration, and hormone-regulated urine formation.',
      pins: [
        { id: 1, x: 76, y: 84, label: 'Glomerulus (Capillary Tuft)', loc: 'Inside Bowman Capsule (Renal Cortex)', fn: 'Fenestrated capillary network filtering plasma under high hydrostatic pressure (~55 mmHg) to form protein-free ultrafiltrate (~125 mL/min GFR).' },
        { id: 2, x: 60, y: 122, label: 'Bowman Capsule', loc: 'Cup-shaped proximal nephron sac', fn: 'Podocyte filtration slits & basement membrane restrict plasma proteins while collecting filtrate into Bowman space.' },
        { id: 3, x: 146, y: 88, label: 'Proximal Convoluted Tubule (PCT)', loc: 'Renal Cortex', fn: 'Reabsorbs ~65% filtered Na⁺/water, 100% glucose/amino acids (SGLT2), and secretes organic acids/drugs.' },
        { id: 4, x: 172, y: 206, label: 'Loop of Henle', loc: 'Descends into Renal Medulla', fn: 'Establishes corticomedullary osmotic gradient (NKCC2 in thick ascending limb) required to concentrate or dilute urine.' },
        { id: 5, x: 238, y: 82, label: 'Distal Convoluted Tubule (DCT)', loc: 'Renal Cortex (next to JGA)', fn: 'Fine-tunes Na⁺/Cl⁻ reabsorption (NCC, thiazide site) and PTH-regulated Ca²⁺ reabsorption.' },
        { id: 6, x: 298, y: 145, label: 'Collecting Duct', loc: 'Cortex → Medullary Papilla', fn: 'ADH (Vasopressin) inserts Aquaporin-2 water channels; Aldosterone acts on principal cells to reabsorb Na⁺ and excrete K⁺.' }
      ]
    }
  };

  const current = diagrams[selectedDiagram];
  const activePin = current.pins[selectedPin] || current.pins[0];
  const activePlate = PLATE_BY_DIAGRAM[selectedDiagram] || null;

  const handleSelectDiagram = (key) => {
    setSelectedDiagram(key);
    setSelectedPin(0);
    if (!PLATE_BY_DIAGRAM[key]) {
      setVisualMode('schematic');
    }
  };

  return (
    <div className="space-y-6">
      {/* Diagram Selector */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'heart', label: 'Heart & Conduction' },
          { id: 'nephron', label: 'Nephron & Renal Filtration' },
          { id: 'cell', label: 'Eukaryotic Cell' },
          { id: 'skin', label: 'Skin Cross-Section' },
          { id: 'skeleton', label: 'Axial & Appendicular Skeleton' },
          { id: 'senses', label: 'Eye & Ear (Special Senses)' },
          { id: 'microscope', label: 'Microscope & Neubauer Grid' },
          { id: 'neuron', label: 'Neuron & NMJ' }
        ].map((d) => (
          <button
            key={d.id}
            onClick={() => handleSelectDiagram(d.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              selectedDiagram === d.id
                ? 'bg-blue-50 dark:bg-blue-600/20 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm dark:shadow-lg'
                : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Main Diagram & Annotation Inspector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{current.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{current.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {activePlate && (
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setVisualMode('schematic')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    visualMode === 'schematic'
                      ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-sm dark:shadow-none'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Pin Schematic</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisualMode('plate')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    visualMode === 'plate'
                      ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-sm dark:shadow-none'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Scientific Atlas Plate</span>
                </button>
              </div>
            )}
            {activePlate && (
              <button
                type="button"
                onClick={() => setViewerItem(activePlate)}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span>Full Academic Profile</span>
              </button>
            )}
            <button
              onClick={() =>
                activePlate && visualMode === 'plate'
                  ? setViewerItem(activePlate)
                  : setZoomed((z) => !z)
              }
              className="px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
            >
              {zoomed && visualMode === 'schematic' ? (
                <ZoomOut className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <ZoomIn className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              )}
              <span className="tabular-nums">
                {activePlate && visualMode === 'plate'
                  ? 'Full Viewer'
                  : zoomed
                    ? 'Reset 1.0×'
                    : 'Inspect 1.25×'}
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Interactive SVG Canvas OR High-Res Scientific Atlas Plate */}
          <div className="lg:col-span-7 bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-center overflow-auto">
            {activePlate && visualMode === 'plate' ? (
              <div className="w-full space-y-3">
                <button
                  type="button"
                  onClick={() => setViewerItem(activePlate)}
                  className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-800 block group focus:outline-none"
                >
                  <img
                    src={activePlate.assetUrl}
                    alt={activePlate.title}
                    className="w-full h-full object-contain p-1 group-hover:scale-[1.02] transition-transform duration-200"
                  />
                </button>
                <div className="flex items-center justify-between gap-3 text-xs text-slate-400 px-1">
                  <span className="truncate">{activePlate.caption}</span>
                  <button
                    type="button"
                    onClick={() => setViewerItem(activePlate)}
                    className="text-emerald-400 font-semibold whitespace-nowrap hover:underline shrink-0"
                  >
                    Zoom Plate
                  </button>
                </div>
                {activePlate.id === 'builtin_heart_anatomy' && (
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2 leading-relaxed">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Illustration Accuracy Notice:</strong> This bundled raster plate contains printed text defects (&ldquo;Left Pulmonary Arterie&rdquo;, misplaced &ldquo;Inferior Vena Cava&rdquo; upper-left label, and duplicate &ldquo;Aortic Valve&rdquo; text). Switch to <strong>Pin Schematic</strong> to verify anatomical landmarks accurately.
                    </span>
                  </div>
                )}
              </div>
            ) : (
            <svg
              viewBox="0 0 360 270"
              className={`w-full max-w-[540px] h-auto select-none transition-transform duration-200 ${zoomed ? 'scale-125 origin-center my-6' : 'scale-100'}`}
            >
              <defs>
                <pattern id="anaGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.6" />
                </pattern>
                <radialGradient id="cellGrad" cx="45%" cy="40%" r="55%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#090d16" />
                </radialGradient>
                <linearGradient id="heartRight" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.65" />
                  <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.85" />
                </linearGradient>
                <linearGradient id="heartLeft" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#dc2626" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0.9" />
                </linearGradient>
              </defs>
              <rect width="360" height="270" fill="url(#anaGrid)" rx="8" />

              {/* HEART SVG */}
              {selectedDiagram === 'heart' && (
                <g>
                  {/* Superior Vena Cava */}
                  <rect x="82" y="38" width="22" height="58" rx="6" fill="#1e40af" stroke="#60a5fa" strokeWidth="1.5" />
                  {/* Aorta Arch */}
                  <path d="M 155 118 C 150 42, 225 40, 228 96" fill="none" stroke="#ef4444" strokeWidth="18" strokeLinecap="round" />
                  <path d="M 155 118 C 150 42, 225 40, 228 96" fill="none" stroke="#fca5a5" strokeWidth="1.5" strokeDasharray="4,3" />
                  {/* Pulmonary Trunk */}
                  <path d="M 155 170 L 178 96 L 235 88" fill="none" stroke="#3b82f6" strokeWidth="13" strokeLinecap="round" />
                  {/* Heart Outer Contour (Right & Left Chambers) */}
                  <path d="M 90 112 C 74 162, 110 238, 198 248 C 262 242, 280 162, 254 114 C 232 95, 112 95, 90 112 Z" fill="#1e1b2e" stroke="#475569" strokeWidth="2" />
                  {/* Right Atrium & Ventricle */}
                  <path d="M 94 116 C 84 142, 102 162, 152 158 L 152 114 Z" fill="url(#heartRight)" stroke="#60a5fa" strokeWidth="1.2" />
                  <path d="M 96 162 C 95 208, 134 234, 178 240 L 166 158 Z" fill="url(#heartRight)" stroke="#60a5fa" strokeWidth="1.2" />
                  {/* Left Atrium & Ventricle */}
                  <path d="M 188 112 L 250 114 C 262 135, 250 160, 192 158 Z" fill="url(#heartLeft)" stroke="#f87171" strokeWidth="1.2" />
                  <path d="M 184 158 L 252 158 C 258 205, 226 238, 188 242 Z" fill="url(#heartLeft)" stroke="#f87171" strokeWidth="1.2" />
                  {/* Interventricular Septum */}
                  <path d="M 166 154 L 184 242" stroke="#94a3b8" strokeWidth="7" strokeLinecap="round" />
                  {/* Conduction System (Yellow gold) */}
                  <circle cx="102" cy="118" r="5" fill="#facc15" />
                  <circle cx="152" cy="154" r="4.5" fill="#facc15" />
                  <path d="M 102 118 Q 130 132 152 154 L 175 215" fill="none" stroke="#facc15" strokeWidth="2" strokeDasharray="3,2" />
                  <text x="180" y="264" textAnchor="middle" fill="#94a3b8" fontSize="9">Blue: Deoxygenated (Right) | Red: Oxygenated (Left) | Gold: SA/AV Conduction</text>
                </g>
              )}

              {/* EUKARYOTIC CELL SVG */}
              {selectedDiagram === 'cell' && (
                <g>
                  <ellipse cx="180" cy="135" rx="128" ry="102" fill="url(#cellGrad)" stroke="#10b981" strokeWidth="3.5" />
                  <ellipse cx="180" cy="135" rx="121" ry="95" fill="none" stroke="#34d399" strokeWidth="1" strokeDasharray="4,3" />
                  {/* Nucleus */}
                  <circle cx="180" cy="130" r="36" fill="#312e81" stroke="#818cf8" strokeWidth="2.5" />
                  <circle cx="186" cy="128" r="12" fill="#4f46e5" />
                  {/* Rough ER */}
                  <path d="M 138 96 Q 118 115 135 138 Q 115 152 142 164" fill="none" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
                  {/* Mitochondria */}
                  <g transform="translate(262,110) rotate(-20)">
                    <ellipse cx="0" cy="0" rx="22" ry="11" fill="#9a3412" stroke="#fb923c" strokeWidth="1.8" />
                    <path d="M -14 0 L -8 -5 L -2 5 L 4 -5 L 10 5 L 15 0" fill="none" stroke="#fdba74" strokeWidth="1.5" />
                  </g>
                  {/* Golgi */}
                  <path d="M 215 182 Q 238 175 256 184 M 212 192 Q 238 185 260 194 M 218 202 Q 238 196 254 204" fill="none" stroke="#facc15" strokeWidth="3.5" strokeLinecap="round" />
                  {/* Lysosome */}
                  <circle cx="115" cy="202" r="11" fill="#831843" stroke="#f472b6" strokeWidth="1.8" />
                  {/* Ribosomes & Centrosome */}
                  <circle cx="270" cy="168" r="3" fill="#2dd4bf" />
                  <circle cx="278" cy="173" r="3" fill="#2dd4bf" />
                  <rect x="148" y="185" width="12" height="4" fill="#a78bfa" />
                  <rect x="155" y="179" width="4" height="12" fill="#a78bfa" />
                </g>
              )}

              {/* SKIN CROSS-SECTION SVG */}
              {selectedDiagram === 'skin' && (
                <g>
                  {/* Epidermis */}
                  <rect x="35" y="35" width="290" height="40" rx="4" fill="#d97706" fillOpacity="0.45" stroke="#f59e0b" strokeWidth="1.5" />
                  {/* Dermis */}
                  <rect x="35" y="75" width="290" height="110" fill="#be123c" fillOpacity="0.28" stroke="#fb7185" strokeWidth="1.2" />
                  {/* Hypodermis */}
                  <rect x="35" y="185" width="290" height="58" rx="4" fill="#eab308" fillOpacity="0.25" stroke="#facc15" strokeWidth="1.2" />
                  {/* Adipose lobules */}
                  {[60, 95, 130, 165, 200, 235, 270, 300].map((cx) => (
                    <circle key={cx} cx={cx} cy="215" r="11" fill="#fde047" fillOpacity="0.35" stroke="#eab308" strokeWidth="1" />
                  ))}
                  {/* Hair Follicle & Shaft */}
                  <path d="M 185 15 L 185 155" stroke="#e2e8f0" strokeWidth="4" strokeLinecap="round" />
                  <ellipse cx="185" cy="158" rx="9" ry="12" fill="#475569" stroke="#cbd5e1" strokeWidth="1.5" />
                  {/* Sebaceous Gland */}
                  <ellipse cx="212" cy="116" rx="14" ry="9" fill="#fbbf24" fillOpacity="0.55" stroke="#f59e0b" strokeWidth="1.2" />
                  {/* Eccrine Sweat Gland */}
                  <path d="M 268 45 L 268 135 Q 256 148 268 156 Q 280 148 268 164 Q 258 172 272 174" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                  {/* Arrector Pili */}
                  <line x1="150" y1="88" x2="182" y2="145" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" />
                  <text x="50" y="58" fill="#fde68a" fontSize="9" fontWeight="bold">EPIDERMIS</text>
                  <text x="50" y="132" fill="#fda4af" fontSize="9" fontWeight="bold">DERMIS</text>
                  <text x="50" y="218" fill="#fef08a" fontSize="9" fontWeight="bold">HYPODERMIS</text>
                </g>
              )}

              {/* SKELETON SVG */}
              {selectedDiagram === 'skeleton' && (
                <g>
                  {/* Axial (Emerald) */}
                  <ellipse cx="180" cy="36" rx="20" ry="22" fill="#10b981" fillOpacity="0.25" stroke="#10b981" strokeWidth="2" />
                  <line x1="180" y1="58" x2="180" y2="155" stroke="#10b981" strokeWidth="6" strokeLinecap="round" />
                  {/* Ribs */}
                  {[74, 86, 98, 110].map((y, i) => (
                    <ellipse key={y} cx="180" cy={y} rx={26 + i * 2} ry="6" fill="none" stroke="#10b981" strokeWidth="2.2" />
                  ))}
                  {/* Appendicular (Amber) */}
                  {/* Clavicles */}
                  <line x1="180" y1="68" x2="132" y2="75" stroke="#f59e0b" strokeWidth="3.5" />
                  <line x1="180" y1="68" x2="228" y2="75" stroke="#f59e0b" strokeWidth="3.5" />
                  {/* Arms */}
                  <line x1="130" y1="76" x2="112" y2="128" stroke="#f59e0b" strokeWidth="4" />
                  <line x1="112" y1="128" x2="98" y2="175" stroke="#f59e0b" strokeWidth="3" />
                  <line x1="230" y1="76" x2="248" y2="128" stroke="#f59e0b" strokeWidth="4" />
                  <line x1="248" y1="128" x2="262" y2="175" stroke="#f59e0b" strokeWidth="3" />
                  {/* Pelvis */}
                  <path d="M 148 154 Q 180 144 212 154 L 204 176 Q 180 182 156 176 Z" fill="#f59e0b" fillOpacity="0.25" stroke="#f59e0b" strokeWidth="2.2" />
                  {/* Legs */}
                  <line x1="158" y1="176" x2="154" y2="224" stroke="#f59e0b" strokeWidth="4.5" />
                  <line x1="154" y1="224" x2="156" y2="262" stroke="#f59e0b" strokeWidth="3.5" />
                  <line x1="202" y1="176" x2="206" y2="224" stroke="#f59e0b" strokeWidth="4.5" />
                  <line x1="206" y1="224" x2="204" y2="262" stroke="#f59e0b" strokeWidth="3.5" />
                  <text x="56" y="30" fill="#10b981" fontSize="9" fontWeight="bold">AXIAL (80)</text>
                  <text x="275" y="30" fill="#f59e0b" fontSize="9" fontWeight="bold">APPENDICULAR (126)</text>
                </g>
              )}

              {/* EYE & EAR SVG */}
              {selectedDiagram === 'senses' && (
                <g>
                  {/* Eye (Left half) */}
                  <text x="95" y="28" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">HUMAN EYE</text>
                  <circle cx="102" cy="120" r="52" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
                  <path d="M 55 96 Q 38 120 55 144" fill="#38bdf8" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="2.5" />
                  <ellipse cx="82" cy="120" rx="8" ry="18" fill="#bae6fd" fillOpacity="0.7" stroke="#7dd3fc" strokeWidth="1.5" />
                  <line x1="72" y1="90" x2="72" y2="105" stroke="#f59e0b" strokeWidth="3.5" />
                  <line x1="72" y1="135" x2="72" y2="150" stroke="#f59e0b" strokeWidth="3.5" />
                  <path d="M 102 72 A 48 48 0 0 1 102 168" fill="none" stroke="#fbbf24" strokeWidth="2.5" />
                  <line x1="150" y1="126" x2="180" y2="136" stroke="#facc15" strokeWidth="6" />
                  {/* Ear (Right half) */}
                  <text x="272" y="28" textAnchor="middle" fill="#10b981" fontSize="10" fontWeight="bold">HUMAN EAR</text>
                  <path d="M 218 85 C 195 85, 195 160, 218 155" fill="none" stroke="#fca5a5" strokeWidth="4" />
                  <rect x="215" y="114" width="40" height="18" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.2" />
                  <ellipse cx="256" cy="123" rx="3" ry="12" fill="#38bdf8" />
                  <path d="M 258 120 L 272 114 L 284 122" fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
                  <circle cx="298" cy="96" r="14" fill="none" stroke="#a855f7" strokeWidth="2.5" />
                  <path d="M 304 125 C 325 112, 336 142, 315 150 C 302 154, 300 135, 314 134" fill="none" stroke="#10b981" strokeWidth="3.5" />
                </g>
              )}

              {/* MICROSCOPE & NEUBAUER SVG */}
              {selectedDiagram === 'microscope' && (
                <g>
                  {/* Microscope (Left) */}
                  <rect x="65" y="220" width="95" height="14" rx="4" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
                  <path d="M 145 220 L 145 95 Q 145 65 115 65" fill="none" stroke="#475569" strokeWidth="12" strokeLinecap="round" />
                  <rect x="103" y="34" width="18" height="46" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                  <rect x="96" y="84" width="32" height="12" rx="3" fill="#10b981" fillOpacity="0.4" stroke="#10b981" strokeWidth="1.5" />
                  <rect x="74" y="142" width="76" height="8" rx="2" fill="#64748b" />
                  <circle cx="112" cy="175" r="10" fill="#fbbf24" fillOpacity="0.4" stroke="#fbbf24" strokeWidth="1.5" />
                  <circle cx="156" cy="155" r="10" fill="#0f172a" stroke="#94a3b8" strokeWidth="2" />
                  {/* Neubauer Grid (Right) */}
                  <text x="275" y="42" textAnchor="middle" fill="#10b981" fontSize="9" fontWeight="bold">NEUBAUER GRID (3×3 mm)</text>
                  <rect x="220" y="54" width="110" height="110" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
                  <rect x="222" y="56" width="34" height="34" fill="#3b82f6" fillOpacity="0.2" stroke="#60a5fa" strokeWidth="1" />
                  <rect x="294" y="56" width="34" height="34" fill="#3b82f6" fillOpacity="0.2" stroke="#60a5fa" strokeWidth="1" />
                  <rect x="222" y="128" width="34" height="34" fill="#3b82f6" fillOpacity="0.2" stroke="#60a5fa" strokeWidth="1" />
                  <rect x="294" y="128" width="34" height="34" fill="#3b82f6" fillOpacity="0.2" stroke="#60a5fa" strokeWidth="1" />
                  <rect x="258" y="92" width="34" height="34" fill="#ef4444" fillOpacity="0.2" stroke="#f87171" strokeWidth="1.2" />
                  <text x="275" y="182" textAnchor="middle" fill="#94a3b8" fontSize="8">Blue: 4 WBC Corners | Red: Center RBC Grid</text>
                </g>
              )}

              {/* NEURON & NMJ SVG */}
              {selectedDiagram === 'neuron' && (
                <g>
                  {/* Soma & Dendrites */}
                  <path d="M 60 80 L 90 110 M 50 110 L 88 120 M 62 150 L 92 132" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="105" cy="120" r="22" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="2" />
                  <circle cx="105" cy="120" r="8" fill="#93c5fd" />
                  {/* Axon + Myelin Sheaths */}
                  <line x1="127" y1="120" x2="295" y2="120" stroke="#facc15" strokeWidth="4" />
                  {[150, 185, 225, 260].map((x) => (
                    <rect key={x} x={x} y="109" width="26" height="22" rx="7" fill="#10b981" fillOpacity="0.45" stroke="#34d399" strokeWidth="1.5" />
                  ))}
                  {/* Axon Terminal & Muscle Fiber */}
                  <circle cx="298" cy="116" r="10" fill="#a855f7" fillOpacity="0.5" stroke="#c084fc" strokeWidth="1.5" />
                  <rect x="275" y="142" width="75" height="34" rx="6" fill="#be123c" fillOpacity="0.45" stroke="#fb7185" strokeWidth="1.8" />
                  <text x="312" y="163" textAnchor="middle" fill="#fecdd3" fontSize="8" fontWeight="bold">MUSCLE FIBER</text>
                </g>
              )}

              {/* NEPHRON SVG */}
              {selectedDiagram === 'nephron' && (
                <g>
                  <line x1="25" y1="145" x2="335" y2="145" stroke="#475569" strokeWidth="1" strokeDasharray="4,3" />
                  <text x="45" y="138" fill="#94a3b8" fontSize="8">CORTEX</text>
                  <text x="45" y="158" fill="#64748b" fontSize="8">MEDULLA</text>
                  {/* Bowman Capsule & Glomerulus */}
                  <path d="M 86 68 C 52 68, 44 128, 88 124" fill="none" stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" />
                  <circle cx="76" cy="84" r="14" fill="#dc2626" fillOpacity="0.55" stroke="#f87171" strokeWidth="1.8" />
                  {/* PCT */}
                  <path d="M 88 124 Q 112 115 118 88 Q 126 68 144 88 Q 156 105 156 140" fill="none" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
                  {/* Loop of Henle */}
                  <path d="M 156 140 L 156 218 Q 172 232 188 218 L 188 140" fill="none" stroke="#10b981" strokeWidth="4.5" strokeLinecap="round" />
                  {/* DCT */}
                  <path d="M 188 140 Q 204 78 236 82 Q 262 86 298 92" fill="none" stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" />
                  {/* Collecting Duct */}
                  <line x1="298" y1="54" x2="298" y2="232" stroke="#a855f7" strokeWidth="8" strokeLinecap="round" />
                </g>
              )}

              {/* Interactive Numbered Pins */}
              {current.pins.map((pin, idx) => {
                const isSelected = selectedPin === idx;
                return (
                  <g
                    key={pin.id}
                    onClick={() => setSelectedPin(idx)}
                    className="cursor-pointer"
                  >
                    {isSelected && (
                      <circle cx={pin.x} cy={pin.y} r="15" fill="#10b981" fillOpacity="0.25" />
                    )}
                    <circle
                      cx={pin.x}
                      cy={pin.y}
                      r="9.5"
                      fill={isSelected ? '#10b981' : '#0f172a'}
                      stroke={isSelected ? '#ffffff' : '#34d399'}
                      strokeWidth="2"
                    />
                    <text
                      x={pin.x}
                      y={pin.y + 3.5}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {pin.id}
                    </text>
                  </g>
                );
              })}
            </svg>
            )}
          </div>

          {/* Pin Details & Clickable Legend */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-50 dark:bg-slate-950 border border-emerald-500/40 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                    {activePin.id}
                  </span>
                  <h4 className="text-base font-bold text-emerald-700 dark:text-emerald-400 truncate">{activePin.label}</h4>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setSelectedPin((p) => (p - 1 + current.pins.length) % current.pins.length)}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
                    aria-label="Previous anatomical marker"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setSelectedPin((p) => (p + 1) % current.pins.length)}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
                    aria-label="Next anatomical marker"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300"><strong>Location:</strong> {activePin.loc}</p>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed"><strong>Physiological Function:</strong> {activePin.fn}</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-1.5 max-h-60 overflow-y-auto">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
                All Annotated Markers ({current.pins.length})
              </span>
              {current.pins.map((pin, idx) => (
                <button
                  key={pin.id}
                  onClick={() => setSelectedPin(idx)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center space-x-2.5 transition-all ${
                    selectedPin === idx
                      ? 'bg-emerald-50 dark:bg-emerald-600/20 border border-emerald-500/50 text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <span className="text-xs font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">#{pin.id}</span>
                  <span>{pin.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ResourceConnector
        department="anatomy"
        topic={selectedDiagram}
        defaultSearchQuery={SEARCH_BY_DIAGRAM[selectedDiagram] || 'anatomy'}
        title={`Linked Visuals & Textbook Passages — ${current.title.split('(')[0].trim()}`}
      />

      <ImageViewerModal
        item={viewerItem}
        allVisuals={BUILT_IN_VISUALS}
        onClose={() => setViewerItem(null)}
        onSelectVisual={(item) => setViewerItem(item)}
      />
    </div>
  );
}
