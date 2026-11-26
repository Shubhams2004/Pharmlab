import { SyllabusSubjectNode, SyllabusTopicNode } from '../study-mode/types';
import { ComponentCheckKey, ResourceCheckKey } from './types';

export interface ApplicabilityDecision {
  applicable: boolean;
  reason: string;
}

export interface TopicApplicabilityProfile {
  components: Record<ComponentCheckKey, ApplicabilityDecision>;
  resources: Record<ResourceCheckKey, ApplicabilityDecision>;
}

export function assessTopicApplicability(
  topic: SyllabusTopicNode,
  subject: SyllabusSubjectNode
): TopicApplicabilityProfile {
  const domain = topic.domainMode;
  const hay = `${topic.subjectCode} ${topic.subjectTitle} ${topic.unitTitle} ${topic.title} ${topic.summary} ${topic.keywords.join(' ')}`.toLowerCase();
  const isPracticalCourse =
    subject.courseType.toLowerCase().includes('practical') ||
    topic.unitNo.toLowerCase().includes('practical');

  const isOrientationOrHistory =
    /\b(history|profession|career|scope of|ethics|pharmacopoeia overview|introduction to pharmacy|regulatory|syllabus)\b/.test(
      hay
    ) && !/\b(assay|titration|limit test|mechanism|physiology|pathway|kinetics)\b/.test(hay);

  const hasQuantitativeCue =
    /\b(calculation|formula|equation|posology|alligation|isotonic|proof spirit|buffer|ph\b|normality|molarity|ppm|decay|half-life|auc|cmax|tmax|stomatal|vein-islet|palisade|lycopodium|micrometry|ash value|extractive|moisture|ecg|cardiac output|blood pressure|hemocytometer|rbc|wbc|gfr|clearance|dilution|titration|dissolution|dose)\b/.test(
      hay
    );

  const hasMicroscopyCue =
    /\b(microscop|histolog|tissue|cell|blood|smear|rbc|wbc|stomata|tricome|trichome|powder|crude drug|botan|leaf constant|palisade|calcium oxalate|starch|vascular|phloem|xylem|epithelial|connective|nervous tissue|muscle tissue|neubauer)\b/.test(
      hay
    );

  const hasClinicalCue =
    /\b(clinical|disease|disorder|pathology|pathophysiology|patient|counseling|therapy|adverse|adr|toxicity|edema|hypertension|arrhythmia|anemia|ulcer|antacid|cathartic|electrolyte|shock|stress|crisis|empathy|sbar|spikes|pharmacokinetic|clearance|renal|cardiac)\b/.test(
      hay
    );

  const hasMechanismCue =
    /\b(mechanism|pathway|cycle|conduction|contraction|filtration|absorption|reabsorption|secretion|reaction|assay|limit test|titration|equilibrium|buffer|precipitation|redox|complexometr|esterification|extraction|biosynthesis|metabolism|decay|action potential|synapse|hemostasis|inflammation|clotting|digestion|pharmacokinetic|diffusion|dissolution|cbt|ttm|health belief|spikes|sbar)\b/.test(
      hay
    );

  const hasStructureCue =
    /\b(anatomy|structure|organ|valve|chamber|nephron|glomerulus|cell|organelle|tissue|bone|skeleton|joint|muscle|skin|eye|ear|brain|spinal|heart|kidney|liver|lung|stomach|apparatus|gutzeit|nessler|burette|microscope|tablet|capsule|emulsion|suspension|suppository|powder|leaf|bark|root|rhizome|seed|molecule|complex|dataframe|series|syntax)\b/.test(
      hay
    );

  const hasSimCue =
    /\b(titration|assay|dissolution|pharmacokinetic|pk|hemodynamic|cardiac|ecg|blood pressure|diffusion|sterilization|autoclave|growth|posology|alligation|isotonic|proof spirit|limit test|buffer|stomatal|vein|micrometry|role-play|counseling|spikes|sbar|python|pandas|matplotlib|plot|numpy)\b/.test(
      hay
    );

  // 1. Academic Components (16 checks)
  const components: Record<ComponentCheckKey, ApplicabilityDecision> = {
    topic_overview: {
      applicable: true,
      reason: 'Every curriculum topic requires a high-level academic overview.'
    },
    definitions: {
      applicable: true,
      reason: 'Core terminology and formal definitions are required across all subjects.'
    },
    core_concepts: {
      applicable: true,
      reason: 'Key academic principles and subtopics anchor unit comprehension.'
    },
    detailed_explanation: {
      applicable: true,
      reason: 'Substantive multi-paragraph or structured technical explanation is required.'
    },
    mechanism_process:
      isOrientationOrHistory && !hasMechanismCue
        ? {
            applicable: false,
            reason:
              'Historical/regulatory orientation topic — molecular, physiological, or procedural mechanism not required.'
          }
        : domain === 'computing_pk' && !hasMechanismCue && /\b(syntax|variable|loop|string|list|dict|tuple|file)\b/.test(hay)
        ? {
            applicable: true,
            reason: 'Program control flow and execution logic apply to foundational Python topics.'
          }
        : {
            applicable: true,
            reason:
              domain === 'anatomy_physiology'
                ? 'Physiological or cellular mechanism applies to body systems.'
                : domain === 'chemistry_analysis'
                ? 'Chemical reaction mechanism or analytical assay workflow applies.'
                : domain === 'psychology_comm'
                ? 'Behavioral model or structured clinical counseling process applies.'
                : 'Formulation, biological, or computational workflow applies.'
          },
    structures_components:
      domain === 'psychology_comm' && !hasStructureCue
        ? {
            applicable: false,
            reason:
              'Behavioral/communication domain — physical anatomical or apparatus structure list not applicable.'
          }
        : domain === 'computing_pk' && !/\b(dataframe|series|plot|pk|dataset|numpy|matplotlib)\b/.test(hay)
        ? {
            applicable: false,
            reason:
              'Introductory programming syntax — physical structural components not applicable.'
          }
        : {
            applicable: true,
            reason:
              domain === 'anatomy_physiology'
                ? 'Anatomical parts, histological layers, and structural landmarks apply.'
                : domain === 'pharmacognosy'
                ? 'Morphological and diagnostic microscopic characters apply.'
                : domain === 'chemistry_analysis'
                ? 'Reagents, chemical species, or analytical apparatus parts apply.'
                : 'Dosage-form excipients, apparatus, or data structure components apply.'
          },
    formulas_calculations:
      domain === 'computing_pk' ||
      domain === 'chemistry_analysis' ||
      (domain === 'pharmaceutics' &&
        (hasQuantitativeCue || /\b(dosage|posology|solution|suspension|emulsion|powder|tablet|incompatib)\b/.test(hay))) ||
      (hasQuantitativeCue && (domain === 'anatomy_physiology' || domain === 'pharmacognosy'))
        ? {
            applicable: true,
            reason:
              'Quantitative equations, dosing/dilution formulas, assay factors, or physiological calculations apply.'
          }
        : {
            applicable: false,
            reason:
              domain === 'psychology_comm'
                ? 'Healthcare psychology & counseling — mathematical calculation formulas not applicable.'
                : 'Descriptive qualitative topic — mathematical formulas are not central unless quantitative QC applies.'
          },
    examples: {
      applicable: true,
      reason: 'Illustrative drugs, formulations, organisms, cases, or worked examples reinforce mastery.'
    },
    pharmaceutical_relevance: {
      applicable: true,
      reason: 'All B.Pharm topics require explicit pharmaceutical or drug-development relevance.'
    },
    clinical_relevance:
      domain === 'anatomy_physiology' ||
      domain === 'psychology_comm' ||
      hasClinicalCue ||
      domain === 'chemistry_analysis'
        ? {
            applicable: true,
            reason: 'Clinical therapeutic, diagnostic, safety, or patient-care implications apply.'
          }
        : domain === 'computing_pk' && !/\b(pk|pharmacokinetic|clinical|adr|dose|bmi|patient|dissolution)\b/.test(hay)
        ? {
            applicable: false,
            reason: 'Pure Python programming fundamentals — clinical pathology link not directly required.'
          }
        : {
            applicable: true,
            reason: 'Patient administration, therapeutic use, or safety relevance applies.'
          },
    learning_objectives: {
      applicable: true,
      reason: 'Course learning objectives & outcomes connect topics to official syllabus competency targets.'
    },
    exam_essentials: {
      applicable: true,
      reason: 'High-yield exam facts, viva pearls, and key distinctions are essential for university prep.'
    },
    references: {
      applicable: true,
      reason: 'Authoritative textbook, pharmacopoeial, or peer-reviewed references are mandatory.'
    },
    visual_resources:
      domain === 'psychology_comm' && !/\b(spikes|sbar|health belief|cbt|communication|model)\b/.test(hay)
        ? {
            applicable: false,
            reason: 'Abstract counseling/ethics topic — anatomical or microscopy visual plates not required.'
          }
        : {
            applicable: true,
            reason: 'Annotated diagrams, microscopy plates, plots, or apparatus visuals support visual learning.'
          },
    experiments_practical: {
      applicable: true,
      reason:
        isPracticalCourse
          ? 'Practical schedule directly requires laboratory procedure & apparatus connections.'
          : 'Laboratory practicals, calculations, role-plays, or dry-lab coding exercises connect theory to practice.'
    },
    assessment_questions: {
      applicable: true,
      reason: 'Practice MCQs, short-answer/numerical prompts, or PYQs verify topic mastery.'
    }
  };

  // 2. Learning Resources (10 checks)
  const resources: Record<ResourceCheckKey, ApplicabilityDecision> = {
    textbooks: {
      applicable: true,
      reason: 'Standard recommended textbook or open-textbook coverage applies to every B.Pharm topic.'
    },
    verified_sources: {
      applicable: true,
      reason: 'Pharmacopoeial monographs, peer-reviewed papers, or verified academic references apply.'
    },
    diagrams:
      domain === 'psychology_comm' && !/\b(spikes|sbar|health belief|cbt|communication|transtheoretical|cycle)\b/.test(hay)
        ? {
            applicable: false,
            reason: 'Narrative interpersonal communication topic without mandatory schematic diagram.'
          }
        : {
            applicable: true,
            reason:
              domain === 'computing_pk'
                ? 'PK curves, workflow diagrams, or data visualization plots apply.'
                : 'Schematic scientific diagrams, cycles, or labeled apparatus figures apply.'
          },
    images:
      domain === 'psychology_comm' || domain === 'computing_pk'
        ? {
            applicable: false,
            reason:
              domain === 'psychology_comm'
                ? 'Behavioral communication domain — photographic specimen/organ imagery not required.'
                : 'Software/PK scripting domain — photographic imagery not required (plots/diagrams apply instead).'
          }
        : {
            applicable: true,
            reason: 'Photographic or high-resolution anatomical/botanical/laboratory visual plates apply.'
          },
    microscopy_visuals:
      (domain === 'pharmacognosy' && (hasMicroscopyCue || /\b(evaluation|crude drug|leaf|bark|seed|plant|ayush|quality)\b/.test(hay))) ||
      (domain === 'anatomy_physiology' && hasMicroscopyCue)
        ? {
            applicable: true,
            reason: 'Histological, cytological, hematology smear, or crude-drug microscopy plates apply.'
          }
        : {
            applicable: false,
            reason:
              'Non-microscopic topic — optical histology or botanical powder microscopy plates not required.'
          },
    models_3d:
      domain === 'psychology_comm'
        ? {
            applicable: false,
            reason: 'Psychology & healthcare communication — 3D spatial model not applicable.'
          }
        : domain === 'computing_pk'
        ? {
            applicable: false,
            reason: 'Python & pharmaceutical data science — 3D spatial model not applicable.'
          }
        : domain === 'anatomy_physiology' ||
          domain === 'chemistry_analysis' ||
          domain === 'pharmaceutics' ||
          domain === 'pharmacognosy'
        ? {
            applicable: true,
            reason:
              domain === 'anatomy_physiology'
                ? '3D anatomical organs, tissues, bones, or cellular structures enrich spatial understanding.'
                : '3D laboratory apparatus, glassware, microscopes, or pharmaceutical equipment models apply.'
          }
        : {
            applicable: false,
            reason: 'General conceptual topic without a mandatory 3D specimen or apparatus target.'
          },
    experiments: {
      applicable: true,
      reason: 'Corresponding PharmaLab department practical, calculator, role-play, or code workbench applies.'
    },
    interactive_simulations:
      hasSimCue || isPracticalCourse
        ? {
            applicable: true,
            reason: 'Interactive dynamic simulator, titration/PK bench, or live Python lab applies.'
          }
        : {
            applicable: false,
            reason: 'Descriptive non-dynamic syllabus topic — dynamic mathematical simulator optional.'
          },
    mcqs: {
      applicable: true,
      reason: 'Formative MCQs or structured exam questions verify unit comprehension.'
    },
    pyqs: {
      applicable: true,
      reason: 'University previous-year question paper (PYQ) alignment strengthens exam readiness.'
    }
  };

  return { components, resources };
}
