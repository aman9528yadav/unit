
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Book, MessageSquare, Code, FileText, Shield, Info, Users, GitBranch, ChevronsRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";


const appInfo = {
    version: "1.4.2",
    build: "2025.09.01",
    releaseChannel: "Stable",
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

const legalLinks = [
    { text: "Terms of Service", action: "Open document", href: "/#" },
    { text: "Privacy Policy", action: "Open document", href: "/privacy-policy" },
    { text: "Open Source Notices", action: "View libraries", href: "/#" },
];

const supportLinks = [
    { text: "Help Center", action: "Visit", href: "/help" },
    { text: "Contact", action: "support@sutradhaar.app", href: "mailto:support@sutradhaar.app" },
    { text: "Report an Issue", action: "Create ticket", href: "/#" },
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
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 p-4 sm:p-6">
      <header className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <Link href="/settings">
                <Button variant="ghost" size="icon">
                    <ArrowLeft />
                </Button>
            </Link>
            <h1 className="text-xl font-bold">About Sutradhaar</h1>
        </div>
        <p className="text-sm text-muted-foreground">Settings / About</p>
      </header>

      <Section title="App Information" description="Details about Sutradhaar unit converter." icon={Info}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoCard label="Version" value={appInfo.version} />
              <InfoCard label="Build" value={appInfo.build} />
              <InfoCard label="Release Channel" value={<Badge variant="outline">{appInfo.releaseChannel}</Badge>} />
              <InfoCard label="License" value={appInfo.license} />
          </div>
      </Section>
      
      <Section title="Credits" description="People behind Sutradhaar." icon={Users}>
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {credits.map(person => (
                <CreditCard key={person.name} {...person} />
            ))}
         </div>
      </Section>

      <Section title="Legal" description="Terms, policies, and open source libraries." icon={Shield}>
        <div className="space-y-2">
            {legalLinks.map(link => (
                <LinkCard key={link.text} text={link.text} action={link.action} href={link.href} />
            ))}
        </div>
      </Section>

      <Section title="Support" description="Get help, contact us, or report issues." icon={MessageSquare}>
        <div className="space-y-2">
            {supportLinks.map(link => (
                 <LinkCard key={link.text} text={link.text} action={link.action} href={link.href} />
            ))}
        </div>
      </Section>

      <footer className="flex justify-end items-center gap-4 mt-4">
        <Button variant="outline"><Book className="mr-2 h-4 w-4"/> Docs</Button>
        <Button><MessageSquare className="mr-2 h-4 w-4"/> Get Support</Button>
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
