export type { TechnicalProposalChapter } from "@/content/technical-proposal.part-a";
import { TECHNICAL_PROPOSAL_CHAPTERS_PART_A } from "@/content/technical-proposal.part-a";
import { TECHNICAL_PROPOSAL_OPENING } from "@/content/technical-proposal.opening";
import { TECHNICAL_PROPOSAL_CHAPTERS_PART_B } from "@/content/technical-proposal.part-b";
import { TECHNICAL_PROPOSAL_CHAPTERS_PART_C } from "@/content/technical-proposal.part-c";
import { TECHNICAL_PROPOSAL_CHAPTERS_PART_D } from "@/content/technical-proposal.part-d";
import { TECHNICAL_PROPOSAL_CHAPTERS_PART_E } from "@/content/technical-proposal.part-e";
import { TECHNICAL_PROPOSAL_CHAPTERS_PART_F } from "@/content/technical-proposal.part-f";
import { TECHNICAL_PROPOSAL_PROGRAMME_PART_B } from "@/content/technical-proposal.programme-part-b";
import { TECHNICAL_PROPOSAL_IMPLEMENTATION_ATLAS } from "@/content/technical-proposal.implementation-atlas";

/** Part A chapters 1–5: objectives through offline (executive/problem removed—covered in opening). */
const PART_A_TAIL = TECHNICAL_PROPOSAL_CHAPTERS_PART_A;

/**
 * Single web/PDF corpus: opening (who reads what + executive pitch), programme Part B,
 * condensed implementation atlas, then engineering annexes.
 */
export const TECHNICAL_PROPOSAL_CHAPTERS = [
  ...TECHNICAL_PROPOSAL_OPENING,
  ...TECHNICAL_PROPOSAL_PROGRAMME_PART_B,
  ...TECHNICAL_PROPOSAL_IMPLEMENTATION_ATLAS,
  ...PART_A_TAIL,
  ...TECHNICAL_PROPOSAL_CHAPTERS_PART_B,
  ...TECHNICAL_PROPOSAL_CHAPTERS_PART_C,
  ...TECHNICAL_PROPOSAL_CHAPTERS_PART_D,
  ...TECHNICAL_PROPOSAL_CHAPTERS_PART_E,
  ...TECHNICAL_PROPOSAL_CHAPTERS_PART_F,
] as const;
