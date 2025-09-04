
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

function PomodoroTimer() {
    const [minutes, setMinutes] = React.useState(25);
    const [seconds, setSeconds] = React.useState(0);
    const [isActive, setIsActive] = React.useState(false);
    const [mode, setMode] = React.useState<'work' | 'shortBreak' | 'longBreak'>('work');
    const [pomodoros, setPomodoros] = React.useState(0);
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

    // Default settings
    const [settings, setSettings] = React.useState({
        pomodoroLength: 25,
        shortBreakLength: 5,
        longBreakLength: 15,
        pomodorosUntilLongBreak: 4,
    });

    const audioRef = React.useRef<HTMLAudioElement>(null);

     React.useEffect(() => {
        // Load settings from localStorage
        const savedSettings = localStorage.getItem('pomodoroSettings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
    }, []);

    React.useEffect(() => {
        // Initialize timer values from settings
        reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings]);

    React.useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isActive) {
            interval = setInterval(() => {
                if (seconds > 0) {
                    setSeconds(s => s - 1);
                } else if (minutes > 0) {
                    setMinutes(m => m - 1);
                    setSeconds(59);
                } else {
                    // Timer ended
                    if (audioRef.current) {
                      audioRef.current.play().catch(e => console.error("Error playing sound:", e));
                    }
                    
                    let newMode: typeof mode;
                    if (mode === 'work') {
                        const newPomodoroCount = pomodoros + 1;
                        setPomodoros(newPomodoroCount);
                        newMode = newPomodoroCount % settings.pomodorosUntilLongBreak === 0 ? 'longBreak' : 'shortBreak';
                    } else {
                        newMode = 'work';
                    }
                    switchMode(newMode);
                }
            }, 1000);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isActive, seconds, minutes, mode, pomodoros, settings]);

    const toggle = () => {
        setIsActive(!isActive);
    };

    const reset = () => {
        setIsActive(false);
        switch (mode) {
            case 'work':
                setMinutes(settings.pomodoroLength);
                break;
            case 'shortBreak':
                setMinutes(settings.shortBreakLength);
                break;
            case 'longBreak':
                setMinutes(settings.longBreakLength);
                break;
        }
        setSeconds(0);
    };

    const switchMode = (newMode: typeof mode, userInitiated = false) => {
        setIsActive(false);
        setMode(newMode);
        if (userInitiated) {
             setPomodoros(0); // Reset cycle count if mode is manually changed
        }
    };
    
    React.useEffect(() => {
        reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode]);

    const handleSettingsSave = (newSettings: typeof settings) => {
        setSettings(newSettings);
        localStorage.setItem('pomodoroSettings', JSON.stringify(newSettings));
        setIsSettingsOpen(false);
        switchMode(mode); // Reset timer with new settings
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
        if (!isNaN(numValue)) {
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
    const timerRef = React.useRef<NodeJS.Timeout | null>(null);

    const startStop = () => {
        if (isRunning) {
            if (timerRef.current) clearInterval(timerRef.current);
        } else {
            const startTime = Date.now() - time;
            timerRef.current = setInterval(() => {
                setTime(Date.now() - startTime);
            }, 10);
        }
        setIsRunning(!isRunning);
    };

    const reset = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsRunning(false);
        setTime(0);
        setLaps([]);
    };

    const lap = () => {
        setLaps(prevLaps => [...prevLaps, time]);
    };

    const clearLaps = () => {
        setLaps([]);
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
