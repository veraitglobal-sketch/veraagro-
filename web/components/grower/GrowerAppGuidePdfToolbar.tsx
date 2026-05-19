'use client';

import Link from 'next/link';
import { Download, ExternalLink, Printer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { growerAppGuidePdfPath, growerAppGuidePdfFilename } from '@/lib/grower-app-guide';

type Props = {
  /** Show secondary “print this page” (optional fallback). */
  showPrint?: boolean;
  className?: string;
};

/** Primary static PDF download + optional browser print fallback. */
export function GrowerAppGuidePdfToolbar({ showPrint = true, className }: Props) {
  const { t, i18n } = useTranslation();
  const pdfPath = growerAppGuidePdfPath(i18n.language);
  const filename = growerAppGuidePdfFilename(i18n.language);

  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center ${className ?? ''}`}>
      <Link
        href={pdfPath}
        download={filename}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-[#2D5A27] px-5 text-sm font-medium text-white hover:bg-[#23471f] focus:outline-none focus:ring-2 focus:ring-[#2D5A27] focus:ring-offset-2"
      >
        <Download className="h-4 w-4 shrink-0" aria-hidden />
        {t('grower.appGuide.downloadPdf')}
      </Link>

      {showPrint ? (
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 text-sm font-medium text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/30 focus:ring-offset-2"
        >
          <Printer className="h-4 w-4 shrink-0" aria-hidden />
          {t('grower.appGuide.printPdf')}
        </button>
      ) : null}

      <p className="text-sm text-gray-600 leading-relaxed sm:max-w-md">
        {t('grower.appGuide.pdfDownloadHint')}
      </p>
    </div>
  );
}

/** Compact link for resource cards — download only. */
export function GrowerAppGuidePdfDownloadLink({ className }: { className?: string }) {
  const { t, i18n } = useTranslation();
  const pdfPath = growerAppGuidePdfPath(i18n.language);
  const filename = growerAppGuidePdfFilename(i18n.language);

  return (
    <Link
      href={pdfPath}
      download={filename}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ??
        'text-sm text-[#2D5A27] hover:text-[#23471f] font-medium transition-colors inline-flex items-center gap-1'
      }
    >
      {t('grower.appGuide.downloadPdf')}
      <Download className="w-4 h-4" aria-hidden />
    </Link>
  );
}

export function GrowerAppGuideOnlineLink({ href, className }: { href: string; className?: string }) {
  const { t } = useTranslation();

  return (
    <Link
      href={href}
      className={
        className ??
        'text-sm text-gray-600 hover:text-[#2D5A27] font-medium transition-colors inline-flex items-center gap-1'
      }
    >
      {t('grower.appGuide.viewOnline')}
      <ExternalLink className="w-4 h-4" aria-hidden />
    </Link>
  );
}
