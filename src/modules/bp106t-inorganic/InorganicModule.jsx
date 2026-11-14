import React, { useState } from 'react';
import { FlaskConical, Droplet, RefreshCcw, CheckCircle2, Sliders, Info } from 'lucide-react';

export default function InorganicModule() {
  const [titrantVolume, setTitrantVolume] = useState(0); // mL added from burette
  const equivalencePoint = 25.0; // mL where neutralization occurs

  // Calculate simulated pH based on volume of NaOH added to 25ml of 0.1N HCl
  const calculatePH = (v) => {
    if (v === 0) return 1.0;
    if (v < 25) {
      const unreactedH = (25 - v) * 0.1;
      const totalVol = 25 + v;
      const concentration = unreactedH / totalVol;
      return Math.max(0, (-Math.log10(concentration)).toFixed(2));
    } else if (v === 25) {
      return 7.0;
    } else {
      const excessOH = (v - 25) * 0.1;
      const totalVol = 25 + v;
      const pOH = -Math.log10(excessOH / totalVol);
      return Math.min(14, (14 - pOH).toFixed(2));
    }
  };

  const currentPH = calculatePH(titrantVolume);
  const isEndpointReached = titrantVolume >= equivalencePoint;
  
  const getFlaskColor = () => {
    if (titrantVolume < 24.5) return 'bg-sky-500/10 border-sky-400/30 text-sky-300';
    if (titrantVolume >= 24.5 && titrantVolume <= 25.5) return 'bg-pink-500/20 border-pink-500/50 text-pink-300 shadow-[0_0_20px_rgba(236,72,153,0.3)]';
    return 'bg-fuchsia-600/30 border-fuchsia-500/60 text-fuchsia-200';
  };

  const resetTitration = () => {
    setTitrantVolume(0);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center space-x-3 mb-3">
          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full uppercase tracking-wider">
            BP106T &bull; Unit III
          </span>
          <span className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono rounded-full">
            Volumetric Analysis Lab
          </span>
        </div>
        <h2 className="text-3xl font-extrabold text-white mb-2">
          Acid-Base Titration &amp; Endpoint Simulator
        </h2>
        <p className="text-slate-400 text-sm md:text-base max-w-3xl">
          Simulate a standard acid-base neutralization titration. Add NaOH titrant to HCl acid using the interactive slider and observe the phenolphthalein color transition at the equivalence point ($pH = 7.0$).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 lg:col-span-1">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Burette Stopcock</h3>
                <p className="text-xs text-slate-400">Control titrant flow</p>
              </div>
            </div>
            <button 
              onClick={resetTitration}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
              title="Reset Titration"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-400 mb-2">
                <span>NaOH Added (Volume):</span>
                <strong className="text-emerald-400 font-mono text-sm">{titrantVolume.toFixed(1)} mL</strong>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="0.5"
                value={titrantVolume}
                onChange={(e) => setTitrantVolume(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-950 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Current pH</span>
                <span className="text-xl font-extrabold text-white font-mono">{currentPH}</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Indicator State</span>
                <span className={`text-xs font-bold font-mono ${isEndpointReached ? 'text-pink-400' : 'text-sky-400'}`}>
                  {isEndpointReached ? 'Pink (Basic)' : 'Colorless (Acid)'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-start space-x-3">
            <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>Lab Note:</strong> Phenolphthalein remains colorless in acidic solutions ($pH < 8.2$) and turns pale pink at the stoichiometric equivalence point ($pH = 7.0$).
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl lg:col-span-2 flex flex-col items-center justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/20 to-slate-950/60 pointer-events-none"></div>

          <div className="w-full flex items-center justify-between pb-4 border-b border-slate-800 z-10">
            <div className="flex items-center space-x-2">
              <FlaskConical className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Virtual Titration Bench</h3>
            </div>
            <span className={`text-xs font-mono px-3 py-1 rounded-full border ${isEndpointReached ? 'bg-pink-500/10 text-pink-400 border-pink-500/30' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
              {isEndpointReached ? 'Endpoint Reached (Equivalence)' : 'Titration in Progress...'}
            </span>
          </div>

          <div className="my-8 flex flex-col items-center z-10 relative">
            <div className="w-2 h-8 bg-slate-700 rounded-b"></div>
            {titrantVolume > 0 && titrantVolume < 50 && (
              <div className="w-1.5 h-3 bg-emerald-400 rounded-full animate-bounce my-1"></div>
            )}

            <div className="w-48 h-48 border-2 border-slate-600 rounded-b-[40px] rounded-t-lg relative flex flex-col justify-end p-3 overflow-hidden bg-slate-950/40 backdrop-blur">
              <div 
                className={`w-full transition-all duration-300 rounded-b-[36px] border-t-2 flex items-center justify-center ${getFlaskColor()}`}
                style={{ height: '70%' }}
              >
                <div className="text-center">
                  <span className="text-xs font-mono font-bold block">HCl + NaOH</span>
                  <span className="text-[10px] font-mono opacity-80">Volume: {25 + titrantVolume} mL</span>
                </div>
              </div>
            </div>
            <div className="w-56 h-3 bg-slate-800 rounded-full mt-2 shadow-lg"></div>
          </div>

          <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between z-10">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${isEndpointReached ? 'bg-pink-500 animate-pulse' : 'bg-sky-400'}`}></div>
              <span className="text-xs font-mono text-slate-300">
                {isEndpointReached ? 'Permanent faint pink color observed. Stop titration!' : 'Solution is clear. Continue adding titrant.'}
              </span>
            </div>
            <span className="text-xs font-bold font-mono text-emerald-400">Target: 25.0 mL</span>
          </div>
        </div>
      </div>
    </div>
  );
}
