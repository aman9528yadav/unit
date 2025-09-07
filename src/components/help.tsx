

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
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/language-context';
import { listenToFaqsFromRtdb } from '@/services/firestore';


export interface FAQ {
    id: string;
    question: string;
    answer: string;
}

export const FAQ_STORAGE_KEY = 'faqs';

export const defaultFaqs: FAQ[] = [
    {
        id: uuidv4(),
        question: "How do I use the Unit Converter?",
        answer: `<p class="mb-2">The unit converter is designed for ease of use. You can either use the AI-powered search bar (e.g., "10kg to lbs") or manually select the category and units.</p><ul class="list-disc pl-5 space-y-1"><li>Use the dropdowns to select the conversion category (e.g., Length, Weight).</li><li>Enter the value you want to convert.</li><li>Select the 'from' and 'to' units.</li><li>The result will be displayed automatically if 'Auto Convert' is enabled in settings, or after you click the 'Convert' button.</li></ul>`
    },
    {
        id: uuidv4(),
        question: "What are the benefits of being a Premium Member?",
        answer: `<p class="mb-2">Becoming a Premium Member unlocks exclusive features to enhance your experience. You can achieve Premium status by either completing <strong>10,000</strong> operations (conversions or calculations) or by maintaining a <strong>15-day</strong> best streak within the app.</p><p class="mb-2">Premium benefits include:</p><ul class="list-disc pl-5 space-y-1"><li><strong>Custom Themes:</strong> Personalize the app's appearance by creating and applying your own color schemes in the Theme Editor.</li><li><strong>Custom Units:</strong> Add your own unique units and even create entirely new conversion categories tailored to your needs.</li></ul><p class="mt-2">You can track your progress towards becoming a Premium Member on your profile page.</p>`
    },
    {
        id: uuidv4(),
        question: "How does the Notepad work?",
        answer: `<p class="mb-2">The notepad allows you to create and manage notes. Notes are automatically saved to your account if you are logged in.</p><ul class="list-disc pl-5 space-y-1"><li>Click the floating 'Edit' button to create a new note.</li><li>Use the toolbar to format your text, attach images, and insert previous calculations or conversions.</li><li>You can favorite notes, assign categories, and move them to the recycle bin.</li></ul>`
    },
    {
        id: uuidv4(),
        question: "How do I add custom units?",
        answer: `<p>You can add your own units or even create new categories by going to <strong>Settings > Custom Unit</strong>. This allows you to tailor the converter to your specific needs, such as converting between fictional currencies or unique project measurements. Note: This is a Premium feature.</p>`
    },
    {
        id: uuidv4(),
        question: "How do I reset my password?",
        answer: "You can reset your password by going to the login page and clicking on the \"Forgot Password\" link. An email will be sent to you with instructions."
    },
    {
        id: uuidv4(),
        question: "How do I update my profile?",
        answer: "You can update your profile information, including your name and profile picture, by navigating to the \"My Profile\" page and clicking the pencil icon."
    },
    {
        id: uuidv4(),
        question: "Contact Us",
        answer: "If you have any other questions or need further assistance, please feel free to contact our support team at <a href=\"mailto:amanyadavyadav9458@gmail.com\" class=\"text-primary hover:underline\">amanyadavyadav9458@gmail.com</a>."
    }
];

export function Help() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();
  
  useEffect(() => {
    setIsClient(true);
    const unsubscribe = listenToFaqsFromRtdb((faqsFromDb) => {
        setFaqs(faqsFromDb.length > 0 ? faqsFromDb : defaultFaqs);
    });

    return () => unsubscribe();
  }, [t]);

  if (!isClient) {
    return null; // Or a loading skeleton
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6 p-4 sm:p-6">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-bold">{t('help.title')}</h1>
      </header>
      <div className="bg-card p-6 rounded-xl space-y-2 text-muted-foreground">
        <h2 className="text-lg font-semibold text-foreground mb-4">{t('help.heading')}</h2>
        
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
