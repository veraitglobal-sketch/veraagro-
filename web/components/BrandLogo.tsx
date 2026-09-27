import Image from 'next/image';
import { BIOVERA_LOGO_SRC, BRAND_LOGO_HEIGHT_CLASS } from '@/lib/brand-logo';

type BrandLogoProps = {
  alt: string;
  className?: string;
  priority?: boolean;
  /** Tailwind height classes; width follows 2:1 wordmark ratio via w-auto. */
  heightClass?: string;
};

export default function BrandLogo({
  alt,
  className = '',
  priority = false,
  heightClass = BRAND_LOGO_HEIGHT_CLASS,
}: BrandLogoProps) {
  return (
    <Image
      src={BIOVERA_LOGO_SRC}
      alt={alt}
      width={240}
      height={120}
      className={`w-auto ${heightClass} bg-transparent object-contain ${className}`.trim()}
      priority={priority}
      unoptimized
      style={{ background: 'transparent' }}
    />
  );
}
