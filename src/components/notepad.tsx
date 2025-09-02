
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, Plus, Edit, Trash2, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from 'date-fns';

export interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export const NOTES_STORAGE_KEY = 'userNotesV2';

export function Notepad() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [isClient, setIsClient] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setIsClient(true);
        const savedNotes = localStorage.getItem(NOTES_STORAGE_KEY);
        if (savedNotes) {
            setNotes(JSON.parse(savedNotes));
        }
    }, []);

    const handleDelete = (noteId: string) => {
        const updatedNotes = notes.filter(note => note.id !== noteId);
        setNotes(updatedNotes);
        localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes));
    };

    if (!isClient) {
        // Optional: render a skeleton loader
        return (
             <div className="w-full max-w-md mx-auto flex flex-col gap-4 text-white">
                <header className="flex items-center justify-between">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/">
                            <Home />
                        </Link>
                    </Button>
                    <h1 className="text-xl font-bold">My Notes</h1>
                    <div className="w-10"></div>
                </header>
                <div className="text-center p-8 text-muted-foreground">Loading notes...</div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-md mx-auto flex flex-col gap-4 text-white pb-24">
            <header className="flex items-center justify-between">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/">
                        <Home />
                    </Link>
                </Button>
                <h1 className="text-xl font-bold">My Notes</h1>
                <div className="w-10"></div>
            </header>

            {notes.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map(note => (
                        <Card key={note.id} className="bg-card hover:bg-secondary cursor-pointer" onClick={() => router.push(`/notes/edit/${note.id}`)}>
                            <CardHeader>
                                <CardTitle className="truncate">{note.title || 'Untitled Note'}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground line-clamp-3">
                                    {note.content || 'No content'}
                                </p>
                            </CardContent>
                            <CardFooter className="flex justify-between items-center text-xs text-muted-foreground">
                                <span>{`Updated: ${format(new Date(note.updatedAt), "MMM d, yyyy")}`}</span>
                                <div className="flex gap-2 items-center">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); router.push(`/notes/edit/${note.id}`); }}>
                                        <Edit size={16} />
                                    </Button>
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                                <Trash2 size={16} />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Note?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the note.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={(e) => { e.stopPropagation(); handleDelete(note.id) }}>
                                            Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center p-8 bg-card rounded-xl text-muted-foreground flex flex-col items-center gap-4 mt-16">
                     <StickyNote size={48} />
                     <h2 className="text-xl font-semibold">No Notes Yet</h2>
                     <p>Click the plus button to create your first note.</p>
                </div>
            )}
            
            <Link href="/notes/edit/new" passHref>
                <Button className="fixed bottom-8 right-1/2 translate-x-1/2 sm:right-8 sm:translate-x-0 w-16 h-16 rounded-full bg-accent text-accent-foreground shadow-lg hover:bg-accent/90">
                    <Plus size={32} />
                </Button>
            </Link>
        </div>
    );
}
