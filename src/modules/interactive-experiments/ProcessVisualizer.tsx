import React from 'react';
import { ExperimentVisualizerKind, ParameterValue, SimulationSnapshot } from './types';

interface ProcessVisualizerProps {
  kind: ExperimentVisualizerKind;
  snapshot: SimulationSnapshot;
  params: Record<string, ParameterValue>;
}

export default function ProcessVisualizer({ kind, snapshot, params }: ProcessVisualizerProps) {
  const v = snapshot.visualState || {};

  if (kind === 'dissolution_vessel') {
    const remainingFrac = Math.min(1, Math.max(0, Number(v.remainingFraction ?? 1)));
    const pctDissolved = Math.min(100, Math.max(0, Number(v.pctDissolved ?? 0)));
    const rpm = Number(v.rpm ?? 50);
    const tempC = Number(v.tempC ?? 37);
    const sinkRatio = Math.min(1, Math.max(0, Number(v.sinkRatio ?? 0)));
    const tabletW = 14 + remainingFrac * 34;
    const tabletH = 6 + remainingFrac * 10;
    const cloudOpacity = 0.08 + (pctDissolved / 100) * 0.42;

    return (
      <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 font-mono tabular-nums">
          <span>USP II PADDLE VESSEL</span>
          <span>
            {rpm} RPM · {tempC.toFixed(1)} °C
          </span>
        </div>
        <svg viewBox="0 0 280 210" className="w-full h-48 mx-auto" role="img" aria-label="USP II dissolution vessel diagram">
          {/* Water bath jacket */}
          <rect x="38" y="28" width="204" height="162" rx="14" className="fill-cyan-500/5 stroke-cyan-500/30" strokeWidth="1.5" />
          {/* Vessel outline */}
          <path
            d="M78,34 L78,136 A62,48 0 0,0 202,136 L202,34"
            fill="none"
            className="stroke-slate-400 dark:stroke-slate-600"
            strokeWidth="2.5"
          />
          {/* Medium liquid fill */}
          <path
            d="M80,62 L80,136 A60,46 0 0,0 200,136 L200,62 Z"
            fill="#10b981"
            fillOpacity={cloudOpacity}
          />
          <line x1="80" y1="62" x2="200" y2="62" className="stroke-emerald-500/60" strokeWidth="1.5" />

          {/* Paddle shaft & blade */}
          <line x1="140" y1="12" x2="140" y2="146" className="stroke-slate-500 dark:stroke-slate-400" strokeWidth="3.5" />
          <polygon points="116,134 164,134 159,148 121,148" className="fill-slate-400 dark:fill-slate-500" />
          {/* Rotation indicator arc */}
          <path
            d="M124,90 A18,6 0 1,1 156,90"
            fill="none"
            className="stroke-emerald-500"
            strokeWidth="1.5"
            strokeDasharray="3 2"
          />

          {/* Tablet resting at vessel bottom */}
          {remainingFrac > 0.01 && (
            <rect
              x={140 - tabletW / 2}
              y={173 - tabletH}
              width={tabletW}
              height={tabletH}
              rx={tabletH / 2}
              className="fill-amber-400 stroke-amber-600"
              strokeWidth="1.2"
            />
          )}

          {/* Dissolved solute particles proportional to % released */}
          {Array.from({ length: Math.round((pctDissolved / 100) * 18) }).map((_, i) => {
            const cx = 94 + ((i * 37) % 92);
            const cy = 74 + ((i * 29) % 80);
            return <circle key={i} cx={cx} cy={cy} r={2.2} fill="#10b981" opacity={0.85} />;
          })}

          <text x="140" y="202" textAnchor="middle" className="fill-slate-600 dark:fill-slate-300 text-[10px] font-mono">
            Released: {pctDissolved.toFixed(1)}% · C/Cs: {(sinkRatio * 100).toFixed(1)}%
          </text>
        </svg>
      </div>
    );
  }

  if (kind === 'titration_burette') {
    const buretteVol = Number(v.buretteVolMl ?? 0);
    const maxBurette = Number(v.maxBuretteMl ?? 50);
    const ph = Number(v.ph ?? 2.8);
    const flaskHex = String(v.flaskHexColor ?? '#bae6fd');
    const eqVol = Number(v.equivalenceVolMl ?? 25);
    const buretteFillFrac = Math.max(0, 1 - buretteVol / maxBurette);
    const liquidTopY = 22 + (1 - buretteFillFrac) * 76;

    return (
      <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 font-mono tabular-nums">
          <span>BURETTE &amp; FLASK</span>
          <span>
            {buretteVol.toFixed(1)} / {maxBurette} mL · pH {ph.toFixed(2)}
          </span>
        </div>
        <svg viewBox="0 0 280 210" className="w-full h-48 mx-auto" role="img" aria-label="Burette titration apparatus schematic">
          {/* Stand */}
          <line x1="64" y1="16" x2="64" y2="195" className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="3" />
          <rect x="44" y="192" width="160" height="6" rx="2" className="fill-slate-400 dark:fill-slate-700" />
          <line x1="64" y1="54" x2="128" y2="54" className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="2.5" />

          {/* Graduated Burette */}
          <rect x="130" y="18" width="16" height="86" rx="2" fill="none" className="stroke-slate-500 dark:stroke-slate-400" strokeWidth="1.5" />
          <rect x="131.5" y={liquidTopY} width="13" height={Math.max(0, 102 - liquidTopY)} fill="#38bdf8" fillOpacity={0.55} />
          {/* Stopcock & Tip */}
          <rect x="126" y="106" width="24" height="5" rx="2" className="fill-emerald-500" />
          <polygon points="135,111 141,111 138,124" className="fill-slate-400" />
          {buretteVol > 0 && buretteVol < maxBurette && (
            <circle cx="138" cy="129" r="2.2" fill="#38bdf8" />
          )}

          {/* Erlenmeyer Flask */}
          <path
            d="M126,134 L150,134 L150,146 L176,184 A6,6 0 0,1 171,192 L105,192 A6,6 0 0,1 100,184 L126,146 Z"
            fill="none"
            className="stroke-slate-500 dark:stroke-slate-400"
            strokeWidth="2"
          />
          {/* Indicator Solution inside Flask */}
          <path
            d="M115,163 L161,163 L174,183 A5,5 0 0,1 170,190 L106,190 A5,5 0 0,1 102,183 Z"
            fill={flaskHex}
            fillOpacity={0.65}
          />

          {/* Digital pH Probe Readout */}
          <rect x="192" y="42" width="76" height="58" rx="8" className="fill-white dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700" strokeWidth="1.2" />
          <text x="230" y="60" textAnchor="middle" className="fill-slate-400 text-[9px] font-mono">
            pH METER
          </text>
          <text x="230" y="80" textAnchor="middle" className="fill-cyan-600 dark:fill-cyan-400 text-[16px] font-mono font-bold">
            {ph.toFixed(2)}
          </text>
          <text x="230" y="93" textAnchor="middle" className="fill-slate-500 text-[9px] font-mono">
            Ve = {eqVol.toFixed(1)} mL
          </text>
        </svg>
      </div>
    );
  }

  if (kind === 'pk_compartment') {
    const plasma = Number(v.plasmaConc ?? 0);
    const depot = Number(v.gutDepotMg ?? 0);
    const dose = Math.max(1, Number(v.doseMg ?? 500));
    const mec = Number(v.mec ?? 4);
    const mtc = Number(v.mtc ?? 18);
    const route = String(v.route ?? 'oral_single');
    const depotPct = Math.min(100, Math.max(0, (depot / dose) * 100));
    const plasmaFillPct = Math.min(100, Math.max(2, (plasma / (mtc * 1.25)) * 100));
    const plasmaColor = plasma > mtc ? '#ef4444' : plasma >= mec ? '#10b981' : '#3b82f6';

    return (
      <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 font-mono tabular-nums">
          <span>1-COMPARTMENT MODEL</span>
          <span>C(t) = {plasma.toFixed(2)} mg/L</span>
        </div>
        <svg viewBox="0 0 280 200" className="w-full h-48 mx-auto" role="img" aria-label="One compartment pharmacokinetic diagram">
          {/* Gut Depot */}
          <rect x="16" y="48" width="66" height="92" rx="10" className="fill-white dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700" strokeWidth="1.5" />
          {route !== 'iv_bolus' && (
            <rect
              x="19"
              y={137 - depotPct * 0.72}
              width="60"
              height={depotPct * 0.72}
              rx="6"
              fill="#f59e0b"
              fillOpacity={0.55}
            />
          )}
          <text x="49" y="64" textAnchor="middle" className="fill-slate-500 text-[9px] font-mono">
            {route === 'iv_bolus' ? 'IV BOLUS' : 'GI DEPOT'}
          </text>
          <text x="49" y="156" textAnchor="middle" className="fill-slate-500 text-[9px] font-mono">
            {route === 'iv_bolus' ? 'Bypassed' : `${depot.toFixed(0)} mg`}
          </text>

          {/* ka arrow */}
          <line x1="84" y1="94" x2="108" y2="94" className="stroke-emerald-500" strokeWidth="2" />
          <polygon points="106,89 114,94 106,99" className="fill-emerald-500" />
          <text x="99" y="84" textAnchor="middle" className="fill-emerald-600 dark:fill-emerald-400 text-[9px] font-mono">
            ka
          </text>

          {/* Central Plasma Compartment */}
          <rect x="116" y="34" width="90" height="120" rx="12" className="fill-white dark:fill-slate-900 stroke-slate-400 dark:stroke-slate-600" strokeWidth="1.8" />
          <rect
            x="120"
            y={150 - plasmaFillPct * 0.96}
            width="82"
            height={plasmaFillPct * 0.96}
            rx="8"
            fill={plasmaColor}
            fillOpacity={0.45}
          />
          {/* MEC and MTC reference ticks */}
          <line
            x1="118"
            y1={150 - Math.min(95, (mec / (mtc * 1.25)) * 96)}
            x2="204"
            y2={150 - Math.min(95, (mec / (mtc * 1.25)) * 96)}
            stroke="#059669"
            strokeDasharray="3 2"
            strokeWidth="1.2"
          />
          <line
            x1="118"
            y1={150 - Math.min(95, (mtc / (mtc * 1.25)) * 96)}
            x2="204"
            y2={150 - Math.min(95, (mtc / (mtc * 1.25)) * 96)}
            stroke="#dc2626"
            strokeDasharray="3 2"
            strokeWidth="1.2"
          />
          <text x="161" y="50" textAnchor="middle" className="fill-slate-600 dark:fill-slate-300 text-[10px] font-mono font-semibold">
            PLASMA (Vd)
          </text>
          <text x="161" y="172" textAnchor="middle" className="fill-slate-600 dark:fill-slate-300 text-[10px] font-mono">
            {plasma.toFixed(2)} mg/L
          </text>

          {/* Elimination arrow */}
          <line x1="208" y1="94" x2="236" y2="94" className="stroke-rose-500" strokeWidth="2" />
          <polygon points="234,89 242,94 234,99" className="fill-rose-500" />
          <text x="256" y="90" textAnchor="middle" className="fill-rose-500 text-[9px] font-mono">
            ke=CL/Vd
          </text>
          <text x="256" y="104" textAnchor="middle" className="fill-slate-500 text-[9px] font-mono">
            {Number(v.ke ?? 0.14).toFixed(2)} /h
          </text>
        </svg>
      </div>
    );
  }

  if (kind === 'cardiac_hemodynamics') {
    const hr = Number(v.heartRateBpm ?? 72);
    const co = Number(v.cardiacOutputLMin ?? 5.0);
    const sbp = Number(v.sbpMmHg ?? 120);
    const dbp = Number(v.dbpMmHg ?? 80);
    const tpr = Number(v.tpr ?? 17.5);
    const instP = Number(v.instantPressure ?? sbp);
    const pulseScale = 0.94 + Math.max(0, (instP - dbp) / Math.max(15, sbp - dbp)) * 0.12;
    const lumenWidth = Math.max(6, Math.min(24, 28 - tpr * 0.65));

    return (
      <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 font-mono tabular-nums">
          <span>WINDKESSEL HEMODYNAMICS</span>
          <span>
            {hr} bpm · {sbp.toFixed(0)}/{dbp.toFixed(0)} mmHg
          </span>
        </div>
        <svg viewBox="0 0 280 200" className="w-full h-48 mx-auto" role="img" aria-label="Cardiac output and vascular resistance schematic">
          {/* Chambered schematic pump */}
          <g transform={`translate(75, 92) scale(${pulseScale}) translate(-75, -92)`}>
            <path
              d="M75,45 C50,45 36,68 42,96 C48,124 68,142 75,148 C82,142 102,124 108,96 C114,68 100,45 75,45 Z"
              className="fill-rose-500/20 stroke-rose-500"
              strokeWidth="2.5"
            />
            <line x1="75" y1="54" x2="75" y2="140" className="stroke-rose-500/40" strokeWidth="1.5" />
            <line x1="45" y1="88" x2="105" y2="88" className="stroke-rose-500/40" strokeWidth="1.5" />
          </g>
          <text x="75" y="170" textAnchor="middle" className="fill-slate-600 dark:fill-slate-300 text-[10px] font-mono">
            CO = {co.toFixed(2)} L/min
          </text>

          {/* Aortic flow into Arteriolar resistance tube */}
          <line x1="114" y1="92" x2="152" y2="92" className="stroke-rose-500" strokeWidth="3" />
          <polygon points="150,87 158,92 150,97" className="fill-rose-500" />

          {/* Arteriolar lumen showing vasoconstriction vs vasodilation */}
          <rect x="164" y="64" width="94" height="56" rx="10" className="fill-white dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700" strokeWidth="1.5" />
          <rect
            x="172"
            y={92 - lumenWidth / 2}
            width="78"
            height={lumenWidth}
            rx={lumenWidth / 2}
            className="fill-red-500/55 stroke-red-500"
            strokeWidth="1.2"
          />
          <text x="211" y="54" textAnchor="middle" className="fill-slate-500 text-[9px] font-mono">
            ARTERIOLAR TPR: {tpr.toFixed(1)}
          </text>
          <text x="211" y="138" textAnchor="middle" className="fill-slate-600 dark:fill-slate-300 text-[10px] font-mono font-bold">
            P(t) = {instP.toFixed(0)} mmHg
          </text>
        </svg>
      </div>
    );
  }

  if (kind === 'microbial_bioreactor') {
    const mode = String(v.mode ?? 'growth');
    const log10N = Number(v.log10N ?? 5);
    const tempC = Number(v.tempC ?? 37);
    const turbidityOpacity =
      mode === 'sterilization'
        ? Math.max(0.05, Math.min(0.6, (log10N + 6) / 14))
        : Math.max(0.08, Math.min(0.7, (log10N - 3) / 8));

    return (
      <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 font-mono tabular-nums">
          <span>{mode === 'sterilization' ? 'STEAM AUTOCLAVE' : 'STIRRED BIOREACTOR'}</span>
          <span>
            {tempC.toFixed(1)} °C · log₁₀ N = {log10N.toFixed(2)}
          </span>
        </div>
        <svg viewBox="0 0 280 200" className="w-full h-48 mx-auto" role="img" aria-label="Bioreactor or autoclave vessel diagram">
          <rect x="86" y="30" width="108" height="136" rx="14" className="fill-white dark:fill-slate-900 stroke-slate-400 dark:stroke-slate-600" strokeWidth="2.2" />
          <rect
            x="90"
            y="66"
            width="100"
            height="96"
            rx="10"
            fill={mode === 'sterilization' ? '#ef4444' : '#10b981'}
            fillOpacity={turbidityOpacity}
          />
          <line x1="140" y1="16" x2="140" y2="142" className="stroke-slate-500" strokeWidth="2.5" />
          <line x1="118" y1="126" x2="162" y2="126" className="stroke-slate-500" strokeWidth="4" />
          <text x="140" y="188" textAnchor="middle" className="fill-slate-600 dark:fill-slate-300 text-[10px] font-mono">
            {mode === 'sterilization'
              ? `F₀ = ${Number(v.f0 ?? 0).toFixed(1)} min · ${v.salAchieved ? 'SAL ≤ 10⁻⁶ PASS' : 'Active Cycle'}`
              : `Substrate: ${(Number(v.substrateRatio ?? 1) * 100).toFixed(0)}% remaining`}
          </text>
        </svg>
      </div>
    );
  }

  // filtration_diffusion (Franz diffusion cell)
  const thicknessUm = Number(v.thicknessUm ?? params.thicknessUm ?? 150);
  const pctPerm = Math.min(100, Math.max(0, Number(v.pctPermeated ?? 0)));
  const cumMg = Number(v.cumulativeMg ?? 0);
  const barrierPx = Math.max(8, Math.min(26, (thicknessUm / 500) * 26));

  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3">
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 font-mono tabular-nums">
        <span>FRANZ DIFFUSION CELL</span>
        <span>
          h = {thicknessUm} µm · Q(t) = {cumMg.toFixed(2)} mg
        </span>
      </div>
      <svg viewBox="0 0 280 205" className="w-full h-48 mx-auto" role="img" aria-label="Franz diffusion cell schematic">
        {/* Donor Compartment */}
        <rect x="92" y="20" width="96" height="58" rx="6" className="fill-violet-500/20 stroke-slate-400 dark:stroke-slate-600" strokeWidth="1.8" />
        <text x="140" y="45" textAnchor="middle" className="fill-violet-700 dark:fill-violet-300 text-[10px] font-mono font-bold">
          DONOR ({Number(params.donorConcMgMl ?? 10)} mg/mL)
        </text>

        {/* Membrane Barrier */}
        <rect
          x="84"
          y={78}
          width="112"
          height={barrierPx}
          rx="3"
          className="fill-amber-400/55 stroke-amber-600"
          strokeWidth="1.5"
        />
        <text x="206" y={78 + barrierPx / 2 + 3} className="fill-amber-600 dark:fill-amber-400 text-[9px] font-mono">
          h={thicknessUm}µm
        </text>

        {/* Receptor Compartment */}
        <path
          d={`M92,${78 + barrierPx} L188,${78 + barrierPx} L196,174 A8,8 0 0,1 188,182 L92,182 A8,8 0 0,1 84,174 Z`}
          fill="#8b5cf6"
          fillOpacity={0.08 + (pctPerm / 100) * 0.45}
          className="stroke-slate-400 dark:stroke-slate-600"
          strokeWidth="1.8"
        />
        {/* Magnetic Stir Bar */}
        <rect x="122" y="168" width="36" height="6" rx="3" className="fill-slate-400 dark:fill-slate-500" />
        <text x="140" y="150" textAnchor="middle" className="fill-slate-700 dark:fill-slate-200 text-[10px] font-mono font-semibold">
          RECEPTOR: {cumMg.toFixed(2)} mg
        </text>
      </svg>
    </div>
  );
}
