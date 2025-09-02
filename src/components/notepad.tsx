
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, Search, MoreVertical, ArrowDown, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


export interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt:string;
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
             <div className="w-full max-w-md mx-auto flex flex-col gap-4 text-white p-4">
                <header className="flex items-center justify-between">
                   <div className="w-10"></div>
                    <h1 className="text-xl font-bold">All notes</h1>
                    <div className="w-10"></div>
                </header>
                <div className="text-center p-8 text-muted-foreground">Loading notes...</div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-md mx-auto flex flex-col gap-4 text-white pb-24 h-screen">
            <header className="flex items-center justify-between p-4">
                <Button variant="ghost" size="icon">
                    <Menu />
                </Button>
                <div className='text-center'>
                    <h1 className="text-2xl font-bold">All notes</h1>
                    <p className="text-sm text-muted-foreground">{notes.length} notes</p>
                </div>
                <div className="flex items-center">
                    <Button variant="ghost" size="icon">
                        <Search />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Share</DropdownMenuItem>
                            <DropdownMenuItem>View as</DropdownMenuItem>
                            <DropdownMenuItem>Sort</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>
            
            <div className="px-4 flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Date modified</span>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ArrowDown size={16} />
                </Button>
            </div>

            <div className="flex-grow overflow-y-auto px-4">
                {notes.length > 0 ? (
                    <ul className="divide-y divide-border">
                        {notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map(note => (
                            <li key={note.id} className="py-4" onClick={() => router.push(`/notes/edit/${note.id}`)}>
                                <h2 className="font-semibold truncate">{note.title || 'Untitled Note'}</h2>
                                <p className="text-sm text-muted-foreground truncate">{note.content ? `${format(new Date(note.updatedAt), "d MMM")}   ${note.content}`: format(new Date(note.updatedAt), "d MMM")}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center p-8 text-muted-foreground flex flex-col items-center gap-4 mt-16">
                         <h2 className="text-xl font-semibold">No Notes Yet</h2>
                         <p>Click the button to create your first note.</p>
                    </div>
                )}
            </div>
            
            <Link href="/notes/edit/new" passHref>
                <Button className="fixed bottom-8 right-1/2 translate-x-1/2 sm:right-8 sm:translate-x-0 w-16 h-16 rounded-full bg-accent text-accent-foreground shadow-lg hover:bg-accent/90">
                    <Edit size={24} />
                </Button>
            </Link>
        </div>
    );
}
