/** Printable Data and Consent Declaration (grant / diligence). */
import type { TechnicalProposalChapter } from "@/content/technical-proposal.part-a";

export const DATA_CONSENT_DECLARATION_CHAPTERS: readonly TechnicalProposalChapter[] = [
  {
    id: "dcd-declaration",
    title: "Data and Consent Declaration",
    paragraphs: [
      "We, the undersigned, hereby confirm that all personal data included in this proposal has been provided with the full knowledge and explicit consent of the individuals concerned.",
      "We confirm that all data is processed in accordance with applicable data protection regulations, including the General Data Protection Regulation (GDPR).",
      "We declare that all participants have agreed to their involvement in the project and the use of their information for the purposes of proposal submission, evaluation, and potential grant management.",
      "We further confirm that appropriate measures are in place to ensure data protection, confidentiality, and integrity.",
    ],
  },
  {
    id: "dcd-signatory",
    title: "Signatory",
    paragraphs: [
      "Organisation name: BIOVERA",
      "Name and position: Jovica Mihajlovic, CEO / Founder",
      "Date: 02.05.2026",
    ],
  },
] as const;
