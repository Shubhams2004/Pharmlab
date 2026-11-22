import React, { useState } from 'react';
import { BookOpen, Activity, Zap, ShieldAlert, HeartPulse } from 'lucide-react';

export default function AnatomyTheory() {
  const [unit, setUnit] = useState('unit1');
  const [hrInput, setHrInput] = useState(72);
  const [svInput, setSvInput] = useState(70);
  const [edvInput, setEdvInput] = useState(120);
  const [esvInput, setEsvInput] = useState(50);

  // Cardiac Output & Ejection Fraction
  const calculatedSv = Math.max(0, edvInput - esvInput);
  const cardiacOutputMl = hrInput * svInput;
  const ejectionFraction = edvInput > 0 ? (calculatedSv / edvInput) * 100 : 0;

  const cranialNerves = [
    { num: 'I', name: 'Olfactory', type: 'Sensory', fn: 'Smell (olfactory epithelium → cribriform plate; lesion → Anosmia)' },
    { num: 'II', name: 'Optic', type: 'Sensory', fn: 'Vision (retina → optic chiasm → occipital lobe)' },
    { num: 'III', name: 'Oculomotor', type: 'Motor', fn: 'Eye movement (4/6 extraocular muscles), upper eyelid elevation, pupil constriction (miosis)' },
    { num: 'IV', name: 'Trochlear', type: 'Motor', fn: 'Superior oblique muscle (moves eye downward & inward)' },
    { num: 'V', name: 'Trigeminal', type: 'Mixed', fn: 'Facial sensation (ophthalmic, maxillary, mandibular) & muscles of mastication' },
    { num: 'VI', name: 'Abducens', type: 'Motor', fn: 'Lateral rectus muscle (abducts eye laterally)' },
    { num: 'VII', name: 'Facial', type: 'Mixed', fn: 'Facial expression, anterior 2/3 tongue taste, lacrimal & salivary glands' },
    { num: 'VIII', name: 'Vestibulocochlear', type: 'Sensory', fn: 'Hearing (cochlear branch) & balance/equilibrium (vestibular branch)' },
    { num: 'IX', name: 'Glossopharyngeal', type: 'Mixed', fn: 'Posterior 1/3 tongue taste, carotid sinus baroreceptor, swallowing, parotid gland' },
    { num: 'X', name: 'Vagus', type: 'Mixed', fn: 'Major parasympathetic supply to heart (↓HR), lungs (bronchoconstriction), GI tract' },
    { num: 'XI', name: 'Accessory', type: 'Motor', fn: 'Sternocleidomastoid & trapezius muscles (head turning, shoulder shrugging)' },
    { num: 'XII', name: 'Hypoglossal', type: 'Motor', fn: 'Intrinsic and extrinsic tongue muscles (speech & swallowing)' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'unit1', label: 'Unit I: Homeostasis, Cell & Injury' },
          { id: 'unit2', label: 'Unit II: Skin, Skeleton & Joints' },
          { id: 'unit3', label: 'Unit III: Blood, Lymph & Inflammation' },
          { id: 'unit4', label: 'Unit IV: PNS & Special Senses' },
          { id: 'unit5', label: 'Unit V: Cardiovascular Physiology' }
        ].map((u) => (
          <button
            key={u.id}
            onClick={() => setUnit(u.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              unit === u.id
                ? 'bg-emerald-50 dark:bg-emerald-600/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm dark:shadow-lg'
                : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {u.label}
          </button>
        ))}
      </div>

      {/* UNIT I */}
      {unit === 'unit1' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm dark:shadow-none">
            <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Homeostasis, Feedback &amp; Intracellular Signalling</h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong>Feedback Components:</strong> Stimulus → Receptor (Sensor) → Control Center (Brain/Endocrine) → Effector → Response.
              <strong> Negative Feedback</strong> reverses deviation (BP baroreceptors, insulin/glucagon, thermoregulation). <strong>Positive Feedback</strong> amplifies stimulus until endpoint (Oxytocin in childbirth, coagulation cascade).
            </p>
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1.5">
              <p className="font-bold text-blue-600 dark:text-blue-400">4 Forms of Intracellular Signalling (BP104T):</p>
              <p className="text-slate-700 dark:text-slate-300"><strong>a) Contact-dependent:</strong> Direct cell-to-cell membrane ligands or gap junctions (connexons).</p>
              <p className="text-slate-700 dark:text-slate-300"><strong>b) Paracrine:</strong> Local diffusion to nearby target cells (histamine, prostaglandins).</p>
              <p className="text-slate-700 dark:text-slate-300"><strong>c) Synaptic:</strong> Rapid neurotransmitter release across synaptic cleft (ACh, dopamine).</p>
              <p className="text-slate-700 dark:text-slate-300"><strong>d) Endocrine:</strong> Hormones secreted into bloodstream acting on distant organs (insulin, thyroxine).</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1">
              <p className="font-bold text-blue-600 dark:text-blue-400">Cell Junctions &amp; Membrane Transport:</p>
              <p className="text-slate-700 dark:text-slate-300"><strong>Junctions:</strong> Tight (occluding), Adherens, Desmosomes (mechanical anchoring), Gap junctions (electrical/ionic coupling).</p>
              <p className="text-slate-700 dark:text-slate-300"><strong>Transport:</strong> Simple/Facilitated diffusion &amp; Osmosis (passive) vs Primary Active (3Na⁺ out / 2K⁺ in ATPase), Secondary Active, and Endocytosis/Exocytosis.</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm dark:shadow-none">
            <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400">Principles of Cell Injury &amp; Adaptive Morphology</h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong>Pathogenesis of Cell Injury:</strong> Hypoxia/ischemia, toxins, ROS, or infectious agents trigger ATP depletion (mitochondrial damage), Ca²⁺ influx, plasma membrane phospholipid loss, ribosomal detachment, and nuclear pyknosis/karyorrhexis/karyolysis.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { name: 'Atrophy', desc: 'Shrinkage in cell size/number due to disuse, denervation, or ischemia.' },
                { name: 'Hypertrophy', desc: 'Increase in cell size (e.g., LV myocardium in hypertension, skeletal muscle).' },
                { name: 'Hyperplasia', desc: 'Increase in cell number via mitosis (e.g., BPH, endometrial proliferation).' },
                { name: 'Metaplasia', desc: 'Reversible replacement of one adult cell type by another (smoker bronchial squamous metaplasia).' },
                { name: 'Dysplasia', desc: 'Disordered cellular growth & nuclear atypia (pre-neoplastic).' },
                { name: 'Necrosis vs Apoptosis', desc: 'Necrosis = unregulated lytic death + inflammation; Apoptosis = programmed caspase death without inflammation.' }
              ].map((ad) => (
                <div key={ad.name} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                  <strong className="text-amber-600 dark:text-amber-400 block">{ad.name}</strong>
                  <span className="text-slate-700 dark:text-slate-300">{ad.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* UNIT II */}
      {unit === 'unit2' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm dark:shadow-none">
            <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Integumentary Disorders &amp; Joint Classification</h3>
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 text-slate-700 dark:text-slate-300">
              <p><strong className="text-blue-600 dark:text-blue-400">Psoriasis:</strong> Autoimmune T-cell hyperproliferation of keratinocytes (accelerated 3–5 day turnover vs 28 days) producing silvery-white scaly plaques.</p>
              <p><strong className="text-blue-600 dark:text-blue-400">Dermatitis:</strong> Spongiotic epidermal inflammation (atopic/contact Type IV hypersensitivity) with erythema, pruritus, and vesicles.</p>
              <p><strong className="text-blue-600 dark:text-blue-400">Leprosy (Hansen's Disease):</strong> <em>Mycobacterium leprae</em> infects dermal macrophages and peripheral Schwann cells causing anesthetic skin patches and neuropathy.</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1.5">
              <p className="font-bold text-emerald-600 dark:text-emerald-400">Classification of Joints:</p>
              <p className="text-slate-700 dark:text-slate-300"><strong>Fibrous (Synarthrosis — Immovable):</strong> Skull sutures, syndesmoses, gomphoses.</p>
              <p className="text-slate-700 dark:text-slate-300"><strong>Cartilaginous (Amphiarthrosis — Slightly movable):</strong> Pubic symphysis, intervertebral discs.</p>
              <p className="text-slate-700 dark:text-slate-300"><strong>Synovial (Diarthrosis — Freely movable):</strong> Ball &amp; socket (hip/shoulder), Hinge (elbow/knee), Pivot (atlas-axis), Saddle (thumb CMC), Gliding, Condyloid.</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm dark:shadow-none">
            <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400">Pathophysiology of Bone &amp; Joint Diseases</h3>
            {[
              { title: 'Rheumatoid Arthritis (RA)', body: 'Autoimmune IgM/IgG Rheumatoid Factor & anti-CCP antibodies target synovial membrane → chronic synovitis & invasive vascular pannus destroys articular cartilage and subchondral bone (symmetric small joints, morning stiffness >1h).' },
              { title: 'Osteoporosis', body: 'Imbalance where osteoclastic bone resorption exceeds osteoblastic bone formation (postmenopausal estrogen loss, vitamin D/Ca deficiency) → decreased bone mineral density (T-score ≤ −2.5) and fragility fractures.' },
              { title: 'Gout', body: 'Hyperuricemia (>7 mg/dL) from purine overproduction or renal underexcretion causes needle-shaped monosodium urate crystal deposition in synovial fluid (1st MTP joint podagra) triggering IL-1β neutrophil inflammation.' }
            ].map((d) => (
              <div key={d.title} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <strong className="text-amber-600 dark:text-amber-400 block mb-1">{d.title}</strong>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{d.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UNIT III */}
      {unit === 'unit3' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm dark:shadow-none">
            <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Body Fluids, Hemopoiesis &amp; Coagulation Cascade</h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong>Body Fluids (~60% body weight = 42 L in 70 kg adult):</strong> Intracellular Fluid (ICF: 28 L, 40%) + Extracellular Fluid (ECF: 14 L, 20% = 11 L Interstitial + 3 L Plasma).
            </p>
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
              <p className="font-bold text-blue-600 dark:text-blue-400">Mechanisms of Blood Coagulation:</p>
              <p className="text-slate-700 dark:text-slate-300"><strong>1. Intrinsic Pathway (aPTT):</strong> Subendothelial collagen activates Factor XII → XI → IX (+VIIIa, Ca²⁺, PF3) → Factor X.</p>
              <p className="text-slate-700 dark:text-slate-300"><strong>2. Extrinsic Pathway (PT/INR):</strong> Tissue damage releases Tissue Factor (III) + Factor VIIa + Ca²⁺ → Factor X.</p>
              <p className="text-slate-700 dark:text-slate-300"><strong>3. Common Pathway:</strong> Factor Xa + Va + Ca²⁺ (Prothrombinase) converts Prothrombin (II) → Thrombin (IIa) → cleaves Fibrinogen (I) → Fibrin mesh stabilized by Factor XIIIa.</p>
            </div>
            <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <strong>Lymphatic System:</strong> Primary organs (Bone marrow, Thymus) &amp; Secondary organs (Lymph nodes, Spleen, MALT/Tonsils) drain excess interstitial protein-rich fluid back to subclavian veins and mount adaptive immunity.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm dark:shadow-none">
            <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400">Inflammation Mediators &amp; Haematological Diseases</h3>
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1.5">
              <p className="font-bold text-amber-600 dark:text-amber-400">Cardinal Signs &amp; Mediators of Inflammation:</p>
              <p className="text-slate-700 dark:text-slate-300">Rubor (redness), Calor (heat), Tumor (swelling), Dolor (pain), Functio laesa (loss of function).</p>
              <p className="text-slate-700 dark:text-slate-300"><strong>Mediators:</strong> Histamine (vasodilation/permeability), Prostaglandins PGE₂ (pain/fever), Leukotrienes (chemotaxis/bronchospasm), Bradykinin (pain), Cytokines (TNF-α, IL-1, IL-6).</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1.5">
              <p className="font-bold text-blue-600 dark:text-blue-400">Anaemia Classifications (Unit III):</p>
              <p className="text-slate-700 dark:text-slate-300"><strong>Iron Deficiency:</strong> Microcytic, hypochromic (↓MCV, ↓Ferritin).</p>
              <p className="text-slate-700 dark:text-slate-300"><strong>Megaloblastic (Vit B₁₂ / Folic Acid):</strong> Impaired DNA synthesis → macrocytic RBCs &amp; hypersegmented neutrophils.</p>
              <p className="text-slate-700 dark:text-slate-300"><strong>Sickle Cell:</strong> β-globin Glu→Val mutation forms HbS polymers under hypoxia.</p>
              <p className="text-slate-700 dark:text-slate-300"><strong>Thalassemia &amp; Haemophilia:</strong> Defective globin chain synthesis vs Factor VIII/IX deficiency.</p>
            </div>
          </div>
        </div>
      )}

      {/* UNIT IV */}
      {unit === 'unit4' && (
        <div className="space-y-6 text-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm dark:shadow-none">
              <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Autonomic Nervous System: Sympathetic vs Parasympathetic</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                      <th className="py-2">Organ / Parameter</th>
                      <th className="py-2 text-amber-600 dark:text-amber-400">Sympathetic (Thoracolumbar T1–L2)</th>
                      <th className="py-2 text-blue-600 dark:text-blue-400">Parasympathetic (Craniosacral III, VII, IX, X, S2–S4)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                    <tr><td className="py-2 font-semibold">Neurotransmitter</td><td className="py-2">NE / Epinephrine (Adrenergic α/β)</td><td className="py-2">Acetylcholine (Muscarinic M₁–M₅)</td></tr>
                    <tr><td className="py-2 font-semibold">Heart (SA/AV)</td><td className="py-2">↑ Heart Rate &amp; Contractility (β₁)</td><td className="py-2">↓ Heart Rate via Vagus CN X (M₂)</td></tr>
                    <tr><td className="py-2 font-semibold">Bronchioles</td><td className="py-2">Bronchodilation (β₂)</td><td className="py-2">Bronchoconstriction (M₃)</td></tr>
                    <tr><td className="py-2 font-semibold">Pupil</td><td className="py-2">Mydriasis / Dilation (α₁)</td><td className="py-2">Miosis / Constriction (M₃)</td></tr>
                    <tr><td className="py-2 font-semibold">GI Motility</td><td className="py-2">Decreased motility, sphincter tone ↑</td><td className="py-2">Increased peristalsis &amp; secretions</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="text-slate-600 dark:text-slate-400 pt-1"><strong>Spinal Nerves:</strong> 31 Pairs (8 Cervical, 12 Thoracic, 5 Lumbar, 5 Sacral, 1 Coccygeal) — mixed dorsal sensory &amp; ventral motor roots.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-2.5 shadow-sm dark:shadow-none">
              <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400">Pathophysiology of Special Sense Disorders</h3>
              {[
                { name: 'Glaucoma', desc: 'Elevated intraocular pressure (>21 mmHg) due to impaired aqueous humor drainage damaging optic nerve head.' },
                { name: 'Cataract', desc: 'Progressive opacification/denaturation of crystalline lens proteins causing blurred vision & glare.' },
                { name: 'Myopia', desc: 'Nearsightedness; elongated eyeball or steep cornea focuses parallel light in front of retina.' },
                { name: 'Otitis Externa & Media', desc: 'Outer ear canal infection ("swimmer\'s ear") vs middle ear effusion/infection via Eustachian tube.' },
                { name: 'Vertigo & Anosmia', desc: 'Vestibular illusion of spinning (endolymph/BPPV) vs loss of olfaction (CN I damage/viral).' }
              ].map((s) => (
                <div key={s.name} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                  <strong className="text-blue-600 dark:text-blue-400">{s.name}: </strong>
                  <span className="text-slate-700 dark:text-slate-300">{s.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm dark:shadow-none">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">12 Cranial Nerves (Origin, Modality &amp; Functions)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {cranialNerves.map((cn) => (
                <div key={cn.num} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">CN {cn.num}: {cn.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-900 text-blue-700 dark:text-blue-300 font-medium">{cn.type}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{cn.fn}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* UNIT V */}
      {unit === 'unit5' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-none">
            <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-2">
              <HeartPulse className="w-5 h-5" />
              <span>Cardiac Output (CO) &amp; Ejection Fraction Calculator</span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Heart Rate (HR, bpm)</label>
                <input type="number" value={hrInput} onChange={(e) => setHrInput(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Stroke Volume (SV, mL/beat)</label>
                <input type="number" value={svInput} onChange={(e) => setSvInput(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">End-Diastolic Volume (EDV, mL)</label>
                <input type="number" value={edvInput} onChange={(e) => setEdvInput(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">End-Systolic Volume (ESV, mL)</label>
                <input type="number" value={esvInput} onChange={(e) => setEsvInput(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-900 dark:text-white" />
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 border border-emerald-500/30 rounded-xl p-4 grid grid-cols-2 gap-3 text-center">
              <div>
                <span className="text-slate-600 dark:text-slate-400 block">Cardiac Output (HR × SV)</span>
                <strong className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{(cardiacOutputMl / 1000).toFixed(2)} L/min</strong>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400 block">Ejection Fraction (SV/EDV)</span>
                <strong className={`text-xl font-bold tabular-nums ${ejectionFraction < 50 ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`}>{ejectionFraction.toFixed(1)}%</strong>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-1 text-slate-700 dark:text-slate-300">
              <p><strong>Blood Vessels Structure:</strong></p>
              <p><strong>Arteries:</strong> Thick tunica media (smooth muscle + elastic lamina) withstanding high pressure.</p>
              <p><strong>Veins:</strong> Thin media, wide lumen, one-way semilunar valves preventing venous pooling.</p>
              <p><strong>Capillaries:</strong> Single endothelial layer + basement membrane for Starling micro-exchange.</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm dark:shadow-none">
            <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400">Pathophysiology of Cardiovascular Disorders</h3>
            {[
              { name: 'Hypertension', desc: 'Sustained elevation (≥140/90 mmHg) driven by ↑ peripheral vascular resistance, RAAS activation (Angiotensin II/Aldosterone), and sympathetic tone.' },
              { name: 'Cardiac Arrhythmias', desc: 'Abnormal impulse generation (ectopic foci) or conduction reentry causing bradyarrhythmias, atrial fibrillation, or ventricular tachycardia.' },
              { name: 'Congestive Heart Failure (CHF)', desc: 'Inability of ventricles to pump adequate CO (HFrEF/HFpEF) → compensatory neurohormonal activation, pulmonary/peripheral edema.' },
              { name: 'Atherosclerosis & CAD', desc: 'LDL oxidation → foam cell fatty streaks → fibrous atheromatous plaque narrowing coronary lumen.' },
              { name: 'Angina vs Myocardial Infarction', desc: 'Angina = reversible myocardial ischemia on exertion; MI = plaque rupture + occlusive thrombus causing irreversible coagulative myocyte necrosis (↑Troponin I/T).' }
            ].map((c) => (
              <div key={c.name} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
                <strong className="text-amber-600 dark:text-amber-400">{c.name}: </strong>
                <span className="text-slate-700 dark:text-slate-300">{c.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
