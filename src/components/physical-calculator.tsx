
"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { incrementCalculationCount } from '@/lib/stats';
import { addCalculationToHistory, listenToUserData, UserData } from '@/services/firestore';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { History, Maximize, Minimize, ArrowLeft } from 'lucide-react';

const PhysicalButton = ({
  onClick,
  label,
  className = "",
  children
}: {
  onClick: (value: string) => void;
  label: string;
  className?: string;
  children?: React.ReactNode;
}) => (
  <button
    onClick={() => onClick(label)}
    className={cn(
        "relative flex items-center justify-center rounded-xl p-5 text-2xl font-semibold shadow-[0_6px_0_var(--shadow-color),_0_8px_4px_rgba(0,0,0,0.3),_inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-100 ease-in-out active:translate-y-1 active:shadow-[0_2px_0_var(--shadow-color),_0_4px_4px_rgba(0,0,0,0.2),_inset_0_1px_0_rgba(255,255,255,0.2)]",
        className
    )}
  >
    {children || label}
  </button>
);


export function PhysicalCalculator({ isFullScreen, onFullScreenToggle }: { isFullScreen: boolean, onFullScreenToggle: (isFullScreen: boolean) => void }) {
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
            <Button variant="ghost" size="icon" onClick={() => onFullScreenToggle(false)} className="text-white hover:bg-white/10">
                <ArrowLeft />
            </Button>
            <h1 className="text-xl font-bold ml-4 text-white">Calculator</h1>
        </header>
    );

  return (
    <div className={cn("w-full space-y-4", isFullScreen ? "h-screen flex flex-col" : "max-w-[500px] mx-auto")}>
       {isFullScreen && <FullScreenHeader />}
      <div className={cn("bg-[#9eadb8] rounded-2xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6),_0_0_0_6px_#7a8791,_0_0_0_12px_#6b7882,_0_0_0_18px_#5d6871,_inset_0_5px_8px_rgba(255,255,255,0.4),_inset_0_-5px_8px_rgba(0,0,0,0.2)]", isFullScreen && "flex-grow flex flex-col")}>
        {!isFullScreen && (
            <div className="header flex justify-between items-center mb-5">
                <div className="text-[#4a5c6c] text-3xl font-bold tracking-widest text-shadow-[1px_1px_2px_rgba(0,0,0,0.2)]">CALCPRO</div>
                <div className="flex justify-between w-[180px] bg-[#3a3022] rounded-md p-2 shadow-[inset_0_0_10px_rgba(0,0,0,0.5),_0_0_0_3px_#2d251a]">
                    <div className="flex-1 h-8 bg-gradient-to-b from-[#2b3a42] to-[#1c252a] mx-1 rounded-sm shadow-[inset_0_0_4px_rgba(0,0,0,0.8)]"></div>
                    <div className="flex-1 h-8 bg-gradient-to-b from-[#2b3a42] to-[#1c252a] mx-1 rounded-sm shadow-[inset_0_0_4px_rgba(0,0,0,0.8)]"></div>
                    <div className="flex-1 h-8 bg-gradient-to-b from-[#2b3a42] to-[#1c252a] mx-1 rounded-sm shadow-[inset_0_0_4px_rgba(0,0,0,0.8)]"></div>
                </div>
                 <Button variant="ghost" size="icon" onClick={() => onFullScreenToggle(true)} className="text-[#4a5c6c] hover:bg-black/10">
                    <Maximize />
                </Button>
            </div>
        )}

        <div className="display-container bg-[#c3d4c6] rounded-lg p-5 mb-6 text-right shadow-[inset_0_6px_10px_rgba(0,0,0,0.3),_0_0_0_4px_#aab9b0,_0_0_0_6px_#95a298] min-h-[120px]">
             <div className="display bg-gradient-to-b from-[#e0efe9] to-[#c3d4c6] rounded-md p-4 h-full shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]">
                <div className="previous-operand text-[#55665e] text-2xl min-h-8 break-all">{previousOperand} {operation}</div>
                <div className="current-operand text-[#2c3e50] text-5xl font-semibold break-all">{currentOperand}</div>
            </div>
        </div>

        <div className={cn("buttons grid grid-cols-5 grid-rows-5 gap-4", isFullScreen && "flex-grow")}>
            <PhysicalButton onClick={handleButtonClick} label="MC" className="bg-gradient-to-b from-[#9c27b0] to-[#7b1fa2] text-white [--shadow-color:#6a1b9a]" />
            <PhysicalButton onClick={handleButtonClick} label="MR" className="bg-gradient-to-b from-[#9c27b0] to-[#7b1fa2] text-white [--shadow-color:#6a1b9a]" />
            <PhysicalButton onClick={handleButtonClick} label="M+" className="bg-gradient-to-b from-[#9c27b0] to-[#7b1fa2] text-white [--shadow-color:#6a1b9a]" />
            <PhysicalButton onClick={handleButtonClick} label="AC" className="bg-gradient-to-b from-[#f44336] to-[#d32f2f] text-white [--shadow-color:#b71c1c]" />
            <PhysicalButton onClick={handleButtonClick} label="DEL" className="bg-gradient-to-b from-[#f44336] to-[#d32f2f] text-white [--shadow-color:#b71c1c]" />

            <PhysicalButton onClick={handleButtonClick} label="√" className="bg-gradient-to-b from-[#ff9500] to-[#e68400] text-white [--shadow-color:#cc7600]" />
            <PhysicalButton onClick={handleButtonClick} label="%" className="bg-gradient-to-b from-[#ff9500] to-[#e68400] text-white [--shadow-color:#cc7600]" />
            <PhysicalButton onClick={handleButtonClick} label="(" className="bg-gradient-to-b from-[#ff9500] to-[#e68400] text-white [--shadow-color:#cc7600]" />
            <PhysicalButton onClick={handleButtonClick} label=")" className="bg-gradient-to-b from-[#ff9500] to-[#e68400] text-white [--shadow-color:#cc7600]" />
            <PhysicalButton onClick={handleButtonClick} label="÷" className="bg-gradient-to-b from-[#ff9500] to-[#e68400] text-white [--shadow-color:#cc7600]" />

            <PhysicalButton onClick={handleButtonClick} label="7" className="bg-gradient-to-b from-[#8a98a4] to-[#6b7884] text-white [--shadow-color:#5a6670]" />
            <PhysicalButton onClick={handleButtonClick} label="8" className="bg-gradient-to-b from-[#8a98a4] to-[#6b7884] text-white [--shadow-color:#5a6670]" />
            <PhysicalButton onClick={handleButtonClick} label="9" className="bg-gradient-to-b from-[#8a98a4] to-[#6b7884] text-white [--shadow-color:#5a6670]" />
            <PhysicalButton onClick={handleButtonClick} label="×" className="bg-gradient-to-b from-[#ff9500] to-[#e68400] text-white [--shadow-color:#cc7600]" />
            <PhysicalButton onClick={handleButtonClick} label="M-" className="bg-gradient-to-b from-[#9c27b0] to-[#7b1fa2] text-white [--shadow-color:#6a1b9a]" />

            <PhysicalButton onClick={handleButtonClick} label="4" className="bg-gradient-to-b from-[#8a98a4] to-[#6b7884] text-white [--shadow-color:#5a6670]" />
            <PhysicalButton onClick={handleButtonClick} label="5" className="bg-gradient-to-b from-[#8a98a4] to-[#6b7884] text-white [--shadow-color:#5a6670]" />
            <PhysicalButton onClick={handleButtonClick} label="6" className="bg-gradient-to-b from-[#8a98a4] to-[#6b7884] text-white [--shadow-color:#5a6670]" />
            <PhysicalButton onClick={handleButtonClick} label="-" className="bg-gradient-to-b from-[#ff9500] to-[#e68400] text-white [--shadow-color:#cc7600]" />
            <PhysicalButton onClick={handleButtonClick} label="x²" className="bg-gradient-to-b from-[#ff9500] to-[#e68400] text-white [--shadow-color:#cc7600]" />

            <PhysicalButton onClick={handleButtonClick} label="1" className="bg-gradient-to-b from-[#8a98a4] to-[#6b7884] text-white [--shadow-color:#5a6670]" />
            <PhysicalButton onClick={handleButtonClick} label="2" className="bg-gradient-to-b from-[#8a98a4] to-[#6b7884] text-white [--shadow-color:#5a6670]" />
            <PhysicalButton onClick={handleButtonClick} label="3" className="bg-gradient-to-b from-[#8a98a4] to-[#6b7884] text-white [--shadow-color:#5a6670]" />
            <PhysicalButton onClick={handleButtonClick} label="+" className="bg-gradient-to-b from-[#ff9500] to-[#e68400] text-white [--shadow-color:#cc7600]" />
            <PhysicalButton onClick={handleButtonClick} label="1/x" className="bg-gradient-to-b from-[#ff9500] to-[#e68400] text-white [--shadow-color:#cc7600]" />

            <PhysicalButton onClick={handleButtonClick} label="0" className="col-span-2 bg-gradient-to-b from-[#8a98a4] to-[#6b7884] text-white [--shadow-color:#5a6670]" />
            <PhysicalButton onClick={handleButtonClick} label="." className="bg-gradient-to-b from-[#8a98a4] to-[#6b7884] text-white [--shadow-color:#5a6670]" />
            <PhysicalButton onClick={handleButtonClick} label="=" className="bg-gradient-to-b from-[#2196F3] to-[#0b7dda] text-white [--shadow-color:#0a6ebe]" />
            <PhysicalButton onClick={handleButtonClick} label="±" className="bg-gradient-to-b from-[#ff9500] to-[#e68400] text-white [--shadow-color:#cc7600]" />
        </div>
         {!isFullScreen && (
            <div className="footer flex justify-between mt-5 text-[#4a5c6c] text-sm font-semibold">
                <div>SCIENTIFIC CALCULATOR</div>
                <div className="italic">Made by Aman Yadav</div>
            </div>
         )}
      </div>
      {!isFullScreen && recentCalculations.length > 0 && (
            <Card className="bg-card/50 backdrop-blur-sm border-none">
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
                            <li key={i} className="flex justify-between items-center p-2 bg-black/10 rounded-md group">
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
