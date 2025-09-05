
"use client";

import { useState, useEffect } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { v4 as uuidv4 } from 'uuid';

export interface FAQ {
    id: string;
    question: string;
    answer: string;
}

export const FAQ_STORAGE_KEY = 'faqData';

export const defaultFaqs: FAQ[] = [
    {
        id: uuidv4(),
        question: "How do I use the Unit Converter?",
        answer: `<p class="mb-2">The unit converter is designed for ease of use. You can either use the AI-powered search bar (e.g., "10kg to lbs") or manually select the category and units.</p><ul class="list-disc pl-5 space-y-1"><li>Use the dropdowns to select the conversion category (e.g., Length, Weight).</li><li>Enter the value you want to convert.</li><li>Select the 'from' and 'to' units.</li><li>The result will be displayed automatically if 'Auto Convert' is enabled in settings, or after you click the 'Convert' button.</li></ul>`
    },
    {
        id: uuidv4(),
        question: "How does the Notepad work?",
        answer: `<p class="mb-2">The notepad allows you to create and manage notes. Notes are automatically saved to your account if you are logged in.</p><ul class="list-disc pl-5 space-y-1"><li>Click the floating 'Edit' button to create a new note.</li><li>Use the toolbar to format your text, attach images, and insert previous calculations or conversions.</li><li>You can favorite notes, assign categories, and move them to the recycle bin.</li></ul>`
    },
    {
        id: uuidv4(),
        question: "How do I add custom units?",
        answer: `<p>You can add your own units or even create new categories by going to <strong>Settings > Custom Unit</strong>. This allows you to tailor the converter to your specific needs, such as converting between fictional currencies or unique project measurements.</p>`
    },
    {
        id: uuidv4(),
        question: "How do I reset my password?",
        answer: `You can reset your password by going to the login page and clicking on the "Forgot Password" link. An email will be sent to you with instructions.`
    },
    {
        id: uuidv4(),
        question: "How do I update my profile?",
        answer: `You can update your profile information, including your name and profile picture, by navigating to the "My Profile" page and clicking the pencil icon.`
    },
    {
        id: uuidv4(),
        question: "Contact Us",
        answer: `If you have any other questions or need further assistance, please feel free to contact our support team at <a href="mailto:support@example.com" class="text-accent hover:underline">support@example.com</a>.`
    }
];


export function Help() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [profile, setProfile] = useState(null);
  
  useEffect(() => {
    setIsClient(true);
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
    }

    const storedFaqs = localStorage.getItem(FAQ_STORAGE_KEY);
    if (storedFaqs) {
        setFaqs(JSON.parse(storedFaqs));
    } else {
        setFaqs(defaultFaqs);
        localStorage.setItem(FAQ_STORAGE_KEY, JSON.stringify(defaultFaqs));
    }

    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === FAQ_STORAGE_KEY && e.newValue) {
            setFaqs(JSON.parse(e.newValue));
        }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);

  }, []);

  if (!isClient) {
    return null; // Or a loading skeleton
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6 p-4 sm:p-6">
      <header className="flex items-center gap-4">
        <Link href={profile ? "/settings" : "/"}>
          <Button variant="ghost" size="icon">
            <ArrowLeft />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Help & Support</h1>
      </header>
      <div className="bg-card p-6 rounded-xl space-y-2 text-muted-foreground">
        <h2 className="text-lg font-semibold text-foreground mb-4">Frequently Asked Questions</h2>
        
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
    </div>
  );
}
