
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogIn, Sigma, Calculator, NotebookText, Star, Settings, Palette, Beaker, Zap, Search, Mic } from "lucide-react";
import { useRouter } from "next/navigation";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { FAQ, defaultFaqs } from "./help";
import { useLanguage } from "@/context/language-context";
import { listenToFaqs } from "@/services/firestore";


const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="bg-card p-6 rounded-xl border border-border/80 shadow-sm">
        <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-full text-primary">
                {icon}
            </div>
            <div>
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
        </div>
    </div>
);

export function HowToUse() {
  const router = useRouter();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const { t } = useLanguage();
  
  useEffect(() => {
    const unsubscribe = listenToFaqs((faqsFromDb) => {
        setFaqs(faqsFromDb.length > 0 ? faqsFromDb : defaultFaqs);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-8 p-4 sm:p-6 pb-12">
        <header className="flex items-center gap-4 sticky top-0 bg-background/80 backdrop-blur-sm py-4 z-10 -mx-4 px-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">How to Use Sutradhaar</h1>
        </header>
        
        <section>
            <h2 className="text-xl font-bold mb-4">Getting Started</h2>
            <div className="space-y-4">
                <FeatureCard 
                    icon={<LogIn />}
                    title="Login, Signup, or Skip"
                    description="Create an account to save your data and unlock premium features, or use the app as a guest by skipping the login."
                />
                <FeatureCard 
                    icon={<Zap />}
                    title="The Dashboard"
                    description="Your central hub. Access all major tools like the Converter, Calculator, and Notes with a single tap. View your usage stats at a glance."
                />
            </div>
        </section>

        <section>
            <h2 className="text-xl font-bold mb-4">Unit Converter</h2>
            <div className="space-y-4">
                <FeatureCard 
                    icon={<Search />}
                    title="Smart Search"
                    description="The fastest way to convert. Simply type your query like '10kg to lbs' or '5 miles in km' into the search bar on the dashboard or converter page."
                />
                 <FeatureCard 
                    icon={<Sigma />}
                    title="Manual Conversion"
                    description="For more control, manually select a category (e.g., Length, Weight), choose your 'From' and 'To' units, and enter the value. The result appears instantly."
                />
                <FeatureCard 
                    icon={<Star />}
                    title="Favorites & History"
                    description="Never lose a conversion. Your calculations are automatically saved to History. Tap the star icon to save any conversion as a favorite for quick access later."
                />
            </div>
        </section>
        
        <section>
            <h2 className="text-xl font-bold mb-4">Calculator</h2>
             <div className="space-y-4">
                <FeatureCard 
                    icon={<Calculator />}
                    title="Basic & Scientific Modes"
                    description="Perform simple arithmetic in Basic mode. Unlock the Scientific calculator by becoming a Premium Member to access functions like sine, cosine, and logarithms."
                />
            </div>
        </section>

        <section>
            <h2 className="text-xl font-bold mb-4">Notepad</h2>
             <div className="space-y-4">
                <FeatureCard 
                    icon={<NotebookText />}
                    title="Rich Text Editing"
                    description="Create detailed notes with titles, categories, and rich text formatting like bold, italics, lists, and different colors. You can even attach images."
                />
            </div>
        </section>

        <section>
            <h2 className="text-xl font-bold mb-4">Settings & Customization</h2>
             <div className="space-y-4">
                <FeatureCard 
                    icon={<Palette />}
                    title="Theme Editor"
                    description="Make the app truly yours. As a Premium Member, you can use the Theme Editor to change the app's colors to match your style."
                />
                <FeatureCard 
                    icon={<Beaker />}
                    title="Custom Units"
                    description="A premium feature for power users. Add your own units to existing categories or create entirely new categories for specialized conversions."
                />
            </div>
        </section>

         <section>
            <h2 className="text-xl font-bold mb-4">Frequently Asked Questions</h2>
             <div className="bg-card p-6 rounded-xl space-y-2 text-muted-foreground">
                <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq) => (
                    <AccordionItem value={faq.id} key={faq.id}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>
                        <div dangerouslySetInnerHTML={{ __html: faq.answer }} />
                    </AccordionContent>
                    </AccordionItem>
                ))}
                </Accordion>
            </div>
        </section>

        <footer className="text-center mt-8">
            <p className="text-muted-foreground">Still have questions? <a href="https://docs.google.com/forms/d/e/1FAIpQLSc-FH5ANa1HRR9sE6OUSRD8HVsZw6JNGWdbwK-5jrUywLnNbQ/viewform?usp=dialog" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Contact Us</a>.</p>
        </footer>
    </div>
  );
}
