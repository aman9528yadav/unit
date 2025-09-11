
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { incrementCalculationCount } from '@/lib/stats';
import { addCalculationToHistory, listenToUserData, UserData } from '@/services/firestore';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { History, Maximize, Minimize, ArrowLeft } from 'lucide-react';

const CalculatorButton = ({
  onClick,
  label,
  className = "",
  buttonLabel,
  children
}: {
  onClick: (value: string) => void;
  label: string;
  className?: string;
  buttonLabel?: string;
  children?: React.ReactNode;
}) => (
  <Button
    variant="secondary"
    onClick={() => onClick(label)}
    className={cn(
        "h-auto text-2xl font-semibold p-4 rounded-xl shadow-md active:shadow-sm active:translate-y-px",
        className
    )}
  >
    {children || label}
  </Button>
);


export function Calculator({ isFullScreen, onFullScreenToggle }: { isFullScreen: boolean, onFullScreenToggle: (isFullScreen: boolean) => void }) {
    const [currentOperand, setCurrentOperand] = useState('0');
    const [previousOperand, setPreviousOperand] = useState('');
    const [operation, setOperation] = useState<string | undefined>(undefined);
    const [memory, setMemory] = useState(0);
    const [profile, setProfile] = useState<{email: string} | null>(null);
    const [recentCalculations, setRecentCalculations] = useState<string[]>([]);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const router = useRouter();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio('/single-key-press-393908.mp3');
            audioRef.current.volume = 1.0;
        }

        const storedProfile = localStorage.getItem("userProfile");
        const userEmail = storedProfile ? JSON.parse(storedProfile).email : null;
        if (storedProfile) {
            setProfile(JSON.parse(storedProfile));
        }

        const unsub = listenToUserData(userEmail, (data: UserData) => {
            if (data) {
                 const history = data?.calculationHistory || [];
                 setRecentCalculations(history.slice(0, 4));
                 setSoundEnabled(data?.settings?.calculatorSound ?? true);
            }
        });

        return () => unsub();
    }, []);
    

    const playSound = () => {
        if (soundEnabled && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(error => console.error("Error playing sound:", error));
        }
    };


    const handleSaveToHistory = (calculation: string, result: string) => {
        const historyString = `${calculation} = ${result}|${new Date().toISOString()}`;
        addCalculationToHistory(profile?.email || null, historyString);
        incrementCalculationCount();
        
        // This is for other components to listen to changes, but it's redundant with the RTDB/localstorage listener
        // localStorage.setItem('lastCalculation', historyString);
        // window.dispatchEvent(new StorageEvent('storage', { key: 'lastCalculation', newValue: historyString }));
    };

    const handleButtonClick = (value: string) => {
        playSound();
        const buttonActions: { [key: string]: () => void } = {
            'AC': () => {
                setCurrentOperand('0');
                setPreviousOperand('');
                setOperation(undefined);
            },
            'DEL': () => {
                setCurrentOperand(currentOperand.slice(0, -1) || '0');
            },
            '.': () => {
                if (!currentOperand.includes('.')) {
                    setCurrentOperand(currentOperand + '.');
                }
            },
            '=': () => {
                if (previousOperand === '' || operation === undefined || currentOperand === '') return;
                let result;
                const prev = parseFloat(previousOperand);
                const curr = parseFloat(currentOperand);

                switch (operation) {
                    case '+': result = prev + curr; break;
                    case '-': result = prev - curr; break;
                    case '×': result = prev * curr; break;
                    case '÷': result = prev / curr; break;
                    case '%': result = prev % curr; break;
                    default: return;
                }
                const resultString = String(result);
                handleSaveToHistory(`${previousOperand} ${operation} ${currentOperand}`, resultString);
                setCurrentOperand(resultString);
                setPreviousOperand('');
                setOperation(undefined);
            },
            '√': () => {
                const operand = parseFloat(currentOperand);
                const result = Math.sqrt(operand);
                handleSaveToHistory(`√(${operand})`, String(result));
                setCurrentOperand(String(result));
            },
            'x²': () => {
                const operand = parseFloat(currentOperand);
                const result = operand ** 2;
                handleSaveToHistory(`(${operand})²`, String(result));
                setCurrentOperand(String(result));
            },
            '1/x': () => {
                const operand = parseFloat(currentOperand);
                const result = 1 / operand;
                handleSaveToHistory(`1/(${operand})`, String(result));
                setCurrentOperand(String(result));
            },
            '±': () => {
                setCurrentOperand(String(parseFloat(currentOperand) * -1));
            },
            'MC': () => setMemory(0),
            'MR': () => setCurrentOperand(String(memory)),
            'M+': () => setMemory(memory + parseFloat(currentOperand)),
            'M-': () => setMemory(memory - parseFloat(currentOperand)),
            '+': () => handleOperation('+'),
            '-': () => handleOperation('-'),
            '×': () => handleOperation('×'),
            '÷': () => handleOperation('÷'),
            '%': () => handleOperation('%'),
            '(': () => { /* Not implemented yet */ },
            ')': () => { /* Not implemented yet */ },
        };
        
        const action = buttonActions[value];
        if (action) {
            action();
        } else if (!isNaN(Number(value))) {
            // It's a number
            if (currentOperand === '0') {
                setCurrentOperand(value);
            } else {
                setCurrentOperand(currentOperand + value);
            }
        }
    };

    const handleOperation = (op: string) => {
        if (currentOperand === '' && previousOperand === '') return;
        if (currentOperand === '' && previousOperand !== '') {
            setOperation(op);
            return;
        }
        if (previousOperand !== '') {
           handleButtonClick('=');
        }
        setOperation(op);
        setPreviousOperand(currentOperand);
        setCurrentOperand('');
    };

    const FullScreenHeader = () => (
        <header className="flex items-center p-4">
            <Button variant="ghost" size="icon" onClick={() => onFullScreenToggle(false)}>
                <ArrowLeft />
            </Button>
            <h1 className="text-xl font-bold ml-4">Calculator</h1>
        </header>
    );

  return (
    <div className={cn("w-full space-y-4", isFullScreen ? "h-screen flex flex-col" : "max-w-lg mx-auto")}>
       {isFullScreen && <FullScreenHeader />}
      <div className={cn("bg-card rounded-2xl shadow-lg border", isFullScreen ? "flex-grow flex flex-col p-4" : "p-6")}>
        {!isFullScreen && (
            <div className="flex justify-between items-center mb-5">
                <div className="font-bold text-xl text-foreground/70 tracking-widest">CALC</div>
                <div className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => onFullScreenToggle(true)}>
                        <Maximize />
                    </Button>
                </div>
            </div>
        )}

        <div className={cn("display-container bg-muted rounded-lg p-2 border", isFullScreen ? "mb-4" : "mb-6")}>
             <div className="display bg-background/50 rounded-md p-4 h-28 text-right flex flex-col justify-end">
                <div className="previous-operand text-muted-foreground text-xl min-h-7 break-all">{previousOperand} {operation}</div>
                <div className="current-operand text-foreground text-5xl font-semibold break-all">{currentOperand}</div>
            </div>
        </div>

        <div className={cn("buttons grid grid-cols-5 grid-rows-5 gap-3", isFullScreen && "flex-grow")}>
          <CalculatorButton onClick={handleButtonClick} label="MC" className="bg-accent text-accent-foreground" />
          <CalculatorButton onClick={handleButtonClick} label="MR" className="bg-accent text-accent-foreground" />
          <CalculatorButton onClick={handleButtonClick} label="M+" className="bg-accent text-accent-foreground" />
          <CalculatorButton onClick={handleButtonClick} label="AC" className="bg-destructive text-destructive-foreground" />
          <CalculatorButton onClick={handleButtonClick} label="DEL" className="bg-destructive text-destructive-foreground" />
          
          <CalculatorButton onClick={handleButtonClick} label="√" />
          <CalculatorButton onClick={handleButtonClick} label="%" />
          <CalculatorButton onClick={handleButtonClick} label="(" />
          <CalculatorButton onClick={handleButtonClick} label=")" />
          <CalculatorButton onClick={handleButtonClick} label="÷" className="bg-primary text-primary-foreground" />
          
          <CalculatorButton onClick={handleButtonClick} label="7" />
          <CalculatorButton onClick={handleButtonClick} label="8" />
          <CalculatorButton onClick={handleButtonClick} label="9" />
          <CalculatorButton onClick={handleButtonClick} label="×" className="bg-primary text-primary-foreground" />
          <CalculatorButton onClick={handleButtonClick} label="M-" className="bg-accent text-accent-foreground" />

          <CalculatorButton onClick={handleButtonClick} label="4" />
          <CalculatorButton onClick={handleButtonClick} label="5" />
          <CalculatorButton onClick={handleButtonClick} label="6" />
          <CalculatorButton onClick={handleButtonClick} label="-" className="bg-primary text-primary-foreground" />
          <CalculatorButton onClick={handleButtonClick} label="x²" />

          <CalculatorButton onClick={handleButtonClick} label="1" />
          <CalculatorButton onClick={handleButtonClick} label="2" />
          <CalculatorButton onClick={handleButtonClick} label="3" />
          <CalculatorButton onClick={handleButtonClick} label="+" className="bg-primary text-primary-foreground" />
          <CalculatorButton onClick={handleButtonClick} label="1/x" />
          
          <CalculatorButton onClick={handleButtonClick} label="0" className="col-span-2" />
          <CalculatorButton onClick={handleButtonClick} label="." />
          <CalculatorButton onClick={handleButtonClick} label="=" className="bg-primary text-primary-foreground" />
          <CalculatorButton onClick={handleButtonClick} label="±" />
        </div>
      </div>
       {!isFullScreen && recentCalculations.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between text-base">
                        <div className="flex items-center gap-2">
                           <History size={18} />
                           Recent Calculations
                        </div>
                        <Button variant="link" size="sm" onClick={() => router.push('/history?tab=calculator')}>See All</Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        {recentCalculations.map((calc, i) => (
                            <li key={i} className="flex justify-between items-center p-2 bg-secondary rounded-md group">
                               <span className="truncate">{calc.split('|')[0]}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        )}
    </div>
  );
}
