import { Provider3DMeta } from './types';
import { Provider3DId } from '../types';

export const PROVIDER_3D_REGISTRY: Provider3DMeta[] = [
  {
    id: 'human_atlas_3d',
    name: 'NIH / HuBMAP Human Reference Atlas',
    shortName: 'Human Atlas (GLB)',
    websiteUrl: 'https://humanatlas.io',
    policySummary:
      '81 official Visible Human anatomical organ GLB models (CC BY 4.0). No auth needed; 1-click direct CORS import.',
    supportsLiveApi: true,
    authRequirement: 'none',
    corsSupport: 'full_cors',
    supportedFormats: ['glb'],
    domainsCovered: ['Anatomical structures & organs', 'Human body systems']
  },
  {
    id: 'pubchem_3d',
    name: 'NCBI PubChem 3D Conformers',
    shortName: 'PubChem 3D',
    websiteUrl: 'https://pubchem.ncbi.nlm.nih.gov',
    policySummary:
      'Public Domain NIH chemical repository. No auth needed; 1-click CORS import of 3D drug molecules (.sdf).',
    supportsLiveApi: true,
    authRequirement: 'none',
    corsSupport: 'full_cors',
    supportedFormats: ['sdf'],
    domainsCovered: ['Drug molecules & chemical structures']
  },
  {
    id: 'rcsb_pdb',
    name: 'RCSB Protein Data Bank (PDB)',
    shortName: 'RCSB PDB',
    websiteUrl: 'https://www.rcsb.org',
    policySummary:
      'CC0 1.0 macromolecular archive. No auth needed; 1-click CORS import of proteins, enzymes, receptors & DNA (.pdb).',
    supportsLiveApi: true,
    authRequirement: 'none',
    corsSupport: 'full_cors',
    supportedFormats: ['pdb'],
    domainsCovered: ['Proteins, enzymes, receptors & nucleic acids']
  },
  {
    id: 'wikimedia_3d',
    name: 'Wikimedia Commons 3D Archive',
    shortName: 'Wikimedia 3D',
    websiteUrl: 'https://commons.wikimedia.org',
    policySummary:
      'CORS-open repository (BodyParts3D, bones, molecules, fossils, instruments) with CC/PD metadata. Direct import <= 45 MB.',
    supportsLiveApi: true,
    authRequirement: 'none',
    corsSupport: 'full_cors',
    supportedFormats: ['stl', 'glb', 'obj', 'ply'],
    domainsCovered: ['Anatomy', 'Molecules', 'Botanical', 'Instruments']
  },
  {
    id: 'smithsonian_3d',
    name: 'Smithsonian Open Access 3D (CC0)',
    shortName: 'Smithsonian 3D',
    websiteUrl: 'https://3d.si.edu',
    policySummary:
      'CC0 specimens & medical history objects. Uses public DEMO_KEY (strict rate limit); direct GLB via 3d-api.si.edu when indexed.',
    supportsLiveApi: true,
    authRequirement: 'demo_key_rate_limited',
    corsSupport: 'full_cors',
    supportedFormats: ['glb'],
    domainsCovered: ['Medical artifacts', 'Anatomical & biological specimens']
  },
  {
    id: 'sketchfab_public',
    name: 'Sketchfab Public Downloadable 3D Catalog',
    shortName: 'Sketchfab',
    websiteUrl: 'https://sketchfab.com',
    policySummary:
      'Live v3 search & interactive 3D embed preview without key. File downloads require Sketchfab sign-in; download .GLB/.ZIP and upload locally.',
    supportsLiveApi: true,
    authRequirement: 'oauth_download',
    corsSupport: 'search_only_cors',
    supportedFormats: ['glb', 'gltf', 'zip'],
    domainsCovered: [
      'Organs & cells',
      'Microorganisms',
      'Medicinal plants',
      'Lab & industrial equipment',
      'Medical devices'
    ]
  },
  {
    id: 'nih_3d_portal',
    name: 'NIH 3D Biomedical & Molecular Exchange',
    shortName: 'NIH 3D Portal',
    websiteUrl: 'https://3d.nih.gov',
    policySummary:
      'External portal only (3d.nih.gov exposes no public unauthenticated REST search API). Browse externally and upload .GLB/.STL/.ZIP here.',
    supportsLiveApi: false,
    authRequirement: 'portal_only',
    corsSupport: 'no_api',
    supportedFormats: ['glb', 'stl', 'obj', 'zip'],
    domainsCovered: ['Biomedical models', 'Microorganisms', 'Medical devices', 'Labware']
  }
];

export const PROVIDER_3D_BY_ID: Record<Provider3DId, Provider3DMeta> =
  PROVIDER_3D_REGISTRY.reduce(
    (acc, meta) => {
      acc[meta.id] = meta;
      return acc;
    },
    {} as Record<Provider3DId, Provider3DMeta>
  );
