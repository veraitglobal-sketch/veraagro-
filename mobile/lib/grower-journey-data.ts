import {
  GROWER_JOURNEY_STEP_DEFS,
  type GrowerJourneyStepDef,
} from '../../shared/lib/grower-journey';

export type JourneyLink = { label: string; path: string };

export type GrowerJourneyStep = {
  title: string;
  paragraphs: string[];
  links?: JourneyLink[];
};

function mobileLinksForStep(def: GrowerJourneyStepDef): JourneyLink[] {
  if (def.linksMobile?.length) {
    return def.linksMobile.map((l) => ({ label: l.label, path: l.path }));
  }
  if (def.links?.length) {
    return def.links.map((l) => ({ label: l.label, path: l.mobilePath }));
  }
  return [];
}

/** Derived from `shared/lib/grower-journey.ts` (single source of truth). */
export const GROWER_JOURNEY_STEPS: GrowerJourneyStep[] = GROWER_JOURNEY_STEP_DEFS.map((def) => ({
  title: def.title,
  paragraphs: [...def.paragraphs, ...(def.footnote ? [def.footnote] : [])],
  links: mobileLinksForStep(def),
}));
