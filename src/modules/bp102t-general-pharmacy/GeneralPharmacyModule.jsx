import React, { useState, useEffect } from 'react';
import { FlaskConical, Calculator, Scale, Droplet, CheckCircle2, BookOpen, Tag, Package } from 'lucide-react';
import ResourceConnector from '../../components/ResourceConnector';

export default function GeneralPharmacyModule({ initialTab, navNonce }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'experiments');

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab, navNonce]);

  // Existing Calculator States
  const [highConc, setHighConc] = useState(20);
  const [lowConc, setLowConc] = useState(5);
  const [targetConc, setTargetConc] = useState(10);
  const [totalVolume, setTotalVolume] = useState(1000);

  const [stockAlcohol, setStockAlcohol] = useState(95);
  const [targetAlcohol, setTargetAlcohol] = useState(25);
  const [finalVolumeMl, setFinalVolumeMl] = useState(500);

  const [drugWeight, setDrugWeight] = useState(1.0);
  const [displacementValue, setDisplacementValue] = useState(0.7);
  const [suppositoryMouldSize, setSuppositoryMouldSize] = useState(2.0);
  const [numSuppositories, setNumSuppositories] = useState(10);

  const [isoDrugGrams, setIsoDrugGrams] = useState(1.0);
  const [isoVolumeMl, setIsoVolumeMl] = useState(100);
  const [eValue, setEValue] = useState(0.22);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDrug, setSelectedDrug] = useState('Paracetamol');
  const [prescribedDose, setPrescribedDose] = useState(500);

  // New BP107P Compounding Workbench State
  const [selectedPrepId, setSelectedPrepId] = useState('sol_ammonium');
  const [batchFactor, setBatchFactor] = useState(1.0);
  const [completedSteps, setCompletedSteps] = useState({});

  // Posology & Proof Spirit / Ratio Dilution State (BP102T Unit II)
  const [adultDoseMg, setAdultDoseMg] = useState(500);
  const [childAgeYrs, setChildAgeYrs] = useState(6);
  const [childAgeMonths, setChildAgeMonths] = useState(10);
  const [childWtKg, setChildWtKg] = useState(20);
  const [childBsaM2, setChildBsaM2] = useState(0.8);
  const [spiritVvPct, setSpiritVvPct] = useState(95);
  const [ratioStockPct, setRatioStockPct] = useState(10);
  const [ratioTarget1InX, setRatioTarget1InX] = useState(500);
  const [ratioVolMl, setRatioVolMl] = useState(250);
  const [bp102Unit, setBp102Unit] = useState('u1');

  const bp107pPreparations = [
    {
      id: 'sol_ammonium',
      category: '2. Solutions',
      code: 'Exp 2(a)',
      name: 'Strong Solution of Ammonium Acetate – IP',
      baseSize: '100 mL',
      type: 'Internal Liquid',
      storage: 'Well-closed container, cool place',
      auxiliaryLabel: 'Dilute well before administration',
      formula: [
        { ingredient: 'Glacial Acetic Acid', qty: 45.3, unit: 'g' },
        { ingredient: 'Strong Ammonia Solution', qty: 65.0, unit: 'mL (approx. to neutralize)' },
        { ingredient: 'Purified Water q.s. to', qty: 100.0, unit: 'mL' }
      ],
      steps: [
        'Mix glacial acetic acid with 35 mL purified water in a beaker.',
        'Add strong ammonia solution gradually with continuous stirring until a drop gives neutral reaction to bromothymol blue (pH ~7.0-7.5).',
        'Adjust final volume to required batch volume with purified water and filter if necessary.'
      ],
      use: 'Diaphoretic and mild expectorant.'
    },
    {
      id: 'sol_cresol',
      category: '2. Solutions',
      code: 'Exp 2(b)',
      name: 'Cresol with Soap Solution (Lysol) – IP',
      baseSize: '100 mL',
      type: 'External Antiseptic / Disinfectant',
      storage: 'Amber-colored, tightly closed bottle',
      auxiliaryLabel: 'FOR EXTERNAL USE ONLY • DILUTE BEFORE USE',
      formula: [
        { ingredient: 'Cresol', qty: 50.0, unit: 'mL' },
        { ingredient: 'Linseed Oil (or Castor/Vegetable Oil)', qty: 18.0, unit: 'g' },
        { ingredient: 'Potassium Hydroxide (KOH)', qty: 4.2, unit: 'g' },
        { ingredient: 'Purified Water q.s. to', qty: 100.0, unit: 'mL' }
      ],
      steps: [
        'Dissolve KOH in 25 mL purified water and warm on a water bath.',
        'Add vegetable oil slowly with constant stirring until saponification is complete (clear foam test in water).',
        'Incorporate cresol gradually into the warm soap base and adjust volume with purified water.'
      ],
      use: 'Powerful phenolic disinfectant for surgical instruments and surfaces (50% v/v cresol).'
    },
    {
      id: 'sol_lugol',
      category: '2. Solutions',
      code: 'Exp 2(c)',
      name: "Lugol's Solution (Aqueous Iodine Solution) – BPC",
      baseSize: '100 mL',
      type: 'Internal / Thyroid Suppression',
      storage: 'Well-closed, iodine-resistant amber glass container',
      auxiliaryLabel: 'Store protected from light • Dilute in milk/water before taking',
      formula: [
        { ingredient: 'Iodine (I₂)', qty: 5.0, unit: 'g' },
        { ingredient: 'Potassium Iodide (KI)', qty: 10.0, unit: 'g' },
        { ingredient: 'Purified Water q.s. to', qty: 100.0, unit: 'mL' }
      ],
      steps: [
        'Dissolve Potassium Iodide completely in ~15 mL purified water (KI forms soluble triiodide complex KI₃).',
        'Add accurately weighed Iodine crystals and stir with a glass rod until completely dissolved.',
        'Make up the final volume to 100 mL using purified water (avoid metal spatulas).'
      ],
      use: 'Source of elemental iodine in hyperthyroidism (pre-operative thyroid storm) and antiseptic.'
    },
    {
      id: 'syrup_simple',
      category: '3. Syrups',
      code: 'Exp 3(a)',
      name: 'Simple Syrup – IP',
      baseSize: '100 g',
      type: 'Oral Pharmaceutical Vehicle',
      storage: 'Tightly closed container, cool place (prevent crystallization/fermentation)',
      auxiliaryLabel: '66.7% w/w Sucrose • Specific Gravity 1.313 at 25°C',
      formula: [
        { ingredient: 'Sucrose (IP Grade)', qty: 66.7, unit: 'g' },
        { ingredient: 'Purified Water q.s. to', qty: 100.0, unit: 'g' }
      ],
      steps: [
        'Weigh purified water into a tared beaker and heat gently (do not boil excessively to prevent caramelization/inversion).',
        'Add sucrose gradually with continuous stirring until completely dissolved.',
        'Cool, adjust final weight to 100 g with purified water, and strain through muslin cloth.'
      ],
      use: 'Sweetening agent, viscosity modifier, and self-preserving oral liquid vehicle (66.7% w/w).'
    },
    {
      id: 'pwd_ors',
      category: '4. Powders & Granules',
      code: 'Exp 4(a)',
      name: 'Oral Rehydration Salts (ORS) Powder – WHO',
      baseSize: '1 Litre Pack (20.5 g)',
      type: 'Oral Electrolyte Powder',
      storage: 'Moisture-proof laminated aluminium sachet, dry place',
      auxiliaryLabel: 'Dissolve entire contents in 1 Litre of clean drinking water. Use within 24 hours.',
      formula: [
        { ingredient: 'Sodium Chloride (NaCl)', qty: 2.6, unit: 'g' },
        { ingredient: 'Glucose, Anhydrous', qty: 13.5, unit: 'g' },
        { ingredient: 'Potassium Chloride (KCl)', qty: 1.5, unit: 'g' },
        { ingredient: 'Trisodium Citrate, Dihydrate', qty: 2.9, unit: 'g' }
      ],
      steps: [
        'Dry hygroscopic salts gently and pass all ingredients separately through Sieve No. 60.',
        'Mix geometrically in ascending order of weights (KCl -> NaCl -> Trisodium Citrate -> Glucose).',
        'Pack 20.5 g (low-osmolarity WHO formula: 245 mOsm/L) in moisture-tight pouches.'
      ],
      use: 'Oral rehydration therapy in acute diarrhea and electrolyte depletion (Na⁺ 75, Cl⁻ 65, K⁺ 20, Citrate 10, Glucose 75 mmol/L).'
    },
    {
      id: 'pwd_effervescent',
      category: '4. Powders & Granules',
      code: 'Exp 4(b)',
      name: 'Effervescent Granules (Sodium Phosphate/Citrate) – IP',
      baseSize: '50 g',
      type: 'Internal Effervescent Granules',
      storage: 'Airtight wide-mouth bottle in cool dry place',
      auxiliaryLabel: 'Dissolve in a glass of water and drink while effervescing',
      formula: [
        { ingredient: 'Sodium Bicarbonate (NaHCO₃)', qty: 25.5, unit: 'g' },
        { ingredient: 'Tartaric Acid', qty: 13.5, unit: 'g' },
        { ingredient: 'Citric Acid Monohydrate', qty: 9.5, unit: 'g' },
        { ingredient: 'Active / Base excipient (Sucrose)', qty: 1.5, unit: 'g' }
      ],
      steps: [
        'Powder and dry ingredients thoroughly; mix tartaric acid, citric acid (monohydrate releases 1 mol H₂O on heating), and sodium bicarbonate.',
        'Heat mixture in a porcelain dish on a water bath (95–105°C) until water of crystallization forms a coherent damp mass.',
        'Force damp mass through Sieve No. 12 to form granules, dry at ≤50°C, and pack immediately in airtight containers.'
      ],
      use: 'Rapid CO₂ effervescence masks bitter taste and enhances gastric buffering/dissolution.'
    },
    {
      id: 'pwd_dusting',
      category: '4. Powders & Granules',
      code: 'Exp 4(c)',
      name: 'Dusting Powder (Talc-Starch-Zinc Oxide) – IP',
      baseSize: '50 g',
      type: 'External Topical Powder',
      storage: 'Sifter-top airtight container, dry place',
      auxiliaryLabel: 'FOR EXTERNAL USE ONLY • Do not apply to open wounds or broken skin',
      formula: [
        { ingredient: 'Zinc Oxide', qty: 10.0, unit: 'g' },
        { ingredient: 'Starch (Maize)', qty: 15.0, unit: 'g' },
        { ingredient: 'Purified Talc (Sterilized)', qty: 25.0, unit: 'g' }
      ],
      steps: [
        'Sift each powder individually through Sieve No. 120 (fine impalpable grade to prevent grittiness).',
        'Mix geometrically using a light spatula on paper/mortar without heavy trituration.',
        'Sterilize talc base if intended for surgical/abraded areas and pack in sifter-top container.'
      ],
      use: 'Absorbent, astringent, and protective topical powder for chafing and minor skin irritation.'
    },
    {
      id: 'pwd_divided',
      category: '4. Powders & Granules',
      code: 'Exp 4(d)',
      name: 'Divided Powders (Chartulae) – IP',
      baseSize: '6 Powders (500 mg each)',
      type: 'Oral Solid Divided Dose',
      storage: 'Dry place in butter/waxed paper packets inside powder box',
      auxiliaryLabel: 'Take one powder with water as directed',
      formula: [
        { ingredient: 'Paracetamol / Aspirin (API)', qty: 1.5, unit: 'g (250 mg/dose)' },
        { ingredient: 'Lactose Diluent', qty: 1.5, unit: 'g' }
      ],
      steps: [
        'Calculate total quantities for N+1 extra powder to compensate for trituration loss.',
        'Triturate API and lactose using geometric dilution method until uniform.',
        'Weigh each dose individually (500 mg) onto folded parchment/waxed paper (double-wrap if hygroscopic) and secure neatly.'
      ],
      use: 'Accurate unit-dose solid dispensing for pediatric or extemporaneous oral therapy.'
    },
    {
      id: 'supp_glycerin',
      category: '5. Suppositories',
      code: 'Exp 5(a)',
      name: 'Glycerogelatin Suppository – BPC',
      baseSize: '6 Suppositories (1.2× Mould)',
      type: 'Rectal Suppository',
      storage: 'Tightly closed container, cool place (<25°C)',
      auxiliaryLabel: 'FOR RECTAL USE ONLY • Moisten with water before insertion',
      formula: [
        { ingredient: 'Gelatin (Pharmaceutical Grade)', qty: 1.4, unit: 'g' },
        { ingredient: 'Glycerin', qty: 7.0, unit: 'g' },
        { ingredient: 'Purified Water q.s. to', qty: 10.0, unit: 'g' }
      ],
      steps: [
        'Lubricate suppository mould lightly with liquid paraffin (do not use soap/water).',
        'Soak gelatin in water for 5 mins, add glycerin, and heat gently on water bath until gelatin dissolves (avoid stirring air bubbles).',
        'Pour into calibrated mould (remember glycerogelatin density factor = 1.2× cocoa butter), cool until set, trim, and wrap.'
      ],
      use: 'Osmotic laxative effect in constipation; dissolves slowly in rectal fluids.'
    },
    {
      id: 'supp_cocoa',
      category: '5. Suppositories',
      code: 'Exp 5(b)',
      name: 'Cocoa Butter (Theobroma Oil) Suppository – IP',
      baseSize: '6 Suppositories (1 g mould)',
      type: 'Rectal Suppository (Oleaginous Base)',
      storage: 'Cool place (<20°C)',
      auxiliaryLabel: 'FOR RECTAL USE ONLY • Store in refrigerator',
      formula: [
        { ingredient: 'Theobroma Oil (Cocoa Butter)', qty: 6.0, unit: 'g (plus excess for 7-8)' }
      ],
      steps: [
        'Grate cocoa butter and melt gently at ≤35°C (do NOT overheat >36°C or unstable low-melting α/γ polymorphs form).',
        'Stir to creamy pourable consistency near solidification point (preserve stable β-crystals).',
        'Pour into unlubricated/lightly soap-lubricated chilled mould, overfill slightly, trim flush after cooling, and unmould.'
      ],
      use: 'Soothing emollient oleaginous suppository base melting at body temperature (34–35°C).'
    },
    {
      id: 'supp_zno',
      category: '5. Suppositories',
      code: 'Exp 5(c)',
      name: 'Zinc Oxide Suppository (DV = 4.0) – IP',
      baseSize: '6 Suppositories (1 g mould, 100 mg ZnO each)',
      type: 'Medicated Rectal Suppository',
      storage: 'Cool dry place (<25°C)',
      auxiliaryLabel: 'FOR RECTAL USE ONLY',
      formula: [
        { ingredient: 'Zinc Oxide (Sieve #120)', qty: 0.6, unit: 'g (calculate for 8: 0.8 g)' },
        { ingredient: 'Cocoa Butter Base (adjusted for DV 4.0)', qty: 5.85, unit: 'g (for 6; 7.8 g for 8)' }
      ],
      steps: [
        'Calculate base displaced using Displacement Value (DV of ZnO = 4.0): Displaced base = 0.8 / 4.0 = 0.2 g; Base = 8.0 - 0.2 = 7.8 g.',
        'Melt 2/3 of cocoa butter at ≤35°C, levigate finely sifted ZnO on a warm tile with remaining melted base.',
        'Combine, stir continuously to prevent dense ZnO sedimentation, and pour just before thickening.'
      ],
      use: 'Astringent and protective suppository for hemorrhoids and anorectal inflammation.'
    },
    {
      id: 'semi_sulphur',
      category: '6. Semisolids',
      code: 'Exp 6(a)',
      name: 'Sulphur Ointment (10% w/w) – IP',
      baseSize: '50 g',
      type: 'Topical Ointment',
      storage: 'Well-closed container, cool place',
      auxiliaryLabel: 'FOR EXTERNAL USE ONLY • Apply thinly to affected skin',
      formula: [
        { ingredient: 'Sublimed / Precipitated Sulphur', qty: 5.0, unit: 'g' },
        { ingredient: 'Simple Ointment Base (Wool fat, Hard paraffin, Cetostearyl alcohol, White soft paraffin)', qty: 45.0, unit: 'g' }
      ],
      steps: [
        'Pass sulphur through Sieve No. 120 to eliminate gritty agglomerates.',
        'Place sulphur on an ointment slab and levigate with a small portion of Simple Ointment (or 1–2 drops liquid paraffin) using a stainless steel spatula.',
        'Incorporate remaining ointment base geometrically until completely smooth and homogeneous.'
      ],
      use: 'Scabicide, keratolytic, and mild antifungal ointment.'
    },
    {
      id: 'semi_iodine',
      category: '6. Semisolids',
      code: 'Exp 6(b)',
      name: 'Non-Staining Iodine Ointment with Methyl Salicylate – BPC',
      baseSize: '50 g',
      type: 'Topical Counter-Irritant Ointment',
      storage: 'Amber glass ointment jar, cool place',
      auxiliaryLabel: 'FOR EXTERNAL USE ONLY • Keep away from eyes & broken skin',
      formula: [
        { ingredient: 'Iodine', qty: 2.5, unit: 'g' },
        { ingredient: 'Arachis Oil (Unsaturated fixed oil)', qty: 10.0, unit: 'mL' },
        { ingredient: 'Methyl Salicylate', qty: 2.5, unit: 'mL' },
        { ingredient: 'Yellow Soft Paraffin q.s. to', qty: 50.0, unit: 'g' }
      ],
      steps: [
        'Warm iodine with arachis oil in a stoppered flask at ~50°C with gentle shaking until free brown iodine reacts with unsaturated oil double bonds and turns dark greenish-black (non-staining).',
        'Melt yellow soft paraffin gently and blend into the iodized oil.',
        'When cooled to ~40°C, stir in volatile methyl salicylate (prevent evaporation loss) and pack.'
      ],
      use: 'Counter-irritant and analgesic rub for sprains, myalgia, and joint stiffness.'
    },
    {
      id: 'gargle_iodine',
      category: '7. Gargles & Mouthwashes',
      code: 'Exp 7(a)',
      name: 'Compound Iodine Gargle (Phenol-Iodine) – BPC',
      baseSize: '100 mL',
      type: 'Oropharyngeal Gargle',
      storage: 'Amber bottle, tightly closed',
      auxiliaryLabel: 'NOT TO BE SWALLOWED • Dilute with equal volume of warm water before gargling',
      formula: [
        { ingredient: 'Iodine', qty: 0.5, unit: 'g' },
        { ingredient: 'Potassium Iodide', qty: 1.0, unit: 'g' },
        { ingredient: 'Liquefied Phenol', qty: 0.5, unit: 'mL' },
        { ingredient: 'Glycerin', qty: 40.0, unit: 'mL' },
        { ingredient: 'Purified Water q.s. to', qty: 100.0, unit: 'mL' }
      ],
      steps: [
        'Dissolve KI in 10 mL water, then dissolve Iodine completely to form clear triiodide solution.',
        'Add liquefied phenol and glycerin slowly with stirring.',
        'Adjust final volume with purified water and affix red "NOT TO BE SWALLOWED" dispensing label.'
      ],
      use: 'Antiseptic and soothing throat gargle for pharyngitis and tonsillitis.'
    },
    {
      id: 'mw_chx',
      category: '7. Gargles & Mouthwashes',
      code: 'Exp 7(b)',
      name: 'Chlorhexidine Mouthwash (0.2% w/v) – IP',
      baseSize: '100 mL',
      type: 'Antiseptic Mouthwash',
      storage: 'Light-resistant container at room temperature',
      auxiliaryLabel: 'FOR ORAL RINSE ONLY • Do not swallow • Wait 30 min after brushing',
      formula: [
        { ingredient: 'Chlorhexidine Gluconate Solution (20% w/v)', qty: 1.0, unit: 'mL (yields 0.2% w/v)' },
        { ingredient: 'Peppermint Oil / Spirit', qty: 0.2, unit: 'mL' },
        { ingredient: 'Glycerin (Humectant)', qty: 5.0, unit: 'mL' },
        { ingredient: 'Purified Water q.s. to', qty: 100.0, unit: 'mL' }
      ],
      steps: [
        'Measure Chlorhexidine Gluconate 20% concentrate accurately using a graduated pipette.',
        'Mix peppermint flavouring with glycerin and blend gradually into ~70 mL purified water.',
        'Add chlorhexidine solution (avoid anionic surfactants/soaps which precipitate cationic CHX) and make up to 100 mL.'
      ],
      use: 'Broad-spectrum anti-plaque and gingivitis oral antiseptic rinse.'
    }
  ];

  const marketedCompendium = [
    { brand: 'Electral (FDC)', generic: 'WHO ORS Powder 21.8 g', form: 'Oral Powder Sachet', standard: 'WHO / IP', labelReq: 'Dissolve in 1L boiled & cooled water; discard after 24h' },
    { brand: 'Betadine Gargle', generic: 'Povidone-Iodine 2% w/v', form: 'Gargle / Mouthwash', standard: 'IP / BPC', labelReq: 'For external/oral rinse only; do not swallow' },
    { brand: 'Hexidine', generic: 'Chlorhexidine Gluconate 0.2%', form: 'Mouthwash', standard: 'IP', labelReq: 'Rinse 10 mL for 1 min; do not swallow' },
    { brand: 'Dulcolax / Glycerin Suppository', generic: 'Bisacodyl / Glycerogelatin', form: 'Rectal Suppository', standard: 'IP / BPC', labelReq: 'For rectal use only; store below 25°C' },
    { brand: 'Iodex', generic: 'Non-staining Iodine + Methyl Salicylate', form: 'Topical Balm/Ointment', standard: 'BPC', labelReq: 'For external use only; keep away from eyes' },
    { brand: 'Candid Dusting Powder', generic: 'Clotrimazole 1% + Talc', form: 'Dusting Powder', standard: 'IP', labelReq: 'For external use only; keep dry' }
  ];

  const latinDictionary = [
    { term: 'b.i.d. (bis in die)', meaning: 'Twice a day', category: 'Frequency' },
    { term: 't.i.d. (ter in die)', meaning: 'Three times a day', category: 'Frequency' },
    { term: 'q.i.d. (quater in die)', meaning: 'Four times a day', category: 'Frequency' },
    { term: 'stat. (statim)', meaning: 'Immediately / At once', category: 'Urgency' },
    { term: 'p.r.n. (pro re nata)', meaning: 'As needed / When required', category: 'Condition' },
    { term: 'h.s. (hora somni)', meaning: 'At bedtime', category: 'Timing' },
    { term: 'sig. (signa)', meaning: 'Write on label / Instructions', category: 'Direction' },
    { term: 'a.c. (ante cibum)', meaning: 'Before meals', category: 'Timing' },
    { term: 'p.c. (post cibum)', meaning: 'After meals', category: 'Timing' },
    { term: 'gtt. (gutta)', meaning: 'Drop(s)', category: 'Form' }
  ];

  const drugDatabase = {
    'Paracetamol': { maxSingle: 1000, maxDaily: 4000, unit: 'mg' },
    'Aspirin': { maxSingle: 1000, maxDaily: 4000, unit: 'mg' },
    'Ibuprofen': { maxSingle: 800, maxDaily: 3200, unit: 'mg' }
  };

  const currentDrugInfo = drugDatabase[selectedDrug] || { maxSingle: 1000, maxDaily: 4000, unit: 'mg' };
  const isDoseSafe = prescribedDose <= currentDrugInfo.maxSingle;

  const highParts = Math.abs(targetConc - lowConc);
  const lowParts = Math.abs(highConc - targetConc);
  const totalParts = highParts + lowParts;
  const highVolume = totalParts > 0 ? (highParts / totalParts) * totalVolume : 0;
  const lowVolume = totalParts > 0 ? (lowParts / totalParts) * totalVolume : 0;

  const volumeOfStock = targetAlcohol && finalVolumeMl ? (targetAlcohol * finalVolumeMl) / stockAlcohol : 0;
  const volumeOfWater = finalVolumeMl - volumeOfStock;

  const totalDrugNeeded = drugWeight * numSuppositories;
  const totalDisplacement = drugWeight * displacementValue * numSuppositories;
  const totalBaseNeeded = (suppositoryMouldSize * numSuppositories) - totalDisplacement;

  const naclNeededForIsotonic = (0.9 / 100) * isoVolumeMl;
  const naclEquivalentOfDrug = isoDrugGrams * eValue;
  const additionalNaclNeeded = naclNeededForIsotonic - naclEquivalentOfDrug;

  // Posology & Proof Spirit Calculations
  const youngsDose = adultDoseMg * (childAgeYrs / (childAgeYrs + 12));
  const dillingDose = adultDoseMg * (childAgeYrs / 20);
  const clarkDose = adultDoseMg * ((childWtKg * 2.20462) / 150);
  const friedDose = adultDoseMg * (childAgeMonths / 150);
  const bsaDose = adultDoseMg * (childBsaM2 / 1.73);
  const proofStrength = spiritVvPct * 1.753;
  const proofLabel = proofStrength >= 100 ? `${(proofStrength - 100).toFixed(1)}° O.P. (Over Proof)` : `${(100 - proofStrength).toFixed(1)}° U.P. (Under Proof)`;
  const targetRatioPct = ratioTarget1InX > 0 ? (100 / ratioTarget1InX) : 0;
  const ratioStockMl = ratioStockPct > 0 ? (targetRatioPct * ratioVolMl) / ratioStockPct : 0;

  const filteredLatin = latinDictionary.filter((item) =>
    item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.meaning.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedPrep = bp107pPreparations.find((p) => p.id === selectedPrepId) || bp107pPreparations[0];

  const toggleStep = (idx) => {
    const key = `${selectedPrep.id}-${idx}`;
    setCompletedSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-slate-900 dark:text-slate-100 pb-12">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl">
        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">PCI B.Pharm &bull; General Pharmacy (Practical) &bull; BP102T / BP107P</span>
        <h2 className="text-2xl md:text-3xl font-bold mt-1.5 text-slate-900 dark:text-white">General Pharmacy Laboratory Suite</h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-1.5 leading-relaxed">
          All 15 official IP/BPC/WHO compounding experiments (Solutions, Syrups, Powders, Suppositories, Semisolids, Gargles &amp; Mouthwashes), batch scaling, dispensing labels, and pharmaceutical calculators.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'experiments', label: 'BP107P Wet-Lab Experiments (2–7)' },
          { id: 'theory', label: 'BP102T Theory (Units I–V)' },
          { id: 'posology_proof', label: 'Posology & Proof Spirit' },
          { id: 'alligation', label: 'Alligation Calculator' },
          { id: 'alcohol', label: 'Alcohol Dilution' },
          { id: 'suppository', label: 'Suppository Displacement' },
          { id: 'isotonicity', label: 'Isotonicity Adjustment' },
          { id: 'prescription', label: 'Prescription & Latin' },
          { id: 'compendium', label: 'Marketed Compendia' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-50 dark:bg-emerald-600/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm dark:shadow-lg'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* BP107P COMPOUNDING WORKBENCH */}
      {activeTab === 'experiments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-xl space-y-2 max-h-[680px] overflow-y-auto">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 px-2 block pb-1">
              BP107P Official Practicals (15 Formulations)
            </span>
            {bp107pPreparations.map((prep) => (
              <button
                key={prep.id}
                onClick={() => setSelectedPrepId(prep.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  selectedPrepId === prep.id
                    ? 'bg-emerald-50 dark:bg-emerald-600/20 border-emerald-500 text-slate-900 dark:text-white'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <span>{prep.category}</span>
                  <span className="tabular-nums">{prep.code}</span>
                </div>
                <p className="text-sm font-semibold mt-1">{prep.name}</p>
              </button>
            ))}
          </div>

          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{selectedPrep.category} &bull; {selectedPrep.code}</span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{selectedPrep.name}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Category: {selectedPrep.type} &bull; Use: {selectedPrep.use}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Batch Scaling Factor</label>
                <select
                  value={batchFactor}
                  onChange={(e) => setBatchFactor(parseFloat(e.target.value))}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums"
                >
                  <option value={0.5}>0.5× (Half Batch)</option>
                  <option value={1.0}>1.0× ({selectedPrep.baseSize})</option>
                  <option value={2.0}>2.0× (Double Batch)</option>
                  <option value={5.0}>5.0× (Lab Stock)</option>
                </select>
              </div>
            </div>

            {/* Working Formula Table */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-3">
                Master &amp; Working Formula (Scaled {batchFactor}×)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs">
                      <th className="pb-2">Ingredient</th>
                      <th className="pb-2 text-right">Official Qty</th>
                      <th className="pb-2 text-right text-emerald-600 dark:text-emerald-400">Working Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                    {selectedPrep.formula.map((item, i) => (
                      <tr key={i}>
                        <td className="py-2.5 text-slate-800 dark:text-slate-200">{item.ingredient}</td>
                        <td className="py-2.5 text-right text-slate-600 dark:text-slate-400 tabular-nums">{item.qty} {item.unit}</td>
                        <td className="py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{(item.qty * batchFactor).toFixed(2)} {item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Compounding Procedure Checklist */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2.5">
              <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400">Step-by-Step Compounding Procedure</h4>
              {selectedPrep.steps.map((step, idx) => {
                const done = !!completedSteps[`${selectedPrep.id}-${idx}`];
                return (
                  <button
                    key={idx}
                    onClick={() => toggleStep(idx)}
                    className={`w-full text-left p-3.5 rounded-lg border text-sm flex items-start space-x-3 transition-all leading-relaxed ${
                      done ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/40 text-emerald-800 dark:text-emerald-200' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${done ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600'}`} />
                    <span><strong>Step {idx + 1}:</strong> {step}</span>
                  </button>
                );
              })}
            </div>

            {/* Pharmacopoeial Dispensing Label Preview */}
            <div className="bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                <span className="flex items-center space-x-1.5"><Tag className="w-4 h-4 text-amber-600 dark:text-amber-400" /><span>Dispensing Label Preview</span></span>
                <span>PharmLab Model Pharmacy</span>
              </div>
              <p className="text-base font-bold text-slate-900 dark:text-white">{selectedPrep.name}</p>
              <p className="text-sm text-rose-600 dark:text-rose-400 font-bold">{selectedPrep.auxiliaryLabel}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Storage: {selectedPrep.storage}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'alligation' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Alligation Medial / Alternate Calculator</h3>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Higher Concentration Stock (%)</label>
                <input type="number" value={highConc} onChange={e => setHighConc(parseFloat(e.target.value) || 0)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Lower Concentration Stock (%)</label>
                <input type="number" value={lowConc} onChange={e => setLowConc(parseFloat(e.target.value) || 0)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Target Desired Concentration (%)</label>
                <input type="number" value={targetConc} onChange={e => setTargetConc(parseFloat(e.target.value) || 0)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Total Desired Final Volume (mL)</label>
                <input type="number" value={totalVolume} onChange={e => setTotalVolume(parseFloat(e.target.value) || 0)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
            </div>
            <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">Results</span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Higher Parts</span>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">{highParts} parts ({highVolume.toFixed(1)} mL)</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Lower Parts</span>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">{lowParts} parts ({lowVolume.toFixed(1)} mL)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'alcohol' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Alcohol Strength &amp; Dilution Calculator</h3>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Stock Strength (%)</label>
                <input type="number" value={stockAlcohol} onChange={e => setStockAlcohol(parseFloat(e.target.value) || 0)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Target Strength (%)</label>
                <input type="number" value={targetAlcohol} onChange={e => setTargetAlcohol(parseFloat(e.target.value) || 0)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Final Volume (mL)</label>
                <input type="number" value={finalVolumeMl} onChange={e => setFinalVolumeMl(parseFloat(e.target.value) || 0)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
            </div>
            <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-center space-y-2">
              <p className="text-base text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">Volume of Stock Alcohol: {volumeOfStock.toFixed(2)} mL</p>
              <p className="text-base text-blue-600 dark:text-blue-400 font-bold tabular-nums">Water to Add: {Math.max(0, volumeOfWater).toFixed(2)} mL</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'suppository' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Suppository Displacement Value Calculator</h3>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Drug Weight per Suppository (g)</label>
                <input type="number" step="0.1" value={drugWeight} onChange={e => setDrugWeight(parseFloat(e.target.value) || 0)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Displacement Value (DV)</label>
                <input type="number" step="0.05" value={displacementValue} onChange={e => setDisplacementValue(parseFloat(e.target.value) || 0)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Mould Size (g)</label>
                <input type="number" step="0.1" value={suppositoryMouldSize} onChange={e => setSuppositoryMouldSize(parseFloat(e.target.value) || 0)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Number of Suppositories</label>
                <input type="number" value={numSuppositories} onChange={e => setNumSuppositories(parseInt(e.target.value) || 1)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
            </div>
            <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-center space-y-2">
              <p className="text-base text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">Total Active Drug: {totalDrugNeeded.toFixed(2)} g</p>
              <p className="text-base text-amber-600 dark:text-amber-400 font-bold tabular-nums">Total Cocoa Butter Base: {Math.max(0, totalBaseNeeded).toFixed(2)} g</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'isotonicity' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Isotonicity Adjustment (NaCl Equivalent Method)</h3>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Drug Quantity (g)</label>
                <input type="number" step="0.1" value={isoDrugGrams} onChange={e => setIsoDrugGrams(parseFloat(e.target.value) || 0)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Total Volume (mL)</label>
                <input type="number" value={isoVolumeMl} onChange={e => setIsoVolumeMl(parseFloat(e.target.value) || 0)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">E-value</label>
                <input type="number" step="0.01" value={eValue} onChange={e => setEValue(parseFloat(e.target.value) || 0)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
            </div>
            <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-center space-y-2">
              <p className="text-base text-blue-600 dark:text-blue-400 font-bold tabular-nums">NaCl Needed for 0.9%: {naclNeededForIsotonic.toFixed(3)} g</p>
              <p className="text-base text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">NaCl Equivalent of Drug: {naclEquivalentOfDrug.toFixed(3)} g</p>
              <p className="text-base text-amber-600 dark:text-amber-400 font-bold tabular-nums">Additional NaCl Required: {Math.max(0, additionalNaclNeeded).toFixed(3)} g</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'prescription' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Prescription Latin Decoder &amp; Dose Safety Checker</h3>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Select Drug</label>
                <select value={selectedDrug} onChange={e => setSelectedDrug(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white">
                  {Object.keys(drugDatabase).map(drug => (
                    <option key={drug} value={drug}>{drug}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Prescribed Single Dose (mg)</label>
                <input type="number" value={prescribedDose} onChange={e => setPrescribedDose(parseFloat(e.target.value) || 0)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
              <p className={`text-sm font-bold mt-2 ${isDoseSafe ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {isDoseSafe ? '✓ SAFE (Within Limits)' : '⚠ WARNING: Exceeds Single Dose!'}
              </p>
            </div>
            <div className="lg:col-span-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
              <input type="text" placeholder="Search Latin term..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              <div className="h-48 overflow-y-auto space-y-2">
                {filteredLatin.map((item, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-transparent p-2.5 rounded-lg text-sm flex justify-between gap-2">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{item.term}</span>
                    <span className="text-slate-700 dark:text-slate-300 text-right">{item.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'compendium' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4">
          <div className="flex items-center space-x-2.5 text-emerald-600 dark:text-emerald-400 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Package className="w-5 h-5" />
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Compendium of Marketed Dosage Forms (BP107P Note)</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Evaluation of marketed preparations against IP/BPC/WHO labeling and patient-centric compliance.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs">
                  <th className="py-2.5 px-3">Marketed Brand</th>
                  <th className="py-2.5 px-3">Active Composition</th>
                  <th className="py-2.5 px-3">Dosage Form</th>
                  <th className="py-2.5 px-3">Official Standard</th>
                  <th className="py-2.5 px-3">Labeling &amp; Patient Counseling</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {marketedCompendium.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">{c.brand}</td>
                    <td className="py-3 px-3 text-slate-800 dark:text-slate-200">{c.generic}</td>
                    <td className="py-3 px-3 text-blue-600 dark:text-blue-300">{c.form}</td>
                    <td className="py-3 px-3 font-medium text-slate-600 dark:text-slate-400">{c.standard}</td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">{c.labelReq}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* POSOLOGY, PROOF SPIRIT & RATIO DILUTION */}
      {activeTab === 'posology_proof' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Posology: Pediatric Dose Calculators</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Adult Dose (mg)</label>
                <input type="number" value={adultDoseMg} onChange={(e) => setAdultDoseMg(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Child Age (Years)</label>
                <input type="number" value={childAgeYrs} onChange={(e) => setChildAgeYrs(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Infant Age (Months)</label>
                <input type="number" value={childAgeMonths} onChange={(e) => setChildAgeMonths(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Child Weight (kg)</label>
                <input type="number" value={childWtKg} onChange={(e) => setChildWtKg(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Child BSA (m²) [Adult Ref: 1.73 m²]</label>
                <input type="number" step="0.05" value={childBsaM2} onChange={(e) => setChildBsaM2(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { label: "Young's Rule (Age/(Age+12))", val: youngsDose },
                { label: "Dilling's Rule (Age/20)", val: dillingDose },
                { label: "Clark's Rule (Weight lb/150)", val: clarkDose },
                { label: "Fried's Rule (Months/150)", val: friedDose },
                { label: "BSA Method (BSA/1.73)", val: bsaDose }
              ].map((r) => (
                <div key={r.label} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex justify-between items-center gap-2">
                  <span className="text-xs text-slate-600 dark:text-slate-400">{r.label}</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0">{r.val.toFixed(1)} mg</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400">Proof Spirit &amp; Ratio Dilution Calculator</h3>
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Ethanol Strength (% v/v) — [57.1% v/v = 100° Proof]</label>
              <input type="number" step="0.5" value={spiritVvPct} onChange={(e) => setSpiritVvPct(parseFloat(e.target.value) || 0)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
              <div className="flex flex-wrap justify-between items-center gap-2 pt-1">
                <span>Proof Spirit Equivalent: <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums">{proofStrength.toFixed(1)}° Proof</strong></span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{proofLabel}</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
              <p className="font-bold text-slate-900 dark:text-white">Ratio (1 in X) Solution Preparation</p>
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Stock (% w/v)</label>
                  <input type="number" value={ratioStockPct} onChange={(e) => setRatioStockPct(parseFloat(e.target.value) || 1)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Target 1 in X</label>
                  <input type="number" value={ratioTarget1InX} onChange={(e) => setRatioTarget1InX(parseFloat(e.target.value) || 1)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Final Vol (mL)</label>
                  <input type="number" value={ratioVolMl} onChange={(e) => setRatioVolMl(parseFloat(e.target.value) || 0)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" />
                </div>
              </div>
              <p className="text-emerald-700 dark:text-emerald-300 leading-relaxed">Take <strong className="tabular-nums">{ratioStockMl.toFixed(2)} mL</strong> of {ratioStockPct}% stock (Target {targetRatioPct.toFixed(3)}% w/v) + Purified Water q.s. to {ratioVolMl} mL.</p>
            </div>
          </div>
        </div>
      )}

      {/* BP102T THEORY (UNITS I-V) */}
      {activeTab === 'theory' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-5 text-sm leading-relaxed">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'u1', label: 'Unit I: History, Pharmacopoeias & Prescription' },
              { id: 'u2', label: 'Unit II: Calculations, Posology & Excipients' },
              { id: 'u3', label: 'Unit III: Solid Dosage Forms' },
              { id: 'u4', label: 'Unit IV: Monophasic & Biphasic Liquids' },
              { id: 'u5', label: 'Unit V: Semisolids & Suppositories' }
            ].map((u) => (
              <button
                key={u.id}
                onClick={() => setBp102Unit(u.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                  bp102Unit === u.id ? 'bg-emerald-50 dark:bg-emerald-600/20 border-emerald-500 text-emerald-700 dark:text-emerald-300' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {u.label}
              </button>
            ))}
          </div>
          {bp102Unit === 'u1' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2.5">
                <h4 className="font-bold text-emerald-600 dark:text-emerald-400 text-base">History &amp; Pharmacopoeias</h4>
                <p className="text-slate-700 dark:text-slate-300"><strong>Indian Milestones:</strong> Bengal Chemical &amp; Pharmaceutical Works (1901, P.C. Ray), Chopra Committee (1931), Drugs &amp; Cosmetics Act (1940), Pharmacy Act (1948), PCI (1949), IP 1st Ed. (1955) to IP 2022.</p>
                <p className="text-slate-700 dark:text-slate-300"><strong>Official Compendia:</strong> IP, BP, USP–NF, BPC, International Pharmacopoeia (WHO), National Formulary of India (NFI). IP Monograph includes Title, Chemical formula, Category, Dose, Description, Solubility, Identification, Tests, Assay, and Storage.</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2.5">
                <h4 className="font-bold text-emerald-600 dark:text-emerald-400 text-base">Parts &amp; Handling of a Prescription</h4>
                <p className="text-slate-700 dark:text-slate-300">1. Date &bull; 2. Patient Info &bull; 3. Superscription (℞ &quot;Take thou&quot;) &bull; 4. Inscription (Main ingredients &amp; quantities) &bull; 5. Subscription (Compounding directions to pharmacist) &bull; 6. Signatura (Sig. patient directions) &bull; 7. Renewal/Refill instructions &bull; 8. Prescriber Signature &amp; Reg. No.</p>
              </div>
            </div>
          )}
          {bp102Unit === 'u2' && (
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2.5">
              <h4 className="font-bold text-emerald-600 dark:text-emerald-400 text-base">Pharmaceutical Calculations, Routes &amp; Excipients</h4>
              <p className="text-slate-700 dark:text-slate-300"><strong>Metric System &amp; Conversions:</strong> 1 kg = 1000 g; 1 g = 1000 mg; 1 tsp = 5 mL; 1 tbsp = 15 mL; 1 fl.oz &approx; 30 mL. Geometric dilution ensures uniform blending when mixing small potent API quantities with bulk diluent.</p>
              <p className="text-slate-700 dark:text-slate-300"><strong>Dosage Form Classification:</strong> Solid (powders, tablets, capsules), Liquid (monophasic solutions/syrups/elixirs; biphasic suspensions/emulsions), Semisolid (ointments, creams, pastes, gels, suppositories), Gaseous (inhalers, aerosols).</p>
              <p className="text-slate-700 dark:text-slate-300"><strong>Excipients:</strong> Non-therapeutic adjuvants (diluents, binders, disintegrants, lubricants, preservatives, antioxidants, buffers, sweeteners, flavoring/coloring agents) ensuring stability, manufacturability, and bioavailability.</p>
            </div>
          )}
          {bp102Unit === 'u3' && (
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2.5">
              <h4 className="font-bold text-emerald-600 dark:text-emerald-400 text-base">Solid Dosage Forms: Powders, Tablets &amp; Capsules</h4>
              <p className="text-slate-700 dark:text-slate-300"><strong>Powders:</strong> Bulk external (Dusting powders), Internal divided/bulk (ORS, Effervescent granules using citric + tartaric acid + NaHCO₃). Special problems: Efflorescent (loses crystal water &rarr; dampen), Hygroscopic/Deliquescent (absorbs moisture &rarr; double-wrap), Eutectic mixtures (menthol + camphor/thymol liquefy at room temp &rarr; add light MgCO₃/kaolin).</p>
              <p className="text-slate-700 dark:text-slate-300"><strong>Tablets:</strong> Compressed, Sugar/Film-coated, Enteric-coated (CAP/Eudragit), Chewable, Effervescent, Buccal/Sublingual, Lozenges, Moulded/Tablet Triturates. Methods: Wet granulation, Dry granulation (slugging/roller compaction), Direct compression.</p>
              <p className="text-slate-700 dark:text-slate-300"><strong>Capsules:</strong> Hard gelatin capsules (sizes #000 largest 1.37 mL to #5 smallest 0.13 mL; two-piece body &amp; cap) vs Soft gelatin capsules (one-piece hermetically sealed for oils/liquids, plasticized with glycerin/sorbitol).</p>
            </div>
          )}
          {bp102Unit === 'u4' && (
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2.5">
              <h4 className="font-bold text-emerald-600 dark:text-emerald-400 text-base">Monophasic &amp; Biphasic Liquid Dosage Forms</h4>
              <p className="text-slate-700 dark:text-slate-300"><strong>Monophasic Internal vs External:</strong> Syrups (66.7% w/w sucrose), Elixirs (clear sweetened hydroalcoholic), Linctuses (viscous cough soothing), Aromatic waters vs Liniments (alcoholic/oily rubbed with friction — never on broken skin), Lotions (dabbed without friction), Throat paints (Mandl&apos;s), Gargles, Mouthwashes, Enemas, Ear/Eye/Nasal drops.</p>
              <p className="text-slate-700 dark:text-slate-300"><strong>Suspensions:</strong> Flocculated (loose porous cake, rapid sedimentation, easy redispersion, clear supernatant) vs Deflocculated (slow settling, dense non-redispersible hard cake). Stabilized via wetting agents &amp; structured vehicles.</p>
              <p className="text-slate-700 dark:text-slate-300"><strong>Emulsions (o/w vs w/o):</strong> Stabilized by surfactants (HLB 8–16 for o/w; 3–6 for w/o). Identification tests: Dilution test, Dye solubility test (Scarlet red / Amaranth), Electrical conductivity test, Cobalt chloride paper test.</p>
            </div>
          )}
          {bp102Unit === 'u5' && (
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2.5">
              <h4 className="font-bold text-emerald-600 dark:text-emerald-400 text-base">Semisolids &amp; Suppositories / Pessaries</h4>
              <p className="text-slate-700 dark:text-slate-300"><strong>Semisolids:</strong> Ointments (oleaginous, absorption, emulsion, water-soluble PEG bases; prepared by trituration/fusion), Pastes (high 20–50% insoluble solids &rarr; stiff protective barrier), Creams (o/w vanishing vs w/o cold cream), Gels (transparent 3D polymeric networks e.g., Carbopol/HPMC).</p>
              <p className="text-slate-700 dark:text-slate-300"><strong>Suppositories &amp; Pessaries:</strong> Solid conical body-cavity forms (rectal/vaginal/urethral). Cocoa butter melts at 34–35°C (watch overheating above 36°C forming unstable &alpha;/&gamma; polymorphs) vs Glycerogelatin/PEG bases which dissolve in secretions. Use Displacement Value (DV) whenever solids replace base weight.</p>
            </div>
          )}
        </div>
      )}

      <ResourceConnector
        department="general_pharmacy"
        topic="titration"
        defaultSearchQuery={
          activeTab === 'posology_proof'
            ? 'posology pediatric proof spirit'
            : activeTab === 'suppository'
              ? 'suppository displacement cocoa butter'
              : activeTab === 'alligation'
                ? 'alligation isotonicity'
                : 'pharmaceutics emulsion suspension'
        }
        title="BP102T / BP107P Formulation & Apparatus References"
      />
    </div>
  );
}
