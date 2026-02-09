'use client';

import { useEffect, useState } from 'react';
import VeraAIChatbot from '@/components/VeraAIChatbot';

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
