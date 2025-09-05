
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme, type CustomTheme } from '@/context/theme-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const themeProperties: { id: keyof CustomTheme['colors'], name: string }[] = [
    { id: 'background', name: 'Background' },
    { id: 'foreground', name: 'Foreground' },
    { id: 'primary', name: 'Primary' },
    { id: 'primaryForeground', name: 'Primary Foreground' },
    { id: 'secondary', name: 'Secondary' },
    { id: 'secondaryForeground', name: 'Secondary Foreground' },
    { id: 'accent', name: 'Accent' },
    { id: 'accentForeground', name: 'Accent Foreground' },
    { id: 'card', name: 'Card' },
    { id: 'cardForeground', name: 'Card Foreground' },
    { id: 'border', name: 'Border' },
    { id: 'input', name: 'Input' },
    { id: 'ring', name: 'Ring' },
];


export function ThemeEditor() {
    const { customTheme, setCustomTheme, resetCustomTheme, theme, setTheme } = useTheme();
    const [localTheme, setLocalTheme] = useState<CustomTheme['colors']>({});
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        setLocalTheme(customTheme?.colors || {});
    }, [customTheme]);

    const handleColorChange = (prop: keyof CustomTheme['colors'], value: string) => {
        const updatedColors = { ...localTheme, [prop]: value };
        setLocalTheme(updatedColors);
        setCustomTheme({ name: 'custom', colors: updatedColors });
    };

    const handleReset = () => {
        resetCustomTheme();
        toast({ title: 'Theme Reset', description: 'Custom colors have been reset to default.' });
    };

    return (
        <div className="w-full max-w-md mx-auto flex flex-col gap-6 p-4 sm:p-6 h-screen">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft />
                    </Button>
                    <h1 className="text-xl font-bold">Theme Editor</h1>
                </div>
                <Button variant="ghost" size="icon" onClick={handleReset}>
                    <RefreshCw />
                </Button>
            </header>

            <ScrollArea className="flex-grow">
                <div className="flex flex-col gap-4">
                    <div className="bg-card p-4 rounded-xl">
                        <div className="flex items-center gap-3 mb-4">
                           <Palette className="text-primary"/>
                           <h2 className="text-lg font-bold">Customize Colors</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {themeProperties.map(({ id, name }) => (
                                <div key={id} className="flex items-center justify-between">
                                    <label htmlFor={id} className="font-medium capitalize">{name}</label>
                                    <div className="flex items-center gap-2 border border-border rounded-md p-1">
                                        <input
                                            type="color"
                                            id={id}
                                            value={localTheme[id] || '#000000'}
                                            onChange={(e) => handleColorChange(id, e.target.value)}
                                            className="w-8 h-8 border-none cursor-pointer bg-transparent"
                                        />
                                        <span className="text-sm text-muted-foreground uppercase">{localTheme[id]}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
