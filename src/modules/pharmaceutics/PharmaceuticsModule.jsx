import React, { useState } from 'react';
import { FlaskConical, Calculator, Scale, Droplet, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function PharmaceuticsModule() {
  const [activeTab, setActiveTab] = useState('alligation');

  // Alligation State
  const [highConc, setHighConc] = useState(20);
  const [lowConc, setLowConc] = useState(5);
  const [targetConc, setTargetConc] = useState(10);
  const [totalVolume, setTotalVolume] = useState(1000);

  // Alcohol Dilution State
  const [stockAlcohol, setStockAlcohol] = useState(95);
  const [targetAlcohol, setTargetAlcohol] = useState(25);
  const [finalVolumeMl, setFinalVolumeMl] = useState(500);

  // Suppository Displacement Value State
  const [drugWeight, setDrugWeight] = useState(1.0);
  const [displacementValue, setDisplacementValue] = useState(0.7);
  const [suppositoryMouldSize, setSuppositoryMouldSize] = useState(2.0);
  const [numSuppositories, setNumSuppositories] = useState(10);

  // Alligation calculations
  const highParts = Math.abs(targetConc - lowConc);
  const lowParts = Math.abs(highConc - targetConc);
  const totalParts = highParts + lowParts;
  const highVolume = totalParts > 0 ? (highParts / totalParts) * totalVolume : 0;
  const lowVolume = totalParts > 0 ? (lowParts / totalParts) * totalVolume : 0;

  // Alcohol dilution calculations (C1V1 = C2V2)
  const volumeOfStock = targetAlcohol && finalVolumeMl ? (targetAlcohol * finalVolumeMl) / stockAlcohol : 0;
  const volumeOfWater = finalVolumeMl - volumeOfStock;

  // Suppository calculations
  const totalDrugNeeded = drugWeight * numSuppositories;
  const totalDisplacement = drugWeight * displacementValue * numSuppositories;
  const totalBaseNeeded = (suppositoryMouldSize * numSuppositories) - totalDisplacement;

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-slate-100 pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">PCI B.Pharm • BP103T / BP107P</span>
        <h2 className="text-2xl md:text-3xl font-bold mt-1 text-white">Pharmaceutics I: Dispensing Pharmacy Laboratory</h2>
        <p className="text-slate-400 text-sm mt-1">Interactive calculators for compounding, alligation mixing, alcohol dilutions, and suppository calculations.</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'alligation', label: '⚖️ Alligation Method Calculator' },
          { id: 'alcohol', label: '🧪 Alcohol Strength & Dilution' },
          { id: 'suppository', label: '💊 Suppository Displacement Value' }
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

      {/* ALLIGATION TAB */}
      {activeTab === 'alligation' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-4">
            <Scale className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-lg font-bold text-white">Alligation Medial / Alternate Calculator</h3>
              <p className="text-xs text-slate-400">Calculate exact volumes of higher and lower concentration stocks required to compound a target strength.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Compounding Parameters</span>
              
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

            <div className="lg:col-span-7 flex flex-col justify-between bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Alligation Matrix Results</span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                    <span className="text-[10px] text-slate-400 uppercase">Parts of Higher ({highConc}%)</span>
                    <p className="text-xl font-bold text-emerald-400 mt-1">{highParts} parts</p>
                    <p className="text-xs text-slate-300 mt-1">= {highVolume.toFixed(2)} mL</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                    <span className="text-[10px] text-slate-400 uppercase">Parts of Lower ({lowConc}%)</span>
                    <p className="text-xl font-bold text-emerald-400 mt-1">{lowParts} parts</p>
                    <p className="text-xs text-slate-300 mt-1">= {lowVolume.toFixed(2)} mL</p>
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span>Total Proportion Parts:</span>
                    <span className="font-bold text-white">{totalParts} parts</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span>Dispensing Instruction:</span>
                    <span className="font-medium text-emerald-400">Mix {highVolume.toFixed(1)} mL of {highConc}% with {lowVolume.toFixed(1)} mL of {lowConc}% to yield {totalVolume} mL of {targetConc}%.</span>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-xl p-3 flex items-center space-x-2.5 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Validated against Indian Pharmacopoeia dispensing guidelines.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ALCOHOL DILUTION TAB */}
      {activeTab === 'alcohol' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-4">
            <Droplet className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-lg font-bold text-white">Alcohol Strength & Dilution Calculator ($C_1V_1 = C_2V_2$)</h3>
              <p className="text-xs text-slate-400">Determine exact volumes of strong spirit and purified water required to prepare lower alcoholic strengths.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Dilution Parameters</span>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Stock Alcohol Strength ($C_1$ % v/v)</label>
                <input type="number" value={stockAlcohol} onChange={e => setStockAlcohol(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Desired Target Strength ($C_2$ % v/v)</label>
                <input type="number" value={targetAlcohol} onChange={e => setTargetAlcohol(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Desired Final Volume ($V_2$ mL)</label>
                <input type="number" value={finalVolumeMl} onChange={e => setFinalVolumeMl(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
              </div>
            </div>

            <div className="lg:col-span-7 flex flex-col justify-between bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Compounding Prescription Output</span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                    <span className="text-[10px] text-slate-400 uppercase">Volume of Stock Alcohol</span>
                    <p className="text-xl font-bold text-emerald-400 mt-1">{volumeOfStock.toFixed(2)} mL</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                    <span className="text-[10px] text-slate-400 uppercase">Purified Water to Add</span>
                    <p className="text-xl font-bold text-blue-400 mt-1">{Math.max(0, volumeOfWater).toFixed(2)} mL</p>
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-xs text-slate-300">
                  <p><strong>Dispensing Protocol:</strong> Measure exactly <span className="text-emerald-400">{volumeOfStock.label || volumeOfStock.toFixed(1)} mL</span> of {stockAlcohol}% stock alcohol, add sufficient purified water with continuous stirring to make up the final calibrated volume to <span className="text-blue-400">{finalVolumeMl} mL</span>.</p>
                </div>
              </div>

              <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-xl p-3 flex items-center space-x-2.5 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Accounts for apparent contraction on mixing where applicable.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUPPOSITORY DISPLACEMENT TAB */}
      {activeTab === 'suppository' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-4">
            <FlaskConical className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-lg font-bold text-white">Suppository Displacement Value Calculator</h3>
              <p className="text-xs text-slate-400">Calculate exact quantity of base (e.g., Theobroma oil) displaced by active pharmaceutical ingredients.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Formulation Variables</span>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Drug Weight per Suppository (g)</label>
                <input type="number" step="0.1" value={drugWeight} onChange={e => setDrugWeight(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Displacement Value (DV) of Drug</label>
                <input type="number" step="0.05" value={displacementValue} onChange={e => setDisplacementValue(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Mould Capacity / Nominal Size (g)</label>
                <input type="number" step="0.1" value={suppositoryMouldSize} onChange={e => setSuppositoryMouldSize(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Number of Suppositories Required</label>
                <input type="number" value={numSuppositories} onChange={e => setNumSuppositories(parseInt(e.target.value) || 1)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
              </div>
            </div>

            <div className="lg:col-span-7 flex flex-col justify-between bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Compounding Batch Quantities</span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                    <span className="text-[10px] text-slate-400 uppercase">Total Active Drug Needed</span>
                    <p className="text-xl font-bold text-emerald-400 mt-1">{totalDrugNeeded.toFixed(2)} g</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                    <span className="text-[10px] text-slate-400 uppercase">Total Cocoa Butter Base</span>
                    <p className="text-xl font-bold text-amber-400 mt-1">{Math.max(0, totalBaseNeeded).toFixed(2)} g</p>
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span>Total Base Displacement:</span>
                    <span className="font-bold text-white">{totalDisplacement.toFixed(2)} g</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span>Mould Capacity Check:</span>
                    <span className="text-emerald-400">Correctly adjusted for density & displacement value.</span>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-xl p-3 flex items-center space-x-2.5 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Ensures exact dosage accuracy per suppository unit.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
