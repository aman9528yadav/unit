
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
import { format, differenceInDays, differenceInWeeks, differenceInMonths } from 'date-fns';
import { Home, Play, Pause, RotateCcw, Flag, CalendarIcon, ArrowRight, Hourglass } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";


function PomodoroTimer() {
    const [minutes, setMinutes] = React.useState(25);
    const [seconds, setSeconds] = React.useState(0);
    const [isActive, setIsActive] = React.useState(false);
    const [mode, setMode] = React.useState<'work' | 'break'>('work');
    const [pomodoroLength, setPomodoroLength] = React.useState(25);
    const [breakLength, setBreakLength] = React.useState(5);

    React.useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isActive) {
            interval = setInterval(() => {
                if (seconds > 0) {
                    setSeconds(seconds - 1);
                } else if (minutes > 0) {
                    setMinutes(minutes - 1);
                    setSeconds(59);
                } else {
                    // Timer ended
                    setIsActive(false);
                    const newMode = mode === 'work' ? 'break' : 'work';
                    setMode(newMode);
                    setMinutes(newMode === 'work' ? pomodoroLength : breakLength);
                    setSeconds(0);
                    new Audio('/alarm.mp3').play().catch(e => console.error("Error playing sound:", e));
                }
            }, 1000);
        } else if (!isActive && seconds !== 0) {
            if(interval) clearInterval(interval);
        } else if (!isActive && minutes !== (mode === 'work' ? pomodoroLength : breakLength)) {
            // handles reset when paused
             setMinutes(mode === 'work' ? pomodoroLength : breakLength);
             setSeconds(0);
        }
        return () => { if(interval) clearInterval(interval) };
    }, [isActive, seconds, minutes, mode, pomodoroLength, breakLength]);

    const toggle = () => {
        setIsActive(!isActive);
    };

    const reset = () => {
        setIsActive(false);
        setMinutes(mode === 'work' ? pomodoroLength : breakLength);
        setSeconds(0);
    };

    const switchMode = (newMode: 'work' | 'break') => {
        setIsActive(false);
        setMode(newMode);
        setMinutes(newMode === 'work' ? pomodoroLength : breakLength);
        setSeconds(0);
    }
    
    const handleTimeChange = (value: string) => {
        const newLength = parseInt(value, 10);
        if (mode === 'work') {
            setPomodoroLength(newLength);
            if (!isActive) setMinutes(newLength);
        } else {
            setBreakLength(newLength);
            if (!isActive) setMinutes(newLength);
        }
    };


    return (
        <Card className="w-full text-center">
            <CardHeader>
                <div className="flex justify-center gap-2 mb-4">
                    <Button variant={mode === 'work' ? 'secondary' : 'ghost'} onClick={() => switchMode('work')}>Pomodoro</Button>
                    <Button variant={mode === 'break' ? 'secondary' : 'ghost'} onClick={() => switchMode('break')}>Short Break</Button>
                </div>
                <div className="text-7xl font-bold tracking-tighter">
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </div>
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
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground">Duration:</label>
                     <Select value={String(mode === 'work' ? pomodoroLength : breakLength)} onValueChange={handleTimeChange}>
                        <SelectTrigger className="w-[100px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[5, 10, 15, 20, 25, 30, 45, 60].map(time => (
                                <SelectItem key={time} value={String(time)}>{time} min</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
    );
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
            </CardContent>
        </Card>
    );
}

function DateDifference() {
    const [startDate, setStartDate] = React.useState<Date | undefined>(new Date());
    const [endDate, setEndDate] = React.useState<Date | undefined>(new Date());
    const [difference, setDifference] = React.useState({ days: 0, weeks: 0, months: 0 });

    React.useEffect(() => {
        if (startDate && endDate) {
            if (endDate < startDate) {
                setDifference({ days: 0, weeks: 0, months: 0 });
                return;
            }
            setDifference({
                days: differenceInDays(endDate, startDate),
                weeks: differenceInWeeks(endDate, startDate),
                months: differenceInMonths(endDate, startDate)
            });
        }
    }, [startDate, endDate]);

    return (
        <Card className="w-full">
             <CardHeader>
                <CardTitle className="text-center">Calculate Date Difference</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Start Date</label>
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
                    <ArrowRight className="hidden md:block mx-auto text-muted-foreground" />
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">End Date</label>
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
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-3xl font-bold">{difference.days}</p>
                            <p className="text-sm text-muted-foreground">Days</p>
                        </div>
                         <div>
                            <p className="text-3xl font-bold">{difference.weeks}</p>
                            <p className="text-sm text-muted-foreground">Weeks</p>
                        </div>
                         <div>
                            <p className="text-3xl font-bold">{difference.months}</p>
                            <p className="text-sm text-muted-foreground">Months</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}


export function TimeUtilities() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = React.useState("timer");

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4">
        <header className="flex items-center justify-between">
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
                <DateDifference />
            </TabsContent>
        </Tabs>
    </div>
  );
}
