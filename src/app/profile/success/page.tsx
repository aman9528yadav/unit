
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
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-[#1E1E1E] text-white p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-center flex flex-col items-center gap-8"
      >
        <Image
          src="https://picsum.photos/300/300"
          alt="Trophy with confetti"
          width={300}
          height={300}
          data-ai-hint="trophy celebration"
          className="w-60 h-60"
        />
        <div className="space-y-4">
            <div className="bg-[#DFFF00]/10 p-8 rounded-2xl flex flex-col gap-4 items-center">
                 <h1 className="text-4xl font-bold text-[#DFFF00]">Congratulations!</h1>
                 <p className="bg-white text-black px-6 py-2 rounded-full font-semibold">Finally Completed Profile</p>
            </div>

            <Button asChild variant="secondary" className="bg-[#6A0DAD] text-white hover:bg-[#6A0DAD]/90 px-8 py-6 rounded-full text-lg">
                <Link href="/settings">Check setting for more update!</Link>
            </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-8">This app is made by Aman yadav</p>
      </motion.div>
    </main>
  );
}
