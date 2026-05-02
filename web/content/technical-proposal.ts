export type { TechnicalProposalChapter } from "@/content/technical-proposal.part-a";
import { TECHNICAL_PROPOSAL_CHAPTERS_PART_A } from "@/content/technical-proposal.part-a";
import { TECHNICAL_PROPOSAL_CHAPTERS_PART_B } from "@/content/technical-proposal.part-b";
import { TECHNICAL_PROPOSAL_CHAPTERS_PART_C } from "@/content/technical-proposal.part-c";
import { TECHNICAL_PROPOSAL_CHAPTERS_PART_D } from "@/content/technical-proposal.part-d";
import { TECHNICAL_PROPOSAL_CHAPTERS_PART_E } from "@/content/technical-proposal.part-e";
import { TECHNICAL_PROPOSAL_CHAPTERS_PART_F } from "@/content/technical-proposal.part-f";
import { TECHNICAL_PROPOSAL_PROGRAMME_PART_B } from "@/content/technical-proposal.programme-part-b";
import { TECHNICAL_PROPOSAL_IMPLEMENTATION_ATLAS } from "@/content/technical-proposal.implementation-atlas";

/** Part A opens with §1 Executive summary, then Programme Part B (problem → finances), then technical depth / annex chapters. */
const PART_A_EXEC_AND_REST = TECHNICAL_PROPOSAL_CHAPTERS_PART_A;

/** English technical proposal — “deck = trailer / Part B = full film” structured body plus technical annex (~30–45+ printed A4 pages at 11pt, spacing-dependent). */
export const TECHNICAL_PROPOSAL_CHAPTERS = [
  PART_A_EXEC_AND_REST[0],
  ...TECHNICAL_PROPOSAL_PROGRAMME_PART_B,
  ...TECHNICAL_PROPOSAL_IMPLEMENTATION_ATLAS,
  ...PART_A_EXEC_AND_REST.slice(1),
  ...TECHNICAL_PROPOSAL_CHAPTERS_PART_B,
  ...TECHNICAL_PROPOSAL_CHAPTERS_PART_C,
  ...TECHNICAL_PROPOSAL_CHAPTERS_PART_D,
  ...TECHNICAL_PROPOSAL_CHAPTERS_PART_E,
  ...TECHNICAL_PROPOSAL_CHAPTERS_PART_F,
] as const;
