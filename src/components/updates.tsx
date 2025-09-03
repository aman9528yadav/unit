
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Gift, Zap, Rocket } from "lucide-react";
import { format } from "date-fns";

const updates = [
  {
    version: "v2.1.0",
    date: "2024-08-15T10:00:00Z",
    title: "Time Utilities & Pomodoro Timer",
    description: "Introducing a new suite of time management tools, including a Pomodoro timer, stopwatch, and various date calculators to boost your productivity.",
    icon: Zap,
    bgColor: "bg-green-500/10",
    textColor: "text-green-400"
  },
  {
    version: "v2.0.0",
    date: "2024-07-20T09:00:00Z",
    title: "Custom Units & Categories",
    description: "You can now create your own custom units and even new conversion categories directly from the settings page for ultimate personalization.",
    icon: Gift,
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-400"
  },
  {
    version: "v1.0.0",
    date: "2024-06-01T12:00:00Z",
    title: "Initial Launch",
    description: "Welcome to UniConvert! The initial version includes a robust unit converter, a scientific calculator, and a notepad for all your needs.",
    icon: Rocket,
    bgColor: "bg-purple-500/10",
    textColor: "text-purple-400"
  },
];


export function Updates() {
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

      <div className="relative pl-8">
        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-border"></div>
        {updates.map((update, index) => (
            <div key={index} className="mb-6 relative">
                <div className="flex items-center mb-2">
                    <div className={`absolute left-[-18px] top-1 p-2 rounded-full border-4 border-background ${update.bgColor} ${update.textColor}`}>
                        <update.icon className="w-5 h-5" />
                    </div>
                    <p className="text-sm text-muted-foreground ml-8">
                        {format(new Date(update.date), "d MMM yyyy, h:mm a")}
                    </p>
                </div>
                <div className="bg-card p-4 rounded-xl ml-8">
                    <h2 className="text-lg font-semibold text-foreground mb-2">{update.title}</h2>
                    <p className="text-sm text-muted-foreground">{update.description}</p>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}
