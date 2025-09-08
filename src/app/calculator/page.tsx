
"use client";

import { Calculator } from "@/components/calculator";
import { Suspense, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { listenToUserData } from "@/services/firestore";
import { PhysicalCalculator } from "@/components/physical-calculator";

export default function CalculatorPage() {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [calculatorTheme, setCalculatorTheme] = useState('original');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const userEmail = localStorage.getItem("userProfile") ? JSON.parse(localStorage.getItem("userProfile")!).email : null;
    const unsub = listenToUserData(userEmail, (data) => {
        if (data?.settings?.calculatorTheme) {
            setCalculatorTheme(data.settings.calculatorTheme);
        }
    });
    return () => unsub();
  }, []);
  
  useEffect(() => {
    if (isFullScreen) {
      document.body.classList.add('calculator-fullscreen');
    } else {
      document.body.classList.remove('calculator-fullscreen');
    }
    return () => {
        document.body.classList.remove('calculator-fullscreen');
    }
  }, [isFullScreen]);

  if (!isClient) {
    // You can return a skeleton loader here if needed
    return null;
  }

  const CalculatorComponent = calculatorTheme === 'physical' ? PhysicalCalculator : Calculator;

  return (
    <main className={cn(
        "flex min-h-screen w-full flex-col items-center",
        !isFullScreen && "p-4 sm:p-6",
        calculatorTheme === 'physical' ? 'bg-gradient-to-br from-slate-700 to-slate-900' : 'bg-background'
    )}>
      <Suspense>
        <CalculatorComponent isFullScreen={isFullScreen} onFullScreenToggle={setIsFullScreen} />
      </Suspense>
    </main>
  );
}
