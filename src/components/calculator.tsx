
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { RefreshCw, Delete, Divide, X, Minus, Plus, Equal, Sigma, CalculatorIcon, Home, User, History, Trash2 } from 'lucide-react';
import type { CalculatorMode } from '../settings';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const buttonClasses = {
  gray: "bg-muted hover:bg-muted/80 text-foreground",
  blue: "bg-primary text-primary-foreground hover:bg-primary/90 text-2xl",
  dark: "bg-secondary hover:bg-secondary/80 text-foreground",
  accent: "bg-accent hover:bg-accent/80 text-accent-foreground"
};

const CalculatorButton = ({
  onClick,
  label,
  className = "",
  span = "col-span-1",
}: {
  onClick: () => void;
  label: React.ReactNode;
  className?: string;
  span?: string;
}) => (
  <Button
    onClick={onClick}
    className={`h-16 md:h-20 text-2xl md:text-3xl rounded-xl ${span} ${className}`}
  >
    {label}
  </Button>
);

export function Calculator() {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');
  const [mode, setMode] = useState<CalculatorMode>('scientific');
  const [angleMode, setAngleMode] = useState<'deg' | 'rad'>('deg');
  const [isClient, setIsClient] = useState(false);
  const [profile, setProfile] = useState<{fullName: string, profileImage?: string} | null>(null);
  const router = useRouter();
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [recentCalculations, setRecentCalculations] = useState<string[]>([]);


  // A simple and safe expression evaluator
  const evaluateExpression = (expr: string, currentAngleMode: 'deg' | 'rad'): number => {
      // Regular expression to match trig functions like sin(90), cos(45), etc.
      const trigRegex = /(sin|cos|tan)\(([^)]+)\)/g;
  
      // Process trig functions based on the angle mode
      let processedExpr = expr.replace(trigRegex, (match, func, angleStr) => {
          let angle = parseFloat(angleStr);
          if (isNaN(angle)) {
              // Attempt to evaluate the inner expression if it's complex, e.g., sin(45+45)
              try {
                  angle = evaluateExpression(angleStr, currentAngleMode);
              } catch {
                  throw new Error('Invalid angle expression');
              }
          }

          const angleInRadians = currentAngleMode === 'deg' ? angle * (Math.PI / 180) : angle;
          return `Math.${func}(${angleInRadians})`;
      });
  
      // Replace other user-friendly symbols with JS Math functions
      processedExpr = processedExpr
          .replace(/√/g, 'Math.sqrt')
          .replace(/\^/g, '**')
          .replace(/log/g, 'Math.log10')
          .replace(/ln/g, 'Math.log')
          .replace(/π/g, 'Math.PI')
          .replace(/e/g, 'Math.E');
  
      // Basic validation to prevent arbitrary code execution
      if (/[^0-9+\-*/()., MathsqrtcoantlgPIEa-z]/.test(processedExpr)) {
          throw new Error('Invalid characters in expression');
      }
      
      // Using Function constructor is safer than eval, but still requires caution.
      return new Function('return ' + processedExpr)();
  };
  
  const loadRecentCalculations = () => {
    const storedHistory = localStorage.getItem('calculationHistory');
    const currentHistory = storedHistory ? JSON.parse(storedHistory) : [];
    setRecentCalculations(currentHistory.slice(0, 4));
  }

  useEffect(() => {
    setIsClient(true);
    const storedProfile = localStorage.getItem('userProfile');
    if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
    }
    
    loadRecentCalculations();

    const savedMode = localStorage.getItem('calculatorMode') as CalculatorMode;
    const soundEnabled = localStorage.getItem('calculatorSoundEnabled');
    
    if (savedMode) setMode(savedMode);
    if (soundEnabled !== null) setIsSoundEnabled(JSON.parse(soundEnabled));
    
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'calculatorSoundEnabled') {
            setIsSoundEnabled(e.newValue === null ? true : JSON.parse(e.newValue));
        }
        if (e.key === 'calculationHistory') {
           loadRecentCalculations();
        }
    };
    
    window.addEventListener('storage', handleStorageChange);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
  }, [isClient]);
  
  const playSound = () => {
    if (isSoundEnabled && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.error("Error playing sound:", e));
    }
  }

  const handleButtonClick = (value: string) => {
    playSound();
    if (result && !['+', '-', '*', '/', '^'].includes(value)) {
        setExpression(value);
        setResult('');
    } else if (result && ['+', '-', '*', '/', '^'].includes(value)) {
        setExpression(result + value);
        setResult('');
    } else {
        setExpression(prev => prev + value);
    }
  };
  
  const handleFunctionClick = (func: string) => {
    playSound();
    setExpression(prev => prev + `${func}(`);
  }

  const handleClear = () => {
    playSound();
    setExpression('');
    setResult('');
  };

  const handleBackspace = () => {
    playSound();
    if (result) {
        setExpression('');
        setResult('');
    } else {
        setExpression(prev => prev.slice(0, -1));
    }
  };

  const handleCalculate = async () => {
    playSound();
    try {
      if (!expression || /[+\-*/.^]$/.test(expression)) return;
      
      const evalResult = evaluateExpression(expression, angleMode);

      if (isNaN(evalResult) || !isFinite(evalResult)) {
        setResult('Error');
        return;
      }
      const formattedResult = evalResult.toLocaleString(undefined, { maximumFractionDigits: 10, useGrouping: true });
      setResult(formattedResult);
      
      const historyEntry = `${expression} = ${formattedResult}|${new Date().toISOString()}`;
      const storedHistory = localStorage.getItem('calculationHistory');
      const currentHistory = storedHistory ? JSON.parse(storedHistory) : [];
      const newHistory = [historyEntry, ...currentHistory];
      localStorage.setItem('calculationHistory', JSON.stringify(newHistory));
      localStorage.setItem('lastCalculation', historyEntry); 
      loadRecentCalculations();

    } catch (error) {
      console.error(error)
      setResult('Error');
    }
  };

  const handleDeleteCalculation = (itemToDelete: string) => {
    const storedHistory = localStorage.getItem('calculationHistory');
    const currentHistory = storedHistory ? JSON.parse(storedHistory) : [];
    const newHistory = currentHistory.filter((item: string) => item !== itemToDelete);
    localStorage.setItem('calculationHistory', JSON.stringify(newHistory));
    loadRecentCalculations();
  };
  
  if (!isClient) {
    return null; // Or a skeleton loader
  }

const ScientificLayout = () => (
    <div className="grid grid-cols-5 gap-3">
        {/* Row 1 */}
        <CalculatorButton onClick={handleClear} label="AC" className={buttonClasses.gray} />
        <CalculatorButton onClick={handleBackspace} label={<Delete />} className={buttonClasses.gray} />
        <CalculatorButton onClick={() => handleButtonClick('(')} label="(" className={buttonClasses.dark} />
        <CalculatorButton onClick={() => handleButtonClick(')')} label=")" className={buttonClasses.dark} />
        <CalculatorButton onClick={() => { playSound(); setAngleMode(a => a === 'deg' ? 'rad' : 'deg')}} label={angleMode.toUpperCase()} className={buttonClasses.accent} />

        {/* Row 2 */}
        <CalculatorButton onClick={() => handleFunctionClick('sin')} label="sin" className={buttonClasses.dark} />
        <CalculatorButton onClick={() => handleFunctionClick('cos')} label="cos" className={buttonClasses.dark} />
        <CalculatorButton onClick={() => handleFunctionClick('tan')} label="tan" className={buttonClasses.dark} />
        <CalculatorButton onClick={() => handleButtonClick('^')} label="xʸ" className={buttonClasses.dark} />
        <CalculatorButton onClick={() => handleButtonClick('/')} label={<Divide />} className={buttonClasses.blue} />

        {/* Row 3 */}
        <CalculatorButton onClick={() => handleFunctionClick('log')} label="log" className={buttonClasses.dark} />
        <CalculatorButton onClick={() => handleButtonClick('7')} label="7" className={buttonClasses.dark} />
        <CalculatorButton onClick={() => handleButtonClick('8')} label="8" className={buttonClasses.dark} />
        <CalculatorButton onClick={() => handleButtonClick('9')} label="9" className={buttonClasses.dark} />
        <CalculatorButton onClick={() => handleButtonClick('*')} label={<X />} className={buttonClasses.blue} />

        {/* Row 4 */}
        <CalculatorButton onClick={() => handleFunctionClick('ln')} label="ln" className={buttonClasses.dark} />
        <CalculatorButton onClick={() => handleButtonClick('4')} label="4" className={buttonClasses.dark} />
        <CalculatorButton onClick={() => handleButtonClick('5')} label="5" className={buttonClasses.dark} />
        <CalculatorButton onClick={() => handleButtonClick('6')} label="6" className={buttonClasses.dark} />
        <CalculatorButton onClick={() => handleButtonClick('-')} label={<Minus />} className={buttonClasses.blue} />
        
        {/* Row 5 */}
        <CalculatorButton onClick={() => handleFunctionClick('√')} label="√" className={buttonClasses.dark} />
        <CalculatorButton onClick={() => handleButtonClick('1')} label="1" className={buttonClasses.dark} />
        <CalculatorButton onClick={() => handleButtonClick('2')} label="2" className={buttonClasses.dark} />
        <CalculatorButton onClick={() => handleButtonClick('3')} label="3" className={buttonClasses.dark} />
        <CalculatorButton onClick={() => handleButtonClick('+')} label={<Plus />} className={buttonClasses.blue} />

        {/* Row 6 */}
        <CalculatorButton onClick={() => handleButtonClick('π')} label="π" className={buttonClasses.dark} />
        <CalculatorButton onClick={() => handleButtonClick('e')} label="e" className={buttonClasses.dark} />
        <CalculatorButton onClick={() => handleButtonClick('0')} label="0" className={buttonClasses.dark} />
        <CalculatorButton onClick={() => handleButtonClick('.')} label="." className={buttonClasses.dark} />
        <CalculatorButton onClick={handleCalculate} label={<Equal />} className={buttonClasses.blue} />
    </div>
);


const BasicLayout = () => (
    <div className="grid grid-cols-4 gap-3">
        <CalculatorButton onClick={handleClear} label="AC" className={`${buttonClasses.gray} col-span-2`} />
        <CalculatorButton onClick={handleBackspace} label={<Delete />} className={buttonClasses.gray} />
        <CalculatorButton onClick={() => handleButtonClick('/')} label={<Divide />} className={buttonClasses.blue} />

        <CalculatorButton onClick={() => handleButtonClick('7')} label="7" className={buttonClasses.dark} />
        <CalculatorButton onClick={() => handleButtonClick('8')} label="8" className={buttonClasses.dark} />
        <CalculatorButton onClick={() => handleButtonClick('9')} label="9" className={buttonClasses.dark} />
        <CalculatorButton onClick={() => handleButtonClick('*')} label={<X />} className={buttonClasses.blue} />

        <CalculatorButton onClick={() => handleButtonClick('4')} label="4" className={buttonClasses.dark} />
        <CalculatorButton onClick={() => handleButtonClick('5')} label="5" className={buttonClasses.dark} />
        <CalculatorButton onClick={() => handleButtonClick('6')} label="6" className={buttonClasses.dark} />
        <CalculatorButton onClick={() => handleButtonClick('-')} label={<Minus />} className={buttonClasses.blue} />

        <CalculatorButton onClick={() => handleButtonClick('1')} label="1" className={buttonClasses.dark} />
        <CalculatorButton onClick={() => handleButtonClick('2')} label="2" className={buttonClasses.dark} />
        <CalculatorButton onClick={() => handleButtonClick('3')} label="3" className={buttonClasses.dark} />
        <CalculatorButton onClick={() => handleButtonClick('+')} label={<Plus />} className={buttonClasses.blue} />
        
        <CalculatorButton onClick={() => handleButtonClick('0')} label="0" className={`${buttonClasses.dark} col-span-2`} />
        <CalculatorButton onClick={() => handleButtonClick('.')} label="." className={buttonClasses.dark} />
        <CalculatorButton onClick={handleCalculate} label={<Equal />} className={buttonClasses.blue} />
    </div>
);


  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4">
       <audio ref={audioRef} src="/alarm.mp3" preload="auto"></audio>
       <header className="flex items-center justify-between sticky top-0 z-50 bg-background/80 backdrop-blur-sm py-4">
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                  <Home />
              </Link>
            </Button>
            <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg">
              <CalculatorIcon />
            </div>
            <h1 className="text-xl font-bold">Calculator</h1>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" className="gap-2" onClick={() => router.push(profile ? '/profile' : '/welcome')}>
                Hi, {profile?.fullName.split(' ')[0] || 'Guest'}
                <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.profileImage} alt={profile?.fullName}/>
                    <AvatarFallback><User /></AvatarFallback>
                </Avatar>
            </Button>
        </div>
      </header>
        <div className="bg-card p-4 rounded-xl flex flex-col gap-4">
            {/* Display */}
            <div className="text-right h-28 flex flex-col justify-end p-4">
                <p className="text-3xl text-muted-foreground break-all">{expression || ' '}</p>
                <p className="text-6xl font-bold break-all">{result ? `=${result}`: ' '}</p>
            </div>

            {/* Buttons */}
             <div className="min-h-[460px] md:min-h-[520px]">
                {mode === 'scientific' ? (
                  <ScientificLayout />
                ) : (
                  <BasicLayout />
                )}
            </div>
        </div>
        
         {recentCalculations.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between text-base">
                        <div className="flex items-center gap-2">
                           <History size={18} />
                           Recent Calculations
                        </div>
                        <Button variant="link" size="sm" onClick={() => router.push('/history?tab=calculator')}>View All</Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        {recentCalculations.map((calc, i) => (
                            <li key={i} className="flex justify-between items-center p-2 bg-secondary rounded-md group">
                               <span className="truncate">{calc.split('|')[0]}</span>
                               <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteCalculation(calc)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                               </div>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        )}
    </div>
  );
}

    