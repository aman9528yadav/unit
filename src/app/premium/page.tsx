
import { PremiumPage } from '@/components/premium-page';
import { Suspense } from 'react';

export default function PremiumInfoPage() {
  return (
    <main className="w-full flex-grow p-4 sm:p-6">
      <Suspense>
        <PremiumPage />
      </Suspense>
    </main>
  );
}
