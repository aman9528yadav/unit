
"use client";

import { Calculator } from "@/components/calculator";
import { Suspense, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { listenToUserData, listenToUpdateInfo } from "@/services/firestore";
import { PhysicalCalculator } from "@/components/physical-calculator";
import MaintenancePage from "@/app/maintenance/page";
import { usePathname, useSearchParams } from "next/navigation";

export default function CalculatorPage() {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [calculatorTheme, setCalculatorTheme] = useState('original');
  const [isClient, setIsClient] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsClient(true);
    const userEmail = localStorage.getItem("userProfile") ? JSON.parse(localStorage.getItem("userProfile")!).email : null;
    const unsub = listenToUserData(userEmail, (data) => {
        if (data?.settings?.calculatorTheme) {
            setCalculatorTheme(data.settings.calculatorTheme);
        }
    });

    const unsubMaintenance = listenToUpdateInfo((info) => {
      const fullPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
      const isPageInMaintenance = info.maintenancePages?.some(p => fullPath.startsWith(p)) || false;
      setIsMaintenance(isPageInMaintenance);
    });

    return () => {
      unsub();
      unsubMaintenance();
    }
  }, [pathname, searchParams]);
  
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
  
  if (isMaintenance) {
    return <MaintenancePage />;
  }

  const CalculatorComponent = calculatorTheme === 'physical' ? PhysicalCalculator : Calculator;

  return (
    <main className={cn(
        "flex w-full flex-grow flex-col items-center",
        !isFullScreen && "p-4 sm:p-6",
        calculatorTheme === 'physical' ? 'bg-gradient-to-br from-slate-700 to-slate-900' : 'bg-background'
    )}>
      <Suspense>
        <CalculatorComponent isFullScreen={isFullScreen} onFullScreenToggle={setIsFullScreen} />
      </Suspense>
    </main>
  );
}
