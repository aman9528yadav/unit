
"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Crown, CheckCircle2, Star, X } from "lucide-react";
import { listenToPremiumInfoContent, PremiumInfoContent } from "@/services/firestore";
import { useRouter } from "next/navigation";

interface PremiumInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function PremiumInfoDialog({ open, onOpenChange }: PremiumInfoDialogProps) {
    const [content, setContent] = useState<PremiumInfoContent>(defaultContent);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = listenToPremiumInfoContent((data) => {
            if (data) {
                setContent(data);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleCheckProgress = () => {
        onOpenChange(false);
        router.push('/profile');
    };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center items-center">
            <div className="p-3 bg-yellow-400/10 rounded-full mb-4">
                <Crown className="w-10 h-10 text-yellow-500" />
            </div>
            <DialogTitle className="text-2xl">{content.title}</DialogTitle>
            <DialogDescription>
                {content.description}
            </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 my-6">
            {/* Standard Member Card */}
            <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold flex items-center gap-2"><Star className="w-5 h-5 text-gray-400"/> {content.memberTier.title}</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                    {content.memberTier.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                           <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                           <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Premium Member Card */}
            <div className="border-2 border-primary rounded-lg p-4 space-y-3 bg-primary/5">
                 <h3 className="font-semibold flex items-center gap-2 text-primary"><Crown className="w-5 h-5"/> {content.premiumTier.title}</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                     {content.premiumTier.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                           <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                           <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
        <div className="text-center p-4 bg-secondary rounded-lg">
            <h4 className="font-semibold">How to Upgrade?</h4>
            <p className="text-sm text-muted-foreground mt-1">{content.howToUpgrade}</p>
        </div>
        <Button onClick={handleCheckProgress} className="w-full mt-4">Check Your Progress</Button>
      </DialogContent>
    </Dialog>
  );
}
