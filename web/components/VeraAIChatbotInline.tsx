'use client';

import dynamic from 'next/dynamic';

const VeraAIChatbot = dynamic(() => import('@/components/VeraAIChatbot'), { ssr: false });

export default function VeraAIChatbotInline() {
  return <VeraAIChatbot inline inlineVariant="minimal" />;
}
