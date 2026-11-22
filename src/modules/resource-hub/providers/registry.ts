import { ProviderCapabilities, ResourceProviderId } from '../types';

export const PROVIDER_REGISTRY: ProviderCapabilities[] = [
  {
    id: 'europepmc',
    name: 'Europe PMC',
    shortName: 'Europe PMC',
    description:
      'Open biomedical and life-science literature database with full abstracts, ORCID author links, DOI/PMCID indexing, and open-access full-text pointers.',
    baseDomain: 'www.ebi.ac.uk/europepmc',
    supportedTypes: ['research_paper', 'review_article', 'medical_reference'],
    corsSearchSupported: true,
    directBrowserPdfImportNote:
      'Metadata and full abstracts load directly over CORS. External PDF links open in a new tab or can be uploaded manually if the remote PDF server restricts cross-origin fetch.',
    defaultEnabled: true,
    requiresApiKey: false
  },
  {
    id: 'pubmed',
    name: 'PubMed (NCBI)',
    shortName: 'PubMed',
    description:
      'National Library of Medicine MEDLINE database of peer-reviewed biomedical research articles, pharmacology trials, and review abstracts.',
    baseDomain: 'eutils.ncbi.nlm.nih.gov',
    supportedTypes: ['research_paper', 'review_article', 'medical_reference'],
    corsSearchSupported: true,
    directBrowserPdfImportNote:
      'Abstracts and PubMed metadata load live via NCBI E-utilities JSON/XML. Full-text PDFs are linked externally via PMC or publisher DOI when available.',
    defaultEnabled: true,
    requiresApiKey: false
  },
  {
    id: 'pmc',
    name: 'PubMed Central (PMC)',
    shortName: 'PMC',
    description:
      'Free full-text archive of biomedical and pharmaceutical journal literature at the U.S. National Library of Medicine.',
    baseDomain: 'pmc.ncbi.nlm.nih.gov',
    supportedTypes: ['research_paper', 'review_article'],
    corsSearchSupported: true,
    directBrowserPdfImportNote:
      'Full-text article links open on PMC directly. Remote PMC PDF endpoints restrict cross-origin byte download; download from PMC and drop the PDF into the Import Manager to index locally.',
    defaultEnabled: true,
    requiresApiKey: false
  },
  {
    id: 'ncbi_bookshelf',
    name: 'NCBI Bookshelf',
    shortName: 'NCBI Bookshelf',
    description:
      'Free online biomedical reference books, clinical manuals (StatPearls), and academic textbook chapters maintained by NCBI.',
    baseDomain: 'www.ncbi.nlm.nih.gov/books',
    supportedTypes: ['textbook', 'medical_reference', 'educational_material'],
    corsSearchSupported: true,
    directBrowserPdfImportNote:
      'Chapter citations and stable NBK links load live via NCBI E-utilities; full chapters read cleanly on NCBI Bookshelf and save as structured references.',
    defaultEnabled: true,
    requiresApiKey: false
  },
  {
    id: 'openstax',
    name: 'OpenStax',
    shortName: 'OpenStax',
    description:
      'Peer-reviewed, openly licensed (CC BY 4.0) college textbooks including Anatomy & Physiology 2e, Biology 2e, Chemistry 2e, and Microbiology.',
    baseDomain: 'openstax.org',
    supportedTypes: ['textbook', 'educational_material', 'anatomical_diagram'],
    corsSearchSupported: true,
    directBrowserPdfImportNote:
      'Official textbook catalog searches live via OpenStax CMS API. Official PDF download links open directly from assets.openstax.org (too large / CORS-restricted for background fetch; drop downloaded PDF into Knowledge Library).',
    defaultEnabled: true,
    requiresApiKey: false
  },
  {
    id: 'wikimedia',
    name: 'Wikimedia Commons',
    shortName: 'Wikimedia',
    description:
      'Open-licensed anatomical illustrations, microscopy slides, histology micrographs, and laboratory apparatus figures with explicit Creative Commons metadata.',
    baseDomain: 'commons.wikimedia.org',
    supportedTypes: ['anatomical_diagram', 'histology_image', 'scientific_illustration'],
    corsSearchSupported: true,
    directBrowserPdfImportNote:
      'Direct one-click import into PharmaLab Visual Library (IndexedDB) with creator attribution and license preservation.',
    defaultEnabled: true,
    requiresApiKey: false
  },
  {
    id: 'pubchem',
    name: 'PubChem (NIH)',
    shortName: 'PubChem',
    description:
      'Public-domain 2D chemical structures, IUPAC names, molecular formulas, and compound records maintained by NIH / NCBI.',
    baseDomain: 'pubchem.ncbi.nlm.nih.gov',
    supportedTypes: ['scientific_illustration', 'medical_reference'],
    corsSearchSupported: true,
    directBrowserPdfImportNote:
      '2D PNG compound diagrams import directly into PharmaLab Visual Library as Public Domain chemistry assets.',
    defaultEnabled: true,
    requiresApiKey: false
  },
  {
    id: 'gbif',
    name: 'GBIF Botanical',
    shortName: 'GBIF',
    description:
      'Open biodiversity herbarium plates and medicinal plant specimen photography aligned with BP105T Pharmacognosy.',
    baseDomain: 'api.gbif.org',
    supportedTypes: ['scientific_illustration'],
    corsSearchSupported: true,
    directBrowserPdfImportNote:
      'Medicinal plant photography imports directly into PharmaLab Visual Library when CC/PD licensed.',
    defaultEnabled: false,
    requiresApiKey: false
  }
];

export const PROVIDER_BY_ID: Record<ResourceProviderId, ProviderCapabilities> =
  PROVIDER_REGISTRY.reduce(
    (acc, item) => {
      acc[item.id] = item;
      return acc;
    },
    {} as Record<ResourceProviderId, ProviderCapabilities>
  );

export function getDefaultEnabledProviders(): Record<ResourceProviderId, boolean> {
  return PROVIDER_REGISTRY.reduce(
    (acc, item) => {
      acc[item.id] = item.defaultEnabled;
      return acc;
    },
    {} as Record<ResourceProviderId, boolean>
  );
}
