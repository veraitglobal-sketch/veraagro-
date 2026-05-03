import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

const mdComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-3xl font-light tracking-tight text-gray-900 border-b border-[#2D5A27]/20 pb-3 mb-8">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-10 text-xl font-semibold text-[#2D5A27] scroll-mt-24 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-6 text-lg font-semibold text-gray-900">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="mt-4 text-lg font-light leading-relaxed text-gray-800 first:mt-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mt-4 list-disc space-y-2 pl-6 text-lg leading-relaxed text-gray-800">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-4 list-decimal space-y-2 pl-6 text-lg leading-relaxed text-gray-800">{children}</ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="mt-6 border-l-4 border-[#2D5A27]/40 bg-[#2D5A27]/[0.06] py-3 pl-5 pr-4 text-base italic text-gray-800 leading-relaxed rounded-r-lg">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-10 border-gray-200" />,
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-base">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
  th: ({ children }) => (
    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 text-sm text-gray-800 border-t border-gray-100">{children}</td>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="font-medium text-[#2D5A27] underline decoration-[#2D5A27]/30 underline-offset-2 hover:decoration-[#2D5A27]"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
};

type Props = {
  markdown: string;
};

/** Confidential partner plans — readable typography aligned with grower surfaces (#2D5A27). */
export function PartnerPlanProse({ markdown }: Props) {
  return (
    <article className="partner-plan-prose max-w-3xl">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
        {markdown}
      </ReactMarkdown>
    </article>
  );
}
