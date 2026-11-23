import { Discovered3DCandidate } from '../types';
import { PROVIDER_3D_BY_ID } from './registry';
import { Asset3DProviderAdapter, ProviderSearchParams, ProviderSearchResult } from './types';
import { computeQueryRelevance } from './utils';

export async function searchPubChem3D(
  params: ProviderSearchParams
): Promise<ProviderSearchResult> {
  const { query, limit = 8, signal } = params;
  const clean = query.trim();
  const namesToTry = new Set<string>([clean]);

  try {
    const autoRes = await fetch(
      `https://pubchem.ncbi.nlm.nih.gov/rest/autocomplete/compound/${encodeURIComponent(
        clean
      )}/json?limit=6`,
      { signal }
    );
    if (autoRes.ok) {
      const autoJson = await autoRes.json();
      const terms: string[] = autoJson?.dictionary_terms?.compound || [];
      terms.slice(0, 6).forEach((t) => namesToTry.add(t));
    }
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    // Fallback to direct compound name query
  }

  const cidsSeen = new Set<number>();
  const candidates: Discovered3DCandidate[] = [];

  await Promise.all(
    Array.from(namesToTry)
      .slice(0, 6)
      .map(async (term) => {
        try {
          const propUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(
            term
          )}/property/Title,MolecularFormula,MolecularWeight,IUPACName/JSON`;
          const res = await fetch(propUrl, { signal });
          if (!res.ok) return;
          const json = await res.json();
          const props = json?.PropertyTable?.Properties || [];
          for (const p of props.slice(0, 2) as Array<{
            CID?: number;
            Title?: string;
            MolecularFormula?: string;
            MolecularWeight?: string;
            IUPACName?: string;
          }>) {
            if (!p.CID || cidsSeen.has(p.CID)) continue;
            cidsSeen.add(p.CID);
            const title = p.Title || term;
            const fullTitle = `${title} (${p.MolecularFormula || '3D Conformer'})`;
            candidates.push({
              id: `pubchem_${p.CID}`,
              providerId: 'pubchem_3d',
              providerName: 'NCBI PubChem 3D',
              title: fullTitle,
              description: `${p.IUPACName ? `IUPAC: ${p.IUPACName}. ` : ''}${
                p.MolecularWeight ? `MW: ${p.MolecularWeight} g/mol.` : ''
              } Real 3D atomic conformer coordinates (.SDF) from NCBI PubChem.`,
              previewUrl: `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${p.CID}/PNG?image_size=300x300`,
              creator: `PubChem CID ${p.CID} (NCBI/NIH)`,
              sourceUrl: `https://pubchem.ncbi.nlm.nih.gov/compound/${p.CID}`,
              directFileUrl: `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${p.CID}/SDF?record_type=3d`,
              format: 'sdf',
              license: 'Public Domain (NCBI / U.S. Government)',
              attribution: `NCBI PubChem Compound CID ${p.CID}`,
              usageRestrictions:
                'Public domain chemical data. Note: very large polymers, mixtures, or inorganic salts may lack a computed 3D SDF conformer.',
              downloadPolicy: 'direct_cors',
              downloadNotice:
                '1-click direct 3D conformer (.SDF) import & CPK ball-and-stick 3D preview.',
              suggestedCategory: 'molecule',
              suggestedDepartment: 'pharmaceutical_chemistry',
              relevanceScore: computeQueryRelevance(clean, [
                { text: title, weight: 5 },
                { text: p.IUPACName, weight: 2 },
                { text: p.MolecularFormula, weight: 2 }
              ]),
              tags: ['PubChem 3D', 'SDF', p.MolecularFormula || 'Molecule'].filter(Boolean)
            });
          }
        } catch (err) {
          if ((err as Error)?.name === 'AbortError') throw err;
          // Ignore individual compound miss
        }
      })
  );

  candidates.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  return { candidates: candidates.slice(0, limit) };
}

export const pubchem3dProvider: Asset3DProviderAdapter = {
  meta: PROVIDER_3D_BY_ID.pubchem_3d,
  search: searchPubChem3D
};
