

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
import { Home, Play, Pause, RotateCcw, Flag, CalendarIcon, ArrowRight, Hourglass, Trash2, Settings, Minus, Plus, ArrowDown, Copy, Share2, FileText, Download, Image as ImageIcon } from "lucide-react";
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
import { useSearchParams, useRouter } from "next/navigation";
import { incrementDateCalculationCount } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Skeleton } from "./ui/skeleton";
import { motion, AnimatePresence } from 'framer-motion';
import { addNotification } from "@/lib/notifications";
import { Slider } from "@/components/ui/slider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter } from "./ui/alert-dialog";


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
        let timeInSeconds;
        switch (newMode) {
            case 'work': timeInSeconds = (Number(currentSettings.pomodoroLength.hours) || 0) * 3600 + (Number(currentSettings.pomodoroLength.minutes) || 0) * 60 + (Number(currentSettings.pomodoroLength.seconds) || 0); break;
            case 'shortBreak': timeInSeconds = (Number(currentSettings.shortBreakLength.hours) || 0) * 3600 + (Number(currentSettings.shortBreakLength.minutes) || 0) * 60 + (Number(currentSettings.shortBreakLength.seconds) || 0); break;
            case 'longBreak': timeInSeconds = (Number(currentSettings.longBreakLength.hours) || 0) * 3600 + (Number(currentSettings.longBreakLength.minutes) || 0) * 60 + (Number(currentSettings.longBreakLength.seconds) || 0); break;
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
        mode === 'work' ? (Number(settings.pomodoroLength.hours) || 0) * 3600 + (Number(settings.pomodoroLength.minutes) || 0) * 60 + (Number(settings.pomodoroLength.seconds) || 0)
      : mode === 'shortBreak' ? (Number(settings.shortBreakLength.hours) || 0) * 3600 + (Number(settings.shortBreakLength.minutes) || 0) * 60 + (Number(settings.shortBreakLength.seconds) || 0)
      : (Number(settings.longBreakLength.hours) || 0) * 3600 + (Number(settings.longBreakLength.minutes) || 0) * 60 + (Number(settings.longBreakLength.seconds) || 0);

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
                            style={{ strokeDasharray: circumference }}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 1, ease: "linear" }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-5xl font-bold tracking-tighter text-foreground">
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
    
    const getResultString = () => {
        if (!startDate || !endDate || !duration.years && !duration.months && !duration.days) return "No calculation performed.";
        return `Result from ${format(startDate, 'PPP')} to ${format(endDate, 'PPP')}:\n` +
               `${duration.years || 0} years, ${duration.months || 0} months, ${duration.weeks || 0} weeks, ${duration.days || 0} days.\n` +
               `Total days: ${differenceInDays(endDate, startDate)}\n\n` + 
               `Sutradhaar | Made by Aman Yadav`;
    }

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
                
                <div className="bg-secondary p-4 rounded-xl mt-2">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold">{t('timePage.dateCalc.result')}</h3>
                        <ExportControls
                            hasResult={!!(duration.years || duration.months || duration.days)}
                            getResultString={getResultString}
                            componentData={{
                                type: 'DateDifference',
                                startDate,
                                endDate,
                                result: {
                                    years: duration.years || 0,
                                    months: duration.months || 0,
                                    weeks: duration.weeks || 0,
                                    days: duration.days || 0,
                                    totalDays: (startDate && endDate) ? differenceInDays(endDate, startDate) : 0
                                }
                            }}
                        />
                    </div>
                     <div className="bg-background p-4 rounded-lg">
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

    const getResultString = () => {
        if (!resultDate) return "No calculation performed.";
        return `Result of ${operation === 'add' ? 'adding' : 'subtracting'} ${amount} ${unit} ${operation === 'add' ? 'to' : 'from'} ${format(date!, 'PPP')}:\n` +
               `${format(resultDate, "PPP")}\n\n` + 
               `Sutradhaar | Made by Aman Yadav`;
    };

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
                    <div className="bg-secondary p-4 rounded-xl mt-4">
                        <div className="flex justify-between items-center mb-2">
                           <h3 className="font-semibold">{t('timePage.dateCalc.resultingDate')}</h3>
                            <ExportControls
                                hasResult={!!resultDate}
                                getResultString={getResultString}
                                componentData={{
                                    type: 'AddSubtractTime',
                                    startDate: date,
                                    operation,
                                    amount,
                                    unit,
                                    resultDate
                                }}
                            />
                        </div>
                        <div className="bg-background p-4 rounded-lg text-center">
                            <p className="text-2xl font-bold">{format(resultDate, "PPP")}</p>
                        </div>
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
    
    const getResultString = () => {
        if (!age) return "No calculation performed.";
        return `Your age is:\n` +
               `${age.years || 0} years, ${age.months || 0} months, ${age.days || 0} days.\n\n` + 
               `Sutradhaar | Made by Aman Yadav`;
    };


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
                        <div className="flex justify-between items-center mb-2">
                           <h3 className="font-semibold">{t('timePage.dateCalc.yourAge')}</h3>
                            <ExportControls
                                hasResult={!!age}
                                getResultString={getResultString}
                                componentData={{
                                    type: 'AgeCalculator',
                                    birthDate,
                                    result: age
                                }}
                            />
                        </div>
                        <div className="bg-background p-4 rounded-lg">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <StatCard value={age.years} label={t('timePage.dateCalc.years')} />
                                <StatCard value={age.months} label={t('timePage.dateCalc.months')} />
                                <StatCard value={age.days} label={t('timePage.dateCalc.days')} />
                            </div>
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
    const [workingDays, setWorkingDays] = React.useState<number | null>(null);
    
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
    
    const getResultString = () => {
        if (workingDays === null) return "No calculation performed.";
        return `Total working days from ${format(startDate!, 'PPP')} to ${format(endDate!, 'PPP')}:\n` +
               `${workingDays} working days\n\n` + 
               `Sutradhaar | Made by Aman Yadav`;
    };

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
                {workingDays !== null && (
                    <div className="bg-secondary p-4 rounded-xl mt-4">
                         <div className="flex justify-between items-center mb-2">
                           <h3 className="font-semibold">{t('timePage.dateCalc.totalWorkDays')}</h3>
                            <ExportControls
                                hasResult={workingDays !== null}
                                getResultString={getResultString}
                                componentData={{
                                    type: 'WorkingDaysCalculator',
                                    startDate,
                                    endDate,
                                    holidays,
                                    result: workingDays
                                }}
                            />
                        </div>
                        <div className="bg-background p-4 rounded-lg text-center">
                            <p className="text-4xl font-bold">{workingDays}</p>
                        </div>
                    </div>
                )}
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

    const getResultString = () => {
        if (!timeLeft || !targetDate) return "No countdown set.";
        return `Time remaining until ${format(targetDate, 'PPP')}:\n` +
               `${timeLeft.days || 0} days, ${timeLeft.hours || 0} hours, ${timeLeft.minutes || 0} minutes, ${timeLeft.seconds || 0} seconds.\n\n` + 
               `Sutradhaar | Made by Aman Yadav`;
    };

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
                         <div className="flex justify-between items-center mb-3">
                            <h3 className="font-semibold">{t('timePage.dateCalc.timeRemaining')}</h3>
                            <ExportControls
                                hasResult={!!timeLeft}
                                getResultString={getResultString}
                                componentData={{
                                    type: 'Countdown',
                                    targetDate,
                                    result: timeLeft
                                }}
                            />
                        </div>
                        <div className="bg-background p-4 rounded-lg">
                             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                                <StatCard value={timeLeft.days} label={t('timePage.dateCalc.days')} />
                                <StatCard value={timeLeft.hours} label={t('timePage.dateCalc.hours')} />
                                <StatCard value={timeLeft.minutes} label={t('timePage.dateCalc.minutes')} />
                                <StatCard value={timeLeft.seconds} label={t('timePage.dateCalc.seconds')} />
                            </div>
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

interface ExportControlsProps {
    hasResult: boolean;
    getResultString: () => string;
    componentData: any;
}

const ResultImage = React.forwardRef<HTMLDivElement, { data: any, t: any }>(({ data, t }, ref) => {
    let content;

    switch (data.type) {
        case 'DateDifference':
            content = (
                <>
                    <p className="text-sm text-center text-muted-foreground">
                        From {format(data.startDate, 'PPP')} to {format(data.endDate, 'PPP')}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center my-4">
                        <StatCard value={data.result.years} label={t('timePage.dateCalc.years')} />
                        <StatCard value={data.result.months} label={t('timePage.dateCalc.months')} />
                        <StatCard value={data.result.weeks} label={t('timePage.dateCalc.weeks')} />
                        <StatCard value={data.result.days} label={t('timePage.dateCalc.days')} />
                    </div>
                    <p className="text-center text-sm text-muted-foreground mt-2">
                        {t('timePage.dateCalc.totalDays', { count: data.result.totalDays })}
                    </p>
                </>
            );
            break;
        case 'AddSubtractTime':
            content = (
                 <>
                    <p className="text-sm text-center text-muted-foreground">
                       {data.operation === 'add' ? 'Adding' : 'Subtracting'} {data.amount} {data.unit} {data.operation === 'add' ? 'to' : 'from'} {format(data.startDate, 'PPP')}
                    </p>
                    <p className="text-center text-4xl font-bold my-4">{format(data.resultDate, "PPP")}</p>
                </>
            );
            break;
        case 'AgeCalculator':
             content = (
                <>
                    <p className="text-sm text-center text-muted-foreground">Age for birthdate: {format(data.birthDate, 'PPP')}</p>
                    <div className="grid grid-cols-3 gap-4 text-center my-4">
                        <StatCard value={data.result.years} label={t('timePage.dateCalc.years')} />
                        <StatCard value={data.result.months} label={t('timePage.dateCalc.months')} />
                        <StatCard value={data.result.days} label={t('timePage.dateCalc.days')} />
                    </div>
                </>
            );
            break;
        case 'WorkingDaysCalculator':
             content = (
                <>
                    <p className="text-sm text-center text-muted-foreground">Working days from {format(data.startDate, 'PPP')} to {format(data.endDate, 'PPP')}</p>
                    <p className="text-center text-4xl font-bold my-4">{data.result}</p>
                </>
            );
            break;
        case 'Countdown':
            content = (
                 <>
                    <p className="text-sm text-center text-muted-foreground">Time until {format(data.targetDate, 'PPP')}</p>
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center my-4">
                        <StatCard value={data.result.days} label={t('timePage.dateCalc.days')} />
                        <StatCard value={data.result.hours} label={t('timePage.dateCalc.hours')} />
                        <StatCard value={data.result.minutes} label={t('timePage.dateCalc.minutes')} />
                        <StatCard value={data.result.seconds} label={t('timePage.dateCalc.seconds')} />
                    </div>
                </>
            );
            break;
        default:
            content = <p>No data to display.</p>;
    }
    
    return (
        <div ref={ref} className="w-[400px] bg-background text-foreground p-6 rounded-lg">
            <h2 className="text-lg font-bold text-center text-primary mb-4">Date Calculation</h2>
            {content}
            <p className="text-center text-xs text-muted-foreground mt-6">Sutradhaar | Made by Aman Yadav</p>
        </div>
    );
});
ResultImage.displayName = "ResultImage";

function ExportControls({ hasResult, getResultString, componentData }: ExportControlsProps) {
    const { toast } = useToast();
    const { t } = useLanguage();
    const imageRef = React.useRef<HTMLDivElement>(null);
    const [isExportLocked, setIsExportLocked] = React.useState(true);
    const [showPremiumLockDialog, setShowPremiumLockDialog] = React.useState(false);
    const router = useRouter();


    React.useEffect(() => {
        const userEmail = localStorage.getItem("userProfile") ? JSON.parse(localStorage.getItem("userProfile")!).email : null;
        if (userEmail) {
            // In a real app, you would check premium status
            // For now, we assume only the developer is premium
            setIsExportLocked(userEmail !== "amanyadavyadav9458@gmail.com");
        }
    }, []);

    const handleCopy = () => {
        if (!hasResult) {
            toast({ title: "Nothing to copy", description: "Please calculate a result first.", variant: "destructive" });
            return;
        }
        navigator.clipboard.writeText(getResultString());
        toast({ title: "Copied to clipboard!" });
    };

    const handleExport = async (type: 'png' | 'pdf' | 'txt') => {
        if (isExportLocked) {
            setShowPremiumLockDialog(true);
            return;
        }

        if (!hasResult) {
            toast({ title: "Nothing to export", description: "Please calculate a result first.", variant: "destructive" });
            return;
        }
        
        if (type === 'txt') {
            const text = getResultString();
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'date-calculation.txt';
            a.click();
            URL.revokeObjectURL(url);
            toast({ title: "Exported as TXT!" });
            return;
        }
        
        if (!imageRef.current) return;

        try {
            const canvas = await html2canvas(imageRef.current, { scale: 2, backgroundColor: null, useCORS: true });
            if (type === 'png') {
                const imgData = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                a.href = imgData;
                a.download = 'date-calculation.png';
                a.click();
            } else if (type === 'pdf') {
                const pdf = new jsPDF({
                    orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
                    unit: 'px',
                    format: [canvas.width, canvas.height]
                });
                pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
                pdf.save('date-calculation.pdf');
            }
             toast({ title: `Exported as ${type.toUpperCase()}!` });
        } catch (error) {
            console.error(`Error exporting as ${type}:`, error);
            toast({ title: `Could not export as ${type.toUpperCase()}`, variant: "destructive" });
        }
    };
    
     return (
        <>
            <div className="absolute -left-[9999px] -top-[9999px]">
                {hasResult && <ResultImage ref={imageRef} data={componentData} t={t} />}
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="outline" size="icon" onClick={handleCopy}><Copy className="h-4 w-4"/></Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon"><Share2 className="h-4 w-4"/></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onSelect={() => handleExport('png')}>
                            <ImageIcon className="mr-2 h-4 w-4" /> Export as PNG
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleExport('txt')}>
                            <FileText className="mr-2 h-4 w-4" /> Export as TXT
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleExport('pdf')}>
                            <Download className="mr-2 h-4 w-4" /> Export as PDF
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <AlertDialog open={showPremiumLockDialog} onOpenChange={setShowPremiumLockDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Premium Feature Locked</AlertDialogTitle>
                        <AlertDialogDescription>
                            Exporting calculations is a premium feature. Please upgrade to unlock.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => router.push('/premium')}>Go Premium</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
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
