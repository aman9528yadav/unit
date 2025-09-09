

"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Crown, CheckCircle2, Star, X, ArrowLeft } from "lucide-react";
import { PremiumInfoContent, listenToPremiumInfoContent, defaultPremiumInfo } from "@/services/firestore";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";

export function PremiumPage() {
    const [content, setContent] = useState<PremiumInfoContent>(defaultPremiumInfo);
    const router = useRouter();

    useEffect(() => {
        const unsub = listenToPremiumInfoContent((newContent) => {
            if (newContent) {
                setContent(newContent);
            }
        });
        return () => unsub();
    }, []);

    const handleCheckProgress = () => {
        router.push('/profile');
    };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-6">
        <header className="flex items-center gap-4">
            <Button variant="secondary" className="rounded-xl shadow-md" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>
            <h1 className="text-xl font-bold">Go Premium</h1>
        </header>
        <Card className="p-0">
            <div className="p-6">
                <div className="text-center items-center flex flex-col">
                    <div className="p-3 bg-yellow-400/10 rounded-full mb-4">
                        <Crown className="w-10 h-10 text-yellow-500" />
                    </div>
                    <CardTitle className="text-2xl">{content.title}</CardTitle>
                    <CardDescription>
                        {content.description}
                    </CardDescription>
                </div>
            </div>
            <div className="space-y-4 px-6 max-h-[50vh] overflow-y-auto">
                <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                    <h3 className="font-semibold flex items-center gap-2 text-muted-foreground"><Star className="w-5 h-5"/> {content.memberTier.title}</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        {content.memberTier.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="border-2 border-primary rounded-lg p-4 space-y-3 bg-primary/5">
                    <h3 className="font-semibold flex items-center gap-2 text-primary"><Crown className="w-5 h-5"/> {content.premiumTier.title}</h3>
                    <ul className="space-y-2 text-sm text-foreground">
                        {content.premiumTier.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                
                <div className="text-center p-4 bg-secondary rounded-lg">
                    <h4 className="font-semibold">How to Upgrade?</h4>
                    <p className="text-sm text-muted-foreground mt-1">{content.howToUpgrade}</p>
                </div>
            </div>
            <div className="p-6">
                <Button onClick={handleCheckProgress} className="w-full">Check Your Progress</Button>
            </div>
        </Card>
    </div>
  );
}
