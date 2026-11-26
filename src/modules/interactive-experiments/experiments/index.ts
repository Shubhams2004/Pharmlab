import { Asset3DItem } from '../../assets-3d/types';
import { ExperimentDefinition } from '../types';
import { cardiacHemodynamicsExperiment } from './cardiacHemodynamicsExperiment';
import { dissolutionExperiment } from './dissolutionExperiment';
import { membraneDiffusionExperiment } from './membraneDiffusionExperiment';
import { microbialKineticsExperiment } from './microbialKineticsExperiment';
import { pharmacokineticsExperiment } from './pharmacokineticsExperiment';
import { titrationExperiment } from './titrationExperiment';

export const INTERACTIVE_EXPERIMENTS: ExperimentDefinition[] = [
  dissolutionExperiment,
  titrationExperiment,
  pharmacokineticsExperiment,
  cardiacHemodynamicsExperiment,
  microbialKineticsExperiment,
  membraneDiffusionExperiment
];

export const EXPERIMENT_BY_ID: Record<string, ExperimentDefinition> = Object.fromEntries(
  INTERACTIVE_EXPERIMENTS.map((exp) => [exp.id, exp])
);

export function getExperimentById(id?: string | null): ExperimentDefinition | null {
  if (!id) return null;
  return EXPERIMENT_BY_ID[id] || null;
}

/**
 * Matches assets in the centralized 3D Asset Library against an experiment's
 * 3D asset slots using existing SyllabusAssociation metadata + category/keyword relevance.
 */
export function match3DAssetsForExperiment(
  experiment: ExperimentDefinition,
  allAssets: Asset3DItem[]
): Array<{
  asset: Asset3DItem;
  slotId: string;
  roleLabel: string;
  score: number;
  reason: string;
}> {
  if (!allAssets || allAssets.length === 0) return [];
  const scored: Array<{
    asset: Asset3DItem;
    slotId: string;
    roleLabel: string;
    score: number;
    reason: string;
  }> = [];

  for (const asset of allAssets) {
    let bestScore = 0;
    let bestReason = '';
    let bestSlot = experiment.asset3dBindings[0];

    for (const binding of experiment.asset3dBindings) {
      let score = 0;
      const reasons: string[] = [];

      // 1. Direct SyllabusAssociation experiment match
      if (
        asset.syllabusLinks?.some(
          (l) =>
            (binding.recommendedExperimentId &&
              l.experimentId === binding.recommendedExperimentId) ||
            l.experimentId === experiment.id ||
            (binding.recommendedSubjectCode &&
              l.subjectCode?.toUpperCase().includes(binding.recommendedSubjectCode.toUpperCase()))
        )
      ) {
        score += 55;
        reasons.push('Linked via syllabus / experiment metadata');
      }

      // 2. Category hint match
      if (binding.categoryHints.includes(asset.category)) {
        score += 22;
        reasons.push(`Category match (${asset.category})`);
      }

      // 3. Department match
      if (asset.departments?.some((d) => binding.departmentHints.includes(d))) {
        score += 18;
        reasons.push('Department match');
      }

      // 4. Keyword match against name, tags, description
      const hay = `${asset.name} ${asset.description} ${asset.tags.join(' ')}`.toLowerCase();
      const kwHits = binding.matchKeywords.filter((kw) => hay.includes(kw.toLowerCase()));
      if (kwHits.length > 0) {
        score += kwHits.length * 14;
        reasons.push(`Matched: ${kwHits.slice(0, 3).join(', ')}`);
      }

      // Prefer assets with actual offline binary or remote URL
      if (asset.hasBinaryBlob || asset.externalFileUrl) {
        score += 10;
      }

      if (score > bestScore && reasons.length > 0) {
        bestScore = score;
        bestReason = reasons[0];
        bestSlot = binding;
      }
    }

    if (bestScore >= 18 && bestSlot) {
      scored.push({
        asset,
        slotId: bestSlot.slotId,
        roleLabel: bestSlot.roleLabel,
        score: bestScore,
        reason: bestReason
      });
    }
  }

  return scored.sort((a, b) => b.score - a.score || (b.asset.updatedAt || 0) - (a.asset.updatedAt || 0));
}
