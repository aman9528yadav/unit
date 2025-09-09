
"use client";

import { useState, useTransition, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowRightLeft, Loader2, Languages, Copy, Lightbulb, BookOpen, MessageSquareQuote, Check } from 'lucide-react';
import { translateText, TranslateTextOutput } from '@/ai/flows/translate-text-flow';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

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
    const [translationResult, setTranslationResult] = useState<TranslateTextOutput | null>(null);
    const [sourceLanguage, setSourceLanguage] = useState('English');
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
                const result = await translateText({ text: inputText, sourceLanguage, targetLanguage });
                setTranslationResult(result);
            } catch (error) {
                console.error("Translation failed:", error);
                setTranslationResult(null);
                toast({
                    title: "Translation Error",
                    description: "Could not translate the text. Please try again later.",
                    variant: "destructive"
                });
            }
        });
    };
    
    const handleSwap = () => {
        const currentInput = inputText;
        const currentSource = sourceLanguage;
        
        setSourceLanguage(targetLanguage);
        setTargetLanguage(currentSource);

        setInputText(translationResult?.translatedText || '');
        setTranslationResult(null);
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
                <div className="space-y-4">
                     <Textarea 
                        placeholder="Enter text to translate..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="min-h-[150px] text-base"
                    />
                    <div className="relative">
                         <Textarea 
                            placeholder="Translation will appear here..."
                            value={translationResult?.translatedText || ''}
                            readOnly
                            className="min-h-[150px] bg-secondary text-base pr-12"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => handleCopyToClipboard(translationResult?.translatedText || '')}
                            disabled={!translationResult?.translatedText}
                        >
                            <Copy className="w-5 h-5"/>
                        </Button>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                        <SelectTrigger className="w-full sm:w-auto flex-1">
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
                    
                    <Button onClick={handleSwap} variant="outline" size="icon" className="flex-shrink-0" disabled={isPending}>
                        <ArrowRightLeft className="w-5 h-5"/>
                    </Button>
                    
                    <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                        <SelectTrigger className="w-full sm:w-auto flex-1">
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
                </div>

                <Button onClick={handleTranslate} disabled={isPending} className="w-full">
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Translate
                </Button>

                {translationResult && (
                    <div className="space-y-4">
                         {translationResult.correctedSourceText && translationResult.correctedSourceText.toLowerCase() !== inputText.toLowerCase() && (
                             <div className="p-4 bg-secondary rounded-lg">
                                <h3 className="font-semibold flex items-center gap-2 mb-2"><Check className="w-5 h-5 text-primary"/> Corrected Original</h3>
                                <p className="text-sm text-muted-foreground italic">"{translationResult.correctedSourceText}"</p>
                            </div>
                        )}
                        <Separator />
                        {translationResult.regionalTranslation && (
                             <div className="p-4 bg-secondary rounded-lg">
                                <h3 className="font-semibold flex items-center gap-2 mb-2"><MessageSquareQuote className="w-5 h-5 text-primary"/> Regional Translation (UP/Bihar)</h3>
                                <p className="text-sm font-semibold text-foreground">{translationResult.regionalTranslation}</p>
                            </div>
                        )}
                        {translationResult.suggestions && translationResult.suggestions.length > 0 && (
                            <div className="p-4 bg-secondary rounded-lg">
                                <h3 className="font-semibold flex items-center gap-2 mb-2"><Lightbulb className="w-5 h-5 text-primary"/> Suggestions</h3>
                                <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
                                    {translationResult.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                        )}
                        <Separator />
                        {translationResult.examples && translationResult.examples.length > 0 && (
                             <div className="p-4 bg-secondary rounded-lg">
                                <h3 className="font-semibold flex items-center gap-2 mb-2"><BookOpen className="w-5 h-5 text-primary"/> Examples</h3>
                                <div className="space-y-3 text-sm">
                                    {translationResult.examples.map((ex, i) => (
                                        <div key={i}>
                                            <p className="font-medium text-foreground">"{ex.original}"</p>
                                            <p className="text-muted-foreground">→ "{ex.translated}"</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
