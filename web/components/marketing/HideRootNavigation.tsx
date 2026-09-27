'use client';

import { useLayoutEffect } from 'react';

/** Hide global marketing nav when a page renders its own top bar with BrandLogo. */
export function HideRootNavigation() {
  useLayoutEffect(() => {
    document.body.classList.add('biovera-custom-top-nav');
    return () => {
      document.body.classList.remove('biovera-custom-top-nav');
    };
  }, []);
  return null;
}
