import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Props = {
  markdown: string;
  /** Optional prose wrapper class tweaks */
  className?: string;
};

/**
 * Renders GDPR-style legal Markdown (GFM tables for cookie policy etc.).
 */
export function LegalMarkdownBody({ markdown, className }: Props) {
  return (
    <div className={`prose prose-gray max-w-none space-y-8 ${className ?? ''}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}
