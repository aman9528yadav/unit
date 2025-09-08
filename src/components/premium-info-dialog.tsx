

"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Crown, CheckCircle2, Star, X } from "lucide-react";
import { PremiumInfoContent } from "@/services/firestore";
import { useRouter } from "next/navigation";

interface PremiumInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: PremiumInfoContent | null;
}

const defaultContent: PremiumInfoContent = {
    title: "Unlock Premium",
    description: "Upgrade to a Premium Membership to unlock exclusive features and enhance your productivity.",
    memberTier: {
        title: "Standard Member",
        features: ["Access to all core converters", "Calculation History", "Basic Note-Taking"]
    },
    premiumTier: {
        title: "Premium Member",
        features: ["All Standard features", "Custom Unit Creation", "Advanced Theming Options", "Scientific Calculator", "Ad-Free Experience"]
    },
    howToUpgrade: "Become a Premium Member by completing 10,000 operations or maintaining a 15-day activity streak."
};

export function PremiumInfoDialog({ open, onOpenChange, content }: PremiumInfoDialogProps) {
    const router = useRouter();
    const displayContent = content || defaultContent;

    const handleCheckProgress = () => {
        onOpenChange(false);
        router.push('/profile');
    };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0">
        <div className="p-6">
            <DialogHeader className="text-center items-center">
                <div className="p-3 bg-yellow-400/10 rounded-full mb-4">
                    <Crown className="w-10 h-10 text-yellow-500" />
                </div>
                <DialogTitle className="text-2xl">{displayContent.title}</DialogTitle>
                <DialogDescription>
                    {displayContent.description}
                </DialogDescription>
            </DialogHeader>
        </div>
        <div className="space-y-4 px-6 max-h-[50vh] overflow-y-auto">
            {/* Standard Member Card */}
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                <h3 className="font-semibold flex items-center gap-2 text-muted-foreground"><Star className="w-5 h-5"/> {displayContent.memberTier.title}</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                    {displayContent.memberTier.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                           <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                           <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Premium Member Card */}
            <div className="border-2 border-primary rounded-lg p-4 space-y-3 bg-primary/5">
                 <h3 className="font-semibold flex items-center gap-2 text-primary"><Crown className="w-5 h-5"/> {displayContent.premiumTier.title}</h3>
                <ul className="space-y-2 text-sm text-foreground">
                     {displayContent.premiumTier.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                           <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                           <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
            
             <div className="text-center p-4 bg-secondary rounded-lg">
                <h4 className="font-semibold">How to Upgrade?</h4>
                <p className="text-sm text-muted-foreground mt-1">{displayContent.howToUpgrade}</p>
            </div>
        </div>
        <div className="p-6">
            <Button onClick={handleCheckProgress} className="w-full">Check Your Progress</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
