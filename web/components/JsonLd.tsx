type JsonLdProps = {
  data: Record<string, unknown>;
};

/** Inline JSON-LD for SEO / AI crawlers. Safe in server and client components. */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
