
"use client";

import { useState, useEffect, useRef } from 'react';
import { cn } from "@/lib/utils";

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
  <button
    onClick={() => onClick(label)}
    className={cn(
        "relative flex items-center justify-center rounded-xl p-4 text-2xl font-semibold text-primary-foreground shadow-md transition-all duration-100 ease-in-out active:translate-y-1 active:shadow-sm",
        "before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-transparent before:clip-q",
        className
    )}
  >
    {children || label}
    {buttonLabel && <span className="absolute bottom-1.5 right-2.5 text-xs font-bold uppercase opacity-60">{buttonLabel}</span>}
  </button>
);


export function Calculator() {
    const [currentOperand, setCurrentOperand] = useState('0');
    const [previousOperand, setPreviousOperand] = useState('');
    const [operation, setOperation] = useState<string | undefined>(undefined);
    const [memory, setMemory] = useState(0);

    const audioRef = useRef<HTMLAudioElement>(null);
    const [isSoundEnabled, setIsSoundEnabled] = useState(true);

    useEffect(() => {
        const soundEnabled = localStorage.getItem('calculatorSoundEnabled');
        if (soundEnabled !== null) {
            setIsSoundEnabled(JSON.parse(soundEnabled));
        }

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'calculatorSoundEnabled') {
                setIsSoundEnabled(e.newValue === null ? true : JSON.parse(e.newValue));
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const playSound = () => {
        if (isSoundEnabled && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.error("Error playing sound:", e));
        }
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
                if (previousOperand === '' || operation === undefined) return;
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
                setCurrentOperand(String(result));
                setPreviousOperand('');
                setOperation(undefined);
            },
            '√': () => {
                setCurrentOperand(String(Math.sqrt(parseFloat(currentOperand))));
            },
            'x²': () => {
                setCurrentOperand(String(parseFloat(currentOperand) ** 2));
            },
            '1/x': () => {
                setCurrentOperand(String(1 / parseFloat(currentOperand)));
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
        if (currentOperand === '') return;
        if (previousOperand !== '') {
           handleButtonClick('=');
        }
        setOperation(op);
        setPreviousOperand(currentOperand);
        setCurrentOperand('');
    };

  return (
    <div className="w-full max-w-lg mx-auto p-4">
       <audio ref={audioRef} src="/alarm.mp3" preload="auto"></audio>
      <div className="bg-card/80 rounded-2xl p-6 shadow-lg border-2 border-border/20">
        <div className="header flex justify-between items-center mb-5">
            <div className="font-bold text-xl text-foreground/70 tracking-widest">CALCPRO</div>
            <div className="flex justify-between w-36 bg-secondary/50 rounded-md p-1.5 border border-border/20">
                <div className="flex-1 h-6 bg-gradient-to-b from-secondary to-background/50 mx-1 rounded-sm"></div>
                <div className="flex-1 h-6 bg-gradient-to-b from-secondary to-background/50 mx-1 rounded-sm"></div>
                <div className="flex-1 h-6 bg-gradient-to-b from-secondary to-background/50 mx-1 rounded-sm"></div>
            </div>
            <div className="text-right">
                <div className="font-semibold text-sm text-foreground/60">X-8000</div>
            </div>
        </div>

        <div className="display-container bg-muted/50 rounded-lg p-2 mb-6 border-2 border-border/20 shadow-inner">
             <div className="display bg-gradient-to-b from-background/80 to-background/50 rounded-md p-4 h-28 text-right flex flex-col justify-end">
                <div className="previous-operand text-foreground/60 text-xl min-h-7 break-all">{previousOperand} {operation}</div>
                <div className="current-operand text-foreground text-5xl font-semibold break-all">{currentOperand}</div>
            </div>
        </div>

        <div className="buttons grid grid-cols-5 grid-rows-5 gap-3">
          <CalculatorButton onClick={handleButtonClick} label="MC" className="bg-accent text-accent-foreground shadow-accent/50" buttonLabel="MEM" />
          <CalculatorButton onClick={handleButtonClick} label="MR" className="bg-accent text-accent-foreground shadow-accent/50" buttonLabel="RECALL" />
          <CalculatorButton onClick={handleButtonClick} label="M+" className="bg-accent text-accent-foreground shadow-accent/50" buttonLabel="STORE" />
          <CalculatorButton onClick={handleButtonClick} label="AC" className="bg-destructive text-destructive-foreground shadow-destructive/50" buttonLabel="OFF" />
          <CalculatorButton onClick={handleButtonClick} label="DEL" className="bg-destructive text-destructive-foreground shadow-destructive/50" buttonLabel="ON" />
          
          <CalculatorButton onClick={handleButtonClick} label="√" className="bg-secondary text-secondary-foreground shadow-secondary/50" />
          <CalculatorButton onClick={handleButtonClick} label="%" className="bg-secondary text-secondary-foreground shadow-secondary/50" />
          <CalculatorButton onClick={handleButtonClick} label="(" className="bg-secondary text-secondary-foreground shadow-secondary/50" />
          <CalculatorButton onClick={handleButtonClick} label=")" className="bg-secondary text-secondary-foreground shadow-secondary/50" />
          <CalculatorButton onClick={handleButtonClick} label="÷" className="bg-primary text-primary-foreground shadow-primary/50" />
          
          <CalculatorButton onClick={handleButtonClick} label="7" className="bg-muted text-muted-foreground" />
          <CalculatorButton onClick={handleButtonClick} label="8" className="bg-muted text-muted-foreground" />
          <CalculatorButton onClick={handleButtonClick} label="9" className="bg-muted text-muted-foreground" />
          <CalculatorButton onClick={handleButtonClick} label="×" className="bg-primary text-primary-foreground shadow-primary/50" />
          <CalculatorButton onClick={handleButtonClick} label="M-" className="bg-accent text-accent-foreground shadow-accent/50" />

          <CalculatorButton onClick={handleButtonClick} label="4" className="bg-muted text-muted-foreground" />
          <CalculatorButton onClick={handleButtonClick} label="5" className="bg-muted text-muted-foreground" />
          <CalculatorButton onClick={handleButtonClick} label="6" className="bg-muted text-muted-foreground" />
          <CalculatorButton onClick={handleButtonClick} label="-" className="bg-primary text-primary-foreground shadow-primary/50" />
          <CalculatorButton onClick={handleButtonClick} label="x²" className="bg-secondary text-secondary-foreground shadow-secondary/50" />

          <CalculatorButton onClick={handleButtonClick} label="1" className="bg-muted text-muted-foreground" />
          <CalculatorButton onClick={handleButtonClick} label="2" className="bg-muted text-muted-foreground" />
          <CalculatorButton onClick={handleButtonClick} label="3" className="bg-muted text-muted-foreground" />
          <CalculatorButton onClick={handleButtonClick} label="+" className="bg-primary text-primary-foreground shadow-primary/50" />
          <CalculatorButton onClick={handleButtonClick} label="1/x" className="bg-secondary text-secondary-foreground shadow-secondary/50" />
          
          <CalculatorButton onClick={handleButtonClick} label="0" className="bg-muted text-muted-foreground col-span-2" />
          <CalculatorButton onClick={handleButtonClick} label="." className="bg-muted text-muted-foreground" />
          <CalculatorButton onClick={handleButtonClick} label="=" className="bg-primary text-primary-foreground shadow-primary/50" />
          <CalculatorButton onClick={handleButtonClick} label="±" className="bg-secondary text-secondary-foreground shadow-secondary/50" />
        </div>
      </div>
    </div>
  );
}

