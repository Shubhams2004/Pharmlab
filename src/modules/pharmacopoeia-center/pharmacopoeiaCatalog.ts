import {
  AnalyticalTestFacet,
  PharmacopoeiaAcademicLink,
  PharmacopoeiaDirectoryEntry,
  StandardCategoryFacet
} from './types';

export const PHARMACOPOEIA_DIRECTORY: PharmacopoeiaDirectoryEntry[] = [
  {
    id: 'pc_ip',
    abbreviation: 'IP',
    fullName: 'Indian Pharmacopoeia',
    classification: 'primary_pharmacopoeia',
    isPharmacopoeia: true,
    countryOrRegion: 'India',
    issuingOrganization: 'Indian Pharmacopoeia Commission (IPC), Ministry of Health & Family Welfare',
    description:
      'Official legally binding book of drug standards in India establishing identity, purity, strength, and analytical test criteria for active pharmaceutical ingredients, excipients, dosage forms, biologicals, and phytopharmaceuticals.',
    purpose:
      'Sets statutory quality standards for manufacturing, testing, licensing, and regulatory compliance of medicines across India under the Drugs and Cosmetics Act.',
    scope:
      'General Notices, General Chapters (limit tests, titrimetry, spectroscopy, chromatography, dissolution, microbiology), API monographs, dosage forms, vaccines, blood products, herbs, and IPC Reference Substances.',
    officialWebsite: 'https://www.ipc.gov.in',
    onlineAccessibilityStatus:
      'Official IPC website and regulatory notices are publicly viewable; full monograph text requires official print purchase or licensed IP Online digital access.',
    contentAccessType: 'licensed',
    accessLimitations:
      'Full monograph text and official addenda are distributed under IPC licensing / print purchase; not publicly mirrored as open full text.',
    searchSupport: 'local_imported_pdf',
    relevantDepartments: [
      'pharmaceutical_analysis',
      'pharmaceutical_chemistry',
      'pharmaceutics',
      'quality_assurance',
      'industrial_pharmacy',
      'pharmacognosy',
      'pharmaceutical_microbiology'
    ],
    syllabusRelevance: [
      'BP102T Unit I — History & Salient Features of Indian Pharmacopoeia',
      'BP106T / BP111P — Limit tests for chloride, sulphate, iron, lead, arsenic; volumetric assays',
      'BP107P — IP compounding & official dosage form standards',
      'BP105T / BP110P — Crude drug ash values, extractive values & herbal standards'
    ],
    officialLinks: [
      {
        id: 'ip_portal',
        label: 'IPC Official Portal',
        url: 'https://www.ipc.gov.in',
        kind: 'portal',
        note: 'Official commission homepage, drug standards overview, and publications catalog.'
      },
      {
        id: 'ip_notices',
        label: 'IPC Announcements & Standards Notices',
        url: 'https://www.ipc.gov.in/Mandates/indian-pharmacopoeia.html',
        kind: 'notices',
        note: 'Official IP overview, addendum information, and commission mandates.'
      }
    ],
    officialNoticesUrl: 'https://www.ipc.gov.in',
    verifiedEditionSummary:
      'Published periodically by the Indian Pharmacopoeia Commission with interim Addenda (verify active edition directly via IPC).',
    editionTrackingNote:
      'Use official IPC publications announcements to verify the currently enforceable edition and addendum effective dates.',
    analyticalTestCategories: [
      'assays_titrimetry',
      'limit_tests_impurities',
      'identification_spectroscopy',
      'dissolution_release',
      'disintegration_physical',
      'sterility_microbial',
      'chromatography_separation',
      'reagents_standards'
    ],
    standardCategories: [
      'general_notices',
      'general_chapters',
      'drug_substances',
      'dosage_forms',
      'excipients',
      'impurities_elemental',
      'quality_guidance'
    ],
    searchableKeywords: [
      'Indian Pharmacopoeia',
      'IPC',
      'limit tests',
      'chloride',
      'sulphate',
      'arsenic',
      'Gutzeit',
      'ash value',
      'BP102T',
      'BP106T',
      'BP111P'
    ],
    linkedReferenceCenterId: 'pharma_ip'
  },
  {
    id: 'pc_bp',
    abbreviation: 'BP',
    fullName: 'British Pharmacopoeia',
    classification: 'primary_pharmacopoeia',
    isPharmacopoeia: true,
    countryOrRegion: 'United Kingdom',
    issuingOrganization:
      'British Pharmacopoeia Commission / Medicines and Healthcare products Regulatory Agency (MHRA)',
    description:
      'Official collection of authoritative standards for UK medicinal substances and formulated preparations, incorporating European Pharmacopoeia texts alongside UK-specific dosage form and veterinary monographs.',
    purpose:
      'Provides legally enforceable quality specifications for medicines supplied in the United Kingdom and widely referenced across Commonwealth pharmaceutical industries.',
    scope:
      'Medicinal and pharmaceutical substances, formulated preparations, herbal drugs, blood products, immunological products, radiopharmaceuticals, and analytical Appendices.',
    officialWebsite: 'https://www.pharmacopoeia.com',
    onlineAccessibilityStatus:
      'Official online platform operates via subscription or institutional license; regulatory news and product information are publicly browsable.',
    contentAccessType: 'subscription',
    accessLimitations:
      'Full monograph content requires an active British Pharmacopoeia subscription or authorized institutional access.',
    searchSupport: 'local_imported_pdf',
    relevantDepartments: [
      'pharmaceutical_analysis',
      'pharmaceutical_chemistry',
      'pharmaceutics',
      'quality_assurance',
      'industrial_pharmacy',
      'pharmacognosy'
    ],
    syllabusRelevance: [
      'BP102T Unit I — Introduction to Pharmacopoeias (IP, BP, USP)',
      'BP107P — Official compounding traditions & British Pharmaceutical Codex heritage',
      'Pharmaceutical Analysis & Quality Assurance — Comparative monograph alignment with Ph. Eur.'
    ],
    officialLinks: [
      {
        id: 'bp_portal',
        label: 'British Pharmacopoeia Official Portal',
        url: 'https://www.pharmacopoeia.com',
        kind: 'portal',
        note: 'Official subscriber portal, catalog, and pharmacopoeial guidance.'
      },
      {
        id: 'bp_updates',
        label: 'BP Updates & Regulatory News',
        url: 'https://www.pharmacopoeia.com/whats-new',
        kind: 'notices',
        note: 'Official edition releases, Ph. Eur. integration notices, and technical updates.'
      }
    ],
    officialNoticesUrl: 'https://www.pharmacopoeia.com/whats-new',
    verifiedEditionSummary:
      'Issued annually by the British Pharmacopoeia Commission / MHRA in print and online formats; verify current active edition on pharmacopoeia.com.',
    editionTrackingNote:
      'Annual edition cycle synchronized with Council of Europe Ph. Eur. supplements where applicable.',
    analyticalTestCategories: [
      'assays_titrimetry',
      'limit_tests_impurities',
      'identification_spectroscopy',
      'dissolution_release',
      'disintegration_physical',
      'sterility_microbial',
      'chromatography_separation',
      'reagents_standards'
    ],
    standardCategories: [
      'general_notices',
      'general_chapters',
      'drug_substances',
      'dosage_forms',
      'excipients',
      'impurities_elemental'
    ],
    searchableKeywords: [
      'British Pharmacopoeia',
      'BP',
      'MHRA',
      'formulated preparations',
      'appendices',
      'compounding',
      'BP102T'
    ],
    linkedReferenceCenterId: 'pharma_bp'
  },
  {
    id: 'pc_usp_nf',
    abbreviation: 'USP–NF',
    fullName: 'United States Pharmacopeia–National Formulary',
    classification: 'primary_pharmacopoeia',
    isPharmacopoeia: true,
    countryOrRegion: 'United States',
    issuingOrganization: 'United States Pharmacopeial Convention (USP)',
    description:
      'Public quality compendium combining USP monographs for drug substances, dosage forms, and biologics with NF standards for pharmaceutical excipients, plus widely used General Chapters.',
    purpose:
      'Establishes enforceable quality, purity, strength, packaging, and labeling standards recognized in US law and global regulatory submissions.',
    scope:
      'USP Drug Substance & Dosage Form Monographs, NF Excipient Monographs, numbered General Chapters (<1> to <999> mandatory, <1000>+ informational), dietary supplements, and USP Reference Standards.',
    officialWebsite: 'https://www.uspnf.com',
    onlineAccessibilityStatus:
      'Official USP–NF Online requires subscription/license; Pharmacopeial Forum (PF), revision bulletins, and selected public standards notices are hosted on USP portals.',
    contentAccessType: 'subscription',
    accessLimitations:
      'Full compendial monographs and official General Chapters require a paid USP–NF Online subscription.',
    searchSupport: 'local_imported_pdf',
    relevantDepartments: [
      'pharmaceutical_analysis',
      'pharmaceutical_chemistry',
      'pharmaceutics',
      'industrial_pharmacy',
      'quality_assurance',
      'pharmaceutical_microbiology'
    ],
    syllabusRelevance: [
      'BP102T Unit I — Comparison of IP, BP, and USP–NF structure',
      'Pharmaceutics & Industrial Pharmacy — Dissolution Apparatus (<711>), Disintegration (<701>), Uniformity of Dosage Units (<905>)',
      'Quality Assurance & Analysis — Chromatography (<621>), Elemental Impurities (<232>/<233>), Method Validation (<1225>)'
    ],
    officialLinks: [
      {
        id: 'uspnf_portal',
        label: 'USP–NF Official Platform',
        url: 'https://www.uspnf.com',
        kind: 'portal',
        note: 'Official digital subscription portal for USP–NF monographs and general chapters.'
      },
      {
        id: 'usp_org',
        label: 'USP Standards & Revision Notices',
        url: 'https://www.usp.org',
        kind: 'notices',
        note: 'Official revision bulletins, Pharmacopeial Forum links, and Reference Standards catalog.'
      }
    ],
    officialNoticesUrl: 'https://www.usp.org',
    verifiedEditionSummary:
      'Continuously maintained online compendium with scheduled official effective dates, Revision Bulletins, and Accelerated Revisions.',
    editionTrackingNote:
      'Verify official effective dates and Errata / Revision Bulletins directly on uspnf.com and usp.org.',
    analyticalTestCategories: [
      'assays_titrimetry',
      'limit_tests_impurities',
      'identification_spectroscopy',
      'dissolution_release',
      'disintegration_physical',
      'sterility_microbial',
      'chromatography_separation',
      'reagents_standards'
    ],
    standardCategories: [
      'general_notices',
      'general_chapters',
      'drug_substances',
      'dosage_forms',
      'excipients',
      'impurities_elemental',
      'quality_guidance'
    ],
    searchableKeywords: [
      'USP',
      'NF',
      'United States Pharmacopeia',
      'National Formulary',
      'General Chapters',
      'dissolution',
      '711',
      '621',
      '232',
      'excipients'
    ],
    linkedReferenceCenterId: 'pharma_usp_nf'
  },
  {
    id: 'pc_ph_eur',
    abbreviation: 'Ph. Eur.',
    fullName: 'European Pharmacopoeia',
    classification: 'primary_pharmacopoeia',
    isPharmacopoeia: true,
    countryOrRegion: 'Europe (Council of Europe Member States)',
    issuingOrganization:
      'European Directorate for the Quality of Medicines & HealthCare (EDQM), Council of Europe',
    description:
      'Single legally binding reference work for quality control of medicines across Council of Europe signatory states, providing harmonized general methods and substance/preparation monographs.',
    purpose:
      'Protects public health by establishing uniform, legally mandatory quality standards for medicinal substances, excipients, and dosage forms across Europe.',
    scope:
      'General Methods of Analysis, Reagents, Materials & Containers, General Monographs on Dosage Forms, Individual Active Substances & Excipients, Vaccines, and Herbal Drugs.',
    officialWebsite: 'https://www.edqm.eu/en/european-pharmacopoeia',
    onlineAccessibilityStatus:
      'EDQM Ph. Eur. Online requires license/subscription; Pharmeuropa draft texts, Knowledge Database metadata, and implementation announcements are publicly accessible.',
    contentAccessType: 'subscription',
    accessLimitations:
      'Full binding monograph texts require an EDQM subscription; public EDQM portals provide index metadata and draft texts.',
    searchSupport: 'local_imported_pdf',
    relevantDepartments: [
      'pharmaceutical_analysis',
      'pharmaceutical_chemistry',
      'pharmaceutics',
      'quality_assurance',
      'industrial_pharmacy',
      'pharmacognosy',
      'pharmaceutical_microbiology'
    ],
    syllabusRelevance: [
      'Quality Assurance & Regulatory Affairs — European Marketing Authorization & CEP (Certificate of Suitability) standards',
      'Pharmaceutical Analysis — Harmonized ICH Q3D / Q4B analytical methods and impurity control'
    ],
    officialLinks: [
      {
        id: 'pheur_portal',
        label: 'EDQM European Pharmacopoeia Portal',
        url: 'https://www.edqm.eu/en/european-pharmacopoeia',
        kind: 'portal',
        note: 'Official EDQM information, edition schedules, and subscriber access.'
      },
      {
        id: 'pheur_knowledge',
        label: 'EDQM Knowledge Database (Public Metadata)',
        url: 'https://pheur.edqm.eu',
        kind: 'documentation',
        note: 'Publicly viewable status of Ph. Eur. texts, monograph titles, and supplement history.'
      }
    ],
    officialNoticesUrl: 'https://www.edqm.eu/en/european-pharmacopoeia',
    verifiedEditionSummary:
      'Published in numbered Editions with periodic Supplements; verify binding implementation dates via EDQM.',
    editionTrackingNote:
      'EDQM Knowledge Database lists current supplement status and monograph implementation timelines publicly.',
    analyticalTestCategories: [
      'assays_titrimetry',
      'limit_tests_impurities',
      'identification_spectroscopy',
      'dissolution_release',
      'disintegration_physical',
      'sterility_microbial',
      'chromatography_separation',
      'reagents_standards'
    ],
    standardCategories: [
      'general_notices',
      'general_chapters',
      'drug_substances',
      'dosage_forms',
      'excipients',
      'impurities_elemental',
      'quality_guidance'
    ],
    searchableKeywords: [
      'European Pharmacopoeia',
      'Ph. Eur.',
      'EDQM',
      'CEP',
      'Pharmeuropa',
      'harmonized'
    ],
    linkedReferenceCenterId: 'pharma_eur'
  },
  {
    id: 'pc_who_int',
    abbreviation: 'WHO Ph. Int.',
    fullName: 'The International Pharmacopoeia',
    classification: 'international_pharmacopoeia',
    isPharmacopoeia: true,
    countryOrRegion: 'International (Global / WHO Member States)',
    issuingOrganization: 'World Health Organization (WHO)',
    description:
      'Recommended international collection of quality specifications for pharmaceutical substances and finished dosage forms, especially aligned with the WHO Model List of Essential Medicines.',
    purpose:
      'Provides globally accessible reference specifications that WHO Member States and national regulatory authorities may adopt directly or adapt into national pharmacopoeias.',
    scope:
      'General Notices, Methods of Analysis, Essential Medicines Monographs (APIs and finished pharmaceutical products), Pediatric Formulations, Radiopharmaceuticals, and Infrared Reference Spectra.',
    officialWebsite:
      'https://www.who.int/teams/health-product-and-policy-standards/standards-and-specifications/norms-and-standards-for-pharmaceuticals/pharmacopoeia',
    onlineAccessibilityStatus:
      'Publicly accessible online free of charge via WHO and the official WHO International Pharmacopoeia online compendium.',
    contentAccessType: 'public',
    accessLimitations:
      'WHO advisory standard — legal enforceability depends on formal adoption by a country’s regulatory authority.',
    searchSupport: 'official_public_portal',
    relevantDepartments: [
      'pharmaceutical_analysis',
      'pharmaceutical_chemistry',
      'pharmaceutics',
      'quality_assurance',
      'pharmacology',
      'pharmaceutical_microbiology'
    ],
    syllabusRelevance: [
      'BP102T Unit I — Global pharmacopoeial standards & WHO Essential Medicines quality control',
      'Pharmaceutical Analysis & QA — Basic tests, titrimetric/spectroscopic/HPLC assays for essential drugs'
    ],
    officialLinks: [
      {
        id: 'who_phint_main',
        label: 'WHO International Pharmacopoeia Portal',
        url: 'https://www.who.int/teams/health-product-and-policy-standards/standards-and-specifications/norms-and-standards-for-pharmaceuticals/pharmacopoeia',
        kind: 'portal',
        note: 'Official WHO department page, background, and edition releases.'
      },
      {
        id: 'who_phint_online',
        label: 'WHO Ph. Int. Online Compendium (Public Full Text)',
        url: 'https://digicollections.net/phint/',
        kind: 'compendium',
        note: 'Publicly searchable official online digital collection of Ph. Int. texts.'
      }
    ],
    officialNoticesUrl:
      'https://www.who.int/teams/health-product-and-policy-standards/standards-and-specifications/norms-and-standards-for-pharmaceuticals/pharmacopoeia',
    verifiedEditionSummary:
      'Publicly hosted in digital editions by the World Health Organization; verify latest published edition directly on the WHO portal.',
    editionTrackingNote:
      'WHO publishes edition updates, draft monographs for consultation, and online compendium releases openly.',
    analyticalTestCategories: [
      'assays_titrimetry',
      'limit_tests_impurities',
      'identification_spectroscopy',
      'dissolution_release',
      'disintegration_physical',
      'sterility_microbial',
      'chromatography_separation',
      'reagents_standards'
    ],
    standardCategories: [
      'general_notices',
      'general_chapters',
      'drug_substances',
      'dosage_forms',
      'impurities_elemental',
      'quality_guidance'
    ],
    searchableKeywords: [
      'International Pharmacopoeia',
      'Ph. Int.',
      'WHO',
      'Essential Medicines',
      'public',
      'open access'
    ],
    linkedReferenceCenterId: 'pharma_who_int'
  },
  {
    id: 'pc_jp',
    abbreviation: 'JP',
    fullName: 'Japanese Pharmacopoeia',
    classification: 'international_pharmacopoeia',
    isPharmacopoeia: true,
    countryOrRegion: 'Japan',
    issuingOrganization:
      'Ministry of Health, Labour and Welfare (MHLW) & Pharmaceuticals and Medical Devices Agency (PMDA)',
    description:
      'Official pharmacopoeia of Japan establishing statutory specifications, standards, and testing methods necessary to ensure the quality and safety of drugs distributed in Japan.',
    purpose:
      'Regulates pharmaceutical quality under Japan’s Pharmaceutical and Medical Device Act and participates in Pharmacopoeial Discussion Group (PDG) international harmonization.',
    scope:
      'General Notices, General Rules for Crude Drugs and Preparations, General Tests, Processes & Apparatus, Official Monographs (Part I chemical drugs; Part II crude drugs & biologics), and Reference Information.',
    officialWebsite:
      'https://www.pmda.go.jp/english/rs-sb-std/standards-development/jp/0019.html',
    onlineAccessibilityStatus:
      'Official English translations of JP editions and supplements are publicly accessible free of charge as official PMDA documents.',
    contentAccessType: 'public',
    accessLimitations:
      'Japanese-language legal text issued by MHLW is the authoritative statutory version; English PDFs on PMDA are official reference translations.',
    searchSupport: 'official_public_portal',
    relevantDepartments: [
      'pharmaceutical_analysis',
      'pharmaceutical_chemistry',
      'pharmaceutics',
      'quality_assurance',
      'industrial_pharmacy',
      'pharmacognosy'
    ],
    syllabusRelevance: [
      'Quality Assurance & Regulatory Affairs — PDG Tri-Pharmacopoeial Harmonization (USP–NF, Ph. Eur., JP)',
      'Pharmacognosy — Part II Crude Drugs and Traditional Kampo Materia Medica standards'
    ],
    officialLinks: [
      {
        id: 'jp_pmda_main',
        label: 'PMDA Japanese Pharmacopoeia Portal',
        url: 'https://www.pmda.go.jp/english/rs-sb-std/standards-development/jp/0019.html',
        kind: 'portal',
        note: 'Official PMDA English gateway for JP standards development and harmonization.'
      },
      {
        id: 'jp_pmda_editions',
        label: 'PMDA Official JP Editions & Supplements',
        url: 'https://www.pmda.go.jp/english/rs-sb-std/standards-development/jp/0029.html',
        kind: 'notices',
        note: 'Publicly hosted English PDFs for JP editions, supplements, and errata notices.'
      }
    ],
    officialNoticesUrl:
      'https://www.pmda.go.jp/english/rs-sb-std/standards-development/jp/0029.html',
    verifiedEditionSummary:
      'Published in five-year full editions with interim Supplements; official English versions and supplements are hosted publicly on PMDA.',
    editionTrackingNote:
      'Verify latest edition, Supplement I/II, and PDG harmonization updates on PMDA’s Editions & Supplements page.',
    analyticalTestCategories: [
      'assays_titrimetry',
      'limit_tests_impurities',
      'identification_spectroscopy',
      'dissolution_release',
      'disintegration_physical',
      'sterility_microbial',
      'chromatography_separation',
      'reagents_standards'
    ],
    standardCategories: [
      'general_notices',
      'general_chapters',
      'drug_substances',
      'dosage_forms',
      'excipients',
      'impurities_elemental'
    ],
    searchableKeywords: [
      'Japanese Pharmacopoeia',
      'JP',
      'PMDA',
      'MHLW',
      'PDG',
      'harmonization',
      'crude drugs'
    ]
  },
  {
    id: 'pc_chp',
    abbreviation: 'ChP',
    fullName: 'Chinese Pharmacopoeia',
    classification: 'international_pharmacopoeia',
    isPharmacopoeia: true,
    countryOrRegion: 'People’s Republic of China',
    issuingOrganization:
      'Chinese Pharmacopoeia Commission (National Medical Products Administration — NMPA)',
    description:
      'Official national code of pharmaceutical standards of China covering Traditional Chinese Medicine (TCM), chemical drugs, biological products, pharmaceutical excipients, and testing methods.',
    purpose:
      'Establishes legally binding quality specifications and general analytical procedures for medicinal production, inspection, import/export, and supervision in China.',
    scope:
      'Multi-volume structure spanning Traditional Chinese Materia Medica & Prepared Slices, Chemical Drugs, Biological Products, Excipients, and General Technical Requirements.',
    officialWebsite: 'https://www.chp.org.cn',
    onlineAccessibilityStatus:
      'Official Chinese Pharmacopoeia Commission website and national standards database operate primarily in Chinese; official English editions are distributed via licensed publications.',
    contentAccessType: 'restricted',
    accessLimitations:
      'Full monograph texts are primarily published in Chinese via official compendia/licensed databases; English editions require licensed purchase.',
    searchSupport: 'catalog_metadata_only',
    relevantDepartments: [
      'pharmaceutical_analysis',
      'pharmaceutical_chemistry',
      'pharmaceutics',
      'quality_assurance',
      'pharmacognosy',
      'industrial_pharmacy'
    ],
    syllabusRelevance: [
      'BP105T Pharmacognosy — TCM herbal quality standards alongside WHO & Ayurvedic traditions',
      'Quality Assurance & Industrial Pharmacy — Global API supply-chain regulatory awareness'
    ],
    officialLinks: [
      {
        id: 'chp_portal',
        label: 'Chinese Pharmacopoeia Commission Portal',
        url: 'https://www.chp.org.cn',
        kind: 'portal',
        note: 'Official commission homepage and national drug standard announcements (Chinese).'
      },
      {
        id: 'chp_db',
        label: 'ChP Official Standards Platform',
        url: 'https://ydz.chp.org.cn',
        kind: 'compendium',
        note: 'Official Chinese Pharmacopoeia Commission online standards database.'
      }
    ],
    officialNoticesUrl: 'https://www.chp.org.cn',
    verifiedEditionSummary:
      'Compiled in five-year revision cycles across multi-volume compendia; verify active edition and official addenda via chp.org.cn.',
    editionTrackingNote:
      'Official announcements and revision drafts are posted on the Chinese Pharmacopoeia Commission website.',
    analyticalTestCategories: [
      'assays_titrimetry',
      'limit_tests_impurities',
      'identification_spectroscopy',
      'dissolution_release',
      'chromatography_separation',
      'reagents_standards'
    ],
    standardCategories: [
      'general_notices',
      'general_chapters',
      'drug_substances',
      'dosage_forms',
      'excipients'
    ],
    searchableKeywords: [
      'Chinese Pharmacopoeia',
      'ChP',
      'NMPA',
      'TCM',
      'herbal',
      'API standards'
    ]
  },
  {
    id: 'pc_martindale',
    abbreviation: 'Martindale',
    fullName: 'Martindale: The Complete Drug Reference',
    classification: 'reference_book',
    isPharmacopoeia: false,
    countryOrRegion: 'United Kingdom / International',
    issuingOrganization: 'Pharmaceutical Press (Royal Pharmaceutical Society)',
    description:
      'Authoritative clinical and pharmaceutical drug reference encyclopedia providing evaluated global drug information, clinical pharmacology, adverse effects, interactions, pharmacokinetics, and international proprietary names. It is NOT a statutory pharmacopoeia.',
    purpose:
      'Supports clinical drug evaluation, therapeutic comparison, formulation context, international synonym identification, and pharmacy practice reference — distinct from legal quality-control pharmacopoeial specifications.',
    scope:
      'Clinical drug monographs, therapeutic groups, adverse effects, precautions, pharmacokinetic summaries, clinical uses, and international multi-country brand/preparations indexes.',
    officialWebsite: 'https://www.pharmaceuticalpress.com',
    onlineAccessibilityStatus:
      'Available digitally through Pharmaceutical Press / MedicinesComplete under institutional or individual subscription; also published in print.',
    contentAccessType: 'subscription',
    accessLimitations:
      'Commercial clinical reference work requiring subscription (MedicinesComplete) or print purchase; does not replace official statutory pharmacopoeial test specifications.',
    searchSupport: 'local_imported_pdf',
    relevantDepartments: [
      'pharmacology',
      'pharmaceutics',
      'pharmaceutical_chemistry',
      'quality_assurance'
    ],
    syllabusRelevance: [
      'Clinical Pharmacy & Pharmacology — Global drug monographs, adverse effects, and therapeutic classes',
      'Pharmaceutics & Compounding — Distinguishing clinical drug references from statutory pharmacopoeias'
    ],
    officialLinks: [
      {
        id: 'martindale_pub',
        label: 'Pharmaceutical Press Official Page',
        url: 'https://www.pharmaceuticalpress.com',
        kind: 'portal',
        note: 'Official publisher page for Martindale: The Complete Drug Reference.'
      },
      {
        id: 'martindale_mc',
        label: 'MedicinesComplete Online Access',
        url: 'https://www.medicinescomplete.com',
        kind: 'compendium',
        note: 'Subscription platform hosting digital Martindale drug monographs.'
      }
    ],
    officialNoticesUrl: 'https://www.pharmaceuticalpress.com',
    verifiedEditionSummary:
      'Published periodically by Pharmaceutical Press in print and continuously updated on MedicinesComplete.',
    editionTrackingNote:
      'Note: Classified explicitly as a Pharmaceutical Reference Book, not a legal pharmacopoeia.',
    analyticalTestCategories: [],
    standardCategories: ['drug_substances', 'dosage_forms'],
    searchableKeywords: [
      'Martindale',
      'Complete Drug Reference',
      'Pharmaceutical Press',
      'MedicinesComplete',
      'clinical pharmacology',
      'drug reference book',
      'proprietary names'
    ],
    linkedReferenceCenterId: 'hb_martindale'
  }
];

export const ANALYTICAL_TEST_FACETS: AnalyticalTestFacet[] = [
  {
    id: 'assays_titrimetry',
    title: 'Assays & Volumetric Titrimetry',
    summary:
      'Acid-base, redox, precipitation, complexometric (EDTA), and non-aqueous titrimetric assays alongside instrumental assays.',
    typicalMethods: ['Acidimetry / Alkalimetry', 'Cerimetry / Permanganometry', 'Complexometry (EDTA)', 'Volhard / Mohr Titration'],
    relevantDepartments: ['pharmaceutical_analysis', 'pharmaceutical_chemistry', 'quality_assurance'],
    pharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur', 'pc_who_int', 'pc_jp', 'pc_chp'],
    recommendedSearchQuery: 'titrimetry'
  },
  {
    id: 'limit_tests_impurities',
    title: 'Limit Tests & Inorganic Impurities',
    summary:
      'Qualitative and semi-quantitative comparison tests for trace inorganic impurities using Nessler cylinders or specialized apparatus.',
    typicalMethods: ['Chloride Limit Test', 'Sulphate Limit Test', 'Iron & Heavy Metals', 'Arsenic (Gutzeit Apparatus)'],
    relevantDepartments: ['pharmaceutical_analysis', 'pharmaceutical_chemistry', 'quality_assurance'],
    pharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur', 'pc_who_int', 'pc_jp', 'pc_chp'],
    recommendedSearchQuery: 'limit test'
  },
  {
    id: 'identification_spectroscopy',
    title: 'Identification & Spectroscopy',
    summary:
      'Infrared (IR) absorption spectra, UV-Visible spectrophotometry, flame tests, and characteristic chemical identification reactions.',
    typicalMethods: ['FTIR Reference Spectra', 'UV-Vis Absorbance', 'Specific Optical Rotation', 'Melting / Boiling Range'],
    relevantDepartments: ['pharmaceutical_analysis', 'pharmaceutical_chemistry', 'quality_assurance'],
    pharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur', 'pc_who_int', 'pc_jp', 'pc_chp'],
    recommendedSearchQuery: 'spectroscopy'
  },
  {
    id: 'dissolution_release',
    title: 'Dissolution & Drug Release Testing',
    summary:
      'Apparatus specifications (Basket, Paddle, Reciprocating Cylinder, Flow-Through Cell) and in-vitro drug release verification.',
    typicalMethods: ['Paddle / Basket Dissolution', 'Media Degassing & Sink Conditions', 'Modified-Release Profiles'],
    relevantDepartments: ['pharmaceutics', 'industrial_pharmacy', 'pharmaceutical_analysis', 'quality_assurance'],
    pharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur', 'pc_who_int', 'pc_jp', 'pc_chp'],
    recommendedSearchQuery: 'dissolution'
  },
  {
    id: 'disintegration_physical',
    title: 'Disintegration, Uniformity & Physical Tests',
    summary:
      'Tablet/capsule disintegration, weight variation, friability, content uniformity, pH, viscosity, and moisture/loss on drying.',
    typicalMethods: ['Disintegration Apparatus', 'Uniformity of Dosage Units', 'Loss on Drying (LOD)', 'Ash & Extractive Values'],
    relevantDepartments: ['pharmaceutics', 'industrial_pharmacy', 'quality_assurance', 'pharmacognosy'],
    pharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur', 'pc_who_int', 'pc_jp'],
    recommendedSearchQuery: 'disintegration'
  },
  {
    id: 'sterility_microbial',
    title: 'Sterility, Endotoxin & Microbial Limits',
    summary:
      'Sterility testing of parenterals, bacterial endotoxins (LAL), particulate matter, and microbial enumeration for non-sterile products.',
    typicalMethods: ['Membrane Filtration Sterility', 'Bacterial Endotoxins Test', 'Microbial Enumeration (TAMC/TYMC)', 'Autoclave F0 Validation'],
    relevantDepartments: ['pharmaceutical_microbiology', 'pharmaceutics', 'quality_assurance', 'industrial_pharmacy'],
    pharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur', 'pc_who_int', 'pc_jp'],
    recommendedSearchQuery: 'sterility'
  },
  {
    id: 'chromatography_separation',
    title: 'Chromatography & Separation Science',
    summary:
      'HPLC, UHPLC, GC, TLC/HPTLC, and system suitability parameters governing assay and related-substances testing.',
    typicalMethods: ['HPLC / UPLC Assay', 'Related Substances Profiling', 'Gas Chromatography (Residual Solvents)', 'HPTLC Botanical Fingerprinting'],
    relevantDepartments: ['pharmaceutical_analysis', 'quality_assurance', 'pharmacognosy'],
    pharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur', 'pc_who_int', 'pc_jp', 'pc_chp'],
    recommendedSearchQuery: 'chromatography'
  },
  {
    id: 'reagents_standards',
    title: 'Reagents, Volumetric Solutions & Reference Standards',
    summary:
      'Specifications for analytical reagents, primary standards, indicator solutions, buffer preparation, and certified reference substances.',
    typicalMethods: ['Standardization of Titrants', 'Buffer Solutions Preparation', 'Certified Reference Substances (CRS/RS)'],
    relevantDepartments: ['pharmaceutical_analysis', 'pharmaceutical_chemistry', 'quality_assurance'],
    pharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur', 'pc_who_int', 'pc_jp', 'pc_chp'],
    recommendedSearchQuery: 'reagents'
  }
];

export const STANDARD_CATEGORY_FACETS: StandardCategoryFacet[] = [
  {
    id: 'general_notices',
    title: 'General Notices',
    summary:
      'Foundational legal, interpretive, temperature, solubility, percentage, and significant-figure rules governing all monographs in a pharmacopoeia.',
    examples: ['Expression of Concentrations', 'Storage Conditions & Temperatures', 'Official Test Precedence'],
    pharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur', 'pc_who_int', 'pc_jp', 'pc_chp'],
    recommendedSearchQuery: 'General Notices'
  },
  {
    id: 'general_chapters',
    title: 'General Chapters & Appendices',
    summary:
      'Cross-cutting physical, chemical, microbiological, and packaging test methods referenced by individual monographs.',
    examples: ['Chromatography', 'Dissolution', 'Microbial Limits', 'Sterilization & Containers'],
    pharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur', 'pc_who_int', 'pc_jp', 'pc_chp'],
    recommendedSearchQuery: 'General Chapters'
  },
  {
    id: 'drug_substances',
    title: 'Drug Substances (APIs)',
    summary:
      'Monographs specifying identity, purity, related substances, water content, and assay scope for active pharmaceutical ingredients.',
    examples: ['Paracetamol / Acetaminophen', 'Aspirin', 'Metformin Hydrochloride', 'Ferrous Sulphate'],
    pharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur', 'pc_who_int', 'pc_jp', 'pc_chp', 'pc_martindale'],
    recommendedSearchQuery: 'Paracetamol'
  },
  {
    id: 'dosage_forms',
    title: 'Dosage Form Monographs',
    summary:
      'Finished product quality requirements covering tablets, capsules, injectables, oral liquids, ophthalmics, and topical preparations.',
    examples: ['Tablets & Capsules', 'Parenteral Preparations', 'Oral Rehydration Salts (ORS)', 'Ophthalmic Drops'],
    pharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur', 'pc_who_int', 'pc_jp', 'pc_chp', 'pc_martindale'],
    recommendedSearchQuery: 'Tablets'
  },
  {
    id: 'excipients',
    title: 'Excipients & Formulation Aids',
    summary:
      'Standards for diluents, binders, disintegrants, preservatives, vehicles, and coating polymers (e.g., NF section in USP–NF).',
    examples: ['Lactose Monohydrate', 'Microcrystalline Cellulose', 'Bentonite', 'Purified Water / WFI'],
    pharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur', 'pc_jp', 'pc_chp'],
    recommendedSearchQuery: 'excipients'
  },
  {
    id: 'impurities_elemental',
    title: 'Impurities, Residual Solvents & Elemental Limits',
    summary:
      'General and specific frameworks for organic related substances, elemental impurities, nitrosamines, and residual solvents.',
    examples: ['Elemental Impurities', 'Residual Solvents', 'Limit Tests for Heavy Metals'],
    pharmacopoeiaIds: ['pc_ip', 'pc_bp', 'pc_usp_nf', 'pc_ph_eur', 'pc_who_int', 'pc_jp'],
    recommendedSearchQuery: 'impurities'
  },
  {
    id: 'quality_guidance',
    title: 'Quality Assurance & Harmonization Guidance',
    summary:
      'Informational chapters, validation principles, PDG harmonization status, and WHO normative guidance.',
    examples: ['Analytical Method Validation', 'PDG Harmonization', 'Good Pharmacopoeial Practices'],
    pharmacopoeiaIds: ['pc_ip', 'pc_usp_nf', 'pc_ph_eur', 'pc_who_int'],
    recommendedSearchQuery: 'harmonization'
  }
];

export const CURATED_ACADEMIC_LINKS: PharmacopoeiaAcademicLink[] = [
  {
    id: 'acad_ip_bp102t',
    entryId: 'pc_ip',
    departmentKey: 'pharmaceutics',
    subjectCode: 'BP102T',
    subjectTitle: 'Pharmaceutics I',
    unitTitle: 'Unit I — Historical Background & Pharmacopoeias',
    topicId: 'bp102t_unit1_pharmacopoeias',
    topicTitle: 'Indian Pharmacopoeia & Official Compendia',
    subtopicTitle: 'History, Edition Evolution & Salient Features of IP',
    experimentModuleId: 'general_pharmacy',
    experimentTitle: 'BP107P Compendial Compounding & Dosage Calculations',
    rationale: 'Primary statutory standard taught in BP102T Unit I and applied across BP107P official preparations.',
    isUserAdded: false,
    createdAt: 1
  },
  {
    id: 'acad_ip_bp106t',
    entryId: 'pc_ip',
    departmentKey: 'pharmaceutical_analysis',
    subjectCode: 'BP106T / BP111P',
    subjectTitle: 'Pharmaceutical Inorganic Chemistry',
    unitTitle: 'Unit I — Impurities in Pharmaceutical Substances',
    topicId: 'bp106t_unit1_impurities',
    topicTitle: 'Sources of Impurities & IP Limit Tests',
    subtopicTitle: 'Limit tests for Chloride, Sulphate, Iron, Lead & Arsenic (Gutzeit)',
    experimentModuleId: 'inorganic',
    experimentTitle: 'BP111P Limit Tests & Volumetric Assays',
    rationale: 'Direct foundation for BP111P limit test apparatus and volumetric titrimetric assays.',
    isUserAdded: false,
    createdAt: 1
  },
  {
    id: 'acad_ip_bp105t',
    entryId: 'pc_ip',
    departmentKey: 'pharmacognosy',
    subjectCode: 'BP105T / BP110P',
    subjectTitle: 'Pharmacognosy & Phytochemistry',
    unitTitle: 'Unit III — Quality Control of Crude Drugs',
    topicTitle: 'Physicochemical Evaluation of Crude Drugs',
    subtopicTitle: 'Ash values, extractive values, moisture content & foreign matter',
    experimentModuleId: 'pharmacognosy',
    experimentTitle: 'BP110P Crude Drug QC & Leaf Constants',
    rationale: 'Standard pharmacopoeial parameters for botanical drug evaluation in BP110P.',
    isUserAdded: false,
    createdAt: 1
  },
  {
    id: 'acad_bp_bp102t',
    entryId: 'pc_bp',
    departmentKey: 'pharmaceutics',
    subjectCode: 'BP102T',
    subjectTitle: 'Pharmaceutics I',
    unitTitle: 'Unit I — Pharmacopoeias & Dosage Forms',
    topicTitle: 'British Pharmacopoeia & BPC Compounding Heritage',
    experimentModuleId: 'general_pharmacy',
    experimentTitle: 'BP107P Compounding Formulations',
    rationale: 'Key comparative pharmacopoeia covered alongside IP and USP–NF in Pharmaceutics I.',
    isUserAdded: false,
    createdAt: 1
  },
  {
    id: 'acad_uspnf_dissolution',
    entryId: 'pc_usp_nf',
    departmentKey: 'industrial_pharmacy',
    subjectCode: 'BP102T / Industrial Pharmacy',
    subjectTitle: 'Industrial Pharmacy & Biopharmaceutics',
    unitTitle: 'Solid Dosage Form Evaluation',
    topicTitle: 'Dissolution Apparatus & Excipient Standards (NF)',
    experimentModuleId: 'interactive_experiments',
    experimentTitle: 'Tablet Dissolution Kinetics Simulator',
    rationale: 'USP–NF defines widely adopted paddle/basket dissolution frameworks and NF excipient monographs.',
    isUserAdded: false,
    createdAt: 1
  },
  {
    id: 'acad_pheur_qa',
    entryId: 'pc_ph_eur',
    departmentKey: 'quality_assurance',
    subjectCode: 'Quality Assurance',
    subjectTitle: 'Pharmaceutical Quality Assurance',
    unitTitle: 'International Compendial Standards & Harmonization',
    topicTitle: 'EDQM Standards, CEPs & Harmonized Methods',
    rationale: 'Essential quality control reference for European regulatory compliance and PDG harmonization.',
    isUserAdded: false,
    createdAt: 1
  },
  {
    id: 'acad_who_qa',
    entryId: 'pc_who_int',
    departmentKey: 'pharmaceutical_chemistry',
    subjectCode: 'BP102T / Quality Assurance',
    subjectTitle: 'Essential Medicines & Global Quality Control',
    unitTitle: 'International Pharmacopoeial Norms',
    topicTitle: 'WHO Ph. Int. Public Monographs & Essential Drugs',
    experimentModuleId: 'inorganic',
    experimentTitle: 'Assays & Titrimetric Standardization',
    rationale: 'Openly accessible official standard supporting essential medicine testing globally.',
    isUserAdded: false,
    createdAt: 1
  },
  {
    id: 'acad_jp_pdg',
    entryId: 'pc_jp',
    departmentKey: 'quality_assurance',
    subjectCode: 'Quality Assurance',
    subjectTitle: 'Pharmaceutical Quality Assurance & Regulatory Affairs',
    unitTitle: 'Pharmacopoeial Harmonization (PDG)',
    topicTitle: 'Japanese Pharmacopoeia & Tri-Lateral Harmonization',
    rationale: 'Demonstrates PDG alignment across USP–NF, Ph. Eur., and JP alongside crude drug Part II chapters.',
    isUserAdded: false,
    createdAt: 1
  },
  {
    id: 'acad_chp_pcog',
    entryId: 'pc_chp',
    departmentKey: 'pharmacognosy',
    subjectCode: 'BP105T',
    subjectTitle: 'Pharmacognosy',
    unitTitle: 'Unit I — Traditional Systems & Global Crude Drug Standards',
    topicTitle: 'Chinese Pharmacopoeia & Botanical Monograph Structure',
    experimentModuleId: 'pharmacognosy',
    experimentTitle: 'Traditional Systems & Crude Drug Quality',
    rationale: 'Relevant for comparative herbal standardization in BP105T and global API supply-chain QA.',
    isUserAdded: false,
    createdAt: 1
  },
  {
    id: 'acad_martindale_clin',
    entryId: 'pc_martindale',
    departmentKey: 'pharmacology',
    subjectCode: 'Pharmacology & Pharmacy Practice',
    subjectTitle: 'Clinical Pharmacology & Drug Information',
    unitTitle: 'Tertiary Drug Information Resources',
    topicTitle: 'Evaluating Clinical Drug References vs Statutory Pharmacopoeias',
    rationale: 'Illustrates the clear distinction between clinical drug encyclopedias (Martindale) and legal QC pharmacopoeias.',
    isUserAdded: false,
    createdAt: 1
  }
];
