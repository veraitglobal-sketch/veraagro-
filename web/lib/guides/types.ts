export type GuideCluster = 'trust' | 'traceability' | 'grower' | 'logistics' | 'buyer' | 'export';

export type GuideSection = {
  heading?: string;
  paragraphs: string[];
};

export type GuideRelatedLink = {
  /** Path without locale, e.g. `for-growers` or `guides/foo` */
  path: string;
  label: string;
};

export type GuideDefinition = {
  slug: string;
  cluster: GuideCluster;
  audiences: string[];
  title: string;
  metaDescription: string;
  eyebrow?: string;
  lead: string;
  sections: GuideSection[];
  relatedLinks: GuideRelatedLink[];
  /** When false, excluded from sitemap until copy is approved. */
  published: boolean;
};

export type ProduceDefinition = {
  slug: string;
  cropName: string;
  metaDescription: string;
  lead: string;
  sections: GuideSection[];
  relatedLinks: GuideRelatedLink[];
  published: boolean;
};
