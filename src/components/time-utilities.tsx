

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
import { format, differenceInDays, differenceInWeeks, differenceInMonths, addDays, subDays, addWeeks, subWeeks, addMonths, subYears, intervalToDuration, differenceInBusinessDays, parseISO, addYears } from 'date-fns';
import { Home, Play, Pause, RotateCcw, Flag, CalendarIcon, ArrowRight, Hourglass, Trash2, Settings, Minus, Plus, ArrowDown, Copy, Share2 } from "lucide-react";
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
import { useSearchParams } from "next/navigation";
import { incrementDateCalculationCount } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import html2canvas from 'html2canvas';
import { Skeleton } from "./ui/skeleton";
import { motion, AnimatePresence } from 'framer-motion';
import { addNotification } from "@/lib/notifications";
import { Slider } from "@/components/ui/slider";


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
    const { t } = useLanguage();
    const { toast } = useToast();
    const [timeLeft, setTimeLeft] = React.useState(25 * 60);
    const [isActive, setIsActive] = React.useState(false);
    const [mode, setMode] = React.useState<'work' | 'shortBreak' | 'longBreak'>('work');
    const [pomodoros, setPomodoros] = React.useState(0);
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

    const [settings, setSettings] = React.useState({
        pomodoroLength: { hours: 0, minutes: 25, seconds: 0 },
        shortBreakLength: { hours: 0, minutes: 5, seconds: 0 },
        longBreakLength: { hours: 0, minutes: 15, seconds: 0 },
        pomodorosUntilLongBreak: 4,
    });

    const workerRef = React.useRef<Worker | null>(null);

    // Load initial settings and state from localStorage
    React.useEffect(() => {
        const savedSettings = localStorage.getItem('pomodoroSettings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
        const savedState = localStorage.getItem('pomodoroState');
        if (savedState) {
            const { endTime, mode: savedMode, pomodoros: savedPomodoros, isActive: wasActive } = JSON.parse(savedState);
            const now = Date.now();
            const remaining = Math.round((endTime - now) / 1000);
            
            setMode(savedMode);
            setPomodoros(savedPomodoros);

            if (wasActive && remaining > 0) {
                 setTimeLeft(remaining);
                 setIsActive(true);
            } else {
                 switchMode(savedMode, false, JSON.parse(savedSettings || '{}'));
            }
        }
    }, []);

    // Timer logic
    React.useEffect(() => {
        if (typeof window !== "undefined") {
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            const workerUrl = URL.createObjectURL(blob);
            workerRef.current = new Worker(workerUrl);
        }

        const handleTick = () => {
             const savedState = JSON.parse(localStorage.getItem('pomodoroState') || '{}');
             if (savedState.endTime && savedState.isActive) {
                 const remaining = Math.round((savedState.endTime - Date.now()) / 1000);
                 if (remaining >= 0) {
                    setTimeLeft(remaining);
                    if(remaining === 0) {
                        handleTimerEnd();
                    }
                 } else {
                    setTimeLeft(0);
                    handleTimerEnd();
                 }
             }
        };

        if (workerRef.current) {
            workerRef.current.onmessage = (e) => {
                if (e.data.type === 'tick') {
                    handleTick();
                }
            };
        }

        if (isActive && workerRef.current) {
            workerRef.current.postMessage({ type: 'start', payload: { interval: 1000 }});
        } else if (!isActive && workerRef.current) {
            workerRef.current.postMessage({ type: 'stop' });
        }

        return () => {
            workerRef.current?.terminate();
        };

    }, [isActive]);

    const handleTimerEnd = React.useCallback(() => {
        const newPomodoros = mode === 'work' ? pomodoros + 1 : pomodoros;
        const nextMode = mode === 'work'
            ? (newPomodoros % settings.pomodorosUntilLongBreak === 0 ? 'longBreak' : 'shortBreak')
            : 'work';
        
        addNotification({
            title: "Timer Finished!",
            description: `Your ${mode} session is over. Time for a ${nextMode === 'work' ? 'new session' : 'break'}.`,
            icon: "success"
        });

        switchMode(nextMode, true, settings, newPomodoros);
    }, [mode, pomodoros, settings]);


    const switchMode = (newMode: typeof mode, autoStart = false, currentSettings = settings, currentPomodoros = pomodoros) => {
        let newTime;
        let timeInSeconds;
        switch (newMode) {
            case 'work': timeInSeconds = (currentSettings.pomodoroLength.hours * 3600) + (currentSettings.pomodoroLength.minutes * 60) + currentSettings.pomodoroLength.seconds; break;
            case 'shortBreak': timeInSeconds = (currentSettings.shortBreakLength.hours * 3600) + (currentSettings.shortBreakLength.minutes * 60) + currentSettings.shortBreakLength.seconds; break;
            case 'longBreak': timeInSeconds = (currentSettings.longBreakLength.hours * 3600) + (currentSettings.longBreakLength.minutes * 60) + currentSettings.longBreakLength.seconds; break;
        }

        setMode(newMode);
        setTimeLeft(timeInSeconds);
        setPomodoros(currentPomodoros);
        setIsActive(autoStart);
        
        const endTime = Date.now() + timeInSeconds * 1000;
        localStorage.setItem('pomodoroState', JSON.stringify({ endTime: autoStart ? endTime : 0, mode: newMode, pomodoros: currentPomodoros, isActive: autoStart }));
    };

    const toggle = () => {
        const nowActive = !isActive;
        setIsActive(nowActive);

        if (nowActive) {
            const endTime = Date.now() + timeLeft * 1000;
            localStorage.setItem('pomodoroState', JSON.stringify({ endTime, mode, pomodoros, isActive: true }));
        } else {
             const savedState = JSON.parse(localStorage.getItem('pomodoroState') || '{}');
             localStorage.setItem('pomodoroState', JSON.stringify({ ...savedState, endTime: 0, isActive: false }));
        }
    };

    const reset = React.useCallback((newSettings = settings) => {
        switchMode(mode, false, newSettings);
    }, [mode, settings]);

    const handleSettingsSave = (newSettings: typeof settings) => {
        setSettings(newSettings);
        localStorage.setItem('pomodoroSettings', JSON.stringify(newSettings));
        setIsSettingsOpen(false);
        reset(newSettings);
    }
    
    const totalDuration = 
        mode === 'work' ? (settings.pomodoroLength.hours * 3600) + (settings.pomodoroLength.minutes * 60) + settings.pomodoroLength.seconds 
      : mode === 'shortBreak' ? (settings.shortBreakLength.hours * 3600) + (settings.shortBreakLength.minutes * 60) + settings.shortBreakLength.seconds
      : (settings.longBreakLength.hours * 3600) + (settings.longBreakLength.minutes * 60) + settings.longBreakLength.seconds;

    const progress = totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;

    const circumference = 2 * Math.PI * 90;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <Card className="w-full text-center">
             <CardHeader>
                 <div className="flex justify-center gap-2 mb-4">
                    <Button variant={mode === 'work' ? 'secondary' : 'ghost'} onClick={() => switchMode('work')}>{t('timePage.pomodoro.pomodoro')}</Button>
                    <Button variant={mode === 'shortBreak' ? 'secondary' : 'ghost'} onClick={() => switchMode('shortBreak')}>{t('timePage.pomodoro.shortBreak')}</Button>
                    <Button variant={mode === 'longBreak' ? 'secondary' : 'ghost'} onClick={() => switchMode('longBreak')}>{t('timePage.pomodoro.longBreak')}</Button>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
                <div className="relative w-64 h-64">
                    <svg className="w-full h-full" viewBox="0 0 200 200">
                        <circle cx="100" cy="100" r="90" className="stroke-muted" strokeWidth="10" fill="transparent" />
                        <motion.circle
                            cx="100"
                            cy="100"
                            r="90"
                            className="stroke-primary"
                            strokeWidth="10"
                            fill="transparent"
                            strokeLinecap="round"
                            transform="rotate(-90 100 100)"
                            style={{ strokeDasharray: circumference, strokeDashoffset }}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 1, ease: "linear" }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-6xl font-bold tracking-tighter text-foreground">
                            {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </div>
                        <p className="text-muted-foreground mt-2">{t('timePage.pomodoro.cyclesCompleted', { count: pomodoros })}</p>
                    </div>
                </div>

                 <div className="flex items-center gap-4">
                    <Button onClick={toggle} className="w-32 h-12 text-lg rounded-full shadow-lg">
                        {isActive ? <Pause/> : <Play/>}
                        <span className="ml-2">{isActive ? t('timePage.pomodoro.pause') : t('timePage.pomodoro.start')}</span>
                    </Button>
                    <Button onClick={() => reset()} variant="outline" className="w-16 h-12 rounded-full shadow-lg">
                        <RotateCcw/>
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
    const { t } = useLanguage();
    const [localSettings, setLocalSettings] = React.useState(currentSettings);

    React.useEffect(() => {
        if (isOpen) {
            setLocalSettings(currentSettings);
        }
    }, [isOpen, currentSettings]);

    const handleChange = (type: 'pomodoroLength' | 'shortBreakLength' | 'longBreakLength', unit: 'hours' | 'minutes' | 'seconds', value: number) => {
        setLocalSettings((prev: any) => ({
            ...prev,
            [type]: {
                ...prev[type],
                [unit]: value
            }
        }));
    };
    
     const handleCycleChange = (value: number) => {
        setLocalSettings((prev: any) => ({ ...prev, pomodorosUntilLongBreak: value }));
    }

    const handleSave = () => {
        onSave(localSettings);
    }
    
    const DurationInput = ({ type, label }: {type: 'pomodoroLength' | 'shortBreakLength' | 'longBreakLength', label: string}) => (
         <div className="space-y-3">
            <Label>{label}</Label>
            <div className="grid grid-cols-3 gap-2">
                <div>
                    <Label htmlFor={`${type}-hours`} className="text-xs">Hours</Label>
                    <Input id={`${type}-hours`} type="number" min="0" value={localSettings[type].hours} onChange={(e) => handleChange(type, 'hours', parseInt(e.target.value) || 0)} />
                </div>
                 <div>
                    <Label htmlFor={`${type}-minutes`} className="text-xs">Mins</Label>
                    <Input id={`${type}-minutes`} type="number" min="0" max="59" value={localSettings[type].minutes} onChange={(e) => handleChange(type, 'minutes', parseInt(e.target.value) || 0)} />
                </div>
                 <div>
                    <Label htmlFor={`${type}-seconds`} className="text-xs">Secs</Label>
                    <Input id={`${type}-seconds`} type="number" min="0" max="59" value={localSettings[type].seconds} onChange={(e) => handleChange(type, 'seconds', parseInt(e.target.value) || 0)} />
                </div>
            </div>
        </div>
    )


    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                    <Settings />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('timePage.pomodoro.settings.title')}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <DurationInput type="pomodoroLength" label={t('timePage.pomodoro.settings.work')} />
                    <DurationInput type="shortBreakLength" label={t('timePage.pomodoro.settings.shortBreak')} />
                    <DurationInput type="longBreakLength" label={t('timePage.pomodoro.settings.longBreak')} />
                    
                     <div className="space-y-3">
                        <Label htmlFor="pomodorosUntilLongBreak">{t('timePage.pomodoro.settings.cycles')} ({localSettings.pomodorosUntilLongBreak} cycles)</Label>
                         <Slider
                            id="pomodorosUntilLongBreak"
                            min={2}
                            max={8}
                            step={1}
                            value={[localSettings.pomodorosUntilLongBreak]}
                            onValueChange={(value) => handleCycleChange(value[0])}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave}>{t('timePage.pomodoro.settings.save')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


function Stopwatch() {
    const { t } = useLanguage();
    const [time, setTime] = React.useState(0);
    const [isRunning, setIsRunning] = React.useState(false);
    const [laps, setLaps] = React.useState<number[]>([]);
    
    const loadState = React.useCallback(() => {
        const savedState = localStorage.getItem('stopwatchState');
        if (savedState) {
            const { time: savedTime, isRunning: wasRunning, startTime: savedStartTime, laps: savedLaps } = JSON.parse(savedState);
            setLaps(savedLaps || []);
            if (wasRunning && savedStartTime) {
                const elapsed = Date.now() - savedStartTime;
                setTime(savedTime + elapsed);
                setIsRunning(true);
            } else {
                setTime(savedTime || 0);
                setIsRunning(false);
            }
        }
    }, []);

    React.useEffect(() => {
        loadState();
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'stopwatchState') {
                loadState();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [loadState]);

    React.useEffect(() => {
        let animationFrameId: number;

        if (isRunning) {
            const tick = () => {
                 const savedState = JSON.parse(localStorage.getItem('stopwatchState') || '{}');
                 if (savedState.isRunning) {
                     const elapsed = Date.now() - savedState.startTime;
                     setTime(savedState.time + elapsed);
                 }
                 animationFrameId = requestAnimationFrame(tick);
            };
            animationFrameId = requestAnimationFrame(tick);
        }
        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [isRunning]);

    const startStop = () => {
        const currentlyRunning = !isRunning;
        setIsRunning(currentlyRunning);
        const lastStopwatchString = `Stopwatch ${currentlyRunning ? 'started' : 'paused'}|${new Date().toISOString()}`;
        localStorage.setItem('lastStopwatch', lastStopwatchString);

        if (currentlyRunning) {
            localStorage.setItem('stopwatchState', JSON.stringify({
                time,
                startTime: Date.now(),
                isRunning: true,
                laps
            }));
        } else {
             localStorage.setItem('stopwatchState', JSON.stringify({
                time,
                startTime: 0, 
                isRunning: false,
                laps
            }));
        }
        // Force sync across tabs
        window.dispatchEvent(new StorageEvent('storage', { key: 'stopwatchState' }));
    };

    const reset = () => {
        setIsRunning(false);
        setTime(0);
        setLaps([]);
        localStorage.removeItem('stopwatchState');
        const lastStopwatchString = `Stopwatch reset|${new Date().toISOString()}`;
        localStorage.setItem('lastStopwatch', lastStopwatchString);
        window.dispatchEvent(new StorageEvent('storage', { key: 'stopwatchState' }));
    };

    const lap = () => {
        if (!isRunning) return;
        const newLaps = [...laps, time];
        setLaps(newLaps);
        const state = JSON.parse(localStorage.getItem('stopwatchState') || '{}');
        localStorage.setItem('stopwatchState', JSON.stringify({...state, laps: newLaps}));
        window.dispatchEvent(new StorageEvent('storage', { key: 'stopwatchState' }));
    };

    const clearLaps = () => {
        setLaps([]);
         const state = JSON.parse(localStorage.getItem('stopwatchState') || '{}');
        localStorage.setItem('stopwatchState', JSON.stringify({...state, laps: []}));
        window.dispatchEvent(new StorageEvent('storage', { key: 'stopwatchState' }));
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
                        {isRunning ? t('timePage.pomodoro.pause') : t('timePage.pomodoro.start')}
                    </Button>
                    <Button onClick={reset} variant="outline" className="w-24 h-12 text-lg">
                        <RotateCcw/> {t('timePage.pomodoro.reset')}
                    </Button>
                     <Button onClick={lap} variant="outline" className="w-24 h-12 text-lg" disabled={!isRunning}>
                        <Flag/> {t('timePage.stopwatch.lap')}
                    </Button>
                </div>
                {laps.length > 0 && (
                    <div className="w-full">
                        <ScrollArea className="h-40 w-full mt-4">
                            <div className="flex flex-col gap-2 p-2">
                                {laps.map((lapTime, index) => (
                                    <div key={index} className="flex justify-between items-center bg-secondary p-2 rounded-md">
                                        <span className="text-muted-foreground">{t('timePage.stopwatch.lap')} {index + 1}</span>
                                        <span className="font-mono">{formatTime(lapTime - (laps[index - 1] || 0))}</span>
                                        <span className="font-mono text-foreground">{formatTime(lapTime)}</span>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        <Button onClick={clearLaps} variant="ghost" size="sm" className="text-muted-foreground mt-2">
                            <Trash2 className="mr-2 h-4 w-4"/> {t('timePage.stopwatch.clearLaps')}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function DateDifference() {
    const { t } = useLanguage();
    const { toast } = useToast();
    const [startDate, setStartDate] = React.useState<Date | undefined>(new Date());
    const [endDate, setEndDate] = React.useState<Date | undefined>(new Date());
    const [duration, setDuration] = React.useState<Duration>({});
    const resultRef = React.useRef<HTMLDivElement>(null);
    const [isStartOpen, setIsStartOpen] = React.useState(false);
    const [isEndOpen, setIsEndOpen] = React.useState(false);
    
    const calculate = () => {
        if (startDate && endDate) {
            if (endDate < startDate) {
                 setDuration({});
                return;
            }
            setDuration(intervalToDuration({ start: startDate, end: endDate }));
            incrementDateCalculationCount();
            const lastDateCalcString = `${format(startDate, 'P')} to ${format(endDate, 'P')}|${new Date().toISOString()}`;
            localStorage.setItem('lastDateCalc', lastDateCalcString);
            window.dispatchEvent(new StorageEvent('storage', { key: 'lastDateCalc', newValue: lastDateCalcString }));
        }
    }
    
    const handleCopy = () => {
        if (!duration.years && !duration.months && !duration.days) {
            toast({ title: "Nothing to copy", description: "Please calculate a duration first.", variant: "destructive" });
            return;
        }
        const durationString = `${duration.years || 0} years, ${duration.months || 0} months, ${duration.weeks || 0} weeks, ${duration.days || 0} days. Total days: ${startDate && endDate ? differenceInDays(endDate, startDate) : 0}`;
        navigator.clipboard.writeText(durationString);
        toast({ title: "Copied to clipboard!" });
    };

    const handleShare = async () => {
        if (!resultRef.current || (!duration.years && !duration.months && !duration.days)) {
            toast({ title: "Nothing to share", description: "Please calculate a duration first.", variant: "destructive" });
            return;
        }

        if (!navigator.share) {
            toast({ title: "Sharing not supported", description: "Your browser does not support the Web Share API.", variant: "destructive" });
            return;
        }

        try {
            const canvas = await html2canvas(resultRef.current, { backgroundColor: null, scale: 2 });
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    toast({ title: "Sharing Failed", description: "Could not create image from result.", variant: "destructive" });
                    return;
                }
                const file = new File([blob], 'date-difference.png', { type: 'image/png' });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: 'Date Calculation Result',
                        text: `Result from ${startDate ? format(startDate, 'PPP') : ''} to ${endDate ? format(endDate, 'PPP') : ''}`,
                        files: [file],
                    });
                } else {
                   toast({ title: "Cannot share image", description: "Your browser does not support sharing files.", variant: "destructive" });
                }
            }, 'image/png');
        } catch (error) {
            console.error('Error sharing calculation:', error);
            toast({ title: "Sharing Failed", description: "An unexpected error occurred.", variant: "destructive" });
        }
    };

    return (
        <Card className="w-full">
             <CardHeader>
                <CardTitle className="text-center">{t('timePage.dateCalc.differenceTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-full flex flex-col gap-1.5">
                        <Label>{t('timePage.dateCalc.startDate')}</Label>
                         <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {startDate ? format(startDate, "PPP") : <span>{t('timePage.dateCalc.pickDate')}</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={startDate} onSelect={(date) => { setStartDate(date); setIsStartOpen(false); }} captionLayout="dropdown-buttons" fromYear={1900} toYear={new Date().getFullYear() + 5} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <ArrowDown className="text-muted-foreground" />
                    <div className="w-full flex flex-col gap-1.5">
                        <Label>{t('timePage.dateCalc.endDate')}</Label>
                         <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {endDate ? format(endDate, "PPP") : <span>{t('timePage.dateCalc.pickDate')}</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={endDate} onSelect={(date) => { setEndDate(date); setIsEndOpen(false); }} captionLayout="dropdown-buttons" fromYear={1900} toYear={new Date().getFullYear() + 5} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                
                <Button onClick={calculate} className="mt-2">{t('timePage.dateCalc.calculate')}</Button>
                
                <div ref={resultRef} className="bg-secondary p-4 rounded-xl mt-2">
                    <h3 className="font-semibold mb-3 text-center">{t('timePage.dateCalc.result')}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                        <StatCard value={duration.years} label={t('timePage.dateCalc.years')} />
                        <StatCard value={duration.months} label={t('timePage.dateCalc.months')} />
                        <StatCard value={duration.weeks} label={t('timePage.dateCalc.weeks')} />
                        <StatCard value={duration.days} label={t('timePage.dateCalc.days')} />
                    </div>
                     <div className="text-center text-sm text-muted-foreground mt-4">
                        {t('timePage.dateCalc.totalDays', { count: startDate && endDate ? differenceInDays(endDate, startDate) : 0 })}
                    </div>
                </div>
                 <div className="flex justify-end gap-2">
                    <Button variant="outline" size="icon" onClick={handleCopy}><Copy className="h-4 w-4"/></Button>
                    <Button variant="outline" size="icon" onClick={handleShare}><Share2 className="h-4 w-4"/></Button>
                </div>
            </CardContent>
        </Card>
    );
}

function AddSubtractTime() {
    const { t } = useLanguage();
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
        const newResultDate = fn(date, amount);
        setResultDate(newResultDate);
        incrementDateCalculationCount();
        const lastDateCalcString = `${operation === 'add' ? '+' : '-'} ${amount} ${unit} from ${format(date, 'P')}|${new Date().toISOString()}`;
        localStorage.setItem('lastDateCalc', lastDateCalcString);
        window.dispatchEvent(new StorageEvent('storage', { key: 'lastDateCalc', newValue: lastDateCalcString }));
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-center">{t('timePage.dateCalc.addSubTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                    <Label>{t('timePage.dateCalc.date')}</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP") : <span>{t('timePage.dateCalc.pickDate')}</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={date} onSelect={setDate} captionLayout="dropdown-buttons" fromYear={1900} toYear={new Date().getFullYear() + 5} initialFocus />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label>{t('timePage.dateCalc.operation')}</Label>
                    <RadioGroup defaultValue="add" onValueChange={(v) => setOperation(v as any)} className="flex gap-4">
                         <div className="flex items-center space-x-2">
                            <RadioGroupItem value="add" id="add" />
                            <Label htmlFor="add">{t('timePage.dateCalc.add')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="subtract" id="subtract" />
                            <Label htmlFor="subtract">{t('timePage.dateCalc.subtract')}</Label>
                        </div>
                    </RadioGroup>
                </div>
                <div className="flex gap-2">
                     <div className="flex-grow flex-col gap-1.5">
                        <Label htmlFor="amount">{t('timePage.dateCalc.amount')}</Label>
                        <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
                    </div>
                     <div className="flex-grow-[2] flex-col gap-1.5">
                        <Label>{t('timePage.dateCalc.unit')}</Label>
                        <Select value={unit} onValueChange={(v) => setUnit(v as any)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="days">{t('timePage.dateCalc.days')}</SelectItem>
                                <SelectItem value="weeks">{t('timePage.dateCalc.weeks')}</SelectItem>
                                <SelectItem value="months">{t('timePage.dateCalc.months')}</SelectItem>
                                <SelectItem value="years">{t('timePage.dateCalc.years')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Button onClick={calculate}>{t('timePage.dateCalc.calculate')}</Button>
                 {resultDate && (
                    <div className="bg-secondary p-4 rounded-xl mt-4 text-center">
                        <h3 className="font-semibold mb-2">{t('timePage.dateCalc.resultingDate')}</h3>
                        <p className="text-2xl font-bold">{format(resultDate, "PPP")}</p>
                    </div>
                 )}
            </CardContent>
        </Card>
    )
}

function AgeCalculator() {
    const { t } = useLanguage();
    const [birthDate, setBirthDate] = React.useState<Date | undefined>();
    const [age, setAge] = React.useState<Duration | null>(null);

    const calculate = () => {
         if (birthDate) {
            setAge(intervalToDuration({ start: birthDate, end: new Date() }));
            incrementDateCalculationCount();
             const lastDateCalcString = `Age for ${format(birthDate, 'P')}|${new Date().toISOString()}`;
            localStorage.setItem('lastDateCalc', lastDateCalcString);
            window.dispatchEvent(new StorageEvent('storage', { key: 'lastDateCalc', newValue: lastDateCalcString }));
        }
    }

    return (
        <Card>
            <CardHeader><CardTitle className="text-center">{t('timePage.dateCalc.ageTitle')}</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-4 items-center">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {birthDate ? format(birthDate, "PPP") : <span>{t('timePage.dateCalc.pickBirthdate')}</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={birthDate} onSelect={setBirthDate} captionLayout="dropdown-buttons" fromYear={1900} toYear={new Date().getFullYear()} initialFocus />
                    </PopoverContent>
                </Popover>
                 <Button onClick={calculate} className="w-full">{t('timePage.dateCalc.calculate')}</Button>
                 {age && (
                    <div className="bg-secondary p-4 rounded-xl mt-4 w-full">
                        <h3 className="font-semibold mb-2 text-center">{t('timePage.dateCalc.yourAge')}</h3>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <StatCard value={age.years} label={t('timePage.dateCalc.years')} />
                            <StatCard value={age.months} label={t('timePage.dateCalc.months')} />
                            <StatCard value={age.days} label={t('timePage.dateCalc.days')} />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function WorkingDaysCalculator() {
    const { t } = useLanguage();
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
        incrementDateCalculationCount();
        const lastDateCalcString = `Working days between ${format(startDate, 'P')} and ${format(endDate, 'P')}|${new Date().toISOString()}`;
        localStorage.setItem('lastDateCalc', lastDateCalcString);
        window.dispatchEvent(new StorageEvent('storage', { key: 'lastDateCalc', newValue: lastDateCalcString }));
    }
    
    return (
        <Card>
            <CardHeader><CardTitle className="text-center">{t('timePage.dateCalc.workDaysTitle')}</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                    <Label>{t('timePage.dateCalc.startDate')}</Label>
                    <Popover>
                        <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{startDate ? format(startDate, "PPP") : <span>{t('timePage.dateCalc.pickDate')}</span>}</Button></PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} captionLayout="dropdown-buttons" fromYear={1900} toYear={new Date().getFullYear() + 5} /></PopoverContent>
                    </Popover>
                </div>
                 <div className="flex flex-col gap-1.5">
                    <Label>{t('timePage.dateCalc.endDate')}</Label>
                    <Popover>
                        <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{endDate ? format(endDate, "PPP") : <span>{t('timePage.dateCalc.pickDate')}</span>}</Button></PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} captionLayout="dropdown-buttons" fromYear={1900} toYear={new Date().getFullYear() + 5} /></PopoverContent>
                    </Popover>
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label>{t('timePage.dateCalc.holidays')}</Label>
                    <Textarea placeholder={t('timePage.dateCalc.holidaysPlaceholder')} value={holidays} onChange={(e) => setHolidays(e.target.value)} />
                </div>
                <Button onClick={calculate}>{t('timePage.dateCalc.calculateWorkDays')}</Button>
                <div className="bg-secondary p-4 rounded-xl mt-4 text-center">
                    <h3 className="font-semibold mb-2">{t('timePage.dateCalc.totalWorkDays')}</h3>
                    <p className="text-4xl font-bold">{workingDays}</p>
                </div>
            </CardContent>
        </Card>
    )
}

function Countdown() {
    const { t } = useLanguage();
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
            <CardHeader><CardTitle className="text-center">{t('timePage.dateCalc.countdownTitle')}</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-4 items-center">
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {targetDate ? format(targetDate, "PPP") : <span>{t('timePage.dateCalc.pickTargetDate')}</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={targetDate} onSelect={setTargetDate} captionLayout="dropdown-buttons" fromYear={1900} toYear={new Date().getFullYear() + 5} initialFocus />
                    </PopoverContent>
                </Popover>
                {timeLeft ? (
                     <div className="bg-secondary p-4 rounded-xl mt-4 w-full">
                        <h3 className="font-semibold mb-3 text-center">{t('timePage.dateCalc.timeRemaining')}</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                            <StatCard value={timeLeft.days} label={t('timePage.dateCalc.days')} />
                            <StatCard value={timeLeft.hours} label={t('timePage.dateCalc.hours')} />
                            <StatCard value={timeLeft.minutes} label={t('timePage.dateCalc.minutes')} />
                            <StatCard value={timeLeft.seconds} label={t('timePage.dateCalc.seconds')} />
                        </div>
                    </div>
                ) : (
                    <p className="text-muted-foreground mt-4">{t('timePage.dateCalc.countdownMessage')}</p>
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
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = React.useState("difference");
    
    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <ScrollArea className="w-full whitespace-nowrap rounded-lg">
                <TabsList className="inline-flex">
                    <TabsTrigger value="difference">{t('timePage.dateCalc.tabs.difference')}</TabsTrigger>
                    <TabsTrigger value="add-subtract">{t('timePage.dateCalc.tabs.addSub')}</TabsTrigger>
                    <TabsTrigger value="age">{t('timePage.dateCalc.tabs.age')}</TabsTrigger>
                    <TabsTrigger value="work-days">{t('timePage.dateCalc.tabs.workDays')}</TabsTrigger>
                    <TabsTrigger value="countdown">{t('timePage.dateCalc.tabs.countdown')}</TabsTrigger>
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

export function TimeUtilitiesSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="flex gap-2">
                <Skeleton className="h-10 w-1/3 rounded-lg" />
                <Skeleton className="h-10 w-1/3 rounded-lg" />
                <Skeleton className="h-10 w-1/3 rounded-lg" />
            </div>
            <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
    );
}


export function TimeUtilities() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const tabFromQuery = searchParams.get('tab') as 'timer' | 'stopwatch' | 'date-diff' | null;
  const [activeTab, setActiveTab] = React.useState(tabFromQuery || "timer");

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4">
         <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'timer' | 'stopwatch' | 'date-diff')} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="timer">{t('timePage.tabs.timer')}</TabsTrigger>
                <TabsTrigger value="stopwatch">{t('timePage.tabs.stopwatch')}</TabsTrigger>
                <TabsTrigger value="date-diff">{t('timePage.tabs.dateCalc')}</TabsTrigger>
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

    
