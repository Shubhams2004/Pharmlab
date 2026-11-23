import { Asset3DCategory, BPharmDepartmentId, ModelFormat } from '../types';

export const MAX_DIRECT_IMPORT_BYTES = 45 * 1024 * 1024; // 45 MB browser IndexedDB safety cap
export const LARGE_ASSET_WARNING_BYTES = 18 * 1024 * 1024; // 18 MB mobile/memory warning threshold
export const SAFE_AUTO_PREVIEW_BYTES = 8 * 1024 * 1024; // 8 MB automatic pre-import WebGL preview cap

export const SUPPORTED_IMPORT_FORMATS: ModelFormat[] = [
  'glb',
  'gltf',
  'stl',
  'obj',
  'ply',
  'zip',
  'pdb',
  'sdf',
  'mol'
];

export function isSupportedModelFormat(fmt?: string | null): fmt is ModelFormat {
  if (!fmt) return false;
  return SUPPORTED_IMPORT_FORMATS.includes(fmt.toLowerCase() as ModelFormat);
}

export function stripHtml(raw: string | undefined | null): string {
  if (!raw) return '';
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function sniffFormatFromBytes(buffer: ArrayBuffer): ModelFormat | null {
  const bytes = new Uint8Array(buffer.slice(0, 768));
  // glTF binary magic 'glTF' (0x67 0x6C 0x54 0x46)
  if (bytes.length >= 4 && bytes[0] === 0x67 && bytes[1] === 0x6c && bytes[2] === 0x54 && bytes[3] === 0x46) {
    return 'glb';
  }
  // ZIP magic 'PK\x03\x04'
  if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
    return 'zip';
  }
  const headText = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  const trimmed = headText.trimStart();
  if (trimmed.startsWith('{') && headText.includes('"asset"')) return 'gltf';
  if (trimmed.startsWith('ply')) return 'ply';
  if (/^(HEADER|ATOM\s|HETATM|COMPND|TITLE\s|REMARK\s)/m.test(headText)) return 'pdb';
  if (headText.includes('V2000') || headText.includes('V3000')) return 'sdf';
  if (trimmed.startsWith('solid ')) return 'stl';
  return null;
}

export function inferScientificCategoryAndDept(
  text: string,
  fallbackCategory: Asset3DCategory = 'anatomy',
  fallbackDept: BPharmDepartmentId = 'anatomy'
): { category: Asset3DCategory; department: BPharmDepartmentId } {
  const hay = text.toLowerCase();

  if (
    /\b(tablet press|granulator|fluid bed|autoclave reactor|fermenter|bioreactor|mixer|compressor|filling machine|rotary press|industrial|manufacturing|homogenizer|coating pan)\b/.test(
      hay
    )
  ) {
    return { category: 'industrial_machinery', department: 'industrial_pharmacy' };
  }

  if (
    /\b(tablet|capsule|suppository|liposome|nanoparticle|emulsion|micelle|inhaler|syringe|stent|pacemaker|prosthesis|heart valve|catheter|medical device|dosage form)\b/.test(
      hay
    )
  ) {
    return {
      category: /\b(tablet|capsule|suppository|liposome|nanoparticle|emulsion|micelle)\b/.test(hay)
        ? 'formulation'
        : 'instrument',
      department: /\b(pacemaker|stent|valve|catheter|prosthesis|syringe|device)\b/.test(hay)
        ? 'clinical_pharmacy'
        : 'pharmaceutics'
    };
  }

  if (
    /\b(hplc|spectrophotometer|chromatograph|microscope|centrifuge|viscometer|balance|titration|ph meter|dissolution|oscilloscope|analyzer)\b/.test(
      hay
    )
  ) {
    return { category: 'instrument', department: 'pharmaceutical_analysis' };
  }

  if (
    /\b(beaker|flask|burette|pipette|condenser|soxhlet|clevenger|apparatus|retort|crucible|funnel|distillation|glassware|test tube)\b/.test(
      hay
    )
  ) {
    return { category: 'apparatus', department: 'pharmaceutics' };
  }

  if (
    /\b(bacteria|virus|bacteriophage|fungi|yeast|ecoli|e\. coli|staphylococcus|streptococcus|microbe|microorganism|cell|organelle|mitochondria|nucleus|neuron|erythrocyte|leukocyte|eukaryotic|prokaryotic|plasmid|ribosome)\b/.test(
      hay
    )
  ) {
    return { category: 'microorganism', department: 'microbiology' };
  }

  if (
    /\b(plant|botanical|leaf|flower|root|bark|seed|herb|medicinal|flora|aloe|cinchona|digitalis|withania|curcuma|ginger|tree|fern|moss|stoma|stomata)\b/.test(
      hay
    )
  ) {
    return { category: 'medicinal_plant', department: 'pharmacognosy' };
  }

  if (
    /\b(molecule|chemical|compound|atom|bond|dna|rna|protein|enzyme|receptor|helix|ligand|crystal|polymer|benzene|aspirin|caffeine|paracetamol|insulin|hemoglobin)\b/.test(
      hay
    )
  ) {
    return { category: 'molecule', department: 'pharmaceutical_chemistry' };
  }

  if (
    /\b(heart|brain|kidney|liver|lung|stomach|spleen|pancreas|intestine|gallbladder|bladder|thyroid|uterus|ovary|prostate|thymus|eye|ear|larynx|trachea|organ)\b/.test(
      hay
    )
  ) {
    return { category: 'organ', department: 'anatomy' };
  }

  if (
    /\b(skull|bone|femur|sternum|rib|vertebra|pelvis|joint|muscle|nerve|vessel|artery|vein|anatomy|skeleton|bodyparts3d|tissue|cartilage)\b/.test(
      hay
    )
  ) {
    return { category: 'anatomy', department: 'anatomy' };
  }

  return { category: fallbackCategory, department: fallbackDept };
}

export function computeQueryRelevance(
  query: string,
  fields: Array<{ text?: string; weight: number }>
): number {
  const clean = query.trim().toLowerCase();
  if (!clean) return 0;
  const tokens = clean.split(/[\s,/-]+/).filter((t) => t.length >= 2);
  let score = 0;

  for (const field of fields) {
    const val = (field.text || '').toLowerCase();
    if (!val) continue;
    if (val === clean) score += field.weight * 4;
    else if (val.includes(clean)) score += field.weight * 2.5;
    for (const tok of tokens) {
      if (val.includes(tok)) score += field.weight;
    }
  }
  return Math.round(score * 10) / 10;
}
