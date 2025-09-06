
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Book, MessageSquare, Code, FileText, Shield, Info, Users, GitBranch, ChevronsRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/language-context";


const appInfo = {
    version: "1.4.2",
    build: "2025.09.01",
    releaseChannel: "Beta 1",
    license: "MIT",
};

const credits = [
    {
        name: "Aman Yadav",
        role: "Founder & Engineer",
        avatar: "https://picsum.photos/seed/aman/100/100",
        dataAiHint: "man portrait"
    },
    {
        name: "Priya Sharma",
        role: "Product Designer",
        avatar: "https://picsum.photos/seed/priya/100/100",
        dataAiHint: "woman portrait"
    },
    {
        name: "Arjun Mehta",
        role: "QA & Support",
        avatar: "https://picsum.photos/seed/arjun/100/100",
        dataAiHint: "man portrait smiling"
    },
];

const Section = ({ title, description, children, icon: Icon }: { title: string, description: string, children: React.ReactNode, icon: React.ElementType }) => (
    <div className="bg-card p-6 rounded-xl">
        <div className="flex items-center gap-3 mb-4">
            <Icon className="w-6 h-6 text-primary" />
            <div>
                <h2 className="text-lg font-bold text-foreground">{title}</h2>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </div>
        {children}
    </div>
)

export function About() {
    const router = useRouter();
    const { t } = useLanguage();

    const legalLinks = [
        { text: t('about.legal.terms'), action: t('about.actions.open'), href: "/#" },
        { text: t('about.legal.privacy'), action: t('about.actions.open'), href: "/privacy-policy" },
        { text: t('about.legal.openSource'), action: t('about.actions.view'), href: "/#" },
    ];

    const supportLinks = [
        { text: t('about.support.helpCenter'), action: t('about.actions.visit'), href: "/help" },
        { text: t('about.support.contact'), action: "support@sutradhaar.app", href: "mailto:support@sutradhaar.app" },
        { text: t('about.support.reportIssue'), action: t('about.actions.create'), href: "/#" },
    ];

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 p-4 sm:p-6">
      <header className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft />
            </Button>
            <h1 className="text-xl font-bold">{t('about.title')}</h1>
        </div>
        <p className="text-sm text-muted-foreground">{t('about.breadcrumbs')}</p>
      </header>

      <Section title={t('about.appInfo.title')} description={t('about.appInfo.description')} icon={Info}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoCard label={t('about.appInfo.version')} value={appInfo.version} />
              <InfoCard label={t('about.appInfo.build')} value={appInfo.build} />
              <InfoCard label={t('about.appInfo.release')} value={<Badge variant="outline">{appInfo.releaseChannel}</Badge>} />
              <InfoCard label={t('about.appInfo.license')} value={appInfo.license} />
          </div>
      </Section>
      
      <Section title={t('about.credits.title')} description={t('about.credits.description')} icon={Users}>
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {credits.map(person => (
                <CreditCard key={person.name} name={person.name} role={t(`about.credits.roles.${person.role.split(' ')[0].toLowerCase()}`)} avatar={person.avatar} dataAiHint={person.dataAiHint} />
            ))}
         </div>
      </Section>

      <Section title={t('about.legal.title')} description={t('about.legal.description')} icon={Shield}>
        <div className="space-y-2">
            {legalLinks.map(link => (
                <LinkCard key={link.text} text={link.text} action={link.action} href={link.href} />
            ))}
        </div>
      </Section>

      <Section title={t('about.support.title')} description={t('about.support.description')} icon={MessageSquare}>
        <div className="space-y-2">
            {supportLinks.map(link => (
                 <LinkCard key={link.text} text={link.text} action={link.action} href={link.href} />
            ))}
        </div>
      </Section>

      <footer className="flex justify-end items-center gap-4 mt-4">
        <Button variant="outline"><Book className="mr-2 h-4 w-4"/> {t('about.footer.docs')}</Button>
        <Button><MessageSquare className="mr-2 h-4 w-4"/> {t('about.footer.support')}</Button>
      </footer>
    </div>
  );
}

const InfoCard = ({ label, value }: { label: string, value: string | React.ReactNode }) => (
    <div className="bg-background p-4 rounded-lg">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
)

const CreditCard = ({ name, role, avatar, dataAiHint }: { name: string, role: string, avatar: string, dataAiHint: string }) => (
    <div className="bg-background p-4 rounded-lg text-center flex flex-col items-center">
        <Avatar className="w-16 h-16 mb-2">
            <AvatarImage src={avatar} alt={name} data-ai-hint={dataAiHint}/>
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <p className="font-semibold text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">{role}</p>
    </div>
)

const LinkCard = ({ text, action, href }: { text: string, action: string, href: string }) => (
    <Link href={href} className="flex justify-between items-center bg-background p-4 rounded-lg hover:bg-secondary transition-colors">
        <span className="font-medium text-foreground">{text}</span>
        <div className="flex items-center gap-2 text-primary">
            <span className="text-sm">{action}</span>
            <ChevronsRight className="w-4 h-4" />
        </div>
    </Link>
)

    