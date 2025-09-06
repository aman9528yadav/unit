
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

export interface FAQ {
    id: string;
    question: string;
    answer: string;
}

export const FAQ_STORAGE_KEY = 'faqData';

export const getDefaultFaqs = (t: (key: string, params?: any) => string): FAQ[] => [
    {
        id: uuidv4(),
        question: t('help.faqs.q1.question'),
        answer: `<p class="mb-2">${t('help.faqs.q1.answer.p1')}</p><ul class="list-disc pl-5 space-y-1"><li>${t('help.faqs.q1.answer.li1')}</li><li>${t('help.faqs.q1.answer.li2')}</li><li>${t('help.faqs.q1.answer.li3')}</li><li>${t('help.faqs.q1.answer.li4')}</li></ul>`
    },
    {
        id: uuidv4(),
        question: t('help.faqs.q2.question'),
        answer: `<p class="mb-2">${t('help.faqs.q2.answer.p1', { ops: '<strong>8,000</strong>' })}</p><p class="mb-2">${t('help.faqs.q2.answer.p2')}</p><ul class="list-disc pl-5 space-y-1"><li><strong>${t('help.faqs.q2.answer.li1.strong')}:</strong> ${t('help.faqs.q2.answer.li1.text')}</li><li><strong>${t('help.faqs.q2.answer.li2.strong')}:</strong> ${t('help.faqs.q2.answer.li2.text')}</li></ul><p class="mt-2">${t('help.faqs.q2.answer.p3')}</p>`
    },
    {
        id: uuidv4(),
        question: t('help.faqs.q3.question'),
        answer: `<p class="mb-2">${t('help.faqs.q3.answer.p1')}</p><ul class="list-disc pl-5 space-y-1"><li>${t('help.faqs.q3.answer.li1')}</li><li>${t('help.faqs.q3.answer.li2')}</li><li>${t('help.faqs.q3.answer.li3')}</li></ul>`
    },
    {
        id: uuidv4(),
        question: t('help.faqs.q4.question'),
        answer: `<p>${t('help.faqs.q4.answer.p1', { settings: `<strong>${t('help.faqs.q4.answer.settingsPath')}</strong>` })}</p>`
    },
    {
        id: uuidv4(),
        question: t('help.faqs.q5.question'),
        answer: t('help.faqs.q5.answer')
    },
    {
        id: uuidv4(),
        question: t('help.faqs.q6.question'),
        answer: t('help.faqs.q6.answer')
    },
    {
        id: uuidv4(),
        question: t('help.faqs.q7.question'),
        answer: `${t('help.faqs.q7.answer')} <a href="mailto:amanyadavyadav9458@gmail.com" class="text-accent hover:underline">amanyadavyadav9458@gmail.com</a>.`
    }
];

export function Help() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [profile, setProfile] = useState(null);
  const router = useRouter();
  const { t } = useLanguage();
  
  useEffect(() => {
    setIsClient(true);
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
    }
    
    const defaultFaqs = getDefaultFaqs(t);
    const storedFaqs = localStorage.getItem(FAQ_STORAGE_KEY);
    if (storedFaqs) {
        // Simple check to see if we need to update faqs (e.g. on language change)
        const parsedFaqs: FAQ[] = JSON.parse(storedFaqs);
        if (parsedFaqs[0]?.question !== defaultFaqs[0]?.question) {
             setFaqs(defaultFaqs);
             localStorage.setItem(FAQ_STORAGE_KEY, JSON.stringify(defaultFaqs));
        } else {
             setFaqs(parsedFaqs);
        }
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

    
