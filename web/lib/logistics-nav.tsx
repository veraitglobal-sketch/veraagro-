import type { ReactNode } from 'react';
import locale from '@/locales/en.json';

const t = locale.logisticsPartnerNav;

const dash = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);
const mission = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);
const truck = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M8.25 18.75a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15.75 18.75a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM2.25 6.75h2.4l1.5 2.25H18a1.5 1.5 0 011.5 1.5v3.75h1.2a.75.75 0 01.75.75v.75m-2.1 0a2.1 2.1 0 11-4.2 0m-8.1 0a2.1 2.1 0 11-4.2 0M2.25 6.75V6A1.5 1.5 0 013.75 4.5h.75A1.5 1.5 0 016 6v.75M2.25 6.75h3m12 8.25h-8.25A1.5 1.5 0 0112 19.5H6.75A1.5 1.5 0 015.25 18V9a1.5 1.5 0 011.5-1.5H18"
    />
  </svg>
);
const handover = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

const handSignature = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
    />
  </svg>
);

export const logisticsPartnerNavItems: { href: string; label: string; icon: ReactNode }[] = [
  { href: '/logistics-partner/dashboard', label: t.dashboard, icon: dash },
  { href: '/logistics-partner/missions', label: t.missions, icon: mission },
  { href: '/logistics-partner/vehicles', label: t.vehicles, icon: truck },
  { href: '/logistics-partner/handover', label: t.loadingHandover, icon: handover },
  { href: '/logistics-partner/handover-receiver', label: t.receiverProof, icon: handSignature },
];
