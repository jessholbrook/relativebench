export type ExperienceRating = -2 | -1 | 0 | 1 | 2;

export interface ExperienceJudgment {
  rating: ExperienceRating;
  weight?: number;
}

export interface ExperienceSummary {
  experienceDelta: number;
  preferenceLift: number;
  noticeability: number;
  strongRegressionRate: number;
  distribution: Record<ExperienceRating, number>;
  sampleSize: number;
  totalWeight: number;
}

export interface ScoredPair {
  previousPassed: boolean;
  newPassed: boolean;
}

export interface FlipSummary {
  stableSuccesses: number;
  negativeFlips: number;
  positiveFlips: number;
  stableFailures: number;
  negativeFlipRate: number | null;
  positiveFlipRate: number | null;
}

export type TransitionClassification =
  | 'upgrade'
  | 'regression'
  | 'sidegrade'
  | 'inconclusive';

const RATINGS: ExperienceRating[] = [-2, -1, 0, 1, 2];

function cleanZero(value: number): number {
  return Object.is(value, -0) ? 0 : value;
}

export function summarizeExperience(
  judgments: ExperienceJudgment[],
): ExperienceSummary {
  if (judgments.length === 0) {
    throw new Error('At least one experience judgment is required.');
  }

  const distribution = Object.fromEntries(
    RATINGS.map((rating) => [rating, 0]),
  ) as Record<ExperienceRating, number>;

  let totalWeight = 0;
  let weightedRating = 0;
  let betterWeight = 0;
  let worseWeight = 0;
  let noticeableWeight = 0;
  let strongRegressionWeight = 0;

  for (const judgment of judgments) {
    if (!RATINGS.includes(judgment.rating)) {
      throw new Error(`Invalid experience rating: ${judgment.rating}`);
    }

    const weight = judgment.weight ?? 1;
    if (!Number.isFinite(weight) || weight <= 0) {
      throw new Error('Judgment weights must be finite and greater than zero.');
    }

    totalWeight += weight;
    weightedRating += weight * judgment.rating;
    distribution[judgment.rating] += 1;

    if (judgment.rating > 0) betterWeight += weight;
    if (judgment.rating < 0) worseWeight += weight;
    if (judgment.rating !== 0) noticeableWeight += weight;
    if (judgment.rating === -2) strongRegressionWeight += weight;
  }

  return {
    experienceDelta: cleanZero((50 * weightedRating) / totalWeight),
    preferenceLift: cleanZero(
      (100 * (betterWeight - worseWeight)) / totalWeight,
    ),
    noticeability: noticeableWeight / totalWeight,
    strongRegressionRate: strongRegressionWeight / totalWeight,
    distribution,
    sampleSize: judgments.length,
    totalWeight,
  };
}

export function summarizeFlips(pairs: ScoredPair[]): FlipSummary {
  let stableSuccesses = 0;
  let negativeFlips = 0;
  let positiveFlips = 0;
  let stableFailures = 0;

  for (const pair of pairs) {
    if (pair.previousPassed && pair.newPassed) stableSuccesses += 1;
    else if (pair.previousPassed) negativeFlips += 1;
    else if (pair.newPassed) positiveFlips += 1;
    else stableFailures += 1;
  }

  const previousPasses = stableSuccesses + negativeFlips;
  const previousFailures = positiveFlips + stableFailures;

  return {
    stableSuccesses,
    negativeFlips,
    positiveFlips,
    stableFailures,
    negativeFlipRate:
      previousPasses === 0 ? null : negativeFlips / previousPasses,
    positiveFlipRate:
      previousFailures === 0 ? null : positiveFlips / previousFailures,
  };
}

export function classifyTransition(
  lowerBound: number,
  upperBound: number,
  minimumImportantDifference = 5,
): TransitionClassification {
  if (lowerBound > upperBound) {
    throw new Error('The lower confidence bound cannot exceed the upper bound.');
  }
  if (minimumImportantDifference < 0) {
    throw new Error('The minimum important difference cannot be negative.');
  }

  if (lowerBound > minimumImportantDifference) return 'upgrade';
  if (upperBound < -minimumImportantDifference) return 'regression';
  if (
    lowerBound >= -minimumImportantDifference &&
    upperBound <= minimumImportantDifference
  ) {
    return 'sidegrade';
  }
  return 'inconclusive';
}
