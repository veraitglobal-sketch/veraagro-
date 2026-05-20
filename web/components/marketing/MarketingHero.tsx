import type { ReactNode } from 'react';
import {
  marketingHeroEyebrow,
  marketingHeroInner,
  marketingHeroLead,
  marketingHeroSection,
  marketingHeroSubtitle,
  marketingHeroTitle,
} from '@/lib/marketing-classes';

type MarketingHeroProps = Readonly<{
  eyebrow?: string;
  title: string;
  /** Podnaslov — bivši deo posle „—“ u jednom dugačkom H1 */
  subtitle?: string;
  lead?: string;
  leadClassName?: string;
  children?: ReactNode;
  sectionClassName?: string;
}>;

export default function MarketingHero({
  eyebrow,
  title,
  subtitle,
  lead,
  leadClassName,
  children,
  sectionClassName = '',
}: MarketingHeroProps) {
  return (
    <section className={`${marketingHeroSection} ${sectionClassName}`.trim()}>
      <div className={marketingHeroInner}>
        {eyebrow ? <p className={marketingHeroEyebrow}>{eyebrow}</p> : null}
        <h1 className={marketingHeroTitle}>{title}</h1>
        {subtitle ? <p className={marketingHeroSubtitle}>{subtitle}</p> : null}
        {lead ? <p className={leadClassName ?? marketingHeroLead}>{lead}</p> : null}
        {children}
      </div>
    </section>
  );
}
