
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Rocket, Sparkles, Cloud, FlaskConical, LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface Feature {
    title: string;
    description: string;
    icon: LucideIcon;
    status: "In Progress" | "Planned" | "Exploring";
    badgeVariant: "secondary" | "outline" | "default";
}

const upcomingFeatures: Feature[] = [
    {
        title: "AI Word Problem Solver",
        description: "Enhance the calculator with an AI that solves math word problems directly from your text input.",
        icon: Sparkles,
        status: "In Progress",
        badgeVariant: "secondary",
    },
    {
        title: "Cloud Sync via Firebase",
        description: "Save your notes, history, and settings to the cloud and access them seamlessly across all your devices.",
        icon: Cloud,
        status: "Planned",
        badgeVariant: "outline",
    },
    {
        title: "Full Recipe Converter",
        description: "Paste an entire recipe, and let our AI instantly convert all ingredient measurements to your desired system (e.g., Imperial to Metric).",
        icon: FlaskConical,
        status: "Exploring",
        badgeVariant: "default",
    },
];

export function WhatsNew() {
  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6 p-4 sm:p-6">
      <header className="flex items-center gap-4">
        <Link href="/profile">
          <Button variant="ghost" size="icon">
            <ArrowLeft />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">What's New</h1>
      </header>
      <div className="space-y-4">
        <div className="text-center p-4 rounded-lg bg-card border">
            <Rocket className="mx-auto h-10 w-10 text-primary mb-2" />
            <h2 className="text-lg font-semibold">Future Updates</h2>
            <p className="text-sm text-muted-foreground">Here's a sneak peek at what we're working on to make your experience even better.</p>
        </div>
        {upcomingFeatures.map((feature, index) => (
            <Card key={index}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <feature.icon className="w-6 h-6 text-accent" />
                            <CardTitle className="text-base font-bold">{feature.title}</CardTitle>
                        </div>
                        <Badge variant={feature.badgeVariant}>{feature.status}</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
            </Card>
        ))}
      </div>
    </div>
  );
}
