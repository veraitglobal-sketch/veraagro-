export type { TechnicalProposalChapter } from "@/content/technical-proposal.part-a";
import { TECHNICAL_PROPOSAL_CHAPTERS_PART_A } from "@/content/technical-proposal.part-a";
import { EIC_PART_B_CHAPTERS } from "@/content/eic-part-b";
import { TECHNICAL_PROPOSAL_CHAPTERS_PART_B } from "@/content/technical-proposal.part-b";
import { TECHNICAL_PROPOSAL_CHAPTERS_PART_C } from "@/content/technical-proposal.part-c";
import { TECHNICAL_PROPOSAL_CHAPTERS_PART_D } from "@/content/technical-proposal.part-d";
import { TECHNICAL_PROPOSAL_CHAPTERS_PART_E } from "@/content/technical-proposal.part-e";
import { TECHNICAL_PROPOSAL_CHAPTERS_PART_F } from "@/content/technical-proposal.part-f";
import { TECHNICAL_PROPOSAL_PROGRAMME_PART_B } from "@/content/technical-proposal.programme-part-b";
import { TECHNICAL_PROPOSAL_IMPLEMENTATION_ATLAS } from "@/content/technical-proposal.implementation-atlas";

/** Part A opens with §1 Executive summary; EU grant narrative (why–market–revenue–success–plan–budget) follows in one document; then programme Part B depth, atlas, annexes. */
const PART_A_EXEC_AND_REST = TECHNICAL_PROPOSAL_CHAPTERS_PART_A;

/** English technical proposal — grant-facing narrative embedded after the executive summary, then programme depth and technical annex. */
export const TECHNICAL_PROPOSAL_CHAPTERS = [
  PART_A_EXEC_AND_REST[0],
  ...EIC_PART_B_CHAPTERS,
  ...TECHNICAL_PROPOSAL_PROGRAMME_PART_B,
  ...TECHNICAL_PROPOSAL_IMPLEMENTATION_ATLAS,
  ...PART_A_EXEC_AND_REST.slice(1),
  ...TECHNICAL_PROPOSAL_CHAPTERS_PART_B,
  ...TECHNICAL_PROPOSAL_CHAPTERS_PART_C,
  ...TECHNICAL_PROPOSAL_CHAPTERS_PART_D,
  ...TECHNICAL_PROPOSAL_CHAPTERS_PART_E,
  ...TECHNICAL_PROPOSAL_CHAPTERS_PART_F,
] as const;
