import {
  CustomCollection,
  PharmacopoeiaProfileMeta,
  PharmacopoeiaSectionKey,
  ReferenceItem
} from './types';

export const PHARMACOPOEIA_SECTIONS: Array<{
  key: PharmacopoeiaSectionKey;
  label: string;
  description: string;
}> = [
  {
    key: 'general_notices',
    label: 'General Notices',
    description: 'Interpretive rules, conventions, units, storage definitions, and official compliance clauses.'
  },
  {
    key: 'general_chapters',
    label: 'General Chapters',
    description: 'Cross-monograph physical, chemical, biological, and instrumental test chapters.'
  },
  {
    key: 'monographs',
    label: 'Monographs',
    description: 'Index of official substance and dosage-form monographs from your authorized edition or portal.'
  },
  {
    key: 'drug_substances',
    label: 'Drug Substances (APIs)',
    description: 'Active pharmaceutical ingredients, nomenclature, molecular descriptors, and identity criteria.'
  },
  {
    key: 'pharmaceutical_preparations',
    label: 'Pharmaceutical Preparations',
    description: 'Finished dosage form monographs (tablets, capsules, injections, solutions, semisolids).'
  },
  {
    key: 'identification_tests',
    label: 'Identification Tests',
    description: 'IR, UV, chromatographic retention, and wet-chemical identification procedures.'
  },
  {
    key: 'assays',
    label: 'Assays',
    description: 'Volumetric, spectrophotometric, and chromatographic potency determination methods.'
  },
  {
    key: 'impurity_testing',
    label: 'Impurity Testing',
    description: 'Related substances, limit tests (As, Cl⁻, SO₄²⁻, Fe, heavy metals), and residual solvents.'
  },
  {
    key: 'specifications',
    label: 'Specifications',
    description: 'Acceptance criteria, dissolution tolerances, weight variation, and sterility/microbial limits.'
  },
  {
    key: 'reagents',
    label: 'Reagents',
    description: 'Volumetric solutions, indicators, buffer preparations, and reagent grade requirements.'
  },
  {
    key: 'reference_standards',
    label: 'Reference Standards',
    description: 'Certified primary and secondary compendial reference standard materials.'
  },
  {
    key: 'analytical_procedures',
    label: 'Analytical Procedures',
    description: 'Chromatography, dissolution apparatus, titrimetry, and validation method procedures.'
  }
];

const SEED_TS = 1732200000000;

export const INITIAL_CUSTOM_COLLECTIONS: CustomCollection[] = [
  {
    id: 'col_bpharm_sem1',
    name: 'B.Pharm Semester 1',
    description: 'Core BP101T–BP111P textbooks, standards, and practical bench references.',
    createdAt: SEED_TS,
    isDefault: true
  },
  {
    id: 'col_anatomy_exam',
    name: 'Anatomy Examination',
    description: 'Tortora, Ross & Wilson, Guyton, Sembulingam, and cardiovascular/hematology guides.',
    createdAt: SEED_TS + 1,
    isDefault: true
  },
  {
    id: 'col_pharm_analysis',
    name: 'Pharmaceutical Analysis',
    description: 'Volumetric assays, limit tests, Beckett & Stenlake, Vogel, and ICH analytical validation.',
    createdAt: SEED_TS + 2,
    isDefault: true
  },
  {
    id: 'col_drug_standards',
    name: 'Drug Standards',
    description: 'Pharmacopoeial profiles (IP, BP, USP-NF, Ph. Eur., WHO Ph. Int.) and GMP/GLP standards.',
    createdAt: SEED_TS + 3,
    isDefault: true
  },
  {
    id: 'col_research_project',
    name: 'Research Project',
    description: 'Saved peer-reviewed publications and linked pharmaceutical topic literature.',
    createdAt: SEED_TS + 4,
    isDefault: true
  }
];

export const INITIAL_PHARMACOPOEIA_PROFILES: PharmacopoeiaProfileMeta[] = [
  { referenceId: 'pharma_ip', code: 'IP', sectionLinks: [] },
  { referenceId: 'pharma_bp', code: 'BP', sectionLinks: [] },
  { referenceId: 'pharma_usp_nf', code: 'USP-NF', sectionLinks: [] },
  { referenceId: 'pharma_eur', code: 'Ph. Eur.', sectionLinks: [] },
  { referenceId: 'pharma_who_int', code: 'Ph. Int.', sectionLinks: [] }
];

export const INITIAL_REFERENCE_CATALOG: ReferenceItem[] = [
  // =========================================================================
  // 1. PHARMACOPOEIAS (5 Dedicated Official Profiles — No Fabricated Editions)
  // =========================================================================
  {
    id: 'pharma_ip',
    collectionType: 'pharmacopoeia',
    title: 'Indian Pharmacopoeia (IP)',
    shortTitle: 'IP',
    issuingAuthority: 'Indian Pharmacopoeia Commission (IPC), Ministry of Health & Family Welfare, Govt. of India',
    edition: 'Verify current edition on IPC portal or record your licensed edition',
    volumes: 'Multi-volume official compendium (record owned volumes in profile)',
    subject: 'Official Drug Standards & Pharmaceutical Analysis',
    description:
      'Official book of standards for drugs manufactured, sold, and consumed in India under the Drugs and Cosmetics Act. Attach an authorized PDF copy locally or open the official IPC portal.',
    sourceName: 'Indian Pharmacopoeia Commission (IPC)',
    accessStatus: 'licensed_external',
    licenseInfo: 'Official Commission publication; subscription/print license required unless accessing authorized copy.',
    externalUrl: 'https://www.ipc.gov.in',
    tags: ['IP', 'IPC', 'Official Standards', 'India', 'Monographs', 'Assays', 'Limit Tests'],
    bookmarked: false,
    customCollectionIds: ['col_drug_standards', 'col_bpharm_sem1'],
    academicConnections: [
      {
        id: 'conn_ip_inorg',
        entityType: 'experiment',
        label: 'BP111P IP Limit Tests & Inorganic Assays',
        departmentId: 'inorganic',
        topicId: 'topic_inorganic_limit_tests'
      },
      {
        id: 'conn_ip_pharm',
        entityType: 'experiment',
        label: 'BP107P Official IP Compounding Formulations',
        departmentId: 'general_pharmacy',
        topicId: 'topic_pharmaceutics_dosage_forms'
      }
    ],
    isSystemCatalog: true,
    createdAt: SEED_TS,
    updatedAt: SEED_TS,
    lastOpenedAt: null
  },
  {
    id: 'pharma_bp',
    collectionType: 'pharmacopoeia',
    title: 'British Pharmacopoeia (BP)',
    shortTitle: 'BP',
    issuingAuthority: 'British Pharmacopoeia Commission / Medicines and Healthcare products Regulatory Agency (MHRA)',
    edition: 'Verify active annual edition on pharmacopoeia.com or record your copy',
    volumes: 'Volumes I–V + Veterinary & Supplementary Chapters (record owned volumes)',
    subject: 'Official Drug Standards & Quality Control',
    description:
      'UK official quality standards for medicinal substances, formulated preparations, herbal drugs, and blood products. Requires authorized subscription or institution access.',
    sourceName: 'British Pharmacopoeia Commission (MHRA)',
    accessStatus: 'licensed_external',
    licenseInfo: 'Crown Copyright / TSO & MHRA subscription required for full monographs.',
    externalUrl: 'https://www.pharmacopoeia.com',
    tags: ['BP', 'MHRA', 'UK', 'Monographs', 'Analytical Procedures'],
    bookmarked: false,
    customCollectionIds: ['col_drug_standards', 'col_pharm_analysis'],
    academicConnections: [
      {
        id: 'conn_bp_analysis',
        entityType: 'topic',
        label: 'Volumetric Titrimetry & Assay Validation',
        departmentId: 'pharm_analysis',
        topicId: 'topic_analysis_volumetric'
      }
    ],
    isSystemCatalog: true,
    createdAt: SEED_TS + 1,
    updatedAt: SEED_TS + 1,
    lastOpenedAt: null
  },
  {
    id: 'pharma_usp_nf',
    collectionType: 'pharmacopoeia',
    title: 'United States Pharmacopeia–National Formulary (USP–NF)',
    shortTitle: 'USP–NF',
    issuingAuthority: 'United States Pharmacopeial Convention (USP)',
    edition: 'Continuous online publication (verify effective date on uspnf.com)',
    volumes: 'USP Drug Monographs, NF Excipients & General Chapters (<1>–<2000+>)',
    subject: 'Official Drug & Excipient Standards',
    description:
      'Compendial standards for prescription and OTC medicines, dietary supplements, and excipients. Official access is provided via USP–NF Online subscription.',
    sourceName: 'United States Pharmacopeial Convention',
    accessStatus: 'licensed_external',
    licenseInfo: 'Copyrighted USP–NF standard; institutional or individual USP subscription required.',
    externalUrl: 'https://www.uspnf.com',
    tags: ['USP', 'NF', 'General Chapters', 'Excipients', 'Dissolution', 'Assays'],
    bookmarked: false,
    customCollectionIds: ['col_drug_standards', 'col_pharm_analysis'],
    academicConnections: [
      {
        id: 'conn_usp_analysis',
        entityType: 'topic',
        label: 'Volumetric Titrimetry & Assay Validation',
        departmentId: 'pharm_analysis',
        topicId: 'topic_analysis_volumetric'
      }
    ],
    isSystemCatalog: true,
    createdAt: SEED_TS + 2,
    updatedAt: SEED_TS + 2,
    lastOpenedAt: null
  },
  {
    id: 'pharma_eur',
    collectionType: 'pharmacopoeia',
    title: 'European Pharmacopoeia (Ph. Eur.)',
    shortTitle: 'Ph. Eur.',
    issuingAuthority: 'European Directorate for the Quality of Medicines & HealthCare (EDQM), Council of Europe',
    edition: 'Verify current edition & supplements on edqm.eu',
    volumes: 'General Notices, General Methods (2.x), Materials/Reagents (3.x–4.x), Monographs',
    subject: 'European Official Quality Standards',
    description:
      'Legally binding quality standards for medicines across Council of Europe member states, harmonizing analytical methods and monograph specifications.',
    sourceName: 'EDQM / Council of Europe',
    accessStatus: 'licensed_external',
    licenseInfo: 'EDQM licensed compendium; official access via EDQM subscription portal.',
    externalUrl: 'https://www.edqm.eu/en/european-pharmacopoeia',
    tags: ['Ph. Eur.', 'EDQM', 'Council of Europe', 'General Methods', 'Monographs'],
    bookmarked: false,
    customCollectionIds: ['col_drug_standards'],
    academicConnections: [],
    isSystemCatalog: true,
    createdAt: SEED_TS + 3,
    updatedAt: SEED_TS + 3,
    lastOpenedAt: null
  },
  {
    id: 'pharma_who_int',
    collectionType: 'pharmacopoeia',
    title: 'WHO International Pharmacopoeia (Ph. Int.)',
    shortTitle: 'Ph. Int.',
    issuingAuthority: 'World Health Organization (WHO) — Expert Committee on Specifications for Pharmaceutical Preparations',
    edition: 'Check official WHO online edition for latest published updates',
    volumes: 'General Notices, Methods of Analysis, Monographs for Essential Medicines & Dosage Forms',
    subject: 'Global Public Health Drug Standards',
    description:
      'WHO recommended quality specifications for selected pharmaceutical substances, excipients, and dosage forms, prioritizing the WHO Model List of Essential Medicines.',
    sourceName: 'World Health Organization (WHO)',
    accessStatus: 'open_access_portal',
    licenseInfo: 'Openly accessible via official WHO International Pharmacopoeia portal.',
    externalUrl:
      'https://www.who.int/teams/health-product-policy-and-standards/standards-and-specifications/norms-and-standards-for-pharmaceuticals/pharmacopoeia',
    tags: ['WHO', 'International Pharmacopoeia', 'Essential Medicines', 'Open Access'],
    bookmarked: false,
    customCollectionIds: ['col_drug_standards', 'col_bpharm_sem1'],
    academicConnections: [
      {
        id: 'conn_who_ors',
        entityType: 'experiment',
        label: 'WHO-Formula Oral Rehydration Salts & Basic Assays',
        departmentId: 'general_pharmacy',
        topicId: 'topic_pharmaceutics_dosage_forms'
      }
    ],
    isSystemCatalog: true,
    createdAt: SEED_TS + 4,
    updatedAt: SEED_TS + 4,
    lastOpenedAt: null
  },

  // =========================================================================
  // 2. REFERENCE TEXTBOOKS (Initial Subject Suggestions — Metadata Only)
  // =========================================================================
  {
    id: 'tb_tortora',
    collectionType: 'textbook',
    title: 'Principles of Anatomy and Physiology',
    authors: 'Gerard J. Tortora, Bryan H. Derrickson',
    subject: 'Human Anatomy & Physiology',
    description: 'Foundational anatomy & physiology textbook covering homeostasis, cellular organization, skeletal, muscular, nervous, and cardiovascular systems.',
    sourceName: 'Wiley (Catalog Suggestion)',
    accessStatus: 'metadata_only',
    licenseInfo: 'Copyrighted textbook — import your personal licensed PDF or specify your print edition.',
    tags: ['Anatomy', 'Physiology', 'BP104T', 'Cardiovascular', 'Cell', 'Skeleton'],
    bookmarked: false,
    customCollectionIds: ['col_bpharm_sem1', 'col_anatomy_exam'],
    academicConnections: [
      {
        id: 'conn_tb_tortora_cv',
        entityType: 'topic',
        label: 'Human Anatomy & Physiology → Cardiovascular Physiology',
        departmentId: 'anatomy',
        topicId: 'topic_anatomy_cardiovascular'
      },
      {
        id: 'conn_tb_tortora_cell',
        entityType: 'topic',
        label: 'Human Anatomy & Physiology → Cellular Organization & Injury',
        departmentId: 'anatomy',
        topicId: 'topic_anatomy_cell_injury'
      }
    ],
    isSystemCatalog: true,
    createdAt: SEED_TS + 10,
    updatedAt: SEED_TS + 10,
    lastOpenedAt: null
  },
  {
    id: 'tb_ross_wilson',
    collectionType: 'textbook',
    title: 'Ross & Wilson Anatomy and Physiology in Health and Illness',
    authors: 'Anne Waugh, Allison Grant',
    subject: 'Human Anatomy & Physiology',
    description: 'Concise clinical anatomy and pathophysiology reference used widely for B.Pharm Semester I physiology and illness correlations.',
    sourceName: 'Elsevier (Catalog Suggestion)',
    accessStatus: 'metadata_only',
    licenseInfo: 'Copyrighted textbook — attach your personal PDF copy or add institutional link.',
    tags: ['Anatomy', 'Pathophysiology', 'BP104T', 'Blood', 'Cardiovascular'],
    bookmarked: false,
    customCollectionIds: ['col_bpharm_sem1', 'col_anatomy_exam'],
    academicConnections: [],
    isSystemCatalog: true,
    createdAt: SEED_TS + 11,
    updatedAt: SEED_TS + 11,
    lastOpenedAt: null
  },
  {
    id: 'tb_guyton_hall',
    collectionType: 'textbook',
    title: 'Guyton and Hall Textbook of Medical Physiology',
    authors: 'John E. Hall, Michael E. Hall',
    subject: 'Human Anatomy & Physiology',
    description: 'Comprehensive physiological mechanisms reference covering membrane potentials, cardiac output regulation, ECG, and homeostasis.',
    sourceName: 'Elsevier (Catalog Suggestion)',
    accessStatus: 'metadata_only',
    licenseInfo: 'Copyrighted textbook — attach your personal PDF copy or institutional library link.',
    tags: ['Medical Physiology', 'ECG', 'Cardiac Output', 'Hemodynamics'],
    bookmarked: false,
    customCollectionIds: ['col_anatomy_exam'],
    academicConnections: [],
    isSystemCatalog: true,
    createdAt: SEED_TS + 12,
    updatedAt: SEED_TS + 12,
    lastOpenedAt: null
  },
  {
    id: 'tb_sembulingam',
    collectionType: 'textbook',
    title: 'Essentials of Medical Physiology',
    authors: 'K. Sembulingam, Prema Sembulingam',
    subject: 'Human Anatomy & Physiology',
    description: 'Structured physiology textbook oriented toward Indian pharmacy and medical curricula (hematology, CVS, nervous system, special senses).',
    sourceName: 'Jaypee Brothers (Catalog Suggestion)',
    accessStatus: 'metadata_only',
    licenseInfo: 'Copyrighted textbook — attach your personal copy or record edition details.',
    tags: ['Physiology', 'BP104T', 'Hematology', 'Special Senses'],
    bookmarked: false,
    customCollectionIds: ['col_bpharm_sem1', 'col_anatomy_exam'],
    academicConnections: [],
    isSystemCatalog: true,
    createdAt: SEED_TS + 13,
    updatedAt: SEED_TS + 13,
    lastOpenedAt: null
  },
  {
    id: 'tb_aulton',
    collectionType: 'textbook',
    title: "Aulton's Pharmaceutics: The Design and Manufacture of Medicines",
    authors: 'Kevin M. G. Taylor, Michael E. Aulton (Eds.)',
    subject: 'Pharmaceutics',
    description: 'Core pharmaceutics & pharmaceutical technology textbook covering preformulation, powders, solutions, suspensions, emulsions, tablets, and biopharmaceutics.',
    sourceName: 'Elsevier (Catalog Suggestion)',
    accessStatus: 'metadata_only',
    licenseInfo: 'Copyrighted textbook — attach authorized PDF or record edition in profile.',
    tags: ['Pharmaceutics', 'Pharmaceutical Technology', 'BP102T', 'Dosage Forms', 'Preformulation'],
    bookmarked: false,
    customCollectionIds: ['col_bpharm_sem1'],
    academicConnections: [
      {
        id: 'conn_tb_aulton',
        entityType: 'topic',
        label: 'Pharmaceutics → Compounding & Pharmaceutical Calculations',
        departmentId: 'general_pharmacy',
        topicId: 'topic_pharmaceutics_dosage_forms'
      }
    ],
    isSystemCatalog: true,
    createdAt: SEED_TS + 14,
    updatedAt: SEED_TS + 14,
    lastOpenedAt: null
  },
  {
    id: 'tb_lachman',
    collectionType: 'textbook',
    title: 'The Theory and Practice of Industrial Pharmacy',
    authors: 'Leon Lachman, Herbert A. Lieberman, Joseph L. Kanig',
    subject: 'Pharmaceutics',
    description: 'Industrial dosage-form formulation, tablet compression, coating, sterilization, and process validation reference.',
    sourceName: 'CBS / Lea & Febiger (Catalog Suggestion)',
    accessStatus: 'metadata_only',
    licenseInfo: 'Copyrighted textbook — attach authorized PDF or add institutional link.',
    tags: ['Industrial Pharmacy', 'Tablets', 'Coating', 'Sterile Products'],
    bookmarked: false,
    customCollectionIds: ['col_bpharm_sem1'],
    academicConnections: [],
    isSystemCatalog: true,
    createdAt: SEED_TS + 15,
    updatedAt: SEED_TS + 15,
    lastOpenedAt: null
  },
  {
    id: 'tb_remington',
    collectionType: 'textbook',
    title: 'Remington: The Science and Practice of Pharmacy',
    authors: 'Adejare, Adeboye (Ed.) / Remington Editorial Board',
    subject: 'Pharmaceutics',
    description: 'Encyclopedic reference bridging pharmaceutics, pharmaceutical technology, compounding, posology, and clinical pharmacy.',
    sourceName: 'Academic Press / Elsevier (Catalog Suggestion)',
    accessStatus: 'metadata_only',
    licenseInfo: 'Copyrighted reference — attach authorized PDF or add institutional access URL.',
    tags: ['Pharmaceutics', 'Pharmaceutical Technology', 'Compounding', 'Posology', 'Isotonicity'],
    bookmarked: false,
    customCollectionIds: ['col_bpharm_sem1'],
    academicConnections: [],
    isSystemCatalog: true,
    createdAt: SEED_TS + 16,
    updatedAt: SEED_TS + 16,
    lastOpenedAt: null
  },
  {
    id: 'tb_rang_dale',
    collectionType: 'textbook',
    title: 'Rang & Dale’s Pharmacology',
    authors: 'James M. Ritter, Rod J. Flower, Graeme Henderson, Yoon Kong Loke, David MacEwan, Humphrey P. Rang',
    subject: 'Pharmacology',
    description: 'Mechanism-focused pharmacology text covering receptors, pharmacokinetics, autacoids, NSAIDs, cardiovascular, and CNS drugs.',
    sourceName: 'Elsevier (Catalog Suggestion)',
    accessStatus: 'metadata_only',
    licenseInfo: 'Copyrighted textbook — attach authorized PDF or add publisher/library URL.',
    tags: ['Pharmacology', 'Pharmacodynamics', 'Pharmacokinetics', 'NSAIDs', 'Mechanism'],
    bookmarked: false,
    customCollectionIds: [],
    academicConnections: [
      {
        id: 'conn_tb_rang_nsaids',
        entityType: 'subtopic',
        label: 'Pharmacology → NSAIDs → Paracetamol — Pharmacological mechanism',
        departmentId: 'pharmacology',
        topicId: 'topic_pharma_paracetamol'
      }
    ],
    isSystemCatalog: true,
    createdAt: SEED_TS + 17,
    updatedAt: SEED_TS + 17,
    lastOpenedAt: null
  },
  {
    id: 'tb_katzung',
    collectionType: 'textbook',
    title: 'Basic & Clinical Pharmacology',
    authors: 'Bertram G. Katzung, Todd W. Vanderah (Eds.)',
    subject: 'Pharmacology',
    description: 'Foundational pharmacology covering pharmacokinetics, bioavailability, receptor kinetics, autonomic, cardiovascular, and analgesic drugs.',
    sourceName: 'McGraw-Hill (Catalog Suggestion)',
    accessStatus: 'metadata_only',
    licenseInfo: 'Copyrighted textbook — attach authorized PDF or institutional AccessPharmacy link.',
    tags: ['Pharmacology', 'Bioavailability', 'Pharmacokinetics', 'Clinical Pharmacology'],
    bookmarked: false,
    customCollectionIds: [],
    academicConnections: [],
    isSystemCatalog: true,
    createdAt: SEED_TS + 18,
    updatedAt: SEED_TS + 18,
    lastOpenedAt: null
  },
  {
    id: 'tb_tripathi',
    collectionType: 'textbook',
    title: 'Essentials of Medical Pharmacology',
    authors: 'K. D. Tripathi',
    subject: 'Pharmacology',
    description: 'Structured Indian pharmacology reference covering drug classifications, NSAIDs, cardiovascular pharmacology, and ADR profiles.',
    sourceName: 'Jaypee Brothers (Catalog Suggestion)',
    accessStatus: 'metadata_only',
    licenseInfo: 'Copyrighted textbook — attach authorized PDF or record print edition.',
    tags: ['Pharmacology', 'Drug Classification', 'NSAIDs', 'Paracetamol', 'ADR'],
    bookmarked: false,
    customCollectionIds: [],
    academicConnections: [],
    isSystemCatalog: true,
    createdAt: SEED_TS + 19,
    updatedAt: SEED_TS + 19,
    lastOpenedAt: null
  },
  {
    id: 'tb_wilson_gisvold',
    collectionType: 'textbook',
    title: 'Wilson and Gisvold’s Textbook of Organic Medicinal and Pharmaceutical Chemistry',
    authors: 'John M. Beale Jr., John H. Block (Eds.)',
    subject: 'Pharmaceutical Chemistry',
    description: 'Medicinal chemistry reference detailing SAR, drug metabolism, physicochemical properties, and chemical nomenclature.',
    sourceName: 'Wolters Kluwer / LWW (Catalog Suggestion)',
    accessStatus: 'metadata_only',
    licenseInfo: 'Copyrighted textbook — attach authorized PDF or add publisher link.',
    tags: ['Medicinal Chemistry', 'SAR', 'Drug Metabolism', 'Chemical Nomenclature'],
    bookmarked: false,
    customCollectionIds: [],
    academicConnections: [],
    isSystemCatalog: true,
    createdAt: SEED_TS + 20,
    updatedAt: SEED_TS + 20,
    lastOpenedAt: null
  },
  {
    id: 'tb_foye',
    collectionType: 'textbook',
    title: "Foye's Principles of Medicinal Chemistry",
    authors: 'Victoria F. Roche, S. William Zito, Thomas L. Lemke, David A. Williams',
    subject: 'Pharmaceutical Chemistry',
    description: 'Comprehensive medicinal chemistry covering drug-receptor interactions, metabolic pathways, analgesics, and antimicrobial agents.',
    sourceName: 'Wolters Kluwer / LWW (Catalog Suggestion)',
    accessStatus: 'metadata_only',
    licenseInfo: 'Copyrighted textbook — attach authorized PDF or add institutional link.',
    tags: ['Medicinal Chemistry', 'Drug Metabolism', 'Receptors', 'SAR'],
    bookmarked: false,
    customCollectionIds: [],
    academicConnections: [],
    isSystemCatalog: true,
    createdAt: SEED_TS + 21,
    updatedAt: SEED_TS + 21,
    lastOpenedAt: null
  },
  {
    id: 'tb_beckett_stenlake',
    collectionType: 'textbook',
    title: 'Practical Pharmaceutical Chemistry (Parts I & II)',
    authors: 'A. H. Beckett, J. B. Stenlake',
    subject: 'Pharmaceutical Analysis',
    description: 'Classical analytical pharmacy reference covering volumetric titrations, limit tests, gravimetric assays, and instrumental spectroscopy.',
    sourceName: 'Athlone / CBS (Catalog Suggestion)',
    accessStatus: 'metadata_only',
    licenseInfo: 'Copyrighted textbook — attach authorized PDF or record edition.',
    tags: ['Pharmaceutical Analysis', 'Titrimetry', 'Assays', 'Spectroscopy', 'BP106T'],
    bookmarked: false,
    customCollectionIds: ['col_pharm_analysis', 'col_bpharm_sem1'],
    academicConnections: [
      {
        id: 'conn_tb_beckett',
        entityType: 'topic',
        label: 'Pharmaceutical Analysis → Volumetric Titrimetry & Assay Validation',
        departmentId: 'pharm_analysis',
        topicId: 'topic_analysis_volumetric'
      }
    ],
    isSystemCatalog: true,
    createdAt: SEED_TS + 22,
    updatedAt: SEED_TS + 22,
    lastOpenedAt: null
  },
  {
    id: 'tb_vogel',
    collectionType: 'textbook',
    title: "Vogel's Textbook of Quantitative Chemical Analysis",
    authors: 'J. Mendham, R. C. Denney, J. D. Barnes, M. Thomas',
    subject: 'Pharmaceutical Analysis',
    description: 'Authoritative analytical chemistry text covering primary standards, acid-base, redox (cerimetry/iodometry), complexometric (EDTA), and precipitation titrations.',
    sourceName: 'Pearson / Prentice Hall (Catalog Suggestion)',
    accessStatus: 'metadata_only',
    licenseInfo: 'Copyrighted textbook — attach authorized PDF or add library link.',
    tags: ['Quantitative Analysis', 'Titration', 'EDTA', 'Standardization', 'BP111P'],
    bookmarked: false,
    customCollectionIds: ['col_pharm_analysis', 'col_bpharm_sem1'],
    academicConnections: [],
    isSystemCatalog: true,
    createdAt: SEED_TS + 23,
    updatedAt: SEED_TS + 23,
    lastOpenedAt: null
  },
  {
    id: 'tb_trease_evans',
    collectionType: 'textbook',
    title: "Trease and Evans' Pharmacognosy",
    authors: 'William Charles Evans, Daphne Evans',
    subject: 'Pharmacognosy',
    description: 'Foundational pharmacognosy textbook covering crude drugs, plant microscopy, phytochemical classes, and quality control.',
    sourceName: 'Elsevier / Saunders (Catalog Suggestion)',
    accessStatus: 'metadata_only',
    licenseInfo: 'Copyrighted textbook — attach authorized PDF or add institutional link.',
    tags: ['Pharmacognosy', 'Crude Drugs', 'Microscopy', 'Phytochemistry', 'BP105T'],
    bookmarked: false,
    customCollectionIds: ['col_bpharm_sem1'],
    academicConnections: [
      {
        id: 'conn_tb_trease',
        entityType: 'topic',
        label: 'Pharmacognosy → Quantitative & Botanical Microscopy',
        departmentId: 'pharmacognosy',
        topicId: 'topic_pharmacognosy_microscopy'
      }
    ],
    isSystemCatalog: true,
    createdAt: SEED_TS + 24,
    updatedAt: SEED_TS + 24,
    lastOpenedAt: null
  },
  {
    id: 'tb_kokate',
    collectionType: 'textbook',
    title: 'Pharmacognosy',
    authors: 'C. K. Kokate, A. P. Purohit, S. B. Gokhale',
    subject: 'Pharmacognosy',
    description: 'PCI-aligned pharmacognosy reference covering stomatal index, vein-islet, ash values, swelling index, and medicinal plants.',
    sourceName: 'Nirali Prakashan (Catalog Suggestion)',
    accessStatus: 'metadata_only',
    licenseInfo: 'Copyrighted textbook — attach authorized PDF or record print edition.',
    tags: ['Pharmacognosy', 'BP105T', 'BP110P', 'Stomatal Index', 'Ash Value'],
    bookmarked: false,
    customCollectionIds: ['col_bpharm_sem1'],
    academicConnections: [],
    isSystemCatalog: true,
    createdAt: SEED_TS + 25,
    updatedAt: SEED_TS + 25,
    lastOpenedAt: null
  },
  {
    id: 'tb_prescott',
    collectionType: 'textbook',
    title: "Prescott's Microbiology",
    authors: 'Joanne M. Willey, Kathleen M. Sandman, Dorothy H. Wood',
    subject: 'Pharmaceutical Microbiology',
    description: 'Microbiology reference covering microbial physiology, staining, microscopy, sterilization, and antimicrobial susceptibility.',
    sourceName: 'McGraw-Hill (Catalog Suggestion)',
    accessStatus: 'metadata_only',
    licenseInfo: 'Copyrighted textbook — attach authorized PDF or add institutional link.',
    tags: ['Microbiology', 'Sterilization', 'Microscopy', 'Antimicrobials'],
    bookmarked: false,
    customCollectionIds: [],
    academicConnections: [
      {
        id: 'conn_tb_prescott',
        entityType: 'topic',
        label: 'Pharmaceutical Microbiology → Aseptic Processing & Sterility Testing',
        departmentId: 'microbiology',
        topicId: 'topic_microbiology_sterility'
      }
    ],
    isSystemCatalog: true,
    createdAt: SEED_TS + 26,
    updatedAt: SEED_TS + 26,
    lastOpenedAt: null
  },
  {
    id: 'tb_pelczar',
    collectionType: 'textbook',
    title: 'Microbiology',
    authors: 'Michael J. Pelczar Jr., E. C. S. Chan, Noel R. Krieg',
    subject: 'Pharmaceutical Microbiology',
    description: 'Classic textbook on microbial classification, culture media, disinfection, and industrial/pharmaceutical microbiology principles.',
    sourceName: 'Tata McGraw-Hill (Catalog Suggestion)',
    accessStatus: 'metadata_only',
    licenseInfo: 'Copyrighted textbook — attach authorized PDF or record print edition.',
    tags: ['Microbiology', 'Culture Media', 'Disinfection', 'Aseptic'],
    bookmarked: false,
    customCollectionIds: [],
    academicConnections: [],
    isSystemCatalog: true,
    createdAt: SEED_TS + 27,
    updatedAt: SEED_TS + 27,
    lastOpenedAt: null
  },
  {
    id: 'tb_aulton_tech',
    collectionType: 'textbook',
    title: "Aulton's Pharmaceutics — Pharmaceutical Technology & Unit Operations",
    authors: 'Kevin M. G. Taylor, Michael E. Aulton (Eds.)',
    subject: 'Pharmaceutical Technology',
    description: 'Unit operations reference covering milling, mixing, granulation, drying, particle size analysis, and dosage-form manufacturing.',
    sourceName: 'Elsevier (Catalog Suggestion)',
    accessStatus: 'metadata_only',
    licenseInfo: 'Copyrighted textbook — cross-referenced for Pharmaceutical Technology.',
    tags: ['Pharmaceutical Technology', 'Granulation', 'Milling', 'Drying', 'Mixing'],
    bookmarked: false,
    customCollectionIds: [],
    academicConnections: [],
    isSystemCatalog: true,
    createdAt: SEED_TS + 28,
    updatedAt: SEED_TS + 28,
    lastOpenedAt: null
  },
  {
    id: 'tb_remington_tech',
    collectionType: 'textbook',
    title: 'Remington — Industrial Pharmaceutical Technology & Sterile Manufacturing',
    authors: 'Remington Editorial Board',
    subject: 'Pharmaceutical Technology',
    description: 'Industrial dosage-form manufacturing, parenteral cleanroom engineering, packaging, and stability testing sections.',
    sourceName: 'Academic Press / Elsevier (Catalog Suggestion)',
    accessStatus: 'metadata_only',
    licenseInfo: 'Copyrighted reference — cross-referenced for Pharmaceutical Technology.',
    tags: ['Pharmaceutical Technology', 'Parenterals', 'Packaging', 'Manufacturing'],
    bookmarked: false,
    customCollectionIds: [],
    academicConnections: [],
    isSystemCatalog: true,
    createdAt: SEED_TS + 29,
    updatedAt: SEED_TS + 29,
    lastOpenedAt: null
  },

  // =========================================================================
  // 3. HANDBOOKS
  // =========================================================================
  {
    id: 'hb_excipients',
    collectionType: 'handbook',
    title: 'Handbook of Pharmaceutical Excipients',
    authors: 'Paul J. Sheskey, Bruno C. Hancock, Gary P. Moss, David J. Goldfarb (Eds.)',
    issuingAuthority: 'Pharmaceutical Press & American Pharmacists Association (APhA)',
    subject: 'Pharmaceutics & Formulation Excipients',
    subCategory: 'Excipients & Compatibility',
    description: 'Reference data on functional categories, physical properties, incompatibilities, and safety of pharmaceutical excipients.',
    sourceName: 'Pharmaceutical Press / APhA',
    accessStatus: 'licensed_external',
    licenseInfo: 'Publisher subscription / MedicinesComplete access required.',
    externalUrl: 'https://www.pharmaceuticalpress.com',
    tags: ['Excipients', 'Binders', 'Disintegrants', 'Preservatives', 'Formulation'],
    bookmarked: false,
    customCollectionIds: ['col_bpharm_sem1'],
    academicConnections: [],
    isSystemCatalog: true,
    createdAt: SEED_TS + 40,
    updatedAt: SEED_TS + 40,
    lastOpenedAt: null
  },
  {
    id: 'hb_martindale',
    collectionType: 'handbook',
    title: 'Martindale: The Complete Drug Reference',
    issuingAuthority: 'Pharmaceutical Press (Royal Pharmaceutical Society)',
    subject: 'Clinical Pharmacology & Drug Information',
    subCategory: 'Clinical Drug Reference',
    description: 'Global drug information compendium covering clinical uses, adverse effects, interactions, and pharmacokinetics.',
    sourceName: 'Pharmaceutical Press',
    accessStatus: 'licensed_external',
    licenseInfo: 'MedicinesComplete institutional or individual subscription.',
    externalUrl: 'https://www.pharmaceuticalpress.com',
    tags: ['Drug Reference', 'Clinical Pharmacology', 'Interactions', 'ADR'],
    bookmarked: false,
    customCollectionIds: [],
    academicConnections: [],
    isSystemCatalog: true,
    createdAt: SEED_TS + 41,
    updatedAt: SEED_TS + 41,
    lastOpenedAt: null
  },
  {
    id: 'hb_clarke',
    collectionType: 'handbook',
    title: "Clarke's Analysis of Drugs and Poisons",
    issuingAuthority: 'Pharmaceutical Press',
    subject: 'Pharmaceutical Analysis & Toxicology',
    subCategory: 'Analytical & Toxicological Data',
    description: 'Analytical profiles, chromatographic data, UV/IR spectra, and toxicological monographs for drugs and poisons.',
    sourceName: 'Pharmaceutical Press',
    accessStatus: 'licensed_external',
    licenseInfo: 'Publisher subscription / authorized print or PDF access.',
    externalUrl: 'https://www.pharmaceuticalpress.com',
    tags: ['Toxicology', 'Chromatography', 'Analytical Profiles', 'UV', 'IR'],
    bookmarked: false,
    customCollectionIds: ['col_pharm_analysis'],
    academicConnections: [],
    isSystemCatalog: true,
    createdAt: SEED_TS + 42,
    updatedAt: SEED_TS + 42,
    lastOpenedAt: null
  },
  {
    id: 'hb_who_eml',
    collectionType: 'handbook',
    title: 'WHO Model List of Essential Medicines & Electronic Essential Medicines List (eEML)',
    issuingAuthority: 'World Health Organization (WHO)',
    subject: 'Essential Medicines & Public Health Pharmacy',
    subCategory: 'Essential Medicines Reference',
    description: 'Open-access WHO reference listing core and complementary essential medicines, dosage forms, and clinical indications.',
    sourceName: 'World Health Organization (WHO)',
    accessStatus: 'open_access_portal',
    licenseInfo: 'Openly accessible via WHO eEML portal.',
    externalUrl: 'https://list.essentialmeds.org/',
    tags: ['WHO', 'Essential Medicines', 'Dosing', 'Public Health', 'Open Access'],
    bookmarked: false,
    customCollectionIds: ['col_bpharm_sem1', 'col_drug_standards'],
    academicConnections: [],
    isSystemCatalog: true,
    createdAt: SEED_TS + 43,
    updatedAt: SEED_TS + 43,
    lastOpenedAt: null
  },

  // =========================================================================
  // 4. STANDARDS & GUIDELINES (Official Portals — No Fabricated Claims)
  // =========================================================================
  {
    id: 'std_ich_quality',
    collectionType: 'standard',
    title: 'ICH Quality Guidelines (Q1–Q14: Stability, Validation, Impurities, GMP)',
    issuingAuthority: 'International Council for Harmonisation (ICH)',
    subject: 'Pharmaceutical Quality & Analytical Validation',
    subCategory: 'Stability testing',
    documentType: 'Harmonised Tripartite Guidelines',
    description: 'Official ICH Quality guidelines portal covering Stability (Q1A–Q1F), Analytical Validation (Q2), Impurities (Q3A–Q3E), Pharmaceutical Development (Q8), Quality Risk Management (Q9), and Pharmaceutical Quality System (Q10).',
    sourceName: 'ICH Official Portal',
    accessStatus: 'open_access_portal',
    licenseInfo: 'Publicly accessible on ich.org; import downloaded official PDFs locally if needed.',
    externalUrl: 'https://www.ich.org/page/quality-guidelines',
    tags: ['ICH', 'Stability testing', 'Validation guidelines', 'Impurities', 'Analytical standards', 'Quality assurance'],
    bookmarked: false,
    customCollectionIds: ['col_drug_standards', 'col_pharm_analysis'],
    academicConnections: [
      {
        id: 'conn_std_ich_val',
        entityType: 'topic',
        label: 'Pharmaceutical Analysis → Volumetric Titrimetry & Assay Validation',
        departmentId: 'pharm_analysis',
        topicId: 'topic_analysis_volumetric'
      }
    ],
    isSystemCatalog: true,
    createdAt: SEED_TS + 50,
    updatedAt: SEED_TS + 50,
    lastOpenedAt: null
  },
  {
    id: 'std_ich_efficacy_gcp',
    collectionType: 'standard',
    title: 'ICH Efficacy Guidelines (E6 Good Clinical Practice & Pharmacovigilance)',
    issuingAuthority: 'International Council for Harmonisation (ICH)',
    subject: 'Clinical Trials & Drug Safety',
    subCategory: 'Good Clinical Practices',
    documentType: 'Regulatory Clinical Guideline',
    description: 'Official ICH Efficacy portal including Good Clinical Practice (E6), Pharmacovigilance Planning (E2E), and Clinical Safety Data Management.',
    sourceName: 'ICH Official Portal',
    accessStatus: 'open_access_portal',
    licenseInfo: 'Publicly accessible on ich.org.',
    externalUrl: 'https://www.ich.org/page/efficacy-guidelines',
    tags: ['GCP', 'Good Clinical Practices', 'Drug safety', 'Pharmacovigilance', 'ICH E6'],
    bookmarked: false,
    customCollectionIds: ['col_drug_standards'],
    academicConnections: [],
    isSystemCatalog: true,
    createdAt: SEED_TS + 51,
    updatedAt: SEED_TS + 51,
    lastOpenedAt: null
  },
  {
    id: 'std_who_norms_gmp',
    collectionType: 'standard',
    title: 'WHO Norms & Standards for Pharmaceuticals (GMP, Quality Assurance & TRS)',
    issuingAuthority: 'World Health Organization (WHO)',
    subject: 'GMP, Quality Assurance & Manufacturing Standards',
    subCategory: 'Good Manufacturing Practices',
    documentType: 'WHO Technical Report Series & Guidance',
    description: 'WHO official norms and standards covering Good Manufacturing Practices (GMP), Good Storage & Distribution Practices, Stability, and Quality Control.',
    sourceName: 'World Health Organization',
    accessStatus: 'open_access_portal',
    licenseInfo: 'Openly accessible via official WHO standards portal.',
    externalUrl:
      'https://www.who.int/teams/health-product-policy-and-standards/standards-and-specifications/norms-and-standards-for-pharmaceuticals',
    tags: ['WHO guidelines', 'Good Manufacturing Practices', 'Quality assurance', 'Pharmaceutical manufacturing standards'],
    bookmarked: false,
    customCollectionIds: ['col_drug_standards'],
    academicConnections: [],
    isSystemCatalog: true,
    createdAt: SEED_TS + 52,
    updatedAt: SEED_TS + 52,
    lastOpenedAt: null
  },
  {
    id: 'std_oecd_glp',
    collectionType: 'standard',
    title: 'OECD Principles of Good Laboratory Practice (GLP) & Compliance Monitoring',
    issuingAuthority: 'Organisation for Economic Co-operation and Development (OECD)',
    subject: 'Non-Clinical Laboratory Quality & Integrity',
    subCategory: 'Good Laboratory Practices',
    documentType: 'International Laboratory Standard',
    description: 'Official OECD GLP principles governing organizational structure, SOPs, equipment calibration, raw data integrity, and study archiving.',
    sourceName: 'OECD Official Portal',
    accessStatus: 'open_access_portal',
    licenseInfo: 'Publicly accessible OECD GLP series.',
    externalUrl: 'https://www.oecd.org/en/topics/sub-issues/testing-of-chemicals/good-laboratory-practice.html',
    tags: ['GLP', 'Good Laboratory Practices', 'Quality control', 'SOP', 'Data Integrity'],
    bookmarked: false,
    customCollectionIds: ['col_drug_standards', 'col_pharm_analysis'],
    academicConnections: [],
    isSystemCatalog: true,
    createdAt: SEED_TS + 53,
    updatedAt: SEED_TS + 53,
    lastOpenedAt: null
  },
  {
    id: 'std_cdsco_india',
    collectionType: 'standard',
    title: 'CDSCO Regulatory Guidance, Schedule M (GMP) & Drug Safety Notices',
    issuingAuthority: 'Central Drugs Standard Control Organisation (CDSCO), India',
    subject: 'Indian Pharmaceutical Regulation & Safety',
    subCategory: 'Regulatory guidance',
    documentType: 'National Regulatory Guidance',
    description: 'Official CDSCO portal for Indian regulatory circulars, New Drugs & Clinical Trials Rules, Schedule M GMP updates, and Pharmacovigilance alerts.',
    sourceName: 'CDSCO Official Portal',
    accessStatus: 'open_access_portal',
    licenseInfo: 'Official Government of India regulatory portal.',
    externalUrl: 'https://cdsco.gov.in',
    tags: ['Regulatory guidance', 'Drug safety', 'CDSCO', 'Schedule M', 'Good Manufacturing Practices'],
    bookmarked: false,
    customCollectionIds: ['col_drug_standards'],
    academicConnections: [],
    isSystemCatalog: true,
    createdAt: SEED_TS + 54,
    updatedAt: SEED_TS + 54,
    lastOpenedAt: null
  },
  {
    id: 'std_fda_guidance',
    collectionType: 'standard',
    title: 'US FDA Pharmaceutical Quality, CGMP & Analytical Validation Guidance',
    issuingAuthority: 'U.S. Food and Drug Administration (CDER / CBER)',
    subject: 'CGMP, Analytical Validation & Drug Safety',
    subCategory: 'Validation guidelines',
    documentType: 'Regulatory Industry Guidance',
    description: 'Official US FDA searchable database of pharmaceutical manufacturing CGMP, bioanalytical method validation, dissolution, and drug safety guidances.',
    sourceName: 'U.S. FDA Guidance Portal',
    accessStatus: 'open_access_portal',
    licenseInfo: 'Public domain U.S. government regulatory portal.',
    externalUrl: 'https://www.fda.gov/drugs/guidance-compliance-regulatory-information/guidances-drugs',
    tags: ['Regulatory guidance', 'Validation guidelines', 'Good Manufacturing Practices', 'Analytical standards', 'FDA'],
    bookmarked: false,
    customCollectionIds: ['col_drug_standards'],
    academicConnections: [],
    isSystemCatalog: true,
    createdAt: SEED_TS + 55,
    updatedAt: SEED_TS + 55,
    lastOpenedAt: null
  },
  {
    id: 'std_ema_scientific',
    collectionType: 'standard',
    title: 'EMA Scientific Guidelines (Quality, Non-Clinical, Clinical & Pharmacovigilance)',
    issuingAuthority: 'European Medicines Agency (EMA)',
    subject: 'Quality Assurance, Safety & Regulatory Science',
    subCategory: 'Quality assurance',
    documentType: 'European Scientific Guidelines',
    description: 'Official EMA index of scientific guidelines on drug quality, bioequivalence, nitrosamine impurities, and pharmacovigilance.',
    sourceName: 'European Medicines Agency',
    accessStatus: 'open_access_portal',
    licenseInfo: 'Publicly accessible via ema.europa.eu.',
    externalUrl: 'https://www.ema.europa.eu/en/human-regulatory-overview/research-development/scientific-guidelines',
    tags: ['Quality assurance', 'Drug safety', 'Impurity testing', 'Bioequivalence', 'EMA'],
    bookmarked: false,
    customCollectionIds: ['col_drug_standards'],
    academicConnections: [],
    isSystemCatalog: true,
    createdAt: SEED_TS + 56,
    updatedAt: SEED_TS + 56,
    lastOpenedAt: null
  }
];
