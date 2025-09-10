
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TranslatorPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page or show a message, as this feature is coming soon.
    router.push('/');
  }, [router]);

  return (
    <main className="w-full flex-grow p-4 sm:p-6 text-center">
      <p>This feature is coming soon and is currently unavailable.</p>
    </main>
  );
}
