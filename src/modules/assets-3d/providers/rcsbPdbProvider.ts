import { Discovered3DCandidate } from '../types';
import { PROVIDER_3D_BY_ID } from './registry';
import { Asset3DProviderAdapter, ProviderSearchParams, ProviderSearchResult } from './types';
import { computeQueryRelevance } from './utils';

export async function searchRcsbPdb3D(
  params: ProviderSearchParams
): Promise<ProviderSearchResult> {
  const { query, limit = 6, signal } = params;
  const clean = query.trim();

  const searchPayload = {
    query: {
      type: 'terminal',
      service: 'full_text',
      parameters: { value: clean }
    },
    return_type: 'entry',
    request_options: {
      paginate: { start: 0, rows: limit }
    }
  };

  const searchRes = await fetch(
    `https://search.rcsb.org/rcsbsearch/v2/query?json=${encodeURIComponent(
      JSON.stringify(searchPayload)
    )}`,
    { signal }
  );

  if (searchRes.status === 204) {
    return { candidates: [] };
  }
  if (!searchRes.ok) {
    throw new Error(`RCSB PDB search returned HTTP ${searchRes.status}.`);
  }

  const searchJson = await searchRes.json();
  const hits: Array<{ identifier?: string; score?: number }> = Array.isArray(searchJson?.result_set)
    ? searchJson.result_set
    : [];

  const candidates: Discovered3DCandidate[] = [];
  await Promise.all(
    hits.slice(0, limit).map(async (hit) => {
      const pdbId = hit.identifier?.trim();
      if (!pdbId) return;
      try {
        const entryRes = await fetch(`https://data.rcsb.org/rest/v1/core/entry/${pdbId}`, {
          signal
        });
        if (!entryRes.ok) return;
        const entry = await entryRes.json();
        const rawTitle = entry?.struct?.title || `PDB Structure ${pdbId}`;
        const method = entry?.exptl?.[0]?.method || 'Experimental Structure';
        const resAng = entry?.rcsb_entry_info?.resolution_combined?.[0];
        const atomCount = entry?.rcsb_entry_info?.deposited_atom_count;
        const releaseDate = entry?.rcsb_accession_info?.initial_release_date?.slice(0, 10);
        const authors = Array.isArray(entry?.audit_author)
          ? entry.audit_author
              .slice(0, 2)
              .map((a: { name?: string }) => a.name)
              .filter(Boolean)
              .join(', ')
          : 'RCSB PDB Contributors';

        const title = `${pdbId}: ${rawTitle}`;
        candidates.push({
          id: `rcsb_${pdbId}`,
          providerId: 'rcsb_pdb',
          providerName: 'RCSB Protein Data Bank',
          title,
          description: `${method}${resAng ? ` · ${resAng.toFixed(2)} Å resolution` : ''}${
            atomCount ? ` · ${atomCount.toLocaleString()} atoms` : ''
          }. Macromolecular 3D atomic coordinate file.`,
          previewUrl: `https://cdn.rcsb.org/images/structures/${pdbId.toLowerCase()}_assembly-1.jpeg`,
          creator: authors || `RCSB PDB (${pdbId})`,
          sourceUrl: `https://www.rcsb.org/structure/${pdbId}`,
          directFileUrl: `https://files.rcsb.org/download/${pdbId}.pdb`,
          format: 'pdb',
          license: 'CC0 1.0 Public Domain (PDB Archive)',
          attribution: `RCSB Protein Data Bank ID ${pdbId}`,
          usageRestrictions: 'CC0 open macromolecular structural biology data.',
          downloadPolicy: 'direct_cors',
          downloadNotice: '1-click direct .PDB macromolecule import (CORS-open RCSB archive).',
          suggestedCategory: 'molecule',
          suggestedDepartment: 'biotechnology',
          vertexCount: typeof atomCount === 'number' ? atomCount : undefined,
          relevanceScore:
            (hit.score ? hit.score * 10 : 0) +
            computeQueryRelevance(clean, [{ text: title, weight: 3 }]),
          publishedAt: releaseDate,
          tags: ['RCSB PDB', 'Protein / Receptor', pdbId]
        });
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') throw err;
        // Ignore individual entry lookup miss
      }
    })
  );

  candidates.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  return { candidates };
}

export const rcsbPdbProvider: Asset3DProviderAdapter = {
  meta: PROVIDER_3D_BY_ID.rcsb_pdb,
  search: searchRcsbPdb3D
};
