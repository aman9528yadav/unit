
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const NOTE_STORAGE_KEY = 'userNotes';

export function Notepad() {
    const [notes, setNotes] = useState('');
    const [isClient, setIsClient] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        setIsClient(true);
        const savedNotes = localStorage.getItem(NOTE_STORAGE_KEY);
        if (savedNotes) {
            setNotes(savedNotes);
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem(NOTE_STORAGE_KEY, notes);
        toast({
            title: "Note Saved!",
            description: "Your notes have been saved successfully.",
        });
    };

    if (!isClient) {
        return null; // or a loading skeleton
    }

    return (
        <div className="w-full max-w-md mx-auto flex flex-col gap-4 text-white">
            <header className="flex items-center justify-between">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/">
                        <Home />
                    </Link>
                </Button>
                <h1 className="text-xl font-bold">My Notes</h1>
                <Button variant="ghost" size="icon" onClick={handleSave}>
                    <Save />
                </Button>
            </header>
            <div className="bg-card p-4 rounded-xl flex-grow">
                <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Start typing your notes here..."
                    className="w-full h-full min-h-[60vh] bg-background border-none resize-none focus-visible:ring-0 text-base"
                />
            </div>
        </div>
    );
}
