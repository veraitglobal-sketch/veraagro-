export type { TechnicalProposalChapter } from "@/content/technical-proposal.part-a";
import { TECHNICAL_PROPOSAL_CHAPTERS_PART_A } from "@/content/technical-proposal.part-a";
import { TECHNICAL_PROPOSAL_CHAPTERS_PART_B } from "@/content/technical-proposal.part-b";
import { TECHNICAL_PROPOSAL_CHAPTERS_PART_C } from "@/content/technical-proposal.part-c";

/** Full structured technical proposal (~20–28 pages printed at 11pt A4 typical; Annex PDFs may extend). */
export const TECHNICAL_PROPOSAL_CHAPTERS = [
  ...TECHNICAL_PROPOSAL_CHAPTERS_PART_A,
  ...TECHNICAL_PROPOSAL_CHAPTERS_PART_B,
  ...TECHNICAL_PROPOSAL_CHAPTERS_PART_C,
] as const;
