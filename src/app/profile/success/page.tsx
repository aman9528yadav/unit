
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function SuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, 5000); // Redirect to dashboard after 5 seconds

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center flex flex-col items-center gap-8 w-full max-w-sm"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.7, delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <Image
            src="https://picsum.photos/300/300"
            alt="Trophy with confetti"
            width={300}
            height={300}
            data-ai-hint="trophy celebration"
            className="w-48 h-48 rounded-full border-4 border-accent shadow-lg"
          />
        </motion.div>
        
        <div className="space-y-4">
            <div className="bg-card p-8 rounded-2xl flex flex-col gap-4 items-center shadow-md">
                 <h1 className="text-4xl font-bold text-primary">Congratulations!</h1>
                 <p className="bg-accent text-accent-foreground px-6 py-2 rounded-full font-semibold">Your Profile is Ready!</p>
            </div>

            <p className="text-muted-foreground">You will be redirected to the dashboard shortly.</p>

            <Button asChild variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30 px-8 py-6 rounded-full text-lg font-bold">
                <Link href="/">Go to Dashboard</Link>
            </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-8">This app is made by Aman yadav</p>
      </motion.div>
    </main>
  );
}
