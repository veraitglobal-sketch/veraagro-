'use client';

import dynamic from 'next/dynamic';

const VeraAIChatbot = dynamic(() => import('@/components/VeraAIChatbot'), {
  ssr: false,
});

export default function VeraAIChatbotWrapper() {
  return <VeraAIChatbot />;
}
