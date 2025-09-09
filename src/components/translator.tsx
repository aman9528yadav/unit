
"use client";

import { useState, useTransition, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowRightLeft, Loader2, Languages, Copy } from 'lucide-react';
import { translateText, TranslateTextOutput } from '@/ai/flows/translate-text-flow';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';

const languages = [
    { value: 'English', label: 'English' },
    { value: 'Spanish', label: 'Spanish' },
    { value: 'French', label: 'French' },
    { value: 'German', label: 'German' },
    { value: 'Hindi', label: 'Hindi' },
    { value: 'Bengali', label: 'Bengali' },
    { value: 'Tamil', label: 'Tamil' },
    { value: 'Telugu', label: 'Telugu' },
    { value: 'Marathi', label: 'Marathi' },
    { value: 'Japanese', label: 'Japanese' },
    { value: 'Chinese (Simplified)', label: 'Chinese (Simplified)' },
    { value: 'Russian', label: 'Russian' },
    { value: 'Arabic', label: 'Arabic' },
];

export function Translator() {
    const [inputText, setInputText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [targetLanguage, setTargetLanguage] = useState('Hindi');
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    useEffect(() => {
        const queryToTranslate = localStorage.getItem('translateQuery');
        if (queryToTranslate) {
            setInputText(queryToTranslate);
            localStorage.removeItem('translateQuery');
        }
    }, []);

    const handleTranslate = () => {
        if (!inputText.trim()) {
            toast({
                title: "Input required",
                description: "Please enter some text to translate.",
                variant: "destructive"
            });
            return;
        }

        startTransition(async () => {
            try {
                const result = await translateText({ text: inputText, targetLanguage });
                setTranslatedText(result.translatedText);
            } catch (error) {
                console.error("Translation failed:", error);
                toast({
                    title: "Translation Error",
                    description: "Could not translate the text. Please try again later.",
                    variant: "destructive"
                });
            }
        });
    };
    
    const handleSwap = () => {
        if (!translatedText) return;
        setInputText(translatedText);
        setTranslatedText('');
    }
    
    const handleCopyToClipboard = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied to clipboard!",
            description: `"${text.substring(0, 20)}..." has been copied.`,
        });
    };


    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Languages className="text-primary"/>
                    AI Translator
                </CardTitle>
                <CardDescription>Translate text into different languages using AI.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <Textarea 
                        placeholder="Enter text to translate..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="min-h-[150px] text-base"
                    />
                    <div className="relative">
                         <Textarea 
                            placeholder="Translation will appear here..."
                            value={translatedText}
                            readOnly
                            className="min-h-[150px] bg-secondary text-base pr-12"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => handleCopyToClipboard(translatedText)}
                            disabled={!translatedText}
                        >
                            <Copy className="w-5 h-5"/>
                        </Button>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                            <ScrollArea className="h-72">
                                {languages.map(lang => (
                                    <SelectItem key={lang.value} value={lang.value}>
                                        {lang.label}
                                    </SelectItem>
                                ))}
                            </ScrollArea>
                        </SelectContent>
                    </Select>
                    
                    <Button onClick={handleSwap} variant="outline" size="icon" className="flex-shrink-0" disabled={!translatedText}>
                        <ArrowRightLeft className="w-5 h-5"/>
                    </Button>

                    <Button onClick={handleTranslate} disabled={isPending} className="w-full sm:w-auto">
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Translate
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
