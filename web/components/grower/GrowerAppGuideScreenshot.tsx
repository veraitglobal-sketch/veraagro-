'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageOff, X, ZoomIn } from 'lucide-react';

/** Native iPhone screenshot dimensions in repo (1170×2532 @3×). */
const SCREENSHOT_WIDTH = 1170;
const SCREENSHOT_HEIGHT = 2532;

type Props = {
  src: string;
  alt: string;
  imageFile: string;
  priority?: boolean;
  /** All screenshots eager — use for ?pdf=1 export so nothing is lazy-loaded. */
  pdfExport?: boolean;
};

export function GrowerAppGuideScreenshot({ src, alt, imageFile, priority = false, pdfExport = false }: Props) {
  const { t } = useTranslation();
  const [imgOk, setImgOk] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [lightboxOpen, closeLightbox]);

  const eager = pdfExport || priority;

  if (!imgOk) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 bg-gray-100 aspect-[1170/2532] px-4 text-center">
        <ImageOff className="h-8 w-8 text-gray-400" aria-hidden />
        <p className="text-xs text-gray-500 font-mono break-all">{imageFile}</p>
        <p className="text-xs text-gray-500">{t('grower.appGuide.imagePending')}</p>
      </div>
    );
  }

  const imgEl = (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      srcSet={pdfExport ? undefined : `${src} ${SCREENSHOT_WIDTH}w`}
      sizes={pdfExport ? undefined : '(max-width: 640px) min(92vw, 420px), 420px'}
      alt={alt}
      width={SCREENSHOT_WIDTH}
      height={SCREENSHOT_HEIGHT}
      className="grower-app-guide-screenshot w-full h-auto block"
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
      decoding={eager ? 'sync' : 'async'}
      onError={() => setImgOk(false)}
    />
  );

  if (pdfExport) {
    return imgEl;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="group relative block w-full cursor-zoom-in border-0 bg-transparent p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27] focus-visible:ring-offset-2"
        aria-label={t('grower.appGuide.enlargeScreenshot')}
      >
        {imgEl}
        <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 print:hidden">
          <ZoomIn className="h-3.5 w-3.5" aria-hidden />
          {t('grower.appGuide.zoomLabel')}
        </span>
      </button>

      {lightboxOpen ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={closeLightbox}
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label={t('grower.appGuide.closeLightbox')}
          >
            <X className="h-6 w-6" aria-hidden />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            width={SCREENSHOT_WIDTH}
            height={SCREENSHOT_HEIGHT}
            className="grower-app-guide-screenshot max-h-[92vh] max-w-full w-auto h-auto object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
}
