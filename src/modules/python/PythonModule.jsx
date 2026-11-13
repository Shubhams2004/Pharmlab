import React, { useState } from 'react';

export default function PythonModule() {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bmiResult, setBmiResult] = useState(null);

  const [childAge, setChildAge] = useState('');
  const [adultDose, setAdultDose] = useState('');
  const [childDoseResult, setChildDoseResult] = useState(null);

  const calculateBmi = (e) => {
    e.preventDefault();
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100;
    if (w > 0 && h > 0) {
      const bmi = w / (h * h);
      let category = 'Normal';
      if (bmi < 18.5) category = 'Underweight';
      else if (bmi >= 25) category = 'Overweight';
      setBmiResult({ value: bmi.toFixed(2), category });
    }
  };

  const calculateYoungsRule = (e) => {
    e.preventDefault();
    const age = parseFloat(childAge);
    const dose = parseFloat(adultDose);
    if (age > 0 && dose > 0) {
      // Young's Rule: (Age in years / (Age + 12)) * Adult Dose
      const calculatedDose = (age / (age + 12)) * dose;
      setChildDoseResult(calculatedDose.toFixed(2));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-slate-100">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">BP101T Core Module</span>
        <h2 className="text-2xl font-bold mt-1 mb-2">Python Programming in Pharmacy</h2>
        <p className="text-slate-400 text-sm">
          Computational pharmaceutical calculators demonstrating script-based dosing logic and biometrics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-emerald-300 mb-4">1. BMI Biometric Calculator</h3>
          <form onSubmit={calculateBmi} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Weight (kg)</label>
              <input
                type="number"
                step="any"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g., 70"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Height (cm)</label>
              <input
                type="number"
                step="any"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="e.g., 175"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors">
              Calculate BMI
            </button>
          </form>
          {bmiResult && (
            <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-emerald-900/50 text-center">
              <span className="text-sm text-slate-400">BMI: </span>
              <span className="text-xl font-bold text-emerald-400">{bmiResult.value}</span>
              <span className="block text-xs text-slate-400 mt-1">Status: {bmiResult.category}</span>
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-emerald-300 mb-4">2. Young's Rule Pediatric Dose</h3>
          <form onSubmit={calculateYoungsRule} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Child Age (Years, 1-12)</label>
              <input
                type="number"
                step="any"
                value={childAge}
                onChange={(e) => setChildAge(e.target.value)}
                placeholder="e.g., 6"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Adult Dose (mg)</label>
              <input
                type="number"
                step="any"
                value={adultDose}
                onChange={(e) => setAdultDose(e.target.value)}
                placeholder="e.g., 500"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors">
              Calculate Child Dose
            </button>
          </form>
          {childDoseResult && (
            <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-emerald-900/50 text-center">
              <span className="text-sm text-slate-400">Calculated Pediatric Dose: </span>
              <span className="text-xl font-bold text-emerald-400">{childDoseResult} mg</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
