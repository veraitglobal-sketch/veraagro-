'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const VeraAIChatbot = dynamic(() => import('@/components/VeraAIChatbot'), {
  ssr: false,
});

export default function VeraAIChatbotWrapper() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return <VeraAIChatbot />;
}
