'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const VeraAIChatbot = dynamic(() => import('@/components/VeraAIChatbot'), { ssr: false });

export default function VeraAIChatbotWrapper() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 350);
    return () => clearTimeout(t);
  }, []);

  if (!mounted) return null;
  return (
    <div className="print:hidden">
      <VeraAIChatbot />
    </div>
  );
}
