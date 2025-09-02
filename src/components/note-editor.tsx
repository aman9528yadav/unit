
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, Save, Star, Trash2, Bold, Italic, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Note, NOTES_STORAGE_KEY } from './notepad';


export function NoteEditor({ noteId }: { noteId: string }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('');
    const [isFavorite, setIsFavorite] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const router = useRouter();
    const { toast } = useToast();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const isNewNote = noteId === 'new';

    useEffect(() => {
        setIsClient(true);
        if (!isNewNote) {
            const savedNotes = localStorage.getItem(NOTES_STORAGE_KEY);
            if (savedNotes) {
                const notes: Note[] = JSON.parse(savedNotes);
                const noteToEdit = notes.find(note => note.id === noteId);
                if (noteToEdit) {
                    setTitle(noteToEdit.title);
                    setContent(noteToEdit.content);
                    setIsFavorite(noteToEdit.isFavorite || false);
                    setCategory(noteToEdit.category || '');
                } else {
                    // Note not found, redirect
                    toast({ title: "Note not found", variant: "destructive" });
                    router.push('/notes');
                }
            }
        }
    }, [noteId, isNewNote, router, toast]);

    const handleSave = () => {
        if (!title.trim() && !content.trim()) {
            toast({
                title: "Cannot save empty note",
                description: "Please add a title or some content.",
                variant: "destructive"
            });
            return;
        }

        const savedNotes = localStorage.getItem(NOTES_STORAGE_KEY);
        const notes: Note[] = savedNotes ? JSON.parse(savedNotes) : [];
        const now = new Date().toISOString();

        if (isNewNote) {
            const newNote: Note = {
                id: uuidv4(),
                title,
                content,
                isFavorite,
                category,
                createdAt: now,
                updatedAt: now,
                deletedAt: null
            };
            notes.push(newNote);
        } else {
            const noteIndex = notes.findIndex(note => note.id === noteId);
            if (noteIndex > -1) {
                notes[noteIndex] = {
                    ...notes[noteIndex],
                    title,
                    content,
                    isFavorite,
                    category,
                    updatedAt: now,
                };
            }
        }

        localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
        toast({
            title: "Note Saved!",
            description: "Your note has been saved successfully.",
        });
        router.push('/notes');
    };
    
    const handleSoftDelete = () => {
        if (isNewNote) return;
        const savedNotes = localStorage.getItem(NOTES_STORAGE_KEY);
        const notes: Note[] = savedNotes ? JSON.parse(savedNotes) : [];
        const updatedNotes = notes.map(note => 
            note.id === noteId ? { ...note, deletedAt: new Date().toISOString() } : note
        );
        localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes));
        toast({ title: "Note moved to Recycle Bin." });
        router.push('/notes');
    };

    const applyFormat = (formatType: 'bold' | 'italic' | 'list') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);
        const beforeText = content.substring(0, start);
        const afterText = content.substring(end);

        let newContent = '';
        let newCursorPosStart = 0;
        let newCursorPosEnd = 0;

        const formatters = {
            bold: { wrapper: '**', placeholder: 'bold text' },
            italic: { wrapper: '*', placeholder: 'italic text' },
            list: { wrapper: '- ', placeholder: 'List item' },
        };
        
        const { wrapper, placeholder } = formatters[formatType];

        if (formatType === 'list') {
            const replacement = `${wrapper}${selectedText || placeholder}`;
            const prefix = (start === 0 || content[start - 1] === '\n') ? '' : '\n';
            newContent = `${beforeText}${prefix}${replacement}${afterText}`;
            
            newCursorPosStart = start + prefix.length + wrapper.length;
            newCursorPosEnd = newCursorPosStart + (selectedText.length || placeholder.length);

        } else {
             const replacement = `${wrapper}${selectedText || placeholder}${wrapper}`;
             newContent = `${beforeText}${replacement}${afterText}`;
             
             newCursorPosStart = start + wrapper.length;
             newCursorPosEnd = newCursorPosStart + (selectedText.length || placeholder.length);
        }

        setContent(newContent);

        // Focus and set cursor position after state update
        setTimeout(() => {
            textarea.focus();
            if (selectedText) {
                // If text was selected, just place the cursor after the formatted text
                 const finalCursorPos = end + (newContent.length - content.length);
                 textarea.setSelectionRange(finalCursorPos, finalCursorPos);
            } else {
                // If no text was selected, select the placeholder text
                 textarea.setSelectionRange(newCursorPosStart, newCursorPosEnd);
            }
        }, 0);
    };

    if (!isClient) {
        return null; // Or a loading skeleton
    }

    return (
        <div className="w-full max-w-md mx-auto flex flex-col gap-4">
            <header className="flex items-center justify-between">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/notes">
                        <ArrowLeft />
                    </Link>
                </Button>
                <div className="flex items-center gap-2">
                    {!isNewNote && (
                         <Button variant="ghost" size="icon" onClick={() => setIsFavorite(!isFavorite)}>
                            <Star className={isFavorite ? 'text-yellow-400 fill-yellow-400' : ''}/>
                        </Button>
                    )}
                     {!isNewNote && (
                        <Button variant="ghost" size="icon" onClick={handleSoftDelete}>
                            <Trash2 />
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={handleSave}>
                        <Save />
                    </Button>
                </div>
            </header>
            <div className="bg-card p-4 rounded-xl flex-grow flex flex-col gap-4">
                <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Note title..."
                    className="w-full bg-background border-none text-lg font-bold focus-visible:ring-0"
                />
                 <Input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Category (e.g., Work, Personal)..."
                    className="w-full bg-background border-none text-sm focus-visible:ring-0"
                />
                <div className="flex items-center gap-2 border-b border-border pb-2">
                    <Button variant="ghost" size="icon" onClick={() => applyFormat('bold')}><Bold /></Button>
                    <Button variant="ghost" size="icon" onClick={() => applyFormat('italic')}><Italic /></Button>
                    <Button variant="ghost" size="icon" onClick={() => applyFormat('list')}><List /></Button>
                </div>
                <Textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Start typing your note here..."
                    className="w-full h-full min-h-[50vh] bg-transparent border-none resize-none focus-visible:ring-0 text-base"
                />
            </div>
        </div>
    );
}
