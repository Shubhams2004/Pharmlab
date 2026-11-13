import React, { useState } from 'react';
import { FlaskConical, Calculator, Scale, Droplet, CheckCircle2, BookOpen, Activity } from 'lucide-react';

export default function GeneralPharmacyModule() {
  const [activeTab, setActiveTab] = useState('alligation');

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

  const filteredLatin = latinDictionary.filter(item => 
    item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.meaning.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-slate-100 pb-12">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">PCI B.Pharm • General Pharmacy (Practical) • BP107P</span>
        <h2 className="text-2xl md:text-3xl font-bold mt-1 text-white">General Pharmacy Laboratory Suite</h2>
        <p className="text-slate-400 text-sm mt-1">Interactive compounding calculators, alligation matrices, Latin prescription parsing, and isotonicity adjustments.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'alligation', label: '⚖️ Alligation Calculator' },
          { id: 'alcohol', label: '🧪 Alcohol Dilution' },
          { id: 'suppository', label: '💊 Suppository Displacement' },
          { id: 'isotonicity', label: '💧 Isotonicity Adjustment' },
          { id: 'prescription', label: '📝 Prescription & Latin Decoder' }
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

      {activeTab === 'alligation' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h3 className="text-lg font-bold text-white">Alligation Medial / Alternate Calculator</h3>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Higher Concentration Stock (%)</label>
                <input type="number" value={highConc} onChange={e => setHighConc(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Lower Concentration Stock (%)</label>
                <input type="number" value={lowConc} onChange={e => setLowConc(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Target Desired Concentration (%)</label>
                <input type="number" value={targetConc} onChange={e => setTargetConc(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Total Desired Final Volume (mL)</label>
                <input type="number" value={totalVolume} onChange={e => setTotalVolume(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
              </div>
            </div>
            <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Results</span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                    <span className="text-[10px] text-slate-400 uppercase">Higher Parts</span>
                    <p className="text-xl font-bold text-emerald-400 mt-1">{highParts} parts ({highVolume.toFixed(1)} mL)</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                    <span className="text-[10px] text-slate-400 uppercase">Lower Parts</span>
                    <p className="text-xl font-bold text-emerald-400 mt-1">{lowParts} parts ({lowVolume.toFixed(1)} mL)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'alcohol' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h3 className="text-lg font-bold text-white">Alcohol Strength & Dilution Calculator</h3>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Stock Strength (%)</label>
                <input type="number" value={stockAlcohol} onChange={e => setStockAlcohol(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Target Strength (%)</label>
                <input type="number" value={targetAlcohol} onChange={e => setTargetAlcohol(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Final Volume (mL)</label>
                <input type="number" value={finalVolumeMl} onChange={e => setFinalVolumeMl(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
              </div>
            </div>
            <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col justify-center">
              <p className="text-sm text-emerald-400 font-bold">Volume of Stock Alcohol: {volumeOfStock.toFixed(2)} mL</p>
              <p className="text-sm text-blue-400 font-bold mt-2">Water to Add: {Math.max(0, volumeOfWater).toFixed(2)} mL</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'suppository' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h3 className="text-lg font-bold text-white">Suppository Displacement Value Calculator</h3>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Drug Weight per Suppository (g)</label>
                <input type="number" step="0.1" value={drugWeight} onChange={e => setDrugWeight(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Displacement Value (DV)</label>
                <input type="number" step="0.05" value={displacementValue} onChange={e => setDisplacementValue(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Mould Size (g)</label>
                <input type="number" step="0.1" value={suppositoryMouldSize} onChange={e => setSuppositoryMouldSize(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Number of Suppositories</label>
                <input type="number" value={numSuppositories} onChange={e => setNumSuppositories(parseInt(e.target.value) || 1)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
              </div>
            </div>
            <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col justify-center">
              <p className="text-sm text-emerald-400 font-bold">Total Active Drug: {totalDrugNeeded.toFixed(2)} g</p>
              <p className="text-sm text-amber-400 font-bold mt-2">Total Cocoa Butter Base: {Math.max(0, totalBaseNeeded).toFixed(2)} g</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'isotonicity' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h3 className="text-lg font-bold text-white">Isotonicity Adjustment (NaCl Equivalent Method)</h3>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Drug Quantity (g)</label>
                <input type="number" step="0.1" value={isoDrugGrams} onChange={e => setIsoDrugGrams(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Total Volume (mL)</label>
                <input type="number" value={isoVolumeMl} onChange={e => setIsoVolumeMl(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">E-value</label>
                <input type="number" step="0.01" value={eValue} onChange={e => setEValue(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
              </div>
            </div>
            <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col justify-center">
              <p className="text-sm text-blue-400 font-bold">NaCl Needed for 0.9%: {naclNeededForIsotonic.toFixed(3)} g</p>
              <p className="text-sm text-emerald-400 font-bold mt-2">NaCl Equivalent of Drug: {naclEquivalentOfDrug.toFixed(3)} g</p>
              <p className="text-sm text-amber-400 font-bold mt-2">Additional NaCl Required: {Math.max(0, additionalNaclNeeded).toFixed(3)} g</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'prescription' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h3 className="text-lg font-bold text-white">Prescription Latin Decoder & Dose Safety Checker</h3>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <label className="block text-xs text-slate-400 mb-1">Select Drug</label>
              <select value={selectedDrug} onChange={e => setSelectedDrug(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white">
                {Object.keys(drugDatabase).map(drug => (
                  <option key={drug} value={drug}>{drug}</option>
                ))}
              </select>
              <label className="block text-xs text-slate-400 mb-1">Prescribed Single Dose (mg)</label>
              <input type="number" value={prescribedDose} onChange={e => setPrescribedDose(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
              <p className={`text-xs font-bold mt-2 ${isDoseSafe ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isDoseSafe ? '✓ SAFE (Within Limits)' : '⚠ WARNING: Exceeds Single Dose!'}
              </p>
            </div>
            <div className="lg:col-span-6 bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <input type="text" placeholder="Search Latin term..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white mb-2" />
              <div className="h-44 overflow-y-auto space-y-2">
                {filteredLatin.map((item, i) => (
                  <div key={i} className="bg-slate-900 p-2 rounded text-xs flex justify-between">
                    <span className="font-mono text-blue-400">{item.term}</span>
                    <span className="text-slate-300">{item.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
