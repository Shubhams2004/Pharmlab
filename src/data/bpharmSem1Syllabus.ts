export interface SyllabusSchemeRow {
  courseCode: string;
  courseName: string;
  hoursPerWeek: string;
  creditPoints: string;
}

export interface SyllabusCourseOutcome {
  coNo: number;
  statement: string;
}

export interface SyllabusUnitSection {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface SyllabusTheoryUnit {
  unitNo: string;
  title?: string;
  sections: SyllabusUnitSection[];
  lectures: string;
}

export interface SyllabusPracticalBlock {
  heading?: string;
  introParagraphs?: string[];
  items?: Array<{
    number?: string;
    title: string;
    subItems?: string[];
    description?: string;
  }>;
  notes?: string[];
}

export interface SyllabusCourse {
  courseCode: string;
  courseTitle: string;
  courseType: string;
  credit: string;
  hoursPerWeek: {
    L: string;
    T: string;
    P: string;
  };
  maxHours: string;
  maximumMarks: string;
  se: string;
  ese: string;
  pdfStartPage: number;
  pdfEndPage: number;
  docPageStart: number;
  docPageEnd: number;
  objectivesHeading: string;
  objectivesIntro: string;
  objectives: string[];
  outcomesHeading: string;
  outcomes: SyllabusCourseOutcome[];
  kind: 'theory' | 'practical';
  units?: SyllabusTheoryUnit[];
  practicalHeading?: string;
  practicalSubtitle?: string;
  practicalIntro?: string;
  practicalBlocks?: SyllabusPracticalBlock[];
  referencesHeading: string;
  references: string[];
}

export const SEMESTER_I_SCHEME = {
  documentHeader: 'B.Pharm Syllabus',
  semesterTitle: 'Semester I',
  pdfPage: 1,
  docPage: 38,
  rows: [
    {
      courseCode: 'BP101T',
      courseName: 'Basics of Python Programming for Pharmaceutical Sciences (Theory)',
      hoursPerWeek: '2',
      creditPoints: '2'
    },
    {
      courseCode: 'BP102T',
      courseName: 'General Pharmacy (Theory)',
      hoursPerWeek: '3',
      creditPoints: '3'
    },
    {
      courseCode: 'BP103T',
      courseName: 'Healthcare Psychology and Communication Skills (Theory)',
      hoursPerWeek: '1',
      creditPoints: '1'
    },
    {
      courseCode: 'BP104T',
      courseName: 'Human Anatomy, Physiology and Pathophysiology I (Theory)',
      hoursPerWeek: '4',
      creditPoints: '4'
    },
    {
      courseCode: 'BP105T',
      courseName: 'Introduction to Pharmacognosy (Theory)',
      hoursPerWeek: '3',
      creditPoints: '3'
    },
    {
      courseCode: 'BP106T',
      courseName: 'Pharmaceutical Inorganic and Analytical Chemistry (Theory)',
      hoursPerWeek: '3',
      creditPoints: '3'
    },
    {
      courseCode: 'BP107P',
      courseName: 'General Pharmacy (Practical)',
      hoursPerWeek: '3',
      creditPoints: '1'
    },
    {
      courseCode: 'BP108P',
      courseName: 'Healthcare Psychology and Communication Skills (Practical)',
      hoursPerWeek: '2',
      creditPoints: '1'
    },
    {
      courseCode: 'BP109P',
      courseName: 'Human Anatomy, Physiology and Pathophysiology I (Practical)',
      hoursPerWeek: '3',
      creditPoints: '1'
    },
    {
      courseCode: 'BP110P',
      courseName: 'Introduction to Pharmacognosy (Practical)',
      hoursPerWeek: '3',
      creditPoints: '1'
    },
    {
      courseCode: 'BP111P',
      courseName: 'Pharmaceutical Inorganic and Analytical Chemistry (Practical)',
      hoursPerWeek: '3',
      creditPoints: '1'
    }
  ] as SyllabusSchemeRow[],
  totalHoursPerWeek: '30',
  totalCreditPoints: '21'
};

export const SYLLABUS_COURSES: SyllabusCourse[] = [
  {
    courseCode: 'BP101T',
    courseTitle: 'Basics of Python Programming for Pharmaceutical Sciences (Theory)',
    courseType: 'Core',
    credit: '2',
    hoursPerWeek: { L: '2', T: '--', P: '--' },
    maxHours: '30',
    maximumMarks: '50',
    se: '20',
    ese: '30',
    pdfStartPage: 2,
    pdfEndPage: 4,
    docPageStart: 39,
    docPageEnd: 41,
    objectivesHeading: 'Course Objectives:',
    objectivesIntro: 'The objectives of this course are to:',
    objectives: [
      'Introduce the fundamentals of Python programming for pharmaceutical sciences.',
      'Develop basic programming skills using control structures, functions, and data structures.',
      'Provide knowledge of data handling techniques for structured dataset management.',
      'Familiarize students with data analysis tools such as NumPy and Pandas for healthcare datasets.',
      'Enable students to visualize and interpret pharmaceutical data.'
    ],
    outcomesHeading: 'Course Outcomes (CO):',
    outcomes: [
      {
        coNo: 1,
        statement:
          'Explain the fundamentals of Python programming, including variables, data types, operators, and libraries.'
      },
      {
        coNo: 2,
        statement: 'Analyze program logic using control structures and functions.'
      },
      {
        coNo: 3,
        statement:
          'Organize, manipulate, and retrieve data using data structures and file handling techniques.'
      },
      {
        coNo: 4,
        statement: 'Analyze pharmaceutical datasets using Python libraries.'
      },
      {
        coNo: 5,
        statement: 'Visualize and interpret pharmaceutical data using graphical tools.'
      }
    ],
    kind: 'theory',
    units: [
      {
        unitNo: 'I',
        title: 'Introduction to Python programming',
        lectures: '6 Hours',
        sections: [
          {
            bullets: [
              'Installing Python and an Integrated Development Environment (IDE) [Jupyter Notebook, PyCharm, VS Code etc.], Advantages of IDEs over text editors.',
              'Python variables and data types (integers, floats, strings, booleans), Type casting and basic operators (arithmetic, comparison, logical), Input and output operations.',
              'Basic string operations and manipulation techniques. Introduction to standard libraries and third-party libraries, installing and uninstalling libraries.'
            ]
          }
        ]
      },
      {
        unitNo: 'II',
        title: 'Control Structures & Functions',
        lectures: '6 hours',
        sections: [
          {
            bullets: [
              'Conditional statements (if, if-else, if-elif-else), nested conditions',
              'Loops (for loop, while loop).',
              'Break and continue statements.',
              'Defining and calling functions, passing arguments and returning values.',
              'Writing modular programs for simple pharmaceutical applications- dosage calculation and BMI calculation.'
            ]
          }
        ]
      },
      {
        unitNo: 'III',
        title: 'Data Structures & File Handling',
        lectures: '6 hours',
        sections: [
          {
            bullets: [
              'Lists, tuples, and dictionaries.',
              'Indexing and slicing lists, basic operations on lists and dictionaries, string manipulation techniques.',
              'Introduction to NumPy arrays, basic operations using NumPy (array creation, arithmetic operations).',
              'Reading and writing CSV files.',
              'Understanding structured healthcare datasets.',
              'Importing small pharmaceutical datasets and performing basic data access and manipulation tasks.'
            ]
          }
        ]
      },
      {
        unitNo: 'IV',
        title: 'Data Handling with Pandas',
        lectures: '6 Hours',
        sections: [
          {
            bullets: [
              'Introduction to Pandas library.',
              'Pandas Series and DataFrame structures.',
              'Reading CSV and Excel files-PK study datasets and ADR reports',
              'Inspecting datasets using functions such as head(), tail(), info(), and describe().',
              'Data cleaning techniques and handling missing values.',
              'Filtering and selecting data based on conditions.',
              'Grouping data and performing aggregation functions.'
            ]
          }
        ]
      },
      {
        unitNo: 'V',
        title: 'Data Visualization with Matplotlib',
        lectures: '6 Hours',
        sections: [
          {
            bullets: [
              'Introduction to Matplotlib.',
              'Creating line plots, histograms, scatter plots, and box plots.',
              'Labeling axes, titles, and legends.',
              'Create plots and visualize pharmaceutical datasets - concentration-time curves for oral and IV administration, ADR reporting rates across drugs, dissolution profiles.',
              'Scientific interpretation of plots.'
            ]
          }
        ]
      }
    ],
    referencesHeading: 'Recommended References (Preferably Latest Editions):',
    references: [
      'Weiss, C.J., 2017. Scientific Computing for Chemists with Python. Available at: https://weisscharlesj.github.io/SciCompforChemists/notebooks/introduction/intro.html',
      'Perkovic, L., 2015. Introduction to Computing Using Python: An Application Development Focus. 2nd ed. Hoboken: Wiley.',
      'Sweigart, A., 2025. Automate the Boring Stuff with Python. 3rd ed. Available at: https://automatetheboringstuff.com/',
      'W3Schools, n.d. Python Tutorial. Available at: https://www.w3schools.com/python/',
      'Datasets for Education and Research: Mentors and students can access healthcare datasets from sources such as Kaggle (healthcare records), government agencies (healthdata.gov, WHO, https://www.data.gov.in/), and clinical trial registries (https://ctri.nic.in/, https://clinicaltrials.gov/). Always use data responsibly.'
    ]
  },
  {
    courseCode: 'BP102T',
    courseTitle: 'General Pharmacy (Theory)',
    courseType: 'Core',
    credit: '3',
    hoursPerWeek: { L: '3', T: '--', P: '--' },
    maxHours: '45',
    maximumMarks: '75',
    se: '30',
    ese: '45',
    pdfStartPage: 5,
    pdfEndPage: 7,
    docPageStart: 42,
    docPageEnd: 44,
    objectivesHeading: 'COURSE OBJECTIVES',
    objectivesIntro: 'The objectives of this course are to:',
    objectives: [
      'Provide knowledge about evolution and development of Pharmacy profession in India and the growth of the Pharmaceutical Industries over the years.',
      'Provide understanding of different types of pharmacopoeias and other official books in maintaining the standards of medicines.',
      'Provide knowledge about the basic pharmaceutical calculations used in dispensing and compounding.',
      'Understand the role of active pharmaceutical ingredients and pharmaceutical excipients in drug formulations',
      'Impart basic knowledge about formulation and preparation of Various solid, liquid and semisolid dosage forms'
    ],
    outcomesHeading: 'Course Outcomes (CO):',
    outcomes: [
      {
        coNo: 1,
        statement:
          'Describe the history and evolution of the pharmacy profession, including pharmacopeial practices and prescription handling.'
      },
      {
        coNo: 2,
        statement:
          'Perform accurate pharmaceutical calculations required in the formulation and preparation of various types of dosage forms.'
      },
      {
        coNo: 3,
        statement:
          'Explain the properties and functions of active pharmaceutical ingredients (APIs) and excipients and demonstrate the methods of preparation of solid dosage forms.'
      },
      {
        coNo: 4,
        statement:
          'Illustrate the formulation principles of liquid dosage forms by analyzing the role of APIs and excipients involved.'
      },
      {
        coNo: 5,
        statement:
          'Compare and evaluate the formulation of semisolid dosage forms based on the characteristics of APIs, excipients, and preparation methods.'
      }
    ],
    kind: 'theory',
    units: [
      {
        unitNo: 'I',
        title: 'Introduction to the Profession of Pharmacy',
        lectures: '9 hours',
        sections: [
          {
            bullets: [
              'History of the Profession of Pharmacy in India: In relation to pharmacy education, pharmaceutical industries and organizations – evolution, development and milestones.',
              'Scope of the Pharmacy Profession: Role and responsibilities of pharmacists in retail/community pharmacy, hospital and clinical pharmacy, and industrial pharmacy including research and development.',
              'Pharmacopoeias: Introduction to IP, BP, USP, BPC, International Pharmacopoeia, other pharmacopoeias and the National Formulary of India; structure and content of the Indian Pharmacopoeia; study of one model IP monograph.',
              'Introduction to Prescription: Structure and format/parts of prescription, handling of prescriptions, Latin terminology related to prescriptions.'
            ]
          }
        ]
      },
      {
        unitNo: 'II',
        title: 'Introduction to Pharmaceutical Calculations and Dosage Forms',
        lectures: '9 hours',
        sections: [
          {
            bullets: [
              'Metric system of weights and measures; calculations based on alligation, proof spirit, isotonic solutions, dilute solutions (percentage and ratio) and geometric dilution; scientific notation of units and measures.',
              'Posology: Definition and dose calculation based on age, body weight and body surface area.',
              'Introduction to Dosage Forms: Routes of administration and classification of dosage forms.',
              'Introduction to Active Pharmaceutical Ingredients and Excipients: Definition, ideal characteristics and importance.'
            ]
          }
        ]
      },
      {
        unitNo: 'III',
        title: 'Solid Dosage Forms',
        lectures: '9 hours',
        sections: [
          {
            bullets: [
              'Powders: Classification, advantages and disadvantages; dusting powders, effervescent powders, efflorescent powders, hygroscopic powders and eutectic mixtures; introduction to excipients and methods of preparation.',
              'Tablets: Definition, types of tablets including moulded tablets and pills with examples; advantages and disadvantages; introduction to excipients and methods of preparation.',
              'Capsules: Definition, types of capsules, advantages and disadvantages, capsule sizes; introduction to excipients and methods of preparation.'
            ]
          }
        ]
      },
      {
        unitNo: 'IV',
        title: 'Monophasic and Biphasic Liquids',
        lectures: '9 hours',
        sections: [
          {
            bullets: [
              'For internal use – aromatic waters, syrups, elixirs and linctus (definition and preparation).',
              'For external use and body cavities – liniments, lotions, throat paints, applications, gargles, mouthwashes, enemas, eye drops, ear drops, nasal drops and tinctures with examples.',
              'Study of official preparations- Introduction to excipients and methods of preparation.',
              'Suspensions- Definition and types (flocculated and deflocculated), advantages and disadvantages, formulation excipients and general methods of preparation.',
              'Emulsions- Definition and types, emulsifying agents, tests for identification of types of emulsions, formulation excipients and general methods of preparation.'
            ]
          }
        ]
      },
      {
        unitNo: 'V',
        title: 'Semisolid Dosage Forms',
        lectures: '9 hours',
        sections: [
          {
            bullets: [
              'Definitions, classification, advantages and disadvantages, ointment bases and other excipients used in semisolid dosage forms; general methods of preparation of ointments, pastes, creams and gels.',
              'Suppositories / Pessaries: Definition, types of suppositories, advantages and disadvantages, formulation excipients used in suppositories, properties of ideal suppository bases, types of suppository bases, displacement value and general method of preparation.'
            ]
          }
        ]
      }
    ],
    referencesHeading: 'Recommended References (Preferably Latest Editions):',
    references: [
      'Ansel, H.C., Allen, L.V. and Popovich, N.G., Pharmaceutical Dosage Forms and Drug Delivery Systems. Lippincott Williams & Wilkins, New Delhi.',
      'Carter, S.J., Cooper and Gunn’s Dispensing for Pharmaceutical Students. CBS Publishers, New Delhi.',
      'Indian Pharmacopoeia Commission, Indian Pharmacopoeia. Ghaziabad.',
      'Indian Pharmacopoeia Commission, National Formulary of India. Ghaziabad, India.',
      'British Pharmacopoeia Commission, British Pharmacopoeia. London.',
      'United States Pharmacopeial Convention, United States Pharmacopeia (USP–NF). Rockville, Maryland, USA.',
      'Lachman, L., Lieberman, H.A. and Kanig, J.L., The Theory and Practice of Industrial Pharmacy. Lea & Febiger, University of Michigan.',
      'Gennaro, A.R., Remington: The Science and Practice of Pharmacy. Lippincott Williams & Wilkins, New Delhi.',
      'Rawlins, E.A., Bentley’s Textbook of Pharmaceutics. Elsevier Health Sciences, USA.',
      'Nieloud, F. and Marti-Mestres, G., Pharmaceutical Emulsions and Suspensions. Marcel Dekker Inc., New York.'
    ]
  },
  {
    courseCode: 'BP103T',
    courseTitle: 'Healthcare Psychology and Communication Skills (Theory)',
    courseType: 'Core',
    credit: '1',
    hoursPerWeek: { L: '1', T: '--', P: '--' },
    maxHours: '15',
    maximumMarks: '50',
    se: '20',
    ese: '30',
    pdfStartPage: 8,
    pdfEndPage: 10,
    docPageStart: 45,
    docPageEnd: 47,
    objectivesHeading: 'COURSE OBJECTIVES:',
    objectivesIntro: 'The objectives of this course are to:',
    objectives: [
      'Introduce the fundamental concepts and branches of psychology relevant to healthcare.',
      'Help students understand human behavior, development, and psychological responses to illness.',
      'Develop awareness of common psychological disorders and coping mechanisms in healthcare contexts.',
      'Equip students with effective health communication skills for clinical and community settings.',
      'Promote professional interaction with patients, caregivers, and healthcare teams through ethical and empathetic communication.'
    ],
    outcomesHeading: 'Course Outcomes (CO):',
    outcomes: [
      {
        coNo: 1,
        statement:
          'Explain the fundamental concepts of psychology and their relevance in healthcare settings.'
      },
      {
        coNo: 2,
        statement:
          'Describe the stages of human development, personality traits, and behavioral responses associated with illness and recovery.'
      },
      {
        coNo: 3,
        statement:
          'Apply effective communication models and techniques in clinical and interdisciplinary healthcare scenarios.'
      },
      {
        coNo: 4,
        statement:
          'Demonstrate professional communication skills including active listening, empathetic interaction, and accurate clinical documentation.'
      },
      {
        coNo: 5,
        statement:
          'Analyze psychological and behavioral interventions that promote mental health, treatment adherence, and stigma reduction.'
      }
    ],
    kind: 'theory',
    units: [
      {
        unitNo: 'I',
        title: 'Introduction to Psychology in Healthcare',
        lectures: '3 hours',
        sections: [
          {
            paragraphs: [
              'Definition, scope, and relevance of psychology in health sciences. Branches of psychology with healthcare relevance: clinical, health, behavioural, and developmental psychology. Sensation, perception, and attention in clinical assessment. Learning and memory: reinforcement in health behaviour change. Emotion and motivation: theories and implications in health contexts.'
            ]
          }
        ]
      },
      {
        unitNo: 'II',
        title: 'Developmental and Behavioural Psychology',
        lectures: '3 hours',
        sections: [
          {
            paragraphs: [
              'Human developmental stages and healthcare needs. Personality theories and patient interaction styles. Psychological factors affecting illness perception and recovery. Common psychological disorders in healthcare: anxiety, depression, and somatization. Coping strategies, resilience, and stress management techniques.'
            ]
          }
        ]
      },
      {
        unitNo: 'III',
        title: 'Foundations of Health Communication',
        lectures: '3 hours',
        sections: [
          {
            paragraphs: [
              'Elements and models of communication in healthcare. Types of communication: interpersonal, group, mass, and telehealth communication. Barriers to effective communication in clinical settings. Active listening, questioning techniques, and empathy. Culturally appropriate and inclusive communication.'
            ]
          }
        ]
      },
      {
        unitNo: 'IV',
        title: 'Professional Communication in Healthcare Settings',
        lectures: '3 hours',
        sections: [
          {
            paragraphs: [
              'Communication with patients, caregivers, and interdisciplinary teams. Delivering difficult news and handling emotionally charged situations. Legal and ethical issues in health communication (confidentiality, consent). Writing patient records, reports, and discharge summaries. Use of technology and digital communication tools in healthcare services.'
            ]
          }
        ]
      },
      {
        unitNo: 'V',
        title: 'Health Psychology and Behavioural Interventions',
        lectures: '3 hours',
        sections: [
          {
            paragraphs: [
              'Health belief models and illness behaviour. Psychosomatic illnesses and the mind–body connection. Behaviour change theories (e.g., CBT, TTM) in treatment adherence. Psychological first aid and crisis communication. Mental health promotion and stigma reduction through communication.'
            ]
          }
        ]
      }
    ],
    referencesHeading: 'Recommended References (Preferably Latest Editions):',
    references: [
      'Feldman, R.S., Understanding Psychology. McGraw-Hill Education, New York.',
      'Taylor, S.E., Health Psychology. McGraw-Hill Education, New York.',
      'Hargie, O., The Handbook of Communication Skills. Routledge, London.',
      'Nevid, J.S., Rathus, S.A. and Greene, B., Psychology and the Challenges of Life: Adjustment and Growth. Wiley, New York.',
      'Atkinson, R.L., Atkinson, R.C., Smith, E.E., Bem, D.J. and Nolen-Hoeksema, S., Introduction to Psychology. Wadsworth Publishing, Belmont.',
      'Kumar, A., Communication Skills for Health Professionals. Jaypee Brothers Medical Publishers, New Delhi.',
      'Park, K., Park’s Textbook of Preventive and Social Medicine. Banarsidas Bhanot Publishers, Jabalpur.'
    ]
  },
  {
    courseCode: 'BP104T',
    courseTitle: 'Human Anatomy, Physiology and Pathophysiology I (Theory)',
    courseType: 'Core',
    credit: '4',
    hoursPerWeek: { L: '4', T: '--', P: '--' },
    maxHours: '60',
    maximumMarks: '100',
    se: '40',
    ese: '60',
    pdfStartPage: 11,
    pdfEndPage: 13,
    docPageStart: 48,
    docPageEnd: 50,
    objectivesHeading: 'COURSE OBJECTIVES:',
    objectivesIntro: 'The objectives of this course are to:',
    objectives: [
      'Understand the structural organization of the human body from cells to systems.',
      'Comprehend physiological functions of various body systems and the principles of homeostasis.',
      'Learn the cellular basis of disease including injury, adaptation, and inflammation.',
      'Recognize common pathological conditions related to skin, bones, joints, blood, cardiovascular system, and special senses.',
      'Establish the groundwork for clinical interpretation of symptoms and disease mechanisms relevant to pharmacy and therapeutics.'
    ],
    outcomesHeading: 'Course Outcomes (CO):',
    outcomes: [
      {
        coNo: 1,
        statement:
          'Explain the fundamental concepts of Human Anatomy, Physiology and Pathophysiology.'
      },
      {
        coNo: 2,
        statement:
          'Explain the gross morphology, structure and functions of various organs of the human body.'
      },
      {
        coNo: 3,
        statement:
          'Understand the etiology and pathogenesis of diseases/disorders associated with integumentary system, peripheral nervous system and cardiovascular system'
      },
      {
        coNo: 4,
        statement: 'Understand the basic mechanism behind inflammation'
      },
      {
        coNo: 5,
        statement:
          'Identify and differentiate the various tissues and organs of different systems of human body.'
      }
    ],
    kind: 'theory',
    units: [
      {
        unitNo: 'I',
        lectures: '12 hours',
        sections: [
          {
            heading: 'Introduction to human body',
            paragraphs: [
              'Cellular and tissue level of organization.',
              'Definition and scope of anatomy, physiology and pathophysiology. Levels of structural organization and body systems, basic life processes, homeostasis, basic anatomical terminologies.',
              'Structure and functions of cell, transport across cell membrane, cell division, cell junctions. General principles of cell communication, forms of intracellular signalling- a) Contact-dependent, b) Paracrine, c) Synaptic, d) Endocrine',
              'Classification of tissues, structure, location and functions of epithelial, muscular and nervous and connective tissues.'
            ]
          },
          {
            heading: 'Basic principles of cell injury and adaptation',
            paragraphs: [
              'Components and types of feedback systems, causes of cellular injury, pathogenesis (cell membrane damage, mitochondrial damage, ribosome damage and nuclear damage), morphology of cell injury – adaptive changes (atrophy, hypertrophy, hyperplasia, metaplasia, dysplasia), cell swelling, intra cellular accumulation and cell death.',
              'Definitions of commonly used relevant medical terminologies.'
            ]
          }
        ]
      },
      {
        unitNo: 'II',
        lectures: '12 hours',
        sections: [
          {
            heading: 'Integumentary system and wound healing',
            paragraphs: [
              'Structure and functions of skin. Skin disorders: Psoriasis and dermatitis and pathophysiology of Leprosy. Basic principles of wound healing.'
            ]
          },
          {
            heading: 'Skeletal system and joints',
            paragraphs: [
              'Divisions of skeletal system, types of bones, salient features and functions of bones of axial and appendicular skeletal system. Organization of skeletal muscle, physiology of muscle contraction, neuromuscular junction. Structural and functional classification of joints.'
            ]
          },
          {
            heading: 'Diseases of bones and joints',
            paragraphs: ['Pathophysiology of rheumatoid arthritis, osteoporosis and gout.']
          }
        ]
      },
      {
        unitNo: 'III',
        lectures: '12 hours',
        sections: [
          {
            heading: 'Body fluids, blood and lymphatic system',
            paragraphs: [
              'Body fluids, composition and functions of blood, hemopoiesis, formation of haemoglobin, mechanisms of coagulation, blood grouping, Rh factors and transfusion.',
              'Lymphatic organs and tissues, lymphatic vessels, lymph formation, circulation and functions of lymphatic system.'
            ]
          },
          {
            heading: 'Basic mechanism of inflammation and repair',
            paragraphs: [
              'Introduction, classification and pathophysiology of inflammation, mediators of inflammation.'
            ]
          },
          {
            heading: 'Haematological diseases',
            paragraphs: [
              'Pathophysiology of iron deficiency, megaloblastic anaemia (Vit B12 and folic acid), sickle cell anaemia, Thalassemia, hereditary acquired anaemia and haemophilia.'
            ]
          }
        ]
      },
      {
        unitNo: 'IV',
        lectures: '12 hours',
        sections: [
          {
            heading: 'Peripheral nervous system',
            paragraphs: [
              'Classification of peripheral nervous system: structure and functions of sympathetic and parasympathetic nervous system. Origin and functions of spinal and cranial nerves.'
            ]
          },
          {
            heading: 'Special senses',
            paragraphs: [
              'Structure and functions of eye, ear, nose and tongue. Pathophysiology of special sense disorders- glaucoma, cataract, myopia, otitis externa, otitis media, vertigo and anosmia'
            ]
          }
        ]
      },
      {
        unitNo: 'V',
        lectures: '12 hours',
        sections: [
          {
            heading: 'Cardiovascular system',
            paragraphs: [
              'Anatomy of heart, blood circulation, blood vessels, structure and functions of artery, vein and capillaries, elements of conduction system of heart and heartbeat, its regulation by autonomic nervous system, cardiac output, cardiac cycle. Regulation of blood pressure, pulse, electrocardiogram.',
              'Pathophysiology of hypertension, cardiac arrhythmias, congestive heart failure, ischemic heart disease (angina, myocardial infarction, atherosclerosis and coronary artery disease).'
            ]
          }
        ]
      }
    ],
    referencesHeading: 'Recommended References (Preferably Latest Editions):',
    references: [
      'Sembulingam, K. and Sembulingam, P., Essentials of Medical Physiology. Jaypee Brothers Medical Publishers, New Delhi.',
      'Guyton, A.C. and Hall, J.E., Textbook of Medical Physiology. Elsevier Saunders, Philadelphia, USA.',
      'Tortora, G.J. and Grabowski, S.R., Principles of Anatomy and Physiology. Wiley, Palmetto, GA, USA.',
      'Kumar, V., Cotran, R.S. and Robbins, S.L., Basic Pathology. W.B. Saunders Company, Philadelphia.'
    ]
  },
  {
    courseCode: 'BP105T',
    courseTitle: 'Introduction to Pharmacognosy (Theory)',
    courseType: 'Core',
    credit: '3',
    hoursPerWeek: { L: '3', T: '--', P: '--' },
    maxHours: '45',
    maximumMarks: '75',
    se: '30',
    ese: '45',
    pdfStartPage: 14,
    pdfEndPage: 16,
    docPageStart: 51,
    docPageEnd: 53,
    objectivesHeading: 'COURSE OBJECTIVES',
    objectivesIntro: 'The objectives of this course are to:',
    objectives: [
      'Explain the origin, history, and classification of natural drugs.',
      'Understand cultivation and conservation methods for medicinal plants.',
      'Study quality control and evaluation of crude drugs.',
      'Study primary and secondary metabolites with their therapeutic relevance',
      'Introduce traditional systems of medicine and phyto-therapeutic agents.'
    ],
    outcomesHeading: 'COURSE OUTCOMES (CO)',
    outcomes: [
      {
        coNo: 1,
        statement:
          'Describe the historical development, classification, and scope of Pharmacognosy.'
      },
      {
        coNo: 2,
        statement:
          'Explain cultivation, processing, and conservation techniques for medicinal plants.'
      },
      {
        coNo: 3,
        statement:
          'Apply quality evaluation methods to crude drugs using organoleptic, microscopic, and chemical parameters.'
      },
      {
        coNo: 4,
        statement:
          'Identify primary and secondary metabolites with their therapeutic relevance.'
      },
      {
        coNo: 5,
        statement:
          'Recognize traditional systems of medicine and commonly used phyto-therapeutic agents.'
      }
    ],
    kind: 'theory',
    units: [
      {
        unitNo: 'I',
        title: 'Fundamentals of Pharmacognosy',
        lectures: '10 hours',
        sections: [
          {
            paragraphs: [
              '(a) Definition, history, present status, scope and development of pharmacognosy.',
              '(b) Sources of drugs: Plants, animals, microbial, marine, mineral and plant tissue culture.',
              '(c) Historical milestones in drug discovery: Morphine, quinine, aspirin, warfarin, penicillin, cephalosporin, taxol and artemisinin.',
              '(d) Introduction to different herbal / traditional pharmacopoeias: Indian Pharmacopoeia, British Herbal Pharmacopoeia, United States Pharmacopeia – Herbal Medicines and Dietary Supplements, Ayurvedic Pharmacopoeia of India, Unani Pharmacopoeia of India and American Herbal Pharmacopoeia.',
              '(e) Official and non-official; codified and non-codified drugs. Classification of crude drugs: alphabetical, morphological, taxonomical, chemical, pharmacological and chemotaxonomic classification along with their merits and limitations.'
            ]
          }
        ]
      },
      {
        unitNo: 'II',
        title: 'Cultivation, Collection, Processing and Storage of Drugs of Natural Origin',
        lectures: '8 hours',
        sections: [
          {
            paragraphs: [
              'Methods of plant cultivation and Good Agricultural and Collection Practices (WHO / GAP / GCP guidelines) for medicinal plants. Factors influencing cultivation, collection and storage of medicinal plants.',
              'Plant hormones and their applications in cultivation of medicinal plants. Application of polyploidy, mutation and hybridization concepts with reference to secondary metabolites. Ex-situ and in-situ conservation and strategies for value addition of medicinal plants. Role of eco-pharmacognosy in sustainable conservation of endangered medicinal plants such as kutki and chirata.'
            ]
          }
        ]
      },
      {
        unitNo: 'III',
        title: 'Quality Control of Drugs of Natural Origin (WHO Guidelines)',
        lectures: '8 hours',
        sections: [
          {
            paragraphs: [
              'Adulteration of drugs of natural origin. Evaluation of drugs using organoleptic, microscopic (qualitative and quantitative), physical, chemical and biological methods. Physicochemical parameters: extractive values, moisture content, foreign organic matter, ash values, bitterness value, foaming index, haemolytic potential, swelling index, viscosity, optical rotation, refractive index, acid value and saponification value. DNA barcoding.'
            ]
          }
        ]
      },
      {
        unitNo: 'IV',
        title: 'Introduction to Metabolites of Plant Origin',
        lectures: '12 hours',
        sections: [
          {
            paragraphs: [
              'Definition and general properties of plant metabolites. Primary and secondary metabolites such as carbohydrates, proteins, lipids, alkaloids, glycosides, flavonoids, tannins, terpenoids, volatile oils and resins.',
              'Traditional Systems of Medicine Basic principles of treatment of diseases in different systems of medicine including AYUSH and TCM. Types of dosage forms in AYUSH medicines. Role of pharmacognosy in allopathy and traditional systems of medicine such as AYUSH and TCM.'
            ]
          }
        ]
      },
      {
        unitNo: 'V',
        title: 'Phyto-therapeutic Agents',
        lectures: '7 hours',
        sections: [
          {
            paragraphs: [
              'Biological source, major constituents and uses of the following classes of drugs:',
              '• Adaptogens and Immunomodulators: Ashwagandha, Tulsi, Amla • Hepatoprotectives: Milk thistle, Kutki • Cardiovascular drugs: Garlic, Arjuna • Antidiabetics: Gymnema, Fenugreek • Anti-inflammatory and analgesics: Turmeric, Boswellia • CNS drugs: Brahmi • Antimicrobial and antivirals: Giloy, Neem, Andrographis • Gastrointestinal drugs: Psyllium • Dermatological agents: Aloe • Drugs used in women’s health: Chasteberry, Shatavari • Respiratory drugs: Vasaka'
            ]
          }
        ]
      }
    ],
    referencesHeading: 'Recommended References (Preferably latest editions):',
    references: [
      'Evans, W.C., Trease and Evans Pharmacognosy. 16th ed. London: W.B. Saunders & Co., 2009.',
      'Tyler, V.E., Brady, L.R. and Robbers, J.E., Pharmacognosy. 9th ed. Philadelphia: Lea & Febiger, 1988.',
      'Wallis, T.E., Textbook of Pharmacognosy. London: J. & A. Churchill Ltd.',
      'World Health Organization (2002) WHO traditional medicine strategy 2002–2005. Geneva: World Health Organization',
      'World Health Organization (1998) Quality control methods for medicinal plant materials. Geneva: World Health Organization.',
      'World Health Organization (2003) WHO guidelines on good agricultural and collection practices (GACP) for medicinal plants. Geneva: World Health Organization.'
    ]
  },
  {
    courseCode: 'BP106T',
    courseTitle: 'Pharmaceutical Inorganic and Analytical Chemistry (Theory)',
    courseType: 'Core',
    credit: '3',
    hoursPerWeek: { L: '3', T: '--', P: '--' },
    maxHours: '45',
    maximumMarks: '75',
    se: '30',
    ese: '45',
    pdfStartPage: 16,
    pdfEndPage: 18,
    docPageStart: 53,
    docPageEnd: 55,
    objectivesHeading: 'COURSE OBJECTIVES:',
    objectivesIntro: 'The objectives of this course are to:',
    objectives: [
      'Understand the importance of errors, impurities in pharmaceuticals.',
      'Comprehend the principles of buffer systems.',
      'Develop skills in performing and interpreting limit tests and titrimetric analysis.',
      'Emphasize the importance of inorganic compounds and radiopharmaceuticals in Pharmacy',
      'Explain synthesis and analysis of inorganic compounds/products of pharmaceutical importance'
    ],
    outcomesHeading: 'COURSE OUTCOMES (CO):',
    outcomes: [
      {
        coNo: 1,
        statement:
          'Identify sources and types of errors in pharmaceutical analysis, and impurities products'
      },
      {
        coNo: 2,
        statement:
          'Apply concepts of acid-base chemistry, buffer systems with importance of electrolytes'
      },
      {
        coNo: 3,
        statement:
          'Describe and differentiate various analytical techniques used in pharmaceutical analysis, including titrimetric methods, and their specific applications in quality assessment.'
      },
      {
        coNo: 4,
        statement:
          'Analyze the properties, mechanisms, and therapeutic uses of gastrointestinal agents, radiopharmaceuticals, expectorants, antidotes, and other pharmaceutical compounds, illustrating their roles in therapy and safety considerations.'
      },
      {
        coNo: 5,
        statement:
          'Describe the drugs used in expectorants, emetics, haemintics, poison and antidote and astringents.'
      }
    ],
    kind: 'theory',
    units: [
      {
        unitNo: 'I',
        lectures: '7 hours',
        sections: [
          {
            heading: 'Introduction to pharmaceutical analysis',
            paragraphs: [
              'Different techniques of analysis, Methods of expressing strength of solutions, Primary and secondary standards with examples.'
            ]
          },
          {
            heading: 'Errors',
            paragraphs: [
              'Sources of errors, types of errors, methods of minimizing errors, accuracy, precision and significant figures.'
            ]
          },
          {
            heading: 'Impurities',
            paragraphs: [
              'Definition, types, contents and regulatory importance. Sources and types of impurities in Pharmaceuticals, limit tests for chloride, sulphate, iron, arsenic, lead, heavy metals, and modified limit test for chloride and sulphate.'
            ]
          }
        ]
      },
      {
        unitNo: 'II',
        lectures: '8 hours',
        sections: [
          {
            heading: 'Acid-Base Chemistry and Buffer Systems in Pharmacy',
            paragraphs: [
              'Definition of acids, bases, buffers, pH Scale and its significance, Buffer equation, calculation of pH for Buffer solution. Isotonicity and its application in IV Fluids and Ophthalmic Solutions.'
            ]
          },
          {
            heading: 'Major extra and intracellular electrolytes',
            paragraphs: [
              'Functions of major physiological ions, Electrolytes used in the replacement therapy: Sodium chloride*, Potassium chloride, Calcium chloride and Oral Rehydration Salt (ORS), Physiological acid base balance.'
            ]
          }
        ]
      },
      {
        unitNo: 'III',
        lectures: '14 hours',
        sections: [
          {
            heading: 'Acid base titrations',
            paragraphs: [
              'Theories of acid base indicators, classification of acid base titrations. Preparation and standardization of titrants viz. hydrochloric acid and sodium hydroxide. Theory involved in titrations of strong, weak, and very weak acids and bases, neutralization curves. Assay of Ammonium hydroxide.'
            ]
          },
          {
            heading: 'Non-aqueous titrations',
            paragraphs: [
              'Types of solvents used, acidimetric and alkalimetric titration using non-aqueous solvents. Preparation and standardization of acidic and basic titrants. Estimation of weakly acidic and basic substances using non-aqueous titrants, estimation of Sodium benzoate.'
            ]
          },
          {
            heading: 'Precipitation titrations and gravimetry',
            paragraphs: [
              'Principle and steps involved in gravimetric analysis, Mohr’s method, Volhard’s, Modified Volhard’s, Fajans method. Estimation of barium sulphate by gravimetry.'
            ]
          },
          {
            heading: 'Complexometric titrations',
            paragraphs: [
              'Classification, metal ion indicators, masking and demasking reagents, preparation and standardization of disodium EDTA. Estimation of Magnesium sulphate and Calcium gluconate*.'
            ]
          },
          {
            heading: 'Redox titrations',
            paragraphs: [
              'Concepts of oxidation and reduction, Types of redox titrations viz. Permanganometry, Cerimetry, Iodimetry, Iodometry and titrations with potassium iodate.'
            ]
          }
        ]
      },
      {
        unitNo: 'IV',
        lectures: '10 hours',
        sections: [
          {
            heading: 'Gastrointestinal agents',
            paragraphs: [
              'Acidifiers: Sodium acid phosphate and Dilute Hydrochloric acid.',
              'Antacids: Ideal properties of antacids, combinations of antacids, Sodium bicarbonate*, Aluminium hydroxide gel*.',
              'Agents promote bowel movements: Magnesium hydroxide, Sodium orthophosphate, Sodium Potassium tartrate and magnesium trisilicate.',
              'Antimicrobials: Mechanism, classification, Potassium permanganate, Boric acid, Hydrogen peroxide*, Chlorinated lime*, Iodine and its preparations.'
            ]
          },
          {
            heading: 'Radiopharmaceuticals',
            paragraphs: [
              'Basics of radioactivity, applications of radioisotopes of Sodium Iodide I-131, Technetium-99m, Cobalt-60, Phosphorus-32 including safe handling, storage, and disposal of radiopharmaceuticals, adhering to regulatory guidelines for safety.'
            ]
          }
        ]
      },
      {
        unitNo: 'V',
        lectures: '06 hours',
        sections: [
          {
            heading: 'Miscellaneous Compounds',
            paragraphs: [
              'Expectorants: Potassium iodide, Ammonium chloride*.',
              'Emetics: Copper sulphate*, Sodium potassium tartrate.',
              'Haematinics: Ferrous sulphate*, Ferrous gluconate.',
              'Poison and Antidote: Definition, classification of antidotes, Sodium thiosulphate'
            ]
          }
        ]
      }
    ],
    referencesHeading: 'Recommended References (Preferably latest editions):',
    references: [
      "Bentley, R. and Driver, J., Bentley and Driver's Textbook of Pharmaceutical Chemistry. Oxford: Oxford University Press.",
      'Vogel, A.I., Vogel’s Textbook of Quantitative Chemical Analysis. Essex: Pearson Education Limited.',
      'Beckett, A.H. and Stenlake, J.B., Practical Pharmaceutical Chemistry. Part I & II. London: The Athlone Press, University of London.',
      'Schroff, M.L., Inorganic Pharmaceutical Chemistry. New Delhi: Oxford Book Company.',
      'Indian Pharmacopoeia Commission, Indian Pharmacopoeia. Ghaziabad, India.'
    ]
  },
  {
    courseCode: 'BP107P',
    courseTitle: 'General Pharmacy (Practical)',
    courseType: 'Core',
    credit: '1',
    hoursPerWeek: { L: '--', T: '--', P: '3' },
    maxHours: '45',
    maximumMarks: '50',
    se: '20',
    ese: '30',
    pdfStartPage: 19,
    pdfEndPage: 20,
    docPageStart: 56,
    docPageEnd: 57,
    objectivesHeading: 'COURSE OBJECTIVES:',
    objectivesIntro: 'The objectives of this course are to:',
    objectives: [
      'Familiarize students with essential pharmaceutical calculations including dilution, concentration, and allegation methods required for accurate formulation of dosage forms.',
      'Impart practical skills in the preparation of official and non-official dosage forms such as solutions, syrups, powders, granules, suppositories, semisolids, gargles, and mouthwashes in accordance with pharmacopeial standards.',
      'Develop understanding of formulation principles related to selection of ingredients, dosage form design, stability, and patient acceptability.',
      'Train students in the application of pharmacopoeial specifications (IP, BPC, WHO) during compounding, labeling, and evaluation of pharmaceutical preparations.',
      'Enhance hands-on competency and professional confidence required for dispensing practice and pharmaceutical compounding in hospital and community pharmacy settings.'
    ],
    outcomesHeading: 'COURSE OUTCOMES (CO):',
    outcomes: [
      {
        coNo: 1,
        statement:
          'Perform accurate pharmaceutical calculations using dilution and allegation principles for the preparation of various dosage forms.'
      },
      {
        coNo: 2,
        statement:
          'Prepare and dispense liquid dosage forms such as solutions, syrups, gargles, and mouthwashes following official pharmacopeial procedures.'
      },
      {
        coNo: 3,
        statement:
          'Formulate solid dosage forms including powders, divided powders, dusting powders, and effervescent granules as per standard guidelines.'
      },
      {
        coNo: 4,
        statement:
          'Prepare semisolid and specialized dosage forms such as ointments, liniments, and suppositories using appropriate bases and techniques.'
      },
      {
        coNo: 5,
        statement:
          'Compile and evaluate a compendium of marketed dosage forms, demonstrating compliance with pharmacopeial standards, labeling requirements, and patient-centric considerations'
      }
    ],
    kind: 'practical',
    practicalHeading: 'List of practical',
    practicalBlocks: [
      {
        items: [
          {
            number: '1.',
            title: 'Pharmaceutical Calculations',
            description: 'Solutions based on allegation and dilution methods'
          },
          {
            number: '2.',
            title: 'Solutions',
            subItems: [
              'a) Strong solution of ammonium acetate – IP',
              'b) Cresol with soap solution – IP',
              'c) Lugol’s solution – BPC'
            ]
          },
          {
            number: '3.',
            title: 'Syrups',
            subItems: ['a) Simple Syrup – IP']
          },
          {
            number: '4.',
            title: 'Powders & Granules',
            subItems: [
              'a) ORS powder – WHO',
              'b) Effervescent granules – IP',
              'c) Dusting powder – IP',
              'd) Divided powders – IP'
            ]
          },
          {
            number: '5.',
            title: 'Suppositories',
            subItems: [
              'a) Glycerogelatin suppository – BPC',
              'b) Cocoa butter suppository – IP',
              'c) Zinc Oxide suppository – IP'
            ]
          },
          {
            number: '6.',
            title: 'Semisolids',
            subItems: [
              'a) Sulphur ointment – IP',
              'b) Non-staining iodine ointment with methyl salicylate – BPC'
            ]
          },
          {
            number: '7.',
            title: 'Gargles & Mouthwashes',
            subItems: [
              'a) Iodine gargle – BPC',
              'b) Chlorhexidine mouthwash – IP'
            ]
          }
        ],
        notes: [
          'a) Preparation of compendia of dosage forms (marketed products), is recommended.',
          'b) Any other practical relevant to the syllabus can be introduced.',
          'c) Minimum 12 experiments must be performed covering all dosage forms.'
        ]
      }
    ],
    referencesHeading: 'Recommended References (Preferably latest editions):',
    references: [
      'Carter, S.J., Cooper and Gunn’s Dispensing for Pharmaceutical Students. 12th ed. New Delhi: CBS Publishers.',
      'Indian Pharmacopoeia Commission, Indian Pharmacopoeia, Vol. I. Ghaziabad: IPC.',
      'United States Pharmacopeial Convention, United States Pharmacopeia–National Formulary (USP–NF). Rockville, MD, USA.',
      'British Pharmacopoeia Commission, British Pharmacopoeia Codex. London: The Stationery Office.',
      'World Health Organization, Oral Rehydration Salts (ORS) Formulation Guidelines. Geneva: WHO.'
    ]
  },
  {
    courseCode: 'BP108P',
    courseTitle: 'Healthcare Psychology and Communication Skills (Practical)',
    courseType: 'Core',
    credit: '1',
    hoursPerWeek: { L: '--', T: '--', P: '2' },
    maxHours: '30',
    maximumMarks: '50',
    se: '20',
    ese: '30',
    pdfStartPage: 21,
    pdfEndPage: 22,
    docPageStart: 58,
    docPageEnd: 59,
    objectivesHeading: 'COURSE OBJECTIVES:',
    objectivesIntro: 'The objectives of this course are:',
    objectives: [
      'To develop effective communication skills essential for diverse clinical and community health scenarios.',
      'To enhance empathetic interaction through role plays, simulations, and reflective practices.',
      'To promote collaborative learning and peer feedback in communication-based tasks.',
      'To encourage application of psychological principles in real-life healthcare contexts.',
      'To build confidence in delivering health education and awareness activities in community settings.'
    ],
    outcomesHeading: 'COURSE OUTCOMES (CO):',
    outcomes: [
      {
        coNo: 1,
        statement:
          'Demonstrate patient-centered communication through role plays and clinical simulations.'
      },
      {
        coNo: 2,
        statement:
          'Analyze healthcare communication challenges using case study discussions.'
      },
      {
        coNo: 3,
        statement:
          'Practice reflective listening, paraphrasing, and team-based communication strategies.'
      },
      {
        coNo: 4,
        statement:
          'Design and deliver effective health education messages for the community.'
      },
      {
        coNo: 5,
        statement:
          'Reflect on personal emotional growth and improvement in communication competencies.'
      }
    ],
    kind: 'practical',
    practicalHeading: 'List of practical',
    practicalBlocks: [
      {
        items: [
          {
            number: '1.',
            title: 'Role Plays and Simulations',
            subItems: [
              'Counselling a patient with chronic illness',
              'Breaking bad news in a clinical setting',
              'Empathetic listening in crisis response'
            ]
          },
          {
            number: '2.',
            title: 'Case Study Discussions',
            subItems: [
              'Mental health cases in primary care',
              'Impact of miscommunication in healthcare errors'
            ]
          },
          {
            number: '3.',
            title: 'Peer-to-Peer Practice Sessions',
            subItems: [
              'Reflective listening and paraphrasing',
              'Effective team communication and decision-making'
            ]
          },
          {
            number: '4.',
            title: 'Community Engagement Tasks',
            subItems: [
              'Designing IEC materials for public health awareness',
              'Conducting mock health education sessions'
            ]
          },
          {
            number: '5.',
            title: 'Journaling & Self-Reflection Logs',
            subItems: [
              'Weekly reflection on emotional responses during care simulations',
              'Growth in communication skill development over the semester'
            ]
          }
        ]
      }
    ],
    referencesHeading: 'Recommended References (Preferably latest editions):',
    references: [
      'Morgan, C.T. and King, R.A., Introduction to Psychology. New York: McGraw-Hill.',
      'Taylor, S.E., Health Psychology. New York: McGraw-Hill Education.',
      'Hargie, O., Skilled Interpersonal Communication: Research, Theory and Practice. London: Routledge.',
      'Balzer-Riley, J., Communication in Nursing and Healthcare. Boston: Pearson.',
      'Weinman, J., Petrie, K.J. and Moss-Morris, R., The Psychology of Health and Illness. London: Routledge.'
    ]
  },
  {
    courseCode: 'BP109P',
    courseTitle: 'Human Anatomy, Physiology and Pathophysiology I (Practical)',
    courseType: 'Core',
    credit: '1',
    hoursPerWeek: { L: '--', T: '--', P: '3' },
    maxHours: '45',
    maximumMarks: '50',
    se: '20',
    ese: '30',
    pdfStartPage: 23,
    pdfEndPage: 24,
    docPageStart: 60,
    docPageEnd: 61,
    objectivesHeading: 'COURSE OBJECTIVES:',
    objectivesIntro: 'The objectives of this course are to:',
    objectives: [
      'Provide fundamental knowledge of the structure and functions of various organ systems of the human body.',
      'Understand the mechanisms of homeostasis and their role in maintaining normal physiological functions.',
      'Introduce the basic concepts of pathophysiology and the causes of diseases affecting different organ systems.',
      'Explain the body’s physiological responses to disease-producing agents.',
      'Lay the foundation for understanding clinical conditions through the study of functional alterations in organs and systems.'
    ],
    outcomesHeading: 'COURSE OUTCOMES (CO):',
    outcomes: [
      {
        coNo: 1,
        statement:
          'Explain the principles, applications, and experimental use of microscopy techniques, and perform basic laboratory experiments related to the nervous system and special senses.'
      },
      {
        coNo: 2,
        statement:
          'Describe the gross morphology, microscopic structure, and coordinated functioning of major human organs and organ systems, emphasizing their roles in maintaining normal physiology.'
      },
      {
        coNo: 3,
        statement:
          'Estimate and interpret key hematological parameters, and explain the mechanisms of homeostasis along with related physiological and pathological disorders.'
      },
      {
        coNo: 4,
        statement:
          'Discuss the etiology and pathogenesis of selected disease states, linking structural and functional changes to clinical manifestations.'
      },
      {
        coNo: 5,
        statement:
          'Identify and explain common diseases with respect to their signs and symptoms, risk factors, diagnostic methods, preventive measures, treatment strategies, and possible complications.'
      }
    ],
    kind: 'practical',
    practicalHeading: 'List of practical',
    practicalSubtitle: '(Minimum 12 experiments must be performed)',
    practicalIntro:
      'Practical HAPP allows the verification of physiological processes discussed in theory classes through experiments on living tissues, simulated videos, models and charts.',
    practicalBlocks: [
      {
        items: [
          { number: '1.', title: 'Study of compound microscopes.' },
          { number: '2.', title: 'Microscopic study of epithelial and connective tissue.' },
          { number: '3.', title: 'Microscopic study of muscular and nervous tissue.' },
          { number: '4.', title: 'Identification of axial bones.' },
          { number: '5.', title: 'Identification of appendicular bones.' },
          { number: '6.', title: 'Introduction to hemocytometry.' },
          { number: '7.', title: 'Demonstration of total blood count by cell analyser.' },
          {
            number: '8.',
            title: 'Enumeration and interpretation of white blood cell (WBC) count, differential count.'
          },
          {
            number: '9.',
            title: 'Enumeration and interpretation of total red blood corpuscles (RBC) count.'
          },
          { number: '10.', title: 'Determination of bleeding time and clotting time.' },
          { number: '11.', title: 'Estimation and interpretation of hemoglobin content.' },
          { number: '12.', title: 'Determination of blood group.' },
          {
            number: '13.',
            title: 'Determination and interpretation of erythrocyte sedimentation rate (ESR).'
          },
          { number: '14.', title: 'Determination of pulse rate, heart rate and blood pressure.' },
          { number: '15.', title: 'Recording and interpretation of ECG.' },
          { number: '16.', title: 'To study the cardiovascular system and integumentary system.' },
          {
            number: '17.',
            title:
              'Case studies/files of patients with anaemia, thalassemia, haemophilia, leprosy, gout, hypertension and ischemic heart disease.'
          }
        ]
      }
    ],
    referencesHeading: 'Recommended References (Preferably latest editions):',
    references: [
      'Wilson, K.J.W., Anatomy and Physiology in Health and Illness. New York: Churchill Livingstone.',
      'Guyton, A.C. and Hall, J.E., Textbook of Medical Physiology. Philadelphia: Elsevier.',
      'Tortora, G.J. and Grabowski, S.R., Principles of Anatomy and Physiology. New York: Wiley.'
    ]
  },
  {
    courseCode: 'BP110P',
    courseTitle: 'Introduction to Pharmacognosy (Practical)',
    courseType: 'Core',
    credit: '1',
    hoursPerWeek: { L: '--', T: '--', P: '3' },
    maxHours: '45',
    maximumMarks: '50',
    se: '20',
    ese: '30',
    pdfStartPage: 25,
    pdfEndPage: 26,
    docPageStart: 62,
    docPageEnd: 63,
    objectivesHeading: 'COURSE OBJECTIVES:',
    objectivesIntro: 'The objectives of this course are to:',
    objectives: [
      'Identify medicinal plants and crude drugs using morphological and microscopical characters.',
      'Analyze powdered drugs and perform quantitative microscopy.',
      'Evaluate crude drugs using physicochemical parameters.',
      'Introduce standardization and quality control of herbal materials.',
      'Collect medicinal plants and prepare voucher specimens.'
    ],
    outcomesHeading: 'COURSE OUTCOMES (CO):',
    outcomes: [
      {
        coNo: 1,
        statement:
          'Identify medicinal plants and crude drugs using morphological and microscopical characters.'
      },
      {
        coNo: 2,
        statement:
          'Analyze powdered drugs microscopically to identify diagnostic cell contents.'
      },
      {
        coNo: 3,
        statement: 'Perform quantitative microscopy for stomatal and vein parameters.'
      },
      {
        coNo: 4,
        statement: 'Evaluate quality and purity of crude drugs using physicochemical parameters.'
      },
      {
        coNo: 5,
        statement: 'Collect medicinal plants and prepare voucher specimens during field visits.'
      }
    ],
    kind: 'practical',
    practicalHeading: 'List of practices',
    practicalSubtitle: '(Minimum 12 experiments must be performed)',
    practicalBlocks: [
      {
        items: [
          {
            number: '1.',
            title: 'Morphological study of medicinal plants (as mentioned in Unit V Theory).'
          },
          {
            number: '2.',
            title:
              'Organoleptic evaluation and powder microscopical characters of the following drugs: Tulsi and Ashwagandha.'
          },
          {
            number: '3.',
            title:
              'Organoleptic evaluation and powder microscopical characters of the following drugs: Amla and Arjuna.'
          },
          {
            number: '4.',
            title:
              'Organoleptic evaluation and powder microscopical characters of the following drugs: Turmeric and Psyllium husk.'
          },
          {
            number: '5.',
            title:
              'Organoleptic evaluation and powder microscopical characters of the following drugs: Brahmi and Fenugreek.'
          },
          { number: '6.', title: 'Determination of moisture content of crude drugs.' },
          {
            number: '7.',
            title: 'Determination of swelling index and foaming index of crude drugs.'
          },
          {
            number: '8.',
            title: 'Determination of stomatal number and stomatal index of leaf.'
          },
          {
            number: '9.',
            title: 'Determination of vein islet and vein termination number of leaf.'
          },
          {
            number: '10.',
            title: 'Determination of ash value and extractive values of crude drugs.'
          },
          {
            number: '11.',
            title: 'Determination of foreign organic matter of crude drugs.'
          },
          {
            number: '12.',
            title:
              'Determination of dimensions of calcium oxalate crystals and phloem fibers by eyepiece micrometry.'
          },
          {
            number: '13.',
            title: 'Determination of percentage purity of powder drug using lycopodium spore method.'
          },
          {
            number: '14.',
            title:
              'Experiential learning-based experiments involving collection, identification of medicinal plant material, preparation of voucher specimens and excursion visits to medicinal plant garden.'
          }
        ]
      }
    ],
    referencesHeading: 'Recommended References (Preferably Latest Editions):',
    references: [
      'Evans, W.C., 2009. Trease and Evans Pharmacognosy. 16th ed. London: W.B. Saunders & Co.',
      'Tyler, V.E., Brady, L.R. and Robbers, J.E., 1988. Pharmacognosy. 9th ed. Philadelphia: Lea & Febiger.',
      'Wallis, T.E., Textbook of Pharmacognosy. London: J. & A. Churchill Ltd.'
    ]
  },
  {
    courseCode: 'BP111P',
    courseTitle: 'Pharmaceutical Inorganic and Analytical Chemistry (Practical)',
    courseType: 'Core',
    credit: '1',
    hoursPerWeek: { L: '--', T: '--', P: '3' },
    maxHours: '45',
    maximumMarks: '50',
    se: '20',
    ese: '30',
    pdfStartPage: 27,
    pdfEndPage: 28,
    docPageStart: 64,
    docPageEnd: 65,
    objectivesHeading: 'COURSE OBJECTIVES:',
    objectivesIntro: 'The objectives of this course are to:',
    objectives: [
      'Gain practical knowledge on various volumetric titration techniques.',
      'Learn the principles of volumetric analysis.',
      'Study the preparation and assessment of inorganic compounds.',
      'Determine the assay of various inorganic compounds in pharmaceutical use.',
      'Develop analytical skill for the qualitative and quantitative analysis of various inorganic compounds.'
    ],
    outcomesHeading: 'COURSE OUTCOMES (CO):',
    outcomes: [
      {
        coNo: 1,
        statement:
          'Perform limit tests to detect and identify impurities in pharmaceutical substances.'
      },
      {
        coNo: 2,
        statement:
          'Prepare various pharmaceutical inorganic compounds following standard procedures.'
      },
      {
        coNo: 3,
        statement:
          'Analyze the significance of quality control in pharmaceutical products and raw materials.'
      },
      {
        coNo: 4,
        statement:
          'Demonstrate proficiency in titrimetric analysis using different volumetric techniques.'
      },
      {
        coNo: 5,
        statement:
          'Competence in applying analytical skills to qualitative and quantitative data.'
      }
    ],
    kind: 'practical',
    practicalHeading: 'List of practical',
    practicalBlocks: [
      {
        items: [
          {
            number: '1.',
            title: 'Limit tests (Any 4 Experiments)',
            description:
              'a. Limit test and modified limit test for Chloride as per Indian Pharmacopoeia b. Limit test and modified limit test for sulphate as per Indian Pharmacopoeia c. Limit test for Iron d. Limit test for Lead e. Limit test for arsenic'
          },
          {
            number: '2.',
            title: 'Preparation of inorganic pharmaceuticals (Any 3 Experiments)',
            description:
              'a. Preparation of Aluminium hydroxide b. Preparation of potash alum c. Preparation of ferrous sulphate d. Preparation of Magnesium sulphate from magnesium hydroxide or magnesium carbonate'
          },
          {
            number: '3.',
            title: 'Test for Purity (Any 2 Experiments)',
            description:
              'a. Assessment of swelling power of bentonite as per Indian Pharmacopoeia b. Evaluation of acid neutralizing capacity of aluminium hydroxide gel c. Determination of potassium iodate and iodine in potassium Iodide'
          },
          {
            number: '4.',
            title:
              'Assay of the following inorganic compounds including standardization of titrant (Any 5 Experiments)',
            description:
              'a. Assay of ammonium chloride by acid base titration, b. Assay of Ferrous sulphate by Cerimetry, c. Assay of Copper sulphate by Iodometry, d. Assay of Calcium gluconate by Complexometry, e. Assay of Hydrogen peroxide by Permanganometry, f. Assay of Sodium benzoate by non-aqueous titration, g. Assay of Sodium Chloride by precipitation titration (Modified Volhard’s method)'
          }
        ]
      }
    ],
    referencesHeading: 'Recommended References (Preferably Latest Editions):',
    references: [
      'Bentley, R. and Driver, J., Bentley and Driver’s Textbook of Pharmaceutical Chemistry. Oxford: Oxford University Press.',
      'Vogel, A.I., Vogel’s Textbook of Quantitative Chemical Analysis. Essex: Pearson Education Limited.',
      'Beckett, A.H. and Stenlake, J.B., Practical Pharmaceutical Chemistry. Part I & II. London: The Athlone Press, University of London.',
      'Kennedy, J.H., Analytical Chemistry: Principles. New York: Saunders College Publishing.',
      'Schroff, M.L., Inorganic Pharmaceutical Chemistry. New Delhi: Oxford Book Company.',
      'Indian Pharmacopoeia Commission, Indian Pharmacopoeia. Ghaziabad, India.'
    ]
  }
];
