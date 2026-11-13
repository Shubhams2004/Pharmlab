import React, { useState } from 'react';

export default function PythonModule() {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bmiResult, setBmiResult] = useState(null);

  const [adultDose, setAdultDose] = useState('');
  const [age, setAge] = useState('');
  const [childDose, setChildDose] = useState(null);

  const calculateBMI = (e) => {
    e.preventDefault();
    if (weight && height) {
      const heightInMeters = height / 100;
      const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(2);
      setBmiResult(bmi);
    }
  };

  const calculateDosage = (e) => {
    e.preventDefault();
    if (adultDose && age) {
      const numAge = parseFloat(age);
      const numAdultDose = parseFloat(adultDose);
      const calculated = (numAge / (numAge + 12)) * numAdultDose;
      setChildDose(calculated.toFixed(2));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-slate-100">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <span className="text-xs font-bold tracking-widest text-teal-400 uppercase">BP101T Core Module</span>
        <h2 className="text-2xl font-bold mt-1 mb-2">Pharmaceutical Python Calculators</h2>
        <p className="text-slate-400 text-sm">
          Interactive tools built to fulfill the practical requirements of pharmaceutical calculations and clinical formulas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-teal-300 mb-4">1. Patient BMI Calculator</h3>
          <form onSubmit={calculateBMI} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Weight (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g., 70"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Height (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="e.g., 175"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-teal-500"
                required
              />
            </div>
            <button type="submit" className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl transition-colors">
              Calculate BMI
            </button>
          </form>
          {bmiResult && (
            <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-teal-900/50 text-center">
              <span className="text-sm text-slate-400">Calculated BMI: </span>
              <span className="text-xl font-bold text-teal-400">{bmiResult} kg/m²</span>
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-teal-300 mb-4">2. Pediatric Dose (Young's Rule)</h3>
          <form onSubmit={calculateDosage} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Adult Dose (mg)</label>
              <input
                type="number"
                value={adultDose}
                onChange={(e) => setAdultDose(e.target.value)}
                placeholder="e.g., 500"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Child Age (Years, 1-12)</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g., 6"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-teal-500"
                required
              />
            </div>
            <button type="submit" className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl transition-colors">
              Calculate Child Dose
            </button>
          </form>
          {childDose && (
            <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-teal-900/50 text-center">
              <span className="text-sm text-slate-400">Estimated Child Dose: </span>
              <span className="text-xl font-bold text-teal-400">{childDose} mg</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
