
"use client";

import { useEffect } from 'react';

export default function NewsPage() {
  useEffect(() => {
    window.location.href = 'https://aman9528.wixstudio.com/my-site-3';
  }, []);

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
      <p>Redirecting to news...</p>
    </main>
  );
}
