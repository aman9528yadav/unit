"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { listenToBetaWelcomeMessage, BetaWelcomeMessage } from "@/services/firestore";
import Link from "next/link";
import { BookOpen, Rocket } from "lucide-react";

const defaultContent: BetaWelcomeMessage = {
    title: 'Gets things with Sutradhaar',
    description: "Your all-in-one solution for unit conversions, calculations, and note-taking. Streamline your productivity with a single, powerful tool."
};

export function GettingStarted() {
    const router = useRouter();
    const [doNotShowAgain, setDoNotShowAgain] = useState(false);
    const [content, setContent] = useState<BetaWelcomeMessage>(defaultContent);

    useEffect(() => {
        const unsub = listenToBetaWelcomeMessage((newContent) => {
            if (newContent) {
                setContent(newContent);
            }
        });
        return () => unsub();
    }, []);

    const handleGetStarted = () => {
        if (doNotShowAgain) {
            localStorage.setItem('hasSeenGettingStarted', 'true');
        }
        sessionStorage.setItem('hasNavigatedFromGettingStarted', 'true');
        router.push('/'); 
    };

    return (
        <div className="flex flex-col items-center justify-between min-h-screen w-full p-8 bg-background">
            <div className="flex-1 flex flex-col items-center justify-center text-center">
                 <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <Image 
                        src="/get welcome.webp" 
                        alt="Get Started" 
                        width={300} 
                        height={200}
                        className="mb-12 rounded-lg"
                    />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="space-y-4"
                >
                    <h1 className="text-3xl font-bold text-foreground">{content.title}</h1>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                        {content.description}
                    </p>
                </motion.div>
            </div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                className="w-full max-w-sm space-y-4"
            >
                 <Button onClick={handleGetStarted} className="w-full h-12 text-lg">
                    Get Started
                </Button>
                 <div className="grid grid-cols-2 gap-4">
                    <Button asChild variant="outline">
                        <Link href="/updates">
                            <Rocket className="mr-2 h-4 w-4" />
                            See What's New
                        </Link>
                    </Button>
                     <Button asChild variant="outline">
                        <Link href="/how-to-use">
                            <BookOpen className="mr-2 h-4 w-4" />
                           Learn How to Use
                        </Link>
                    </Button>
                </div>
                <div className="flex items-center justify-center space-x-2 pt-2">
                    <Checkbox id="dont-show-again" checked={doNotShowAgain} onCheckedChange={(checked) => setDoNotShowAgain(checked as boolean)} />
                    <Label htmlFor="dont-show-again" className="text-sm font-medium text-muted-foreground">
                        Don't show this again
                    </Label>
                </div>
            </motion.div>
        </div>
    );
}
