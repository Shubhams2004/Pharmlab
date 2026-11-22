function toSvgDataUrl(svgBody: string): string {
  const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" width="1200" height="900">${svgBody}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(fullSvg)}`;
}

/**
 * 1. Human Nephron & Renal Corpuscle (1200x900)
 * Coordinates align exactly with subj_nephron annotations:
 * - Glomerulus & Bowman's Capsule: (265, 225) -> 22.1%, 25.0%
 * - Proximal Convoluted Tubule (PCT): (475, 225) -> 39.6%, 25.0%
 * - Loop of Henle: (560, 620) -> 46.7%, 68.9%
 * - Juxtaglomerular Apparatus (JGA): (365, 165) -> 30.4%, 18.3%
 * - Distal Convoluted Tubule (DCT): (745, 235) -> 62.1%, 26.1%
 * - Collecting Duct: (930, 470) -> 77.5%, 52.2%
 */
export const NEPHRON_PLATE_URL = toSvgDataUrl(`
  <defs>
    <linearGradient id="cortexBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#f1f5f9"/>
    </linearGradient>
    <linearGradient id="medullaBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#e2e8f0"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </linearGradient>
    <marker id="arrowBlue" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284c7"/>
    </marker>
    <marker id="arrowRed" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#dc2626"/>
    </marker>
  </defs>

  <!-- Cortex & Medulla Zones -->
  <rect x="0" y="0" width="1200" height="440" fill="url(#cortexBg)"/>
  <rect x="0" y="440" width="1200" height="460" fill="url(#medullaBg)"/>
  <line x1="0" y1="440" x2="1200" y2="440" stroke="#64748b" stroke-width="2" stroke-dasharray="10 8"/>
  <text x="36" y="422" font-family="sans-serif" font-size="18" font-weight="700" fill="#334155">RENAL CORTEX</text>
  <text x="36" y="472" font-family="sans-serif" font-size="18" font-weight="700" fill="#334155">RENAL MEDULLA (Osmotic Gradient: 300 → 1200 mOsm/L)</text>

  <!-- Title Header -->
  <text x="36" y="48" font-family="sans-serif" font-size="24" font-weight="800" fill="#0f172a">HUMAN NEPHRON — FUNCTIONAL FILTRATION &amp; TUBULAR TRANSPORT UNIT</text>
  <text x="36" y="74" font-family="sans-serif" font-size="15" fill="#475569">Select any anatomical marker to inspect structure, filtration/reabsorption mechanics, and clinical significance</text>

  <!-- Afferent & Efferent Arterioles -->
  <path d="M 70 265 L 185 265 C 210 265 215 245 228 235" fill="none" stroke="#dc2626" stroke-width="18" stroke-linecap="round"/>
  <path d="M 70 265 L 155 265" fill="none" stroke="#fca5a5" stroke-width="3" marker-end="url(#arrowRed)"/>
  <text x="58" y="302" font-family="sans-serif" font-size="15" font-weight="700" fill="#991b1b">Afferent Arteriole</text>
  <text x="58" y="320" font-family="sans-serif" font-size="13" fill="#7f1d1d">(Wider lumen · High P_GC)</text>

  <!-- Efferent Arteriole looping down to vasa recta -->
  <path d="M 295 215 C 330 205 348 182 368 182 C 415 182 435 280 420 430 C 408 560 400 720 475 745 C 535 765 620 715 620 560 L 620 400" fill="none" stroke="#ef4444" stroke-width="9" stroke-linecap="round" opacity="0.65"/>
  <text x="315" y="138" font-family="sans-serif" font-size="14" font-weight="700" fill="#991b1b">Juxtaglomerular Apparatus (JGA)</text>
  <text x="315" y="156" font-family="sans-serif" font-size="12" fill="#475569">Macula Densa + JG Granular Cells</text>

  <!-- Bowman's Capsule (Double-walled C-cup) -->
  <path d="M 328 188 C 295 140 220 140 192 200 C 165 258 205 322 272 315 C 310 310 336 285 348 258" fill="#fef3c7" stroke="#b45309" stroke-width="6"/>
  <path d="M 322 198 C 292 162 232 165 212 212 C 192 256 225 296 272 292 C 304 289 325 270 336 248" fill="#fde68a" stroke="#d97706" stroke-width="2.5"/>

  <!-- Glomerular Capillary Tuft -->
  <g stroke="#b91c1c" stroke-width="7" fill="none" stroke-linecap="round">
    <path d="M 225 230 C 235 190 278 186 286 218 C 294 252 246 270 236 238"/>
    <path d="M 240 212 C 265 198 298 228 272 258 C 250 280 220 248 248 222"/>
    <path d="M 255 202 C 282 208 296 242 262 260"/>
  </g>
  <text x="172" y="348" font-family="sans-serif" font-size="15" font-weight="700" fill="#92400e">Glomerulus &amp; Bowman's Capsule</text>

  <!-- Proximal Convoluted Tubule (PCT) -->
  <path d="M 340 232 C 378 232 388 188 424 196 C 460 204 452 262 490 258 C 526 254 514 198 552 214 C 584 228 548 292 522 332 C 502 362 495 405 495 450" fill="none" stroke="#d97706" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 340 232 C 378 232 388 188 424 196 C 460 204 452 262 490 258 C 526 254 514 198 552 214 C 584 228 548 292 522 332 C 502 362 495 405 495 450" fill="none" stroke="#fef3c7" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="415" y="172" font-family="sans-serif" font-size="15" font-weight="700" fill="#92400e">Proximal Convoluted Tubule (PCT)</text>

  <!-- Loop of Henle (Descending thin + Ascending thin/thick) -->
  <!-- Descending Limb -->
  <path d="M 495 450 L 495 570 C 495 620 505 660 505 715 C 505 775 605 775 605 715 L 605 565" fill="none" stroke="#eab308" stroke-width="16" stroke-linecap="round"/>
  <path d="M 495 450 L 495 570 C 495 620 505 660 505 715 C 505 775 605 775 605 715 L 605 565" fill="none" stroke="#fef9c3" stroke-width="9" stroke-linecap="round"/>
  <!-- Thick Ascending Limb -->
  <path d="M 605 565 L 605 360 C 605 300 580 250 618 222" fill="none" stroke="#ca8a04" stroke-width="22" stroke-linecap="round"/>
  <path d="M 605 565 L 605 360 C 605 300 580 250 618 222" fill="none" stroke="#fef08a" stroke-width="14" stroke-linecap="round"/>
  <text x="435" y="805" font-family="sans-serif" font-size="15" font-weight="700" fill="#854d0e">Loop of Henle (Countercurrent Multiplier)</text>

  <!-- Distal Convoluted Tubule (DCT) -->
  <path d="M 618 222 C 646 200 668 258 702 246 C 736 234 736 184 776 204 C 810 220 795 270 835 256 C 865 246 890 218 925 225" fill="none" stroke="#0284c7" stroke-width="22" stroke-linecap="round"/>
  <path d="M 618 222 C 646 200 668 258 702 246 C 736 234 736 184 776 204 C 810 220 795 270 835 256 C 865 246 890 218 925 225" fill="none" stroke="#e0f2fe" stroke-width="14" stroke-linecap="round"/>
  <text x="665" y="172" font-family="sans-serif" font-size="15" font-weight="700" fill="#075985">Distal Convoluted Tubule (DCT)</text>

  <!-- Collecting Duct -->
  <path d="M 925 140 L 925 810" fill="none" stroke="#0369a1" stroke-width="34" stroke-linecap="round"/>
  <path d="M 925 140 L 925 810" fill="none" stroke="#bae6fd" stroke-width="22" stroke-linecap="round"/>
  <!-- Side Tributary Ducts -->
  <path d="M 942 300 L 1015 268" fill="none" stroke="#0369a1" stroke-width="18" stroke-linecap="round"/>
  <path d="M 942 300 L 1015 268" fill="none" stroke="#bae6fd" stroke-width="10" stroke-linecap="round"/>
  <path d="M 942 520 L 1015 488" fill="none" stroke="#0369a1" stroke-width="18" stroke-linecap="round"/>
  <path d="M 942 520 L 1015 488" fill="none" stroke="#bae6fd" stroke-width="10" stroke-linecap="round"/>
  <path d="M 925 720 L 925 790" fill="none" stroke="#0284c7" stroke-width="4" marker-end="url(#arrowBlue)"/>
  <text x="965" y="160" font-family="sans-serif" font-size="15" font-weight="700" fill="#0c4a6e">Collecting Duct</text>
  <text x="965" y="180" font-family="sans-serif" font-size="13" fill="#0369a1">ADH (AQP2) &amp; Aldosterone</text>
  <text x="848" y="852" font-family="sans-serif" font-size="14" font-weight="700" fill="#0f172a">To Renal Papilla &amp; Minor Calyx (Urine)</text>

  <!-- Legend Box -->
  <rect x="36" y="750" width="320" height="114" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
  <text x="54" y="776" font-family="sans-serif" font-size="14" font-weight="700" fill="#0f172a">Normal Renal Filtration Metrics</text>
  <text x="54" y="800" font-family="sans-serif" font-size="13" fill="#334155">• GFR: ~125 mL/min (180 L/day)</text>
  <text x="54" y="822" font-family="sans-serif" font-size="13" fill="#334155">• PCT Reabsorption: ~65–70% Na⁺ &amp; H₂O</text>
  <text x="54" y="844" font-family="sans-serif" font-size="13" fill="#334155">• Final Urine Output: ~1.5 L/day</text>
`);

/**
 * 2. Gutzeit Apparatus for Arsenic Limit Test (1200x900)
 */
export const GUTZEIT_PLATE_URL = toSvgDataUrl(`
  <rect x="0" y="0" width="1200" height="900" fill="#f8fafc"/>
  <text x="48" y="54" font-family="sans-serif" font-size="24" font-weight="800" fill="#0f172a">GUTZEIT APPARATUS — INDIAN PHARMACOPOEIA ARSENIC LIMIT TEST (BP111P)</text>
  <text x="48" y="80" font-family="sans-serif" font-size="15" fill="#475569">Standardized arsine (AsH₃) gas generation, H₂S scrubbing, and mercuric chloride (HgCl₂) stain comparator assembly</text>

  <!-- Bench surface -->
  <rect x="140" y="790" width="920" height="24" rx="6" fill="#cbd5e1"/>

  <!-- 120 mL Wide-Mouthed Reaction Bottle -->
  <path d="M 475 565 L 475 505 L 605 505 L 605 565 L 650 612 L 650 770 C 650 782 640 790 628 790 L 452 790 C 440 790 430 782 430 770 L 430 612 Z" fill="#ffffff" stroke="#334155" stroke-width="5"/>
  <!-- Liquid level (Stannated HCl + Test/Std + KI) -->
  <path d="M 436 675 L 644 675 L 644 768 C 644 778 636 784 626 784 L 454 784 C 444 784 436 778 436 768 Z" fill="#dbeafe" stroke="#60a5fa" stroke-width="2"/>
  <!-- Granulated Zinc pellets -->
  <polygon points="468,778 486,758 504,778" fill="#64748b"/>
  <polygon points="512,778 532,756 550,778" fill="#475569"/>
  <polygon points="558,778 576,760 598,778" fill="#64748b"/>
  <!-- H2 + AsH3 bubbles -->
  <circle cx="496" cy="730" r="5" fill="#0284c7" opacity="0.7"/>
  <circle cx="535" cy="712" r="6" fill="#0284c7" opacity="0.7"/>
  <circle cx="565" cy="696" r="4.5" fill="#0284c7" opacity="0.7"/>
  <text x="680" y="695" font-family="sans-serif" font-size="16" font-weight="700" fill="#0f172a">120 mL Wide-Mouth Bottle</text>
  <text x="680" y="718" font-family="sans-serif" font-size="14" fill="#475569">Test / 10 ppm As Std + Stannated HCl + 10 g Zn + KI</text>

  <!-- Rubber Bung -->
  <polygon points="482,502 598,502 586,554 494,554" fill="#475569" stroke="#1e293b" stroke-width="3"/>
  <text x="680" y="534" font-family="sans-serif" font-size="15" font-weight="700" fill="#1e293b">Rubber Bung &amp; 2 mm Lateral Vent Hole</text>

  <!-- Vertical Glass Tube (200 mm x 6.5 mm ID) -->
  <rect x="525" y="195" width="30" height="385" fill="#f1f5f9" stroke="#334155" stroke-width="4"/>
  <!-- Lower constricted tip + side hole -->
  <circle cx="540" cy="560" r="4" fill="#0284c7"/>

  <!-- Lead Acetate Cotton Wool Plug -->
  <rect x="528" y="385" width="24" height="88" rx="6" fill="#fde68a" stroke="#b45309" stroke-width="2" stroke-dasharray="4 3"/>
  <text x="680" y="425" font-family="sans-serif" font-size="15" font-weight="700" fill="#92400e">Lead Acetate Cotton Wool Plug</text>
  <text x="680" y="446" font-family="sans-serif" font-size="13" fill="#78350f">Scrubs H₂S gas → black PbS (prevents false stain)</text>

  <!-- Glass Tube Dimension Callout -->
  <line x1="490" y1="195" x2="490" y2="502" stroke="#64748b" stroke-width="2"/>
  <line x1="482" y1="195" x2="498" y2="195" stroke="#64748b" stroke-width="2"/>
  <line x1="482" y1="502" x2="498" y2="502" stroke="#64748b" stroke-width="2"/>
  <text x="275" y="346" font-family="sans-serif" font-size="15" font-weight="700" fill="#334155">200 mm × 6.5 mm ID</text>
  <text x="275" y="366" font-family="sans-serif" font-size="13" fill="#475569">Vertical Delivery Glass Tube</text>

  <!-- Upper Flat-Ground Flange Caps + HgCl2 Paper Disc -->
  <rect x="498" y="180" width="84" height="15" rx="3" fill="#cbd5e1" stroke="#334155" stroke-width="3"/>
  <rect x="498" y="156" width="84" height="15" rx="3" fill="#cbd5e1" stroke="#334155" stroke-width="3"/>
  <!-- HgCl2 Paper Disc sandwiched between flanges -->
  <rect x="492" y="171" width="96" height="9" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
  <!-- Upper short glass chimney -->
  <rect x="525" y="110" width="30" height="46" fill="#f1f5f9" stroke="#334155" stroke-width="4"/>

  <!-- Rubber Band / Spring Clip -->
  <path d="M 488 152 L 488 198 M 592 152 L 592 198" stroke="#0f766e" stroke-width="5" stroke-linecap="round"/>
  <text x="680" y="168" font-family="sans-serif" font-size="15" font-weight="700" fill="#0f766e">HgCl₂ Paper Disc &amp; Flange Clamp</text>
  <text x="680" y="189" font-family="sans-serif" font-size="13" fill="#115e59">AsH₃ + HgCl₂ → Yellow/Brown [As(HgCl)₃] stain</text>

  <!-- Reaction Box -->
  <rect x="48" y="125" width="370" height="145" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
  <text x="66" y="154" font-family="sans-serif" font-size="14" font-weight="700" fill="#0f172a">Key IP Reaction Sequence</text>
  <text x="66" y="182" font-family="monospace" font-size="13" fill="#334155">1. As⁵⁺ + SnCl₂/KI → As³⁺ (Arsenious)</text>
  <text x="66" y="206" font-family="monospace" font-size="13" fill="#334155">2. H₃AsO₃ + 3Zn + 6HCl → AsH₃↑ + 3H₂O</text>
  <text x="66" y="230" font-family="monospace" font-size="13" fill="#334155">3. H₂S + Pb(CH₃COO)₂ → PbS↓ (trapped)</text>
  <text x="66" y="254" font-family="monospace" font-size="13" fill="#b45309">4. AsH₃ + HgCl₂ → Yellow-Brown Stain</text>
`);

/**
 * 3. Acetylsalicylic Acid (Aspirin) Molecular Structure & Synthesis (1200x900)
 */
export const ASPIRIN_PLATE_URL = toSvgDataUrl(`
  <rect x="0" y="0" width="1200" height="900" fill="#ffffff"/>
  <text x="48" y="54" font-family="sans-serif" font-size="24" font-weight="800" fill="#0f172a">ACETYLSALICYLIC ACID (ASPIRIN) — 2D STRUCTURE &amp; FUNCTIONAL GROUPS</text>
  <text x="48" y="80" font-family="sans-serif" font-size="15" fill="#475569">Formula: C₉H₈O₄ · MW: 180.16 g/mol · IUPAC: 2-acetoxybenzoic acid · NSAID / Antiplatelet</text>

  <!-- Main Benzene Ring centered at (480, 440) radius 140 -->
  <polygon points="480,300 601,370 601,510 480,580 359,510 359,370" fill="#f8fafc" stroke="#0f172a" stroke-width="5"/>
  <!-- Aromatic double bonds -->
  <line x1="480" y1="326" x2="578" y2="383" stroke="#0f172a" stroke-width="4.5"/>
  <line x1="578" y1="497" x2="480" y2="554" stroke="#0f172a" stroke-width="4.5"/>
  <line x1="382" y1="497" x2="382" y2="383" stroke="#0f172a" stroke-width="4.5"/>
  <text x="442" y="446" font-family="sans-serif" font-size="15" font-weight="700" fill="#334155">Benzene Ring</text>

  <!-- C1 Carboxylic Acid Group (-COOH) going UP from (480,300) -->
  <rect x="392" y="135" width="230" height="142" rx="14" fill="#eff6ff" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6 4"/>
  <line x1="480" y1="300" x2="480" y2="232" stroke="#0f172a" stroke-width="5"/>
  <text x="469" y="220" font-family="sans-serif" font-size="24" font-weight="800" fill="#1d4ed8">C</text>
  <!-- =O double bond up-left -->
  <line x1="466" y1="196" x2="424" y2="165" stroke="#1d4ed8" stroke-width="4"/>
  <line x1="458" y1="205" x2="416" y2="174" stroke="#1d4ed8" stroke-width="4"/>
  <text x="396" y="168" font-family="sans-serif" font-size="24" font-weight="800" fill="#dc2626">O</text>
  <!-- -OH single bond up-right -->
  <line x1="496" y1="200" x2="545" y2="168" stroke="#1d4ed8" stroke-width="4.5"/>
  <text x="550" y="172" font-family="sans-serif" font-size="24" font-weight="800" fill="#dc2626">OH</text>
  <text x="404" y="266" font-family="sans-serif" font-size="13" font-weight="700" fill="#1e40af">Carboxylic Acid (pKa 3.5)</text>

  <!-- C2 Ester / Acetoxy Group (-OCOCH3) going RIGHT from (601,370) -->
  <rect x="645" y="275" width="325" height="175" rx="14" fill="#ecfdf5" stroke="#10b981" stroke-width="2" stroke-dasharray="6 4"/>
  <line x1="601" y1="370" x2="670" y2="370" stroke="#0f172a" stroke-width="5"/>
  <text x="676" y="378" font-family="sans-serif" font-size="26" font-weight="800" fill="#dc2626">O</text>
  <line x1="704" y1="370" x2="770" y2="370" stroke="#059669" stroke-width="5"/>
  <text x="776" y="378" font-family="sans-serif" font-size="26" font-weight="800" fill="#047857">C</text>
  <!-- =O double bond up -->
  <line x1="782" y1="348" x2="782" y2="305" stroke="#059669" stroke-width="4"/>
  <line x1="794" y1="348" x2="794" y2="305" stroke="#059669" stroke-width="4"/>
  <text x="777" y="298" font-family="sans-serif" font-size="24" font-weight="800" fill="#dc2626">O</text>
  <!-- -CH3 bond right -->
  <line x1="802" y1="370" x2="868" y2="370" stroke="#059669" stroke-width="5"/>
  <text x="874" y="378" font-family="sans-serif" font-size="24" font-weight="800" fill="#0f172a">CH₃</text>
  <text x="665" y="428" font-family="sans-serif" font-size="13" font-weight="700" fill="#065f46">Acetoxy Ester (COX Ser-530 Acetylator)</text>

  <!-- Synthesis Summary Strip at Bottom -->
  <rect x="48" y="675" width="1104" height="175" rx="14" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
  <text x="74" y="710" font-family="sans-serif" font-size="16" font-weight="800" fill="#0f172a">O-Acetylation Synthesis &amp; Hydrolysis Stability</text>
  <text x="74" y="744" font-family="monospace" font-size="15" fill="#1e293b">Salicylic Acid (C₇H₆O₃) + Acetic Anhydride ((CH₃CO)₂O)  ──[H₂SO₄ / H₃PO₄]──▶  Aspirin (C₉H₈O₄) + CH₃COOH</text>
  <text x="74" y="782" font-family="sans-serif" font-size="14" fill="#334155">• Ortho-substitution reduces gastric irritation vs free phenolic -OH of salicylic acid; still inhibits protective COX-1 PGs.</text>
  <text x="74" y="810" font-family="sans-serif" font-size="14" fill="#334155">• Moisture causes ester hydrolysis back to Salicylic Acid + Acetic Acid (vinegar odor) — store in airtight, dry containers.</text>
`);

/**
 * 4. Gram-Positive vs Gram-Negative Bacterial Cell Envelope (1200x900)
 */
export const BACTERIAL_CELL_WALL_PLATE_URL = toSvgDataUrl(`
  <rect x="0" y="0" width="1200" height="900" fill="#f8fafc"/>
  <text x="48" y="54" font-family="sans-serif" font-size="24" font-weight="800" fill="#0f172a">GRAM-POSITIVE vs GRAM-NEGATIVE BACTERIAL CELL WALL ENVELOPE</text>
  <text x="48" y="80" font-family="sans-serif" font-size="15" fill="#475569">Structural basis of Gram staining, endotoxin (Lipid A) toxicity, and β-lactam / glycopeptide antibiotic penetration</text>

  <!-- Left Half: Gram-Positive -->
  <rect x="48" y="110" width="530" height="730" rx="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
  <text x="76" y="148" font-family="sans-serif" font-size="19" font-weight="800" fill="#6d28d9">GRAM-POSITIVE (Retains Crystal Violet)</text>

  <!-- Thick Peptidoglycan Layer -->
  <rect x="86" y="210" width="454" height="220" rx="8" fill="#ede9fe" stroke="#7c3aed" stroke-width="3"/>
  <line x1="86" y1="254" x2="540" y2="254" stroke="#a78bfa" stroke-width="2" stroke-dasharray="12 6"/>
  <line x1="86" y1="298" x2="540" y2="298" stroke="#a78bfa" stroke-width="2" stroke-dasharray="12 6"/>
  <line x1="86" y1="342" x2="540" y2="342" stroke="#a78bfa" stroke-width="2" stroke-dasharray="12 6"/>
  <line x1="86" y1="386" x2="540" y2="386" stroke="#a78bfa" stroke-width="2" stroke-dasharray="12 6"/>
  <text x="115" y="328" font-family="sans-serif" font-size="17" font-weight="800" fill="#5b21b6">Thick Peptidoglycan (20–80 nm, 40+ layers)</text>

  <!-- Teichoic & Lipoteichoic Acid chains -->
  <path d="M 160 182 L 160 460" stroke="#db2777" stroke-width="7" stroke-dasharray="10 6"/>
  <path d="M 460 182 L 460 555" stroke="#be185d" stroke-width="7" stroke-dasharray="10 6"/>
  <text x="176" y="196" font-family="sans-serif" font-size="14" font-weight="700" fill="#be185d">Teichoic &amp; Lipoteichoic Acids</text>

  <!-- Periplasmic narrow zone & Cytoplasmic Membrane -->
  <rect x="86" y="458" width="454" height="45" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
  <text x="180" y="486" font-family="sans-serif" font-size="14" font-weight="700" fill="#92400e">Cytoplasmic Phospholipid Bilayer</text>
  <rect x="86" y="503" width="454" height="295" rx="8" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.5"/>
  <text x="235" y="640" font-family="sans-serif" font-size="16" font-weight="700" fill="#475569">Cytoplasm (70S Ribosomes, Nucleoid)</text>

  <!-- Right Half: Gram-Negative -->
  <rect x="622" y="110" width="530" height="730" rx="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
  <text x="650" y="148" font-family="sans-serif" font-size="19" font-weight="800" fill="#be123c">GRAM-NEGATIVE (Counterstains Safranin Pink)</text>

  <!-- LPS O-antigen & Lipid A Outer Membrane -->
  <path d="M 690 175 L 690 215 M 730 175 L 730 215 M 770 175 L 770 215 M 930 175 L 930 215 M 970 175 L 970 215 M 1010 175 L 1010 215" stroke="#e11d48" stroke-width="5" stroke-linecap="round"/>
  <rect x="660" y="215" width="454" height="58" rx="6" fill="#ffe4e6" stroke="#e11d48" stroke-width="3"/>
  <text x="678" y="250" font-family="sans-serif" font-size="15" font-weight="800" fill="#9f1239">Outer Membrane (LPS / Lipid A Endotoxin)</text>

  <!-- Porin Channel -->
  <rect x="830" y="208" width="60" height="72" rx="10" fill="#0284c7" stroke="#0369a1" stroke-width="3"/>
  <rect x="850" y="208" width="20" height="72" fill="#e0f2fe"/>
  <text x="816" y="196" font-family="sans-serif" font-size="14" font-weight="700" fill="#0369a1">Porin (OmpF/C)</text>

  <!-- Periplasmic Space + Thin Peptidoglycan -->
  <rect x="660" y="273" width="454" height="145" fill="#ecfeff" stroke="#0891b2" stroke-width="2"/>
  <rect x="660" y="330" width="454" height="30" fill="#ddd6fe" stroke="#7c3aed" stroke-width="2.5"/>
  <text x="728" y="314" font-family="sans-serif" font-size="14" font-weight="700" fill="#155e75">Periplasmic Space (β-Lactamase Enzymes)</text>
  <text x="735" y="350" font-family="sans-serif" font-size="14" font-weight="800" fill="#5b21b6">Thin Peptidoglycan (2–7 nm, 1–2 layers)</text>

  <!-- Cytoplasmic Membrane -->
  <rect x="660" y="458" width="454" height="45" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
  <text x="754" y="486" font-family="sans-serif" font-size="14" font-weight="700" fill="#92400e">Inner Cytoplasmic Membrane</text>
  <rect x="660" y="503" width="454" height="295" rx="8" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.5"/>
  <text x="810" y="640" font-family="sans-serif" font-size="16" font-weight="700" fill="#475569">Cytoplasm (70S Ribosomes, Nucleoid)</text>
`);

/**
 * 5. Diuretic Drug Sites of Action Along the Nephron (1200x900)
 */
export const DIURETIC_NEPHRON_PLATE_URL = toSvgDataUrl(`
  <rect x="0" y="0" width="1200" height="900" fill="#f8fafc"/>
  <text x="48" y="54" font-family="sans-serif" font-size="24" font-weight="800" fill="#0f172a">RENAL PHARMACOLOGY — DIURETIC SITES &amp; TRANSPORTER TARGETS</text>
  <text x="48" y="80" font-family="sans-serif" font-size="15" fill="#475569">Segmental tubular inhibition of Na⁺/Cl⁻/HCO₃⁻ reabsorption and resulting K⁺ / Ca²⁺ / acid-base profiles</text>

  <!-- Nephron Schematic Silhouette -->
  <circle cx="210" cy="280" r="62" fill="#fee2e2" stroke="#dc2626" stroke-width="5"/>
  <text x="158" y="286" font-family="sans-serif" font-size="15" font-weight="700" fill="#991b1b">Glomerulus</text>

  <!-- PCT -->
  <path d="M 272 280 L 470 280" fill="none" stroke="#d97706" stroke-width="30" stroke-linecap="round"/>
  <path d="M 272 280 L 470 280" fill="none" stroke="#fef3c7" stroke-width="20" stroke-linecap="round"/>
  <!-- Loop of Henle -->
  <path d="M 470 280 L 470 670 C 470 735 595 735 595 670 L 595 280" fill="none" stroke="#ca8a04" stroke-width="24" stroke-linecap="round"/>
  <path d="M 470 280 L 470 670 C 470 735 595 735 595 670 L 595 280" fill="none" stroke="#fef9c3" stroke-width="14" stroke-linecap="round"/>
  <!-- DCT -->
  <path d="M 595 280 L 840 280" fill="none" stroke="#0284c7" stroke-width="26" stroke-linecap="round"/>
  <path d="M 595 280 L 840 280" fill="none" stroke="#e0f2fe" stroke-width="16" stroke-linecap="round"/>
  <!-- Collecting Duct -->
  <path d="M 880 180 L 880 790" fill="none" stroke="#0369a1" stroke-width="34" stroke-linecap="round"/>
  <path d="M 880 180 L 880 790" fill="none" stroke="#bae6fd" stroke-width="22" stroke-linecap="round"/>

  <!-- Site 1: PCT CA Inhibitors -->
  <rect x="275" y="135" width="235" height="106" rx="12" fill="#fffbeb" stroke="#d97706" stroke-width="2.5"/>
  <text x="292" y="164" font-family="sans-serif" font-size="15" font-weight="800" fill="#92400e">1. CA Inhibitors (PCT)</text>
  <text x="292" y="188" font-family="sans-serif" font-size="13" fill="#78350f">Acetazolamide · Inhibits CA II/IV</text>
  <text x="292" y="210" font-family="sans-serif" font-size="12" fill="#78350f">Weak diuresis · ↑ HCO₃⁻ excretion</text>
  <text x="292" y="228" font-family="sans-serif" font-size="12" fill="#78350f">Uses: Glaucoma, Altitude sickness</text>

  <!-- Site 2: Loop Diuretics (TAL) -->
  <rect x="200" y="455" width="295" height="122" rx="12" fill="#fef2f2" stroke="#dc2626" stroke-width="2.5"/>
  <text x="218" y="484" font-family="sans-serif" font-size="15" font-weight="800" fill="#991b1b">2. Loop Diuretics (Thick Ascending Limb)</text>
  <text x="218" y="508" font-family="sans-serif" font-size="13" fill="#7f1d1d">Furosemide, Bumetanide, Torsemide</text>
  <text x="218" y="530" font-family="sans-serif" font-size="12" fill="#7f1d1d">Blocks NKCC2 (Na⁺-K⁺-2Cl⁻) · High-ceiling (25%)</text>
  <text x="218" y="550" font-family="sans-serif" font-size="12" fill="#7f1d1d">↑ Ca²⁺/Mg²⁺ excretion · Ototoxicity, Hypokalemia</text>

  <!-- Site 3: Thiazides (DCT) -->
  <rect x="575" y="130" width="255" height="110" rx="12" fill="#eff6ff" stroke="#2563eb" stroke-width="2.5"/>
  <text x="592" y="159" font-family="sans-serif" font-size="15" font-weight="800" fill="#1e40af">3. Thiazide Diuretics (Early DCT)</text>
  <text x="592" y="183" font-family="sans-serif" font-size="13" fill="#1e3a8a">Hydrochlorothiazide, Chlorthalidone</text>
  <text x="592" y="205" font-family="sans-serif" font-size="12" fill="#1e3a8a">Blocks NCC (Na⁺-Cl⁻ cotransporter)</text>
  <text x="592" y="225" font-family="sans-serif" font-size="12" fill="#1e3a8a">↓ Ca²⁺ excretion (used in stones &amp; HTN)</text>

  <!-- Site 4: K+ Sparing (Collecting Duct) -->
  <rect x="920" y="425" width="242" height="122" rx="12" fill="#ecfdf5" stroke="#059669" stroke-width="2.5"/>
  <text x="936" y="454" font-family="sans-serif" font-size="15" font-weight="800" fill="#065f46">4. K⁺-Sparing (Collecting Duct)</text>
  <text x="936" y="478" font-family="sans-serif" font-size="13" fill="#064e3b">Spironolactone (MR Antagonist)</text>
  <text x="936" y="500" font-family="sans-serif" font-size="13" fill="#064e3b">Amiloride / Triamterene (ENaC)</text>
  <text x="936" y="524" font-family="sans-serif" font-size="12" fill="#064e3b">Retains K⁺ · Risk: Hyperkalemia</text>
`);
