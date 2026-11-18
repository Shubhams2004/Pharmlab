import React, { useState } from 'react';
import { Microscope, Leaf, FlaskConical, Ruler, BookOpen, Tag } from 'lucide-react';

export default function PharmacognosyModule() {
  const [activeTab, setActiveTab] = useState('leaf_constants');

  // Existing Exp 8 & 9 States
  const [stomataCount, setStomataCount] = useState('');
  const [epidermalCount, setEpidermalCount] = useState('');
  const [stomatalIndexResult, setStomatalIndexResult] = useState(null);

  const [veinCount, setVeinCount] = useState('');
  const [areaCount, setAreaCount] = useState('');
  const [veinletResult, setVeinletResult] = useState(null);

  // Exp 8 & 9 extras
  const [stomatalNumArea, setStomatalNumArea] = useState(4);
  const [veinIsletCount, setVeinIsletCount] = useState(44);

  // Exp 1: Morphological Study of Unit V Plants (20 drugs)
  const [plantFilter, setPlantFilter] = useState('All');

  // Exp 2-5: Powder Microscopy
  const [selectedPowderExp, setSelectedPowderExp] = useState('exp2');

  // Exp 6, 7, 10, 11: Physicochemical QC Calculators
  const [lodInitial, setLodInitial] = useState(5.0);
  const [lodFinal, setLodFinal] = useState(4.55);
  const [swellDrugG, setSwellDrugG] = useState(1.0);
  const [swellVolMl, setSwellVolMl] = useState(14.5);
  const [foamTubeMl, setFoamTubeMl] = useState(4);
  const [ashSampleG, setAshSampleG] = useState(2.0);
  const [ashResidueG, setAshResidueG] = useState(0.14);
  const [acidInsolAshG, setAcidInsolAshG] = useState(0.03);
  const [extractiveDrugG, setExtractiveDrugG] = useState(5.0);
  const [extractiveResidueG, setExtractiveResidueG] = useState(0.28);
  const [foreignSampleG, setForeignSampleG] = useState(50.0);
  const [foreignMatterG, setForeignMatterG] = useState(0.75);

  // Exp 12: Eyepiece Micrometry
  const [stageDivs, setStageDivs] = useState(3);
  const [ocularDivs, setOcularDivs] = useState(20);
  const [measuredOcularDivs, setMeasuredOcularDivs] = useState(16);

  // Exp 13: Lycopodium Spore Method
  const [lycoN, setLycoN] = useState(24);
  const [lycoW, setLycoW] = useState(0.05);
  const [lycoS, setLycoS] = useState(18);
  const [lycoM, setLycoM] = useState(0.10);
  const [lycoP, setLycoP] = useState(280);

  // Exp 14: Voucher Specimen Herbarium Label
  const [voucher, setVoucher] = useState({
    botanicalName: 'Ocimum tenuiflorum L.',
    family: 'Lamiaceae',
    vernacularName: 'Tulsi (Holy Basil)',
    locality: 'College Medicinal Plant Garden, Aurangabad',
    collector: 'Shubham Sonale',
    voucherNo: 'YBCCP/COG/2026/014',
    partUsed: 'Fresh/Dried Leaves'
  });

  const calculateStomatalIndex = (e) => {
    e.preventDefault();
    const s = parseFloat(stomataCount);
    const eCells = parseFloat(epidermalCount);
    if (s >= 0 && eCells > 0) {
      const index = (s / (eCells + s)) * 100;
      setStomatalIndexResult(index.toFixed(2));
    }
  };

  const calculateVeinlet = (e) => {
    e.preventDefault();
    const v = parseFloat(veinCount);
    const a = parseFloat(areaCount);
    if (v >= 0 && a > 0) {
      const ratio = v / a;
      setVeinletResult(ratio.toFixed(2));
    }
  };

  const unitVPlants = [
    { name: 'Ashwagandha', botanical: 'Withania somnifera (Solanaceae)', cat: 'Adaptogen', part: 'Dried Roots', constituents: 'Withanolides, Withaferin A', use: 'Adaptogen, antistress, immunomodulator' },
    { name: 'Tulsi', botanical: 'Ocimum tenuiflorum (Lamiaceae)', cat: 'Adaptogen', part: 'Leaves', constituents: 'Eugenol, Ursolic acid', use: 'Immunomodulator, antitussive, antimicrobial' },
    { name: 'Amla', botanical: 'Emblica officinalis (Phyllanthaceae)', cat: 'Adaptogen', part: 'Fruits', constituents: 'Vitamin C, Emblicanin A & B', use: 'Antioxidant, Rasayana, hepatoprotective' },
    { name: 'Milk Thistle', botanical: 'Silybum marianum (Asteraceae)', cat: 'Hepatoprotective', part: 'Seeds/Fruits', constituents: 'Silymarin (Silybin)', use: 'Hepatoprotective in cirrhosis/toxicity' },
    { name: 'Kutki', botanical: 'Picrorhiza kurroa (Plantaginaceae)', cat: 'Hepatoprotective', part: 'Rhizomes', constituents: 'Picroside I & II, Kutkoside', use: 'Hepatoprotective, bitter tonic' },
    { name: 'Garlic', botanical: 'Allium sativum (Amaryllidaceae)', cat: 'Cardiovascular', part: 'Bulbs', constituents: 'Allicin, Alliin', use: 'Hypolipidemic, antiplatelet, antihypertensive' },
    { name: 'Arjuna', botanical: 'Terminalia arjuna (Combretaceae)', cat: 'Cardiovascular', part: 'Stem Bark', constituents: 'Arjunolic acid, Arjunin', use: 'Cardiotonic, angina & CHF support' },
    { name: 'Gymnema', botanical: 'Gymnema sylvestre (Apocynaceae)', cat: 'Antidiabetic', part: 'Leaves', constituents: 'Gymnemic acids', use: 'Antidiabetic ("Gurmar" sugar destroyer)' },
    { name: 'Fenugreek', botanical: 'Trigonella foenum-graecum (Fabaceae)', cat: 'Antidiabetic', part: 'Seeds', constituents: 'Trigonelline, Diosgenin, Mucilage', use: 'Hypoglycemic, galactagogue' },
    { name: 'Turmeric', botanical: 'Curcuma longa (Zingiberaceae)', cat: 'Anti-inflammatory', part: 'Rhizomes', constituents: 'Curcuminoids (Curcumin)', use: 'Anti-inflammatory, antioxidant, antiseptic' },
    { name: 'Boswellia', botanical: 'Boswellia serrata (Burseraceae)', cat: 'Anti-inflammatory', part: 'Oleo-gum-resin', constituents: 'Boswellic acids (AKBA)', use: 'Osteoarthritis, anti-inflammatory' },
    { name: 'Brahmi', botanical: 'Bacopa monnieri (Plantaginaceae)', cat: 'CNS', part: 'Whole Herb', constituents: 'Bacosides A & B', use: 'Nootropic, memory enhancer' },
    { name: 'Giloy', botanical: 'Tinospora cordifolia (Menispermaceae)', cat: 'Antimicrobial', part: 'Stems', constituents: 'Berberine, Tinosporaside', use: 'Immunomodulator, antipyretic' },
    { name: 'Neem', botanical: 'Azadirachta indica (Meliaceae)', cat: 'Antimicrobial', part: 'Leaves & Bark', constituents: 'Azadirachtin, Nimbin', use: 'Antimicrobial, antifungal, bitter tonic' },
    { name: 'Andrographis', botanical: 'Andrographis paniculata (Acanthaceae)', cat: 'Antimicrobial', part: 'Aerial Parts', constituents: 'Andrographolide', use: 'Antiviral, hepatoprotective, bitter' },
    { name: 'Psyllium', botanical: 'Plantago ovata (Plantaginaceae)', cat: 'GI', part: 'Seed Husk', constituents: 'Arabinoxylan Mucilage', use: 'Bulk-forming laxative (high swelling index)' },
    { name: 'Aloe', botanical: 'Aloe barbadensis (Asphodelaceae)', cat: 'Dermatological', part: 'Leaf Gel / Dried Juice', constituents: 'Aloin (Barbaloin), Acemannan', use: 'Wound healing, moisturizer, purgative' },
    { name: 'Chasteberry', botanical: 'Vitex agnus-castus (Lamiaceae)', cat: "Women's Health", part: 'Fruits', constituents: 'Agnuside, Casticin', use: 'PMS, cyclic mastalgia, hormonal balance' },
    { name: 'Shatavari', botanical: 'Asparagus racemosus (Asparagaceae)', cat: "Women's Health", part: 'Tuberous Roots', constituents: 'Shatavarins I–IV', use: 'Galactagogue, uterine tonic' },
    { name: 'Vasaka', botanical: 'Adhatoda vasica (Acanthaceae)', cat: 'Respiratory', part: 'Leaves', constituents: 'Vasicine, Vasicinone', use: 'Bronchodilator, expectorant' }
  ];

  const powderExperiments = {
    exp2: {
      title: 'Exp 2: Organoleptic & Powder Microscopy — Tulsi & Ashwagandha',
      drugs: [
        { name: 'Tulsi Leaf Powder', organoleptic: 'Greenish-brown; aromatic clove-like odour; pungent warm taste.', microscopy: 'Diacytic stomata, multicellular covering trichomes, sessile labiate glandular trichomes with 8-celled head, wavy epidermal cells.' },
        { name: 'Ashwagandha Root Powder', organoleptic: 'Buff to greyish-yellow; characteristic horse-like odour; mucilaginous bitter taste.', microscopy: 'Abundant simple & compound starch grains (with concentric hilum), bordered-pitted xylem vessels, cork cells, non-lignified fibers.' }
      ]
    },
    exp3: {
      title: 'Exp 3: Organoleptic & Powder Microscopy — Amla & Arjuna',
      drugs: [
        { name: 'Amla Fruit Pericarp Powder', organoleptic: 'Pale brownish-grey; faint characteristic odour; sour & astringent taste.', microscopy: 'Thick-walled polygonal sclereids (brachysclereids), mesocarp parenchyma with tannin globules, prismatic calcium oxalate crystals.' },
        { name: 'Arjuna Bark Powder', organoleptic: 'Reddish-brown; no distinct odour; strongly astringent taste.', microscopy: 'Cluster (rosette) crystals of calcium oxalate, phloem fibers with crystal sheath, tannin-filled parenchyma, cork cells.' }
      ]
    },
    exp4: {
      title: 'Exp 4: Organoleptic & Powder Microscopy — Turmeric & Psyllium Husk',
      drugs: [
        { name: 'Turmeric Rhizome Powder', organoleptic: 'Bright golden-yellow; warm aromatic odour; pungent bitter taste.', microscopy: 'Gelatinized starch masses stained yellow by curcumin, spiral & reticulate xylem vessels, unicellular thick-walled trichomes, oil cells.' },
        { name: 'Psyllium (Isabgol) Husk Powder', organoleptic: 'Translucent pinkish-white flakes; odourless; bland mucilaginous taste.', microscopy: 'Polygonal epidermal cells filled with transparent mucilage (swells massively in water/ruthenium red), absence of lignified tissues.' }
      ]
    },
    exp5: {
      title: 'Exp 5: Organoleptic & Powder Microscopy — Brahmi & Fenugreek',
      drugs: [
        { name: 'Brahmi Herb Powder', organoleptic: 'Dull olive-green; faint herbal odour; slightly bitter taste.', microscopy: 'Anisocytic & anomocytic stomata, glandular peltate trichomes, spongy mesophyll, rosette calcium oxalate crystals.' },
        { name: 'Fenugreek Seed Powder', organoleptic: 'Yellowish-brown; characteristic spicy maple-like odour; bitter mucilaginous taste.', microscopy: 'Palisade-like epidermal cells (macrosclereids), hourglass (bearer) hypodermal cells, aleurone grains & fixed oil droplets.' }
      ]
    }
  };

  // Calculations
  const lodPercent = lodInitial > 0 ? ((lodInitial - lodFinal) / lodInitial) * 100 : 0;
  const swellingIndex = swellDrugG > 0 ? swellVolMl / swellDrugG : 0;
  const foamingIndex = foamTubeMl > 0 ? 1000 / foamTubeMl : 0;
  const totalAshPercent = ashSampleG > 0 ? (ashResidueG / ashSampleG) * 100 : 0;
  const acidInsolAshPercent = ashSampleG > 0 ? (acidInsolAshG / ashSampleG) * 100 : 0;
  const extractivePercent = extractiveDrugG > 0 ? (extractiveResidueG / extractiveDrugG) * 100 * 4 : 0; // 25 mL aliquot of 100 mL
  const foreignMatterPercent = foreignSampleG > 0 ? (foreignMatterG / foreignSampleG) * 100 : 0;

  const calibrationFactor = ocularDivs > 0 ? (stageDivs * 10) / ocularDivs : 0; // µm per ocular div
  const specimenSizeUm = measuredOcularDivs * calibrationFactor;

  const lycoPurity = lycoS > 0 && lycoM > 0 && lycoP > 0 ? ((lycoN * lycoW * 94000 * 100) / (lycoS * lycoM * lycoP)) : 0;

  const categories = ['All', ...Array.from(new Set(unitVPlants.map((p) => p.cat)))];
  const filteredPlants = plantFilter === 'All' ? unitVPlants : unitVPlants.filter((p) => p.cat === plantFilter);

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-slate-100 pb-12">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">BP105T / BP110P Core Practical Suite (14 Experiments)</span>
        <h2 className="text-2xl md:text-3xl font-bold mt-1 mb-1 text-white">Pharmacognosy &amp; Phytochemistry Laboratory</h2>
        <p className="text-slate-400 text-sm">
          Unit V Medicinal Plants Morphology, Organoleptic &amp; Powder Microscopy, Leaf Constants, Eyepiece Micrometry, Lycopodium Spore Purity, Physicochemical QC, and Voucher Herbarium Builder.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'leaf_constants', label: '🌿 Leaf Constants & Micrometry (Exp 8, 9, 12, 13)' },
          { id: 'morphology', label: '🌱 Unit V Plant Morphology (Exp 1)' },
          { id: 'powder', label: '🔬 Powder Microscopy (Exp 2–5)' },
          { id: 'physicochemical', label: '⚗️ Physicochemical QC (Exp 6, 7, 10, 11)' },
          { id: 'voucher', label: '🏷️ Voucher Specimen Builder (Exp 14)' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-lg'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: LEAF CONSTANTS, MICROMETRY & LYCOPODIUM (Exp 8, 9, 12, 13) */}
      {activeTab === 'leaf_constants' && (
        <div className="space-y-6">
          {/* Existing Stomatal Index & Veinlet Calculators */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-emerald-300 mb-2">Exp 8. Stomatal Number &amp; Stomatal Index</h3>
              <form onSubmit={calculateStomatalIndex} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Number of Stomata (S)</label>
                  <input
                    type="number"
                    step="any"
                    value={stomataCount}
                    onChange={(e) => setStomataCount(e.target.value)}
                    placeholder="e.g., 15"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Number of Epidermal Cells (E)</label>
                  <input
                    type="number"
                    step="any"
                    value={epidermalCount}
                    onChange={(e) => setEpidermalCount(e.target.value)}
                    placeholder="e.g., 45"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Area Examined for Stomatal Number (mm²)</label>
                  <input
                    type="number"
                    step="any"
                    value={stomatalNumArea}
                    onChange={(e) => setStomatalNumArea(parseFloat(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors">
                  Calculate Stomatal Index
                </button>
              </form>
              {stomatalIndexResult !== null && (
                <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-emerald-900/50 text-center space-y-1">
                  <div>
                    <span className="text-sm text-slate-400">Stomatal Index (I): </span>
                    <span className="text-xl font-bold text-emerald-400">{stomatalIndexResult}%</span>
                  </div>
                  <div className="text-xs text-blue-400">
                    Stomatal Number: {((parseFloat(stomataCount) || 0) / (stomatalNumArea || 1)).toFixed(2)} stomata/mm²
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-emerald-300 mb-2">Exp 9. Vein-Islet &amp; Vein-let Termination Number</h3>
              <form onSubmit={calculateVeinlet} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Vein-let Terminations Counted</label>
                  <input
                    type="number"
                    step="any"
                    value={veinCount}
                    onChange={(e) => setVeinCount(e.target.value)}
                    placeholder="e.g., 22"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Vein-Islets Counted</label>
                  <input
                    type="number"
                    step="any"
                    value={veinIsletCount}
                    onChange={(e) => setVeinIsletCount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Area Examined (mm²)</label>
                  <input
                    type="number"
                    step="any"
                    value={areaCount}
                    onChange={(e) => setAreaCount(e.target.value)}
                    placeholder="e.g., 4"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors">
                  Calculate Vein Parameters
                </button>
              </form>
              {veinletResult !== null && (
                <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-emerald-900/50 text-center space-y-1">
                  <div>
                    <span className="text-sm text-slate-400">Vein-let Termination Number: </span>
                    <span className="text-xl font-bold text-emerald-400">{veinletResult} /mm²</span>
                  </div>
                  <div className="text-xs text-blue-400">
                    Vein-Islet Number: {(veinIsletCount / (parseFloat(areaCount) || 1)).toFixed(2)} islets/mm²
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Exp 12 & 13: Eyepiece Micrometry & Lycopodium Spore Method */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Ruler className="w-4 h-4 text-blue-400" />
                <span>Exp 12. Eyepiece Micrometry (Ca-Oxalate Crystals &amp; Fibers)</span>
              </h3>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Stage Divs (10 µm ea)</label>
                  <input type="number" value={stageDivs} onChange={(e) => setStageDivs(parseFloat(e.target.value) || 0)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Coinciding Ocular Divs</label>
                  <input type="number" value={ocularDivs} onChange={(e) => setOcularDivs(parseFloat(e.target.value) || 1)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Crystal/Fiber (Ocular)</label>
                  <input type="number" value={measuredOcularDivs} onChange={(e) => setMeasuredOcularDivs(parseFloat(e.target.value) || 0)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" />
                </div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs flex justify-between items-center">
                <span>Calibration Factor: <strong className="font-mono text-blue-400">{calibrationFactor.toFixed(2)} µm/div</strong></span>
                <span>Dimension: <strong className="font-mono text-emerald-400 text-base">{specimenSizeUm.toFixed(1)} µm</strong></span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white">Exp 13. Lycopodium Spore Method (% Purity)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Particles/field (N)</label>
                  <input type="number" value={lycoN} onChange={(e) => setLycoN(parseFloat(e.target.value) || 0)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Lycopodium Wt (W, g)</label>
                  <input type="number" step="0.01" value={lycoW} onChange={(e) => setLycoW(parseFloat(e.target.value) || 0)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Spores/field (S)</label>
                  <input type="number" value={lycoS} onChange={(e) => setLycoS(parseFloat(e.target.value) || 1)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Sample Wt (M, g)</label>
                  <input type="number" step="0.01" value={lycoM} onChange={(e) => setLycoM(parseFloat(e.target.value) || 1)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white" />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-400 mb-1">Standard Particles/mg (P, e.g., 280 for Clove/Ginger)</label>
                  <input type="number" value={lycoP} onChange={(e) => setLycoP(parseFloat(e.target.value) || 1)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white" />
                </div>
              </div>
              <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-3 text-center">
                <span className="text-xs text-slate-400">Formula: (N × W × 94,000 × 100) / (S × M × P) &rarr; </span>
                <strong className="text-lg font-mono text-emerald-400">{Math.min(100, lycoPurity).toFixed(2)}% Purity</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MORPHOLOGICAL STUDY OF UNIT V MEDICINAL PLANTS (Exp 1) */}
      {activeTab === 'morphology' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2 text-emerald-400">
              <Leaf className="w-5 h-5" />
              <div>
                <h3 className="text-lg font-bold text-white">Exp 1. Morphological Study of Unit V Phyto-Therapeutic Plants</h3>
                <p className="text-xs text-slate-400">All 20 medicinal plants prescribed in BP105T Unit V &amp; BP110P Practical 1.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setPlantFilter(cat)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-semibold border ${
                    plantFilter === cat ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlants.map((p) => (
              <div key={p.name} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-emerald-400">{p.name}</h4>
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-[10px] text-blue-300">{p.cat}</span>
                </div>
                <p className="italic text-slate-400">{p.botanical}</p>
                <p><strong className="text-slate-300">Part Used:</strong> {p.part}</p>
                <p><strong className="text-slate-300">Constituents:</strong> {p.constituents}</p>
                <p><strong className="text-slate-300">Uses:</strong> {p.use}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: POWDER MICROSCOPY (Exp 2-5) */}
      {activeTab === 'powder' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <h3 className="text-lg font-bold text-white">Exp 2–5. Organoleptic &amp; Powder Microscopical Characters</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'exp2', label: 'Exp 2: Tulsi & Ashwagandha' },
              { id: 'exp3', label: 'Exp 3: Amla & Arjuna' },
              { id: 'exp4', label: 'Exp 4: Turmeric & Psyllium' },
              { id: 'exp5', label: 'Exp 5: Brahmi & Fenugreek' }
            ].map((e) => (
              <button
                key={e.id}
                onClick={() => setSelectedPowderExp(e.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border ${
                  selectedPowderExp === e.id ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {powderExperiments[selectedPowderExp].drugs.map((d) => (
              <div key={d.name} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3 text-xs">
                <h4 className="text-base font-bold text-emerald-400">{d.name}</h4>
                <p className="text-slate-300 leading-relaxed"><strong>Organoleptic Characters:</strong> {d.organoleptic}</p>
                <p className="text-slate-300 leading-relaxed"><strong>Diagnostic Powder Microscopy:</strong> {d.microscopy}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PHYSICOCHEMICAL QC (Exp 6, 7, 10, 11) */}
      {activeTab === 'physicochemical' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Exp 6: Moisture Content */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3 text-xs">
            <h3 className="text-base font-bold text-emerald-400">Exp 6. Moisture Content (Loss on Drying)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Initial Weight (g)</label>
                <input type="number" step="0.01" value={lodInitial} onChange={(e) => setLodInitial(parseFloat(e.target.value) || 0)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Constant Dry Weight (g)</label>
                <input type="number" step="0.01" value={lodFinal} onChange={(e) => setLodFinal(parseFloat(e.target.value) || 0)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" />
              </div>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              Moisture Content (LOD): <strong className="text-emerald-400 font-mono text-base">{lodPercent.toFixed(2)}% w/w</strong>
            </div>
          </div>

          {/* Exp 7: Swelling & Foaming Index */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3 text-xs">
            <h3 className="text-base font-bold text-emerald-400">Exp 7. Swelling Index &amp; Foaming Index (WHO)</h3>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-slate-400 mb-1">Drug Wt (g)</label>
                <input type="number" step="0.1" value={swellDrugG} onChange={(e) => setSwellDrugG(parseFloat(e.target.value) || 1)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Swollen Vol (mL)</label>
                <input type="number" step="0.5" value={swellVolMl} onChange={(e) => setSwellVolMl(parseFloat(e.target.value) || 0)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">1cm Foam Tube (mL)</label>
                <input type="number" value={foamTubeMl} onChange={(e) => setFoamTubeMl(parseFloat(e.target.value) || 1)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white" />
              </div>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-around">
              <span>Swelling Index: <strong className="text-emerald-400 font-mono">{swellingIndex.toFixed(1)} mL/g</strong></span>
              <span>Foaming Index: <strong className="text-blue-400 font-mono">{foamingIndex.toFixed(0)}</strong></span>
            </div>
          </div>

          {/* Exp 10: Ash & Extractive Values */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3 text-xs">
            <h3 className="text-base font-bold text-emerald-400">Exp 10. Ash Values &amp; Extractive Values</h3>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-slate-400 mb-1">Sample Wt (g)</label>
                <input type="number" step="0.1" value={ashSampleG} onChange={(e) => setAshSampleG(parseFloat(e.target.value) || 1)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Total Ash Wt (g)</label>
                <input type="number" step="0.01" value={ashResidueG} onChange={(e) => setAshResidueG(parseFloat(e.target.value) || 0)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Acid-Insol Ash (g)</label>
                <input type="number" step="0.01" value={acidInsolAshG} onChange={(e) => setAcidInsolAshG(parseFloat(e.target.value) || 0)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 mb-1">Extractive Maceration Drug (g)</label>
                <input type="number" step="0.1" value={extractiveDrugG} onChange={(e) => setExtractiveDrugG(parseFloat(e.target.value) || 1)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">25mL Evaporated Residue (g)</label>
                <input type="number" step="0.01" value={extractiveResidueG} onChange={(e) => setExtractiveResidueG(parseFloat(e.target.value) || 0)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white" />
              </div>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-wrap justify-between gap-2">
              <span>Total Ash: <strong className="text-emerald-400 font-mono">{totalAshPercent.toFixed(2)}%</strong></span>
              <span>Acid-Insol: <strong className="text-amber-400 font-mono">{acidInsolAshPercent.toFixed(2)}%</strong></span>
              <span>Extractive: <strong className="text-blue-400 font-mono">{extractivePercent.toFixed(2)}%</strong></span>
            </div>
          </div>

          {/* Exp 11: Foreign Organic Matter */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3 text-xs">
            <h3 className="text-base font-bold text-emerald-400">Exp 11. Foreign Organic Matter Determination</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Total Crude Drug Sample (g)</label>
                <input type="number" step="1" value={foreignSampleG} onChange={(e) => setForeignSampleG(parseFloat(e.target.value) || 1)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Separated Foreign Matter (g)</label>
                <input type="number" step="0.05" value={foreignMatterG} onChange={(e) => setForeignMatterG(parseFloat(e.target.value) || 0)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" />
              </div>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center space-y-1">
              <div>Foreign Organic Matter: <strong className="text-emerald-400 font-mono text-base">{foreignMatterPercent.toFixed(2)}% w/w</strong></div>
              <div className={`text-[11px] font-semibold ${foreignMatterPercent <= 2.0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {foreignMatterPercent <= 2.0 ? 'PASS (Within standard ≤ 2.0% pharmacopoeial limit)' : 'FAIL (Exceeds 2.0% limit — requires sorting)'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: VOUCHER SPECIMEN HERBARIUM BUILDER (Exp 14) */}
      {activeTab === 'voucher' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-3 text-xs">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Tag className="w-4 h-4 text-emerald-400" />
              <span>Exp 14. Voucher Specimen Label Builder</span>
            </h3>
            {[
              { key: 'botanicalName', label: 'Botanical Name (Genus species)' },
              { key: 'family', label: 'Family' },
              { key: 'vernacularName', label: 'Common / Vernacular Name' },
              { key: 'partUsed', label: 'Part Collected' },
              { key: 'locality', label: 'Collection Locality & Habitat' },
              { key: 'collector', label: 'Collector Name' },
              { key: 'voucherNo', label: 'Voucher Accession No.' }
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-slate-400 mb-1">{f.label}</label>
                <input
                  type="text"
                  value={voucher[f.key]}
                  onChange={(e) => setVoucher({ ...voucher, [f.key]: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>
            ))}
          </div>
          <div className="lg:col-span-7 bg-slate-950 border-2 border-dashed border-emerald-500/40 rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Herbarium Voucher Label</span>
                <span className="text-xs font-mono text-slate-400">{voucher.voucherNo}</span>
              </div>
              <h4 className="text-2xl font-bold italic text-white">{voucher.botanicalName}</h4>
              <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider">Family: {voucher.family}</p>
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-slate-300">
                <p><strong>Vernacular:</strong> {voucher.vernacularName}</p>
                <p><strong>Part Used:</strong> {voucher.partUsed}</p>
                <p className="col-span-2"><strong>Locality:</strong> {voucher.locality}</p>
                <p><strong>Collector:</strong> {voucher.collector}</p>
                <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-4 pt-3 border-t border-slate-800">
              Experiential learning record: Medicinal Plant Garden Excursion &amp; Herbarium Preparation (BP110P Exp 14).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
