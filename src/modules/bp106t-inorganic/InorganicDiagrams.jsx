import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Image as ImageIcon, Layers } from 'lucide-react';
import ResourceConnector from '../../components/ResourceConnector';
import { BUILT_IN_VISUALS } from '../visual-library/builtInVisuals';
import ImageViewerModal from '../visual-library/ImageViewerModal';

const APPARATUS_PLATE = BUILT_IN_VISUALS.find((v) => v.id === 'builtin_chemistry_apparatus') || null;

const INORG_SEARCH_MAP = {
  gutzeit: 'limit test arsenic gutzeit',
  nessler: 'nessler cylinder limit test',
  titration_setup: 'volumetric titration burette',
  accuracy: 'accuracy precision determinate error',
  curves: 'neutralization curve indicator',
  radiation: 'radiopharmaceutical shielding'
};

export default function InorganicDiagrams() {
  const [selectedDiagram, setSelectedDiagram] = useState('gutzeit');
  const [selectedPin, setSelectedPin] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [visualMode, setVisualMode] = useState('schematic');
  const [viewerItem, setViewerItem] = useState(null);

  const diagrams = {
    gutzeit: {
      title: 'Gutzeit Apparatus — IP Limit Test for Arsenic (Exp 1e / Unit I)',
      subtitle: 'Click numbered markers 1–7 to inspect exact dimensions, gas purification, and arsine stain chemistry.',
      pins: [
        { id: 1, x: 175, y: 215, label: '120 mL Wide-Mouthed Reaction Bottle', loc: 'Base vessel containing Test/Standard + Zn + Stannated HCl', fn: 'Granulated zinc reacts with stannated HCl (with KI & SnCl₂) reducing As⁵⁺ → As³⁺ → volatile Arsine gas (AsH₃↑).' },
        { id: 2, x: 175, y: 158, label: 'Rubber Bung & Vent Hole', loc: 'Neck seal & lateral hole (2 mm) in glass tube', fn: 'Supports vertical glass tube tightly; lower lateral opening allows rising gas entry and condensate drainage.' },
        { id: 3, x: 175, y: 118, label: 'Lead Acetate Cotton Wool Plug', loc: 'Packed loosely inside lower 200 mm × 6.5 mm glass tube', fn: 'Traps interfering Hydrogen Sulphide (H₂S) gas as black PbS precipitate so it does not falsely stain HgCl₂ paper.' },
        { id: 4, x: 175, y: 74, label: 'Upper Glass Tube (6.5 mm Internal Diameter)', loc: '200 mm long vertical delivery tube', fn: 'Standardizes arsine gas flow velocity toward the mercuric chloride detection disc.' },
        { id: 5, x: 175, y: 44, label: 'Mercuric Chloride (HgCl₂) Paper Disc', loc: 'Clamped horizontally between upper flat-ground tube flanges', fn: 'AsH₃ reacts with HgCl₂ forming a yellow to brown stain [As(HgCl)₃]; test stain intensity must be ≤ standard 10 ppm As stain.' },
        { id: 6, x: 210, y: 44, label: 'Rubber Band / Spring Clip Clamp', loc: 'Secures upper & lower flange caps around HgCl₂ paper', fn: 'Ensures all arsine gas passes strictly through the 6.5 mm disc orifice without side leakage.' }
      ]
    },
    nessler: {
      title: 'Nessler Cylinder Visual Comparator — Chloride, Sulphate & Iron Limit Tests (Exp 1a–1d)',
      subtitle: 'Click pins 1–5 to inspect IP optical comparison geometry for turbidity, opalescence, and color.',
      pins: [
        { id: 1, x: 110, y: 60, label: 'Test Cylinder (50 mL Borosilicate)', loc: 'Left matched flat-bottom cylinder', fn: 'Contains sample + acid + precipitating reagent (AgNO₃ for Cl⁻, BaCl₂ for SO₄²⁻, or thioglycolic acid for Fe).' },
        { id: 2, x: 245, y: 60, label: 'Standard Control Cylinder (50 mL)', loc: 'Right matched cylinder of identical bore & wall thickness', fn: 'Contains exact IP standard reference (e.g., 25 ppm Cl⁻, 0.6 mg SO₄²⁻, or 20 ppm Fe).' },
        { id: 3, x: 178, y: 98, label: '50 mL Calibration Mark', loc: 'Matched meniscus height across both tubes', fn: 'Ensures equal optical path length so turbidity/color comparison is strictly valid.' },
        { id: 4, x: 178, y: 216, label: 'Black/White Viewing Background Tile', loc: 'Beneath flat optical cylinder bases', fn: 'Black background highlights white AgCl/BaSO₄ opalescence (Cl⁻/SO₄²⁻); White background highlights purple Iron-thioglycolate.' },
        { id: 5, x: 178, y: 30, label: 'Vertical Top-Down Viewing Axis', loc: 'Look vertically down through liquid column', fn: 'Pass Criterion: Opalescence or color intensity in Test tube must be LESS than Standard tube after 5 min standing.' }
      ]
    },
    titration_setup: {
      title: 'Volumetric Titration Assembly & Meniscus Parallax (Exp 4a–4g / Unit III)',
      subtitle: 'Click pins 1–6 to inspect burette reading rules, apparatus, and equivalence detection.',
      pins: [
        { id: 1, x: 155, y: 52, label: '50 mL Graduated Burette', loc: 'Clamped vertically on retort stand', fn: 'Delivers measured titrant volumes (±0.05 mL precision) for acid-base, redox, complexometric, or precipitation assays.' },
        { id: 2, x: 220, y: 82, label: 'Concave Meniscus (Eye-Level Reading)', loc: 'Avoid upward/downward parallax error', fn: 'Read bottom of concave meniscus for colorless liquids (NaOH, EDTA); read top meniscus for intensely colored KMnO₄ or I₂.' },
        { id: 3, x: 155, y: 128, label: 'PTFE / Glass Stopcock', loc: 'Lower burette delivery valve', fn: 'Controls steady stream vs drop-by-drop (0.05–0.1 mL) delivery near equivalence point.' },
        { id: 4, x: 155, y: 185, label: 'Conical (Erlenmeyer) Titration Flask', loc: 'Contains 25 mL pipetted analyte + indicator', fn: 'Sloped walls prevent splashing during vigorous swirling to mix titrant uniformly.' },
        { id: 5, x: 155, y: 222, label: 'White Porcelain Tile Base', loc: 'Beneath conical flask', fn: 'Provides crisp high-contrast background to spot faint pale-pink (Phenolphthalein/KMnO₄) or blue (EDTA/Ferroin) endpoints.' }
      ]
    },
    accuracy: {
      title: 'Errors in Analysis: Accuracy vs Precision Target (Unit I)',
      subtitle: 'Click each quadrant 1–4 to distinguish Determinate (Systematic) vs Indeterminate (Random) errors.',
      pins: [
        { id: 1, x: 95, y: 78, label: 'High Accuracy & High Precision', loc: 'Top-Left Target: Tightly clustered at bullseye', fn: 'Both systematic and random errors minimized; ideal pharmacopoeial assay reproducibility.' },
        { id: 2, x: 255, y: 78, label: 'Low Accuracy, High Precision (Systematic Error)', loc: 'Top-Right Target: Tightly clustered off-center', fn: 'Caused by determinate errors (uncalibrated burette, wrong indicator blank, impure primary standard).' },
        { id: 3, x: 95, y: 192, label: 'Fair Accuracy, Low Precision (Random Error)', loc: 'Bottom-Left Target: Scattered around center', fn: 'Caused by indeterminate random fluctuations (temperature drift, reading parallax, variable drop size).' },
        { id: 4, x: 255, y: 192, label: 'Low Accuracy & Low Precision', loc: 'Bottom-Right Target: Widely scattered off-center', fn: 'Presence of both gross/systematic calibration bias and random operational errors; experiment must be repeated.' }
      ]
    },
    curves: {
      title: 'Acid-Base Neutralization Curves & Indicator Zones (Unit III)',
      subtitle: 'Click pins 1–4 to inspect equivalence pH jumps and indicator selection (Ostwald/Quinonoid theory).',
      pins: [
        { id: 1, x: 192, y: 132, label: 'Strong Acid vs Strong Base (Equivalence pH 7.0)', loc: 'Steep vertical jump pH 3.5 → 10.5', fn: 'Both Phenolphthalein (8.2–10.0) and Methyl Orange (3.1–4.4) fall inside the sharp equivalence inflection.' },
        { id: 2, x: 192, y: 90, label: 'Weak Acid vs Strong Base (Equivalence pH ~8.7)', loc: 'Buffer region around pKa; jump pH 7.0 → 10.5', fn: 'Basic salt hydrolysis at endpoint requires Phenolphthalein or Thymol Blue (methyl orange changes too early!).' },
        { id: 3, x: 192, y: 168, label: 'Weak Base vs Strong Acid (Equivalence pH ~5.3)', loc: 'Acidic salt hydrolysis at endpoint (e.g., NH₄OH vs HCl)', fn: 'Requires acidic-range indicator like Methyl Orange (3.1–4.4) or Methyl Red (4.2–6.3).' },
        { id: 4, x: 270, y: 76, label: 'Phenolphthalein Transition Band (pH 8.2–10.0)', loc: 'Upper shaded pink band', fn: 'Colorless benzenoid lactone form converts to pink quinonoid dianion in alkaline solution.' }
      ]
    },
    radiation: {
      title: 'Radiopharmaceuticals: α, β, γ Radiation Shielding & Penetration (Unit IV)',
      subtitle: 'Click pins 1–4 to inspect particle range, shielding materials, and ALARA safety protocols.',
      pins: [
        { id: 1, x: 118, y: 72, label: 'Alpha (α) Particles (⁴₂He²⁺)', loc: 'Stopped completely by Paper / Dead skin layer', fn: 'High mass (+2 charge), massive ionizing power, tiny range (~cm in air); hazardous only if ingested/inhaled.' },
        { id: 2, x: 185, y: 124, label: 'Beta (β⁻) Electrons (e.g., P-32, I-131)', loc: 'Penetrates paper, stopped by Aluminium / Acrylic (Perspex)', fn: 'Used therapeutically (P-32 polycythemia vera, I-131 thyroid ablation). Shield with low-Z plastic/Al to avoid Bremsstrahlung X-rays.' },
        { id: 3, x: 265, y: 176, label: 'Gamma (γ) Photons (e.g., Tc-99m, Co-60)', loc: 'Penetrates paper & Al; attenuated by thick Lead (Pb) or Concrete', fn: 'High-penetration electromagnetic rays ideal for diagnostic SPECT imaging (Tc-99m, 140 keV) and Co-60 teletherapy.' },
        { id: 4, x: 318, y: 222, label: 'ALARA Safety Principles', loc: 'Time, Distance (1/d²), Shielding & Decay-in-Storage', fn: 'Minimize exposure time, maximize distance using remote tongs, store waste in lead-lined decay vaults for 10 half-lives.' }
      ]
    }
  };

  const current = diagrams[selectedDiagram];
  const activePin = current.pins[selectedPin] || current.pins[0];
  const hasPlate =
    Boolean(APPARATUS_PLATE) &&
    (selectedDiagram === 'titration_setup' || selectedDiagram === 'nessler');

  const handleSelectDiagram = (key) => {
    setSelectedDiagram(key);
    setSelectedPin(0);
    if (key !== 'titration_setup' && key !== 'nessler') {
      setVisualMode('schematic');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'gutzeit', label: 'Gutzeit Arsenic Apparatus (Exp 1e)' },
          { id: 'nessler', label: 'Nessler Cylinder Comparator (Exp 1a–1d)' },
          { id: 'titration_setup', label: 'Burette & Meniscus Setup (Exp 4)' },
          { id: 'accuracy', label: 'Accuracy vs Precision (Unit I)' },
          { id: 'curves', label: 'Neutralization Curves (Unit III)' },
          { id: 'radiation', label: 'α / β / γ Radiation Shielding (Unit IV)' }
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

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{current.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{current.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {hasPlate && (
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
                  <span>Schematic</span>
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
                  <span>Apparatus Plate</span>
                </button>
              </div>
            )}
            <button
              onClick={() =>
                hasPlate && visualMode === 'plate'
                  ? setViewerItem(APPARATUS_PLATE)
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
                {hasPlate && visualMode === 'plate'
                  ? 'Full Viewer'
                  : zoomed
                    ? 'Reset 1.0×'
                    : 'Inspect 1.25×'}
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-center overflow-auto">
            {hasPlate && visualMode === 'plate' && APPARATUS_PLATE ? (
              <div className="w-full space-y-3">
                <button
                  type="button"
                  onClick={() => setViewerItem(APPARATUS_PLATE)}
                  className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-800 block group focus:outline-none"
                >
                  <img
                    src={APPARATUS_PLATE.assetUrl}
                    alt={APPARATUS_PLATE.title}
                    className="w-full h-full object-contain p-1 group-hover:scale-[1.02] transition-transform duration-200"
                  />
                </button>
                <div className="flex items-center justify-between gap-3 text-xs text-slate-400 px-1">
                  <span className="truncate">{APPARATUS_PLATE.caption}</span>
                  <button
                    type="button"
                    onClick={() => setViewerItem(APPARATUS_PLATE)}
                    className="text-emerald-400 font-semibold whitespace-nowrap hover:underline shrink-0"
                  >
                    Zoom Plate
                  </button>
                </div>
              </div>
            ) : (
            <svg
              viewBox="0 0 360 260"
              className={`w-full max-w-[540px] h-auto select-none transition-transform duration-200 ${zoomed ? 'scale-125 origin-center my-6' : 'scale-100'}`}
            >
              <defs>
                <pattern id="inorgGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.6" />
                </pattern>
              </defs>
              <rect width="360" height="260" fill="url(#inorgGrid)" rx="8" />
              {/* GUTZEIT APPARATUS */}
              {selectedDiagram === 'gutzeit' && (
                <g>
                  {/* Bottle */}
                  <rect x="130" y="165" width="90" height="80" rx="10" fill="#0f172a" stroke="#64748b" strokeWidth="2.5" />
                  <rect x="132" y="205" width="86" height="38" rx="6" fill="#10b981" fillOpacity="0.2" />
                  {/* Zinc granules */}
                  <circle cx="155" cy="232" r="4" fill="#94a3b8" />
                  <circle cx="170" cy="235" r="5" fill="#94a3b8" />
                  <circle cx="190" cy="233" r="4" fill="#94a3b8" />
                  {/* Rubber Bung */}
                  <path d="M 152 150 L 198 150 L 194 170 L 156 170 Z" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />
                  {/* Glass Delivery Tube */}
                  <rect x="169" y="48" width="12" height="106" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.8" />
                  {/* Lead Acetate Cotton */}
                  <rect x="171" y="100" width="8" height="36" rx="2" fill="#e2e8f0" fillOpacity="0.65" />
                  {/* Flanges & HgCl2 Paper */}
                  <rect x="155" y="42" width="40" height="6" rx="2" fill="#facc15" stroke="#eab308" strokeWidth="1.5" />
                  <rect x="162" y="34" width="26" height="8" rx="2" fill="#334155" stroke="#94a3b8" strokeWidth="1.2" />
                  <text x="275" y="218" textAnchor="middle" fill="#34d399" fontSize="8">Zn + HCl + As³⁺ → AsH₃↑</text>
                </g>
              )}

              {/* NESSLER CYLINDERS */}
              {selectedDiagram === 'nessler' && (
                <g>
                  <rect x="65" y="212" width="225" height="14" rx="3" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
                  {/* Test Tube */}
                  <rect x="85" y="50" width="50" height="162" rx="3" fill="#0f172a" stroke="#94a3b8" strokeWidth="2" />
                  <rect x="87" y="98" width="46" height="112" fill="#e2e8f0" fillOpacity="0.16" />
                  <line x1="85" y1="98" x2="135" y2="98" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3,2" />
                  <text x="110" y="242" textAnchor="middle" fill="#cbd5e1" fontSize="9">TEST</text>
                  {/* Standard Tube */}
                  <rect x="220" y="50" width="50" height="162" rx="3" fill="#0f172a" stroke="#94a3b8" strokeWidth="2" />
                  <rect x="222" y="98" width="46" height="112" fill="#e2e8f0" fillOpacity="0.34" />
                  <line x1="220" y1="98" x2="270" y2="98" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3,2" />
                  <text x="245" y="242" textAnchor="middle" fill="#10b981" fontSize="9">STANDARD</text>
                </g>
              )}

              {/* TITRATION SETUP */}
              {selectedDiagram === 'titration_setup' && (
                <g>
                  {/* Stand */}
                  <rect x="65" y="220" width="160" height="10" rx="2" fill="#334155" />
                  <line x1="85" y1="220" x2="85" y2="25" stroke="#64748b" strokeWidth="5" />
                  <line x1="85" y1="75" x2="147" y2="75" stroke="#94a3b8" strokeWidth="3.5" />
                  {/* Burette */}
                  <rect x="147" y="30" width="16" height="105" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.8" />
                  <rect x="149" y="52" width="12" height="81" fill="#10b981" fillOpacity="0.3" />
                  {/* Stopcock */}
                  <rect x="142" y="125" width="26" height="6" rx="2" fill="#f59e0b" />
                  {/* Flask */}
                  <path d="M 142 155 L 168 155 L 190 212 L 120 212 Z" fill="#0f172a" stroke="#94a3b8" strokeWidth="2" />
                  <path d="M 130 186 L 180 186 L 188 210 L 122 210 Z" fill="#ec4899" fillOpacity="0.3" />
                  {/* Meniscus Zoom Box */}
                  <rect x="200" y="50" width="115" height="62" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                  <path d="M 225 65 L 225 102 M 265 65 L 265 102" stroke="#64748b" strokeWidth="2" />
                  <path d="M 225 80 Q 245 90 265 80" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                  <line x1="215" y1="85" x2="295" y2="85" stroke="#10b981" strokeWidth="1.2" strokeDasharray="3,2" />
                  <text x="258" y="106" textAnchor="middle" fill="#10b981" fontSize="8">Read Bottom @ Eye Level</text>
                </g>
              )}

              {/* ACCURACY VS PRECISION */}
              {selectedDiagram === 'accuracy' && (
                <g>
                  {[
                    { cx: 95, cy: 78, dots: [[93,77],[97,79],[95,75],[94,80],[96,78]] },
                    { cx: 255, cy: 78, dots: [[275,62],[278,64],[273,65],[276,61],[274,63]] },
                    { cx: 95, cy: 192, dots: [[75,180],[112,202],[88,210],[108,176],[94,191]] },
                    { cx: 255, cy: 192, dots: [[228,168],[280,210],[238,212],[276,174],[245,182]] }
                  ].map((t, idx) => (
                    <g key={idx}>
                      <circle cx={t.cx} cy={t.cy} r="44" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                      <circle cx={t.cx} cy={t.cy} r="28" fill="none" stroke="#475569" strokeWidth="1.2" />
                      <circle cx={t.cx} cy={t.cy} r="12" fill="#10b981" fillOpacity="0.2" stroke="#10b981" strokeWidth="1.2" />
                      {t.dots.map(([dx, dy], i) => (
                        <circle key={i} cx={dx} cy={dy} r="3" fill="#f59e0b" />
                      ))}
                    </g>
                  ))}
                </g>
              )}

              {/* NEUTRALIZATION CURVES */}
              {selectedDiagram === 'curves' && (
                <g>
                  <line x1="55" y1="30" x2="55" y2="225" stroke="#475569" strokeWidth="1.5" />
                  <line x1="55" y1="225" x2="325" y2="225" stroke="#475569" strokeWidth="1.5" />
                  {/* Phenolphthalein Band */}
                  <rect x="56" y="68" width="268" height="24" fill="#ec4899" fillOpacity="0.15" />
                  {/* Methyl Orange Band */}
                  <rect x="56" y="160" width="268" height="20" fill="#f59e0b" fillOpacity="0.15" />
                  {/* Strong-Strong Curve */}
                  <path d="M 60 205 L 170 198 Q 190 194 192 130 Q 194 64 215 58 L 315 52" fill="none" stroke="#10b981" strokeWidth="2.5" />
                  {/* Weak Acid - Strong Base */}
                  <path d="M 60 155 Q 130 140 175 130 Q 190 125 192 92 Q 196 64 220 58" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4,3" />
                  {/* Weak Base - Strong Acid */}
                  <path d="M 192 128 Q 194 175 215 190 L 315 202" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4,3" />
                  <text x="30" y="130" fill="#94a3b8" fontSize="9" transform="rotate(-90 30 130)">pH (0–14)</text>
                  <text x="192" y="245" textAnchor="middle" fill="#94a3b8" fontSize="9">Volume of Titrant Added (mL)</text>
                </g>
              )}

              {/* RADIATION PENETRATION */}
              {selectedDiagram === 'radiation' && (
                <g>
                  {/* Source */}
                  <circle cx="42" cy="124" r="16" fill="#f59e0b" fillOpacity="0.3" stroke="#f59e0b" strokeWidth="2" />
                  <text x="42" y="127" textAnchor="middle" fill="#fde047" fontSize="9" fontWeight="bold">SRC</text>
                  {/* Barriers */}
                  <rect x="115" y="45" width="8" height="160" fill="#e2e8f0" />
                  <text x="119" y="220" textAnchor="middle" fill="#e2e8f0" fontSize="8">Paper</text>
                  <rect x="182" y="45" width="12" height="160" fill="#94a3b8" />
                  <text x="188" y="220" textAnchor="middle" fill="#94a3b8" fontSize="8">Aluminium</text>
                  <rect x="255" y="45" width="24" height="160" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
                  <text x="267" y="220" textAnchor="middle" fill="#cbd5e1" fontSize="8">Lead (Pb)</text>
                  {/* Rays */}
                  <line x1="58" y1="72" x2="115" y2="72" stroke="#10b981" strokeWidth="3" />
                  <line x1="58" y1="124" x2="182" y2="124" stroke="#38bdf8" strokeWidth="2.5" />
                  <path d="M 58 176 L 265 176" stroke="#f43f5e" strokeWidth="2.5" strokeDasharray="6,3" />
                  <path d="M 279 176 L 325 176" stroke="#f43f5e" strokeWidth="1" strokeDasharray="3,4" opacity="0.5" />
                </g>
              )}

              {/* Interactive Pins */}
              {current.pins.map((pin, idx) => {
                const isSelected = selectedPin === idx;
                return (
                  <g key={pin.id} onClick={() => setSelectedPin(idx)} className="cursor-pointer">
                    {isSelected && <circle cx={pin.x} cy={pin.y} r="14" fill="#10b981" fillOpacity="0.25" />}
                    <circle
                      cx={pin.x}
                      cy={pin.y}
                      r="9.5"
                      fill={isSelected ? '#10b981' : '#0f172a'}
                      stroke={isSelected ? '#ffffff' : '#34d399'}
                      strokeWidth="2"
                    />
                    <text x={pin.x} y={pin.y + 3.5} textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                      {pin.id}
                    </text>
                  </g>
                );
              })}
            </svg>
            )}
          </div>

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
                    aria-label="Previous setup marker"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setSelectedPin((p) => (p + 1) % current.pins.length)}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
                    aria-label="Next setup marker"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300"><strong>Location / Setup:</strong> {activePin.loc}</p>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed"><strong>Function &amp; Principle:</strong> {activePin.fn}</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-1.5 max-h-60 overflow-y-auto">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
                Diagram Annotations ({current.pins.length})
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
        department="inorganic"
        topic={selectedDiagram === 'titration_setup' ? 'titration' : 'nessler'}
        defaultSearchQuery={INORG_SEARCH_MAP[selectedDiagram] || 'limit test'}
        title={`Linked Apparatus Visuals & Textbook References — ${current.title.split('(')[0].trim()}`}
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
