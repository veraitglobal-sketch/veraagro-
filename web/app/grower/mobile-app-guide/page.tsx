import { Suspense } from 'react';
import GrowerAppGuidePublicPage from '@/components/grower/GrowerAppGuidePublicPage';

export default function GrowerMobileAppGuidePage() {
  return (
    <Suspense fallback={null}>
      <GrowerAppGuidePublicPage />
    </Suspense>
  );
}
