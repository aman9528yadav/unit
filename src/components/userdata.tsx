
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Upload, LogOut, Settings, HelpCircle, X } from "lucide-react";
import Image from "next/image";

const DetailRow = ({ label, value, valueClassName }: { label: string, value: string, valueClassName?: string }) => (
    <div className="flex justify-between items-center py-2">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-medium text-foreground ${valueClassName}`}>{value}</span>
    </div>
);

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-1">{title.toUpperCase()}</h3>
        <div className="divide-y divide-border">
            {children}
        </div>
    </div>
)

export function UserData() {
    return (
        <div className="w-full max-w-4xl mx-auto bg-card rounded-2xl shadow-lg border p-6">
            <header className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <User className="text-primary"/>
                    <h1 className="text-xl font-bold">Profile</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm"><HelpCircle className="mr-2 h-4 w-4"/> Help</Button>
                     <Link href="/">
                        <Button variant="ghost" size="icon"><X/></Button>
                    </Link>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column */}
                <aside className="col-span-1 flex flex-col items-center text-center border-r pr-8">
                    <Avatar className="w-28 h-28 mb-4">
                        <AvatarImage src="https://picsum.photos/seed/aman/200" alt="Aman Yadav" data-ai-hint="man portrait"/>
                        <AvatarFallback>AY</AvatarFallback>
                    </Avatar>
                    <h2 className="text-xl font-bold">Aman Yadav</h2>
                    <p className="text-muted-foreground text-sm">Signed in</p>
                    <Badge variant="secondary" className="mt-2">Member</Badge>
                    <Button variant="secondary" className="w-full mt-6">
                        <Upload className="mr-2 h-4 w-4"/>
                        Change Photo
                    </Button>
                </aside>

                {/* Right Column */}
                <main className="col-span-2 space-y-6">
                    <Section title="Account">
                        <DetailRow label="Name" value="Aman Yadav"/>
                        <DetailRow label="Email" value="aman@sutradhaar.app"/>
                        <DetailRow label="Status" value="Verified" valueClassName="text-green-500"/>
                    </Section>

                    <Section title="Preferences">
                        <DetailRow label="Default Unit Set" value="SI (Metric)"/>
                        <DetailRow label="Theme" value="System (Appearance)"/>
                        <DetailRow label="History" value="Enabled"/>
                    </Section>

                     <Section title="Security">
                        <DetailRow label="2FA" value="Off"/>
                        <DetailRow label="Last Sign-in" value="2 days ago"/>
                        <DetailRow label="Sessions" value="This device"/>
                    </Section>
                </main>
            </div>

            <footer className="mt-8 pt-6 border-t flex justify-end items-center gap-4">
                <Button variant="outline"><LogOut className="mr-2 h-4 w-4"/> Log out</Button>
                <Button><Settings className="mr-2 h-4 w-4"/> Manage Settings</Button>
            </footer>
        </div>
    );
}

