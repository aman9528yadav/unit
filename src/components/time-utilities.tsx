
"use client";

import * as React from "react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, differenceInDays, differenceInWeeks, differenceInMonths, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, addYears, subYears, intervalToDuration, differenceInBusinessDays, parseISO } from 'date-fns';
import { Home, Play, Pause, RotateCcw, Flag, CalendarIcon, ArrowRight, Hourglass, Trash2, Settings, Minus, Plus, ArrowDown } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// --- Web Worker Code ---
// This code will be run in a separate thread to ensure timers work in the background.
const workerCode = `
  let timerInterval = null;

  self.onmessage = function(e) {
    const { type, payload } = e.data;

    if (type === 'start') {
      clearInterval(timerInterval); // Clear any existing timer
      timerInterval = setInterval(() => {
        self.postMessage({ type: 'tick' });
      }, payload.interval);
    } else if (type === 'stop') {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  };
`;


function PomodoroTimer() {
    const [minutes, setMinutes] = React.useState(25);
    const [seconds, setSeconds] = React.useState(0);
    const [isActive, setIsActive] = React.useState(false);
    const [mode, setMode] = React.useState<'work' | 'shortBreak' | 'longBreak'>('work');
    const [pomodoros, setPomodoros] = React.useState(0);
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    const workerRef = React.useRef<Worker | null>(null);

    const [settings, setSettings] = React.useState({
        pomodoroLength: 25,
        shortBreakLength: 5,
        longBreakLength: 15,
        pomodorosUntilLongBreak: 4,
    });

    const audioRef = React.useRef<HTMLAudioElement>(null);

    const switchMode = React.useCallback((newMode: typeof mode, userInitiated = false) => {
        setIsActive(!userInitiated);
        let newMinutes: number;
        switch (newMode) {
            case 'work': newMinutes = settings.pomodoroLength; break;
            case 'shortBreak': newMinutes = settings.shortBreakLength; break;
            case 'longBreak': newMinutes = settings.longBreakLength; break;
        }

        const newPomodoros = (newMode === 'work' && userInitiated) ? 0 : pomodoros;
        setPomodoros(newPomodoros);
        
        setMode(newMode);
        setMinutes(newMinutes);
        setSeconds(0);

        if (!userInitiated) { // Auto-switch
             if (audioRef.current) {
                audioRef.current.play().catch(e => console.error("Error playing sound:", e));
             }
             const endTime = new Date().getTime() + newMinutes * 60 * 1000;
             localStorage.setItem('pomodoroState', JSON.stringify({
                 endTime: endTime,
                 mode: newMode,
                 pomodoros: newPomodoros,
                 isPaused: false,
             }));
        } else { // Manual switch by user
             localStorage.setItem('pomodoroState', JSON.stringify({
                remainingTime: newMinutes * 60 * 1000,
                mode: newMode,
                pomodoros: newPomodoros,
                isPaused: true,
            }));
        }

    }, [pomodoros, settings]);


    // Initialize from localStorage
    React.useEffect(() => {
        const savedSettings = localStorage.getItem('pomodoroSettings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }

        const savedState = localStorage.getItem('pomodoroState');
        if (savedState) {
            const { endTime, remainingTime, mode: savedMode, pomodoros: savedPomodoros, isPaused } = JSON.parse(savedState);
            const now = new Date().getTime();

            setMode(savedMode);
            setPomodoros(savedPomodoros);

            if (isPaused) {
                const remaining = Math.ceil(remainingTime / 1000);
                setMinutes(Math.floor(remaining / 60));
                setSeconds(remaining % 60);
                setIsActive(false);
            } else if (endTime && now < endTime) {
                const remaining = Math.ceil((endTime - now) / 1000);
                setMinutes(Math.floor(remaining / 60));
                setSeconds(remaining % 60);
                setIsActive(true);
            } else {
                 // Timer expired while away
                 // We can't know for sure how many cycles passed, so we just switch to the next mode.
                 const nextMode = savedMode === 'work' ? 'shortBreak' : 'work';
                 switchMode(nextMode, true);
            }
        }
    }, [switchMode]);

    // Timer logic effect
    React.useEffect(() => {
        if (!workerRef.current) {
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            workerRef.current = new Worker(URL.createObjectURL(blob));
        }

        const worker = workerRef.current;

        const handleTick = () => {
             setTime(prevTime => {
                 if (prevTime <= 0) {
                     const newPomodoroCount = mode === 'work' ? pomodoros + 1 : pomodoros;
                     if(mode === 'work') setPomodoros(newPomodoroCount);
                     
                     const newMode = mode === 'work'
                        ? (newPomodoroCount % settings.pomodorosUntilLongBreak === 0 ? 'longBreak' : 'shortBreak')
                        : 'work';
                     
                     switchMode(newMode, false);
                     return 0; // Return 0 to prevent further negative countdown
                 }
                 return prevTime - 1;
             });
        }
        
        const setTime = (updater: (prevTime: number) => number) => {
            setMinutes(m => {
                setSeconds(s => {
                    const totalSeconds = m * 60 + s;
                    const newTotalSeconds = updater(totalSeconds);
                    setMinutes(Math.floor(newTotalSeconds / 60));
                    setSeconds(newTotalSeconds % 60);
                    return newTotalSeconds % 60;
                });
                return m;
            });
        };

        if (isActive) {
            worker.onmessage = handleTick;
            worker.postMessage({ type: 'start', payload: { interval: 1000 } });
        } else {
            worker.postMessage({ type: 'stop' });
        }

        return () => {
             worker.postMessage({ type: 'stop' });
        };
    }, [isActive, mode, pomodoros, settings, switchMode]);

    // Cleanup worker on component unmount
     React.useEffect(() => {
        return () => {
            workerRef.current?.terminate();
        }
     }, []);


    const toggle = () => {
        const newState = !isActive;
        setIsActive(newState);
        
        const savedState = JSON.parse(localStorage.getItem('pomodoroState') || '{}');

        if (newState) { // Starting or resuming
            const remainingMs = savedState.isPaused 
                ? savedState.remainingTime
                : (minutes * 60 + seconds) * 1000;
            const newEndTime = new Date().getTime() + remainingMs;
            localStorage.setItem('pomodoroState', JSON.stringify({ ...savedState, endTime: newEndTime, isPaused: false }));
        } else { // Pausing
            const remaining = (minutes * 60 + seconds) * 1000;
            localStorage.setItem('pomodoroState', JSON.stringify({ ...savedState, remainingTime: remaining, isPaused: true }));
        }
    };

    const reset = () => {
        switchMode(mode, true);
    };
    
    const handleSettingsSave = (newSettings: typeof settings) => {
        setSettings(newSettings);
        localStorage.setItem('pomodoroSettings', JSON.stringify(newSettings));
        setIsSettingsOpen(false);
        reset(); 
    }

    return (
        <Card className="w-full text-center">
             <audio ref={audioRef} src="/alarm.mp3" preload="auto"></audio>
            <CardHeader>
                <div className="flex justify-center gap-2 mb-4">
                    <Button variant={mode === 'work' ? 'secondary' : 'ghost'} onClick={() => switchMode('work', true)}>Pomodoro</Button>
                    <Button variant={mode === 'shortBreak' ? 'secondary' : 'ghost'} onClick={() => switchMode('shortBreak', true)}>Short Break</Button>
                    <Button variant={mode === 'longBreak' ? 'secondary' : 'ghost'} onClick={() => switchMode('longBreak', true)}>Long Break</Button>
                </div>
                <div className="text-7xl font-bold tracking-tighter">
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </div>
                 <p className="text-muted-foreground">Cycles completed: {pomodoros}</p>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
                 <div className="flex items-center gap-4">
                    <Button onClick={toggle} className="w-24 h-12 text-lg">
                        {isActive ? <Pause/> : <Play/>}
                        {isActive ? 'Pause' : 'Start'}
                    </Button>
                    <Button onClick={reset} variant="outline" className="w-24 h-12 text-lg">
                        <RotateCcw/> Reset
                    </Button>
                    <PomodoroSettingsDialog
                        isOpen={isSettingsOpen}
                        setIsOpen={setIsSettingsOpen}
                        currentSettings={settings}
                        onSave={handleSettingsSave}
                    />
                </div>
            </CardContent>
        </Card>
    );
}

function PomodoroSettingsDialog({ isOpen, setIsOpen, currentSettings, onSave }: any) {
    const [localSettings, setLocalSettings] = React.useState(currentSettings);

    React.useEffect(() => {
        setLocalSettings(currentSettings);
    }, [currentSettings]);

    const handleChange = (key: keyof typeof localSettings, value: string) => {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue > 0) {
            setLocalSettings({ ...localSettings, [key]: numValue });
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Settings />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Pomodoro Settings</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="pomodoroLength" className="text-right">Work</Label>
                        <Input id="pomodoroLength" type="number" value={localSettings.pomodoroLength} onChange={e => handleChange('pomodoroLength', e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="shortBreakLength" className="text-right">Short Break</Label>
                        <Input id="shortBreakLength" type="number" value={localSettings.shortBreakLength} onChange={e => handleChange('shortBreakLength', e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="longBreakLength" className="text-right">Long Break</Label>
                        <Input id="longBreakLength" type="number" value={localSettings.longBreakLength} onChange={e => handleChange('longBreakLength', e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="pomodorosUntilLongBreak" className="text-right">Cycles</Label>
                        <Input id="pomodorosUntilLongBreak" type="number" value={localSettings.pomodorosUntilLongBreak} onChange={e => handleChange('pomodorosUntilLongBreak', e.target.value)} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={() => onSave(localSettings)}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


function Stopwatch() {
    const [time, setTime] = React.useState(0);
    const [isRunning, setIsRunning] = React.useState(false);
    const [laps, setLaps] = React.useState<number[]>([]);
    const workerRef = React.useRef<Worker | null>(null);

     React.useEffect(() => {
        // Restore state from localStorage
        const savedState = localStorage.getItem('stopwatchState');
        if (savedState) {
            const { time: savedTime, isRunning: wasRunning, startTime: savedStartTime, laps: savedLaps } = JSON.parse(savedState);
            setLaps(savedLaps || []);
            if (wasRunning && savedStartTime) {
                const elapsed = Date.now() - savedStartTime;
                setTime(savedTime + elapsed);
                setIsRunning(true);
            } else {
                setTime(savedTime);
                setIsRunning(false);
            }
        }
        
        // Setup worker
        if (!workerRef.current) {
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            workerRef.current = new Worker(URL.createObjectURL(blob));
        }
        const worker = workerRef.current;

        const handleTick = () => {
             const state = localStorage.getItem('stopwatchState');
             if (!state) return;
             const { time, startTime, isRunning: running } = JSON.parse(state);
             if (running) {
                setTime(time + (Date.now() - startTime));
             }
        };

        if(isRunning) {
            worker.onmessage = handleTick;
            worker.postMessage({type: 'start', payload: { interval: 10 }});
        } else {
            worker.postMessage({type: 'stop'});
        }

        return () => {
            worker.postMessage({ type: 'stop' });
        };
    }, [isRunning]);

     React.useEffect(() => {
        return () => {
            workerRef.current?.terminate();
        }
     }, []);


    const startStop = () => {
        const currentlyRunning = !isRunning;
        setIsRunning(currentlyRunning);
        if (currentlyRunning) {
            // Starting or resuming
             localStorage.setItem('stopwatchState', JSON.stringify({
                time: time,
                startTime: Date.now(),
                isRunning: true,
                laps: laps
            }));
        } else {
            // Pausing
            localStorage.setItem('stopwatchState', JSON.stringify({
                time: time,
                startTime: 0, 
                isRunning: false,
                laps: laps
            }));
        }
    };

    const reset = () => {
        setIsRunning(false);
        setTime(0);
        setLaps([]);
        localStorage.removeItem('stopwatchState');
    };

    const lap = () => {
        if (!isRunning) return;
        const newLaps = [...laps, time];
        setLaps(newLaps);
        const state = JSON.parse(localStorage.getItem('stopwatchState') || '{}');
        localStorage.setItem('stopwatchState', JSON.stringify({...state, laps: newLaps}));
    };

    const clearLaps = () => {
        setLaps([]);
         const state = JSON.parse(localStorage.getItem('stopwatchState') || '{}');
        localStorage.setItem('stopwatchState', JSON.stringify({...state, laps: []}));
    };

    const formatTime = (ms: number) => {
        const minutes = String(Math.floor((ms / 60000) % 60)).padStart(2, '0');
        const seconds = String(Math.floor((ms / 1000) % 60)).padStart(2, '0');
        const milliseconds = String(Math.floor((ms / 10) % 100)).padStart(2, '0');
        return `${minutes}:${seconds}.${milliseconds}`;
    };

    return (
        <Card className="w-full text-center">
             <CardHeader>
                <div className="text-7xl font-bold tracking-tighter">
                    {formatTime(time)}
                </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
                 <div className="flex items-center gap-4">
                    <Button onClick={startStop} className="w-24 h-12 text-lg">
                        {isRunning ? <Pause/> : <Play/>}
                        {isRunning ? 'Pause' : 'Start'}
                    </Button>
                    <Button onClick={reset} variant="outline" className="w-24 h-12 text-lg">
                        <RotateCcw/> Reset
                    </Button>
                     <Button onClick={lap} variant="outline" className="w-24 h-12 text-lg" disabled={!isRunning}>
                        <Flag/> Lap
                    </Button>
                </div>
                {laps.length > 0 && (
                    <div className="w-full">
                        <ScrollArea className="h-40 w-full mt-4">
                            <div className="flex flex-col gap-2 p-2">
                                {laps.map((lapTime, index) => (
                                    <div key={index} className="flex justify-between items-center bg-secondary p-2 rounded-md">
                                        <span className="text-muted-foreground">Lap {index + 1}</span>
                                        <span className="font-mono">{formatTime(lapTime - (laps[index - 1] || 0))}</span>
                                        <span className="font-mono text-foreground">{formatTime(lapTime)}</span>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        <Button onClick={clearLaps} variant="ghost" size="sm" className="text-muted-foreground mt-2">
                            <Trash2 className="mr-2 h-4 w-4"/> Clear Laps
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function DateDifference() {
    const [startDate, setStartDate] = React.useState<Date | undefined>(new Date());
    const [endDate, setEndDate] = React.useState<Date | undefined>(new Date());
    const [duration, setDuration] = React.useState<Duration>({});

    React.useEffect(() => {
        if (startDate && endDate) {
            if (endDate < startDate) {
                 setDuration({});
                return;
            }
            setDuration(intervalToDuration({ start: startDate, end: endDate }));
        }
    }, [startDate, endDate]);

    return (
        <Card className="w-full">
             <CardHeader>
                <CardTitle className="text-center">Time Between Dates</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-full flex flex-col gap-1.5">
                        <Label>Start Date</Label>
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <ArrowDown className="text-muted-foreground" />
                    <div className="w-full flex flex-col gap-1.5">
                        <Label>End Date</Label>
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div className="bg-secondary p-4 rounded-xl mt-4">
                    <h3 className="font-semibold mb-3 text-center">Result</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                        <StatCard value={duration.years} label="Years" />
                        <StatCard value={duration.months} label="Months" />
                        <StatCard value={duration.weeks} label="Weeks" />
                        <StatCard value={duration.days} label="Days" />
                    </div>
                     <div className="text-center text-sm text-muted-foreground mt-4">
                        Total Days: {startDate && endDate ? differenceInDays(endDate, startDate) : 0}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function AddSubtractTime() {
    const [date, setDate] = React.useState<Date | undefined>(new Date());
    const [amount, setAmount] = React.useState<number>(1);
    const [unit, setUnit] = React.useState<'days' | 'weeks' | 'months' | 'years'>('days');
    const [operation, setOperation] = React.useState<'add' | 'subtract'>('add');
    const [resultDate, setResultDate] = React.useState<Date | null>(null);
    
    const calculate = () => {
        if (!date) return;
        const fn = operation === 'add' ? 
            { days: addDays, weeks: addWeeks, months: addMonths, years: addYears }[unit] :
            { days: subDays, weeks: subWeeks, months: subMonths, years: subYears }[unit];
        setResultDate(fn(date, amount));
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-center">Add / Subtract Time</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                    <Label>Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label>Operation</Label>
                    <RadioGroup defaultValue="add" onValueChange={(v) => setOperation(v as any)} className="flex gap-4">
                         <div className="flex items-center space-x-2">
                            <RadioGroupItem value="add" id="add" />
                            <Label htmlFor="add">Add</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="subtract" id="subtract" />
                            <Label htmlFor="subtract">Subtract</Label>
                        </div>
                    </RadioGroup>
                </div>
                <div className="flex gap-2">
                     <div className="flex-grow flex-col gap-1.5">
                        <Label htmlFor="amount">Amount</Label>
                        <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
                    </div>
                     <div className="flex-grow-[2] flex-col gap-1.5">
                        <Label>Unit</Label>
                        <Select value={unit} onValueChange={(v) => setUnit(v as any)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="days">Days</SelectItem>
                                <SelectItem value="weeks">Weeks</SelectItem>
                                <SelectItem value="months">Months</SelectItem>
                                <SelectItem value="years">Years</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Button onClick={calculate}>Calculate</Button>
                 {resultDate && (
                    <div className="bg-secondary p-4 rounded-xl mt-4 text-center">
                        <h3 className="font-semibold mb-2">Resulting Date</h3>
                        <p className="text-2xl font-bold">{format(resultDate, "PPP")}</p>
                    </div>
                 )}
            </CardContent>
        </Card>
    )
}

function AgeCalculator() {
    const [birthDate, setBirthDate] = React.useState<Date | undefined>();
    const [age, setAge] = React.useState<Duration | null>(null);

    React.useEffect(() => {
        if (birthDate) {
            setAge(intervalToDuration({ start: birthDate, end: new Date() }));
        }
    }, [birthDate]);

    return (
        <Card>
            <CardHeader><CardTitle className="text-center">Age Calculator</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-4 items-center">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {birthDate ? format(birthDate, "PPP") : <span>Pick your birthdate</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={birthDate} onSelect={setBirthDate} captionLayout="dropdown-buttons" fromYear={1900} toYear={new Date().getFullYear()} initialFocus />
                    </PopoverContent>
                </Popover>
                 {age && (
                    <div className="bg-secondary p-4 rounded-xl mt-4 w-full">
                        <h3 className="font-semibold mb-3 text-center">Your Age Is</h3>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <StatCard value={age.years} label="Years" />
                            <StatCard value={age.months} label="Months" />
                            <StatCard value={age.days} label="Days" />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function WorkingDaysCalculator() {
    const [startDate, setStartDate] = React.useState<Date | undefined>(new Date());
    const [endDate, setEndDate] = React.useState<Date | undefined>(addDays(new Date(), 10));
    const [holidays, setHolidays] = React.useState<string>("");
    const [workingDays, setWorkingDays] = React.useState<number>(0);
    
    const calculate = () => {
        if (!startDate || !endDate) return;
        const businessDays = differenceInBusinessDays(endDate, startDate);
        const holidayDates = holidays.split('\n').map(h => h.trim()).filter(Boolean).map(h => parseISO(h));
        const holidayCount = holidayDates.filter(h => h >= startDate && h <= endDate && h.getDay() !== 0 && h.getDay() !== 6).length;
        setWorkingDays(businessDays - holidayCount);
    }
    
    return (
        <Card>
            <CardHeader><CardTitle className="text-center">Working Days Calculator</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                    <Label>Start Date</Label>
                    <Popover>
                        <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{startDate ? format(startDate, "PPP") : <span>Pick date</span>}</Button></PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} /></PopoverContent>
                    </Popover>
                </div>
                 <div className="flex flex-col gap-1.5">
                    <Label>End Date</Label>
                    <Popover>
                        <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{endDate ? format(endDate, "PPP") : <span>Pick date</span>}</Button></PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} /></PopoverContent>
                    </Popover>
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label>Holidays (optional)</Label>
                    <Textarea placeholder="Enter holidays, one per line in YYYY-MM-DD format" value={holidays} onChange={(e) => setHolidays(e.target.value)} />
                </div>
                <Button onClick={calculate}>Calculate Working Days</Button>
                <div className="bg-secondary p-4 rounded-xl mt-4 text-center">
                    <h3 className="font-semibold mb-2">Total Working Days</h3>
                    <p className="text-4xl font-bold">{workingDays}</p>
                </div>
            </CardContent>
        </Card>
    )
}

function Countdown() {
    const [targetDate, setTargetDate] = React.useState<Date | undefined>();
    const [timeLeft, setTimeLeft] = React.useState<Duration | null>(null);

    React.useEffect(() => {
        if (!targetDate) return;

        const timer = setInterval(() => {
            const now = new Date();
            if (targetDate > now) {
                setTimeLeft(intervalToDuration({ start: now, end: targetDate }));
            } else {
                setTimeLeft(null);
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    return (
        <Card>
            <CardHeader><CardTitle className="text-center">Countdown Timer</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-4 items-center">
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {targetDate ? format(targetDate, "PPP") : <span>Pick a target date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={targetDate} onSelect={setTargetDate} initialFocus />
                    </PopoverContent>
                </Popover>
                {timeLeft ? (
                     <div className="bg-secondary p-4 rounded-xl mt-4 w-full">
                        <h3 className="font-semibold mb-3 text-center">Time Remaining</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                            <StatCard value={timeLeft.days} label="Days" />
                            <StatCard value={timeLeft.hours} label="Hours" />
                            <StatCard value={timeLeft.minutes} label="Minutes" />
                            <StatCard value={timeLeft.seconds} label="Seconds" />
                        </div>
                    </div>
                ) : (
                    <p className="text-muted-foreground mt-4">Please select a future date to start the countdown.</p>
                )}
            </CardContent>
        </Card>
    )
}

function StatCard({ value, label }: { value: number | undefined, label: string }) {
    return (
        <div>
            <p className="text-3xl font-bold">{value || 0}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
        </div>
    )
}

function DateCalculator() {
    const [activeTab, setActiveTab] = React.useState("difference");
    
    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <ScrollArea className="w-full whitespace-nowrap rounded-lg">
                <TabsList className="inline-flex">
                    <TabsTrigger value="difference">Difference</TabsTrigger>
                    <TabsTrigger value="add-subtract">Add/Sub</TabsTrigger>
                    <TabsTrigger value="age">Age</TabsTrigger>
                    <TabsTrigger value="work-days">Work Days</TabsTrigger>
                    <TabsTrigger value="countdown">Countdown</TabsTrigger>
                </TabsList>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
            <TabsContent value="difference" className="mt-4"><DateDifference /></TabsContent>
            <TabsContent value="add-subtract" className="mt-4"><AddSubtractTime /></TabsContent>
            <TabsContent value="age" className="mt-4"><AgeCalculator /></TabsContent>
            <TabsContent value="work-days" className="mt-4"><WorkingDaysCalculator /></TabsContent>
            <TabsContent value="countdown" className="mt-4"><Countdown /></TabsContent>
        </Tabs>
    )
}


export function TimeUtilities() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = React.useState("timer");

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4">
        <header className="flex items-center justify-between sticky top-0 z-50 bg-background py-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                  <Home />
              </Link>
            </Button>
            <h1 className="text-xl font-bold">Time Utilities</h1>
            <div className="w-10"></div>
        </header>

         <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="timer">Timer</TabsTrigger>
                <TabsTrigger value="stopwatch">Stopwatch</TabsTrigger>
                <TabsTrigger value="date-diff">Date Calc</TabsTrigger>
            </TabsList>
            <TabsContent value="timer" className="mt-4">
                <PomodoroTimer />
            </TabsContent>
            <TabsContent value="stopwatch" className="mt-4">
                <Stopwatch />
            </TabsContent>
            <TabsContent value="date-diff" className="mt-4">
                <DateCalculator />
            </TabsContent>
        </Tabs>
    </div>
  );
}
