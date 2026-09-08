/**
 * Funnel arithmetic.
 *
 * Pure and separate from the database so the drop-off maths can be asserted
 * directly. A funnel report that is quietly wrong is worse than none at all —
 * it sends you off optimising a step that was never the problem.
 */

export type FunnelStep = {
  step: number;
  label: string;
  reached: number;
  dropOff: number;
  dropOffPct: number;
};

export const FUNNEL_STEP_LABELS = [
  "Property type",
  "Budget",
  "Location",
  "What matters most",
  "Finance position",
  "Timeframe",
  "Contact details",
];

/**
 * Turn "how many reached each step" into per-step drop-off.
 *
 * Step 1 is everyone who started. Each later step is measured against the one
 * before it, so the percentages answer "of the people who got here, how many
 * went on?" rather than a share of the original total — which is the question
 * you act on when deciding which screen to change.
 */
export function computeFunnelSteps(
  started: number,
  reachedByStep: Map<number, number>,
  labels: string[] = FUNNEL_STEP_LABELS,
): FunnelStep[] {
  return labels.map((label, index) => {
    const step = index + 1;
    const reached = step === 1 ? started : (reachedByStep.get(step) ?? 0);
    const previous = step === 1 ? started : (reachedByStep.get(step - 1) ?? started);
    const dropOff = Math.max(0, previous - reached);
    return {
      step,
      label,
      reached,
      dropOff,
      dropOffPct: previous > 0 ? Math.round((dropOff / previous) * 100) : 0,
    };
  });
}

/**
 * The step losing the largest share of the people who reach it.
 *
 * Step 1 is excluded: the gap between "started the form" and "answered the
 * first question" is a different phenomenon to abandoning midway, and letting
 * it win would mask every real problem behind it.
 */
export function worstFunnelStep(steps: FunnelStep[]): FunnelStep | null {
  const candidates = steps.filter((s) => s.step > 1 && s.reached > 0);
  if (!candidates.length) return null;
  return candidates.reduce((worst, s) => (s.dropOffPct > worst.dropOffPct ? s : worst));
}

export function completionRate(started: number, completed: number): number {
  if (started <= 0) return 0;
  return Math.round((completed / started) * 100);
}
