
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

export default function SuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, 5000); // Redirect to dashboard after 5 seconds

    return () => clearTimeout(timer);
  }, [router]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-center flex flex-col items-center gap-8 w-full max-w-md"
      >
        <motion.div
          variants={itemVariants}
          className="relative"
        >
           <CheckCircle className="w-32 h-32 text-green-500" />
        </motion.div>
        
        <motion.div variants={itemVariants} className="space-y-4">
          <h1 className="text-4xl font-bold text-primary">All Set!</h1>
          <p className="text-xl text-muted-foreground">Your account is ready to go.</p>
        </motion.div>
        
        <motion.p variants={itemVariants} className="text-muted-foreground">
          You will be redirected to the dashboard shortly.
        </motion.p>
        
        <motion.div variants={itemVariants}>
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 rounded-full text-lg font-bold">
            <Link href="/">Go to Dashboard Now</Link>
          </Button>
        </motion.div>
      </motion.div>
    </main>
  );
}
