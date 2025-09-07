

"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Palette, Sigma, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme, type CustomTheme } from '@/context/theme-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/language-context';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Card, CardHeader, CardContent, CardTitle } from './ui/card';
import { Label } from './ui/label';

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

const ThemePreview = ({ themeColors }: { themeColors: CustomTheme['colors'] }) => {
    const previewStyle: React.CSSProperties = {
        '--background': themeColors.background ? hexToHsl(themeColors.background) : undefined,
        '--foreground': themeColors.foreground ? hexToHsl(themeColors.foreground) : undefined,
        '--card': themeColors.card ? hexToHsl(themeColors.card) : undefined,
        '--card-foreground': themeColors.cardForeground ? hexToHsl(themeColors.cardForeground) : undefined,
        '--primary': themeColors.primary ? hexToHsl(themeColors.primary) : undefined,
        '--primary-foreground': themeColors.primaryForeground ? hexToHsl(themeColors.primaryForeground) : undefined,
        '--secondary': themeColors.secondary ? hexToHsl(themeColors.secondary) : undefined,
        '--secondary-foreground': themeColors.secondaryForeground ? hexToHsl(themeColors.secondaryForeground) : undefined,
        '--accent': themeColors.accent ? hexToHsl(themeColors.accent) : undefined,
        '--accent-foreground': themeColors.accentForeground ? hexToHsl(themeColors.accentForeground) : undefined,
        '--border': themeColors.border ? hexToHsl(themeColors.border) : undefined,
        '--input': themeColors.input ? hexToHsl(themeColors.input) : undefined,
        '--ring': themeColors.ring ? hexToHsl(themeColors.ring) : undefined,
    } as React.CSSProperties;

    return (
        <div style={previewStyle} className="w-full h-full bg-background text-foreground font-sans">
             <div className="p-4 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="p-1 bg-primary/10 rounded-lg text-primary"><Sigma size={16} /></div>
                        <h1 className="text-md font-bold">Converter</h1>
                    </div>
                    <Avatar className="h-6 w-6">
                        <AvatarFallback><User size={12}/></AvatarFallback>
                    </Avatar>
                </div>
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-full rounded-md border border-input bg-background flex items-center px-2 text-sm">10</div>
                    </div>
                    <div className="text-center text-xl font-bold text-primary">6.2137</div>
                    <Button size="sm">Convert</Button>
                    <Button size="sm" variant="secondary">History</Button>
                </div>
            </div>
        </div>
    );
};

// Helper to convert hex to HSL string for CSS variables
function hexToHsl(hex: string): string {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h} ${s}% ${l}%`;
}


export function ThemeEditor() {
    const { customTheme, setCustomTheme, resetCustomTheme, theme, setTheme } = useTheme();
    const [localTheme, setLocalTheme] = useState<CustomTheme['colors']>({});
    const { toast } = useToast();
    const router = useRouter();
    const { t } = useLanguage();

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
        toast({ title: t('themeEditor.toast.reset.title'), description: t('themeEditor.toast.reset.description') });
    };

    return (
        <div className="w-full max-w-md mx-auto flex flex-col gap-6 p-4 sm:p-6 h-screen">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft />
                    </Button>
                    <h1 className="text-xl font-bold">{t('themeEditor.title')}</h1>
                </div>
                <Button variant="ghost" size="icon" onClick={handleReset}>
                    <RefreshCw />
                </Button>
            </header>

            <div className="bg-card p-4 rounded-xl">
                <Label className="text-sm font-medium mb-2 block text-center">{t('themeEditor.preview')}</Label>
                <div className="mx-auto w-[200px] h-[400px] bg-gray-800 rounded-[20px] p-2 border-4 border-gray-900 shadow-xl overflow-hidden">
                    <div className="w-full h-full rounded-[12px] overflow-hidden">
                        <ThemePreview themeColors={localTheme} />
                    </div>
                </div>
            </div>


            <ScrollArea className="flex-grow">
                <div className="flex flex-col gap-4">
                    <div className="bg-card p-4 rounded-xl">
                        <div className="flex items-center gap-3 mb-4">
                           <Palette className="text-primary"/>
                           <h2 className="text-lg font-bold">{t('themeEditor.customizeColors')}</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {themeProperties.map(({ id, name }) => (
                                <div key={id} className="flex items-center justify-between">
                                    <label htmlFor={id} className="font-medium capitalize">{t(`themeEditor.properties.${name.toLowerCase().replace(/\s/g, '')}`)}</label>
                                    <div className="flex items-center gap-2 border border-input rounded-md p-1">
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
