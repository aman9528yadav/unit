
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, Save, Star, Trash2, Bold, Italic, List, Underline, Strikethrough, Link2, ListOrdered, ListTodo, Code2, Paperclip, Smile, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Note, NOTES_STORAGE_KEY } from './notepad';
import Image from 'next/image';


export function NoteEditor({ noteId }: { noteId: string }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('');
    const [isFavorite, setIsFavorite] = useState(false);
    const [attachment, setAttachment] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);
    const router = useRouter();
    const { toast } = useToast();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                    setAttachment(noteToEdit.attachment || null);
                } else {
                    // Note not found, redirect
                    toast({ title: "Note not found", variant: "destructive" });
                    router.push('/notes');
                }
            }
        }
    }, [noteId, isNewNote, router, toast]);
    
    const handleFormat = (formatType: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'link' | 'list' | 'list-ordered') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);
        
        let formattedText = '';
        let prefix = '';
        let suffix = '';

        switch (formatType) {
            case 'bold':
                prefix = '**';
                suffix = '**';
                break;
            case 'italic':
                prefix = '*';
                suffix = '*';
                break;
            case 'underline':
                 // No standard markdown for underline, using a placeholder
                prefix = '__'; 
                suffix = '__';
                break;
            case 'strikethrough':
                prefix = '~~';
                suffix = '~~';
                break;
            case 'link':
                prefix = '[';
                suffix = '](url)';
                break;
            case 'list':
                prefix = '- ';
                break;
            case 'list-ordered':
                prefix = '1. ';
                break;
        }

        if (formatType === 'list' || formatType === 'list-ordered') {
            const currentLineStart = content.lastIndexOf('\n', start - 1) + 1;
            const newContent = `${content.substring(0, currentLineStart)}${prefix}${content.substring(currentLineStart)}`;
            setContent(newContent);
            textarea.focus();
            setTimeout(() => textarea.setSelectionRange(currentLineStart + prefix.length, currentLineStart + prefix.length), 0);
        } else {
            const textToInsert = selectedText || 'your text';
            formattedText = `${prefix}${textToInsert}${suffix}`;
            const newContent = `${content.substring(0, start)}${formattedText}${content.substring(end)}`;
            setContent(newContent);
            
            // For better UX, select the inserted text or placeholder
            textarea.focus();
            const selectionStart = start + prefix.length;
            const selectionEnd = selectionStart + textToInsert.length;
             setTimeout(() => {
                textarea.setSelectionRange(selectionStart, selectionEnd)
                 if(formatType === 'link' && !selectedText) {
                    const urlSelectionStart = newContent.lastIndexOf('(') + 1;
                    const urlSelectionEnd = newContent.lastIndexOf(')');
                    textarea.setSelectionRange(urlSelectionStart, urlSelectionEnd);
                 }
             }, 0);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setAttachment(reader.result as string);
                toast({ title: "Image attached successfully!"});
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setAttachment(null);
        toast({ title: "Image removed."});
    }
    
    const showComingSoonToast = () => {
        toast({ title: "Feature Coming Soon!", description: "This functionality is currently under development."});
    }

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
                attachment,
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
                    attachment,
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
        if (isNewNote) {
             router.push('/notes');
             return;
        };
        const savedNotes = localStorage.getItem(NOTES_STORAGE_KEY);
        const notes: Note[] = savedNotes ? JSON.parse(savedNotes) : [];
        const updatedNotes = notes.map(note => 
            note.id === noteId ? { ...note, deletedAt: new Date().toISOString() } : note
        );
        localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes));
        toast({ title: "Note moved to Recycle Bin." });
        router.push('/notes');
    };

    if (!isClient) {
        return null; // Or a loading skeleton
    }

    return (
        <div className="w-full max-w-md mx-auto flex flex-col h-screen">
            <header className="flex items-center justify-between p-4 flex-shrink-0">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/notes">
                        <ArrowLeft />
                    </Link>
                </Button>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={handleSave}>
                        <Save />
                    </Button>
                </div>
            </header>
            <div className="px-4 flex-shrink-0">
                <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Write title here"
                    className="w-full bg-card border-border h-12 text-lg font-bold focus-visible:ring-1 focus-visible:ring-ring mb-2"
                />
                 <Input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Write category"
                    className="w-full bg-card border-border h-12 text-base focus-visible:ring-1 focus-visible:ring-ring"
                />
            </div>
            <div className="bg-card p-4 rounded-t-xl flex-grow flex flex-col gap-4 mt-4">
                <div className="flex items-center gap-1 border-b border-border pb-2 flex-wrap">
                    <Button variant="ghost" size="icon" onClick={() => handleFormat('bold')}><Bold /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleFormat('italic')}><Italic /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleFormat('underline')}><Underline /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleFormat('strikethrough')}><Strikethrough /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleFormat('link')}><Link2 /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleFormat('list')}><List /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleFormat('list-ordered')}><ListOrdered /></Button>
                    <Button variant="ghost" size="icon" onClick={showComingSoonToast}><ListTodo /></Button>
                    <Button variant="ghost" size="icon" onClick={showComingSoonToast}><Code2 /></Button>
                    <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}><ImageIcon /></Button>
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                </div>
                {attachment && (
                    <div className="relative w-full h-48 group">
                        <Image src={attachment} alt="Note attachment" layout="fill" objectFit="contain" className="rounded-md" />
                        <Button variant="destructive" size="icon" className="absolute top-2 right-2 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleRemoveImage}>
                           <X size={16}/>
                        </Button>
                    </div>
                )}
                <Textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Type your message"
                    className="w-full h-full flex-grow bg-transparent border-none resize-none focus-visible:ring-0 text-base p-0"
                />
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <Button variant="ghost" size="icon" onClick={showComingSoonToast}><Paperclip /></Button>
                    <Button variant="ghost" size="icon" onClick={showComingSoonToast}><Smile /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={handleSoftDelete}><Trash2 /></Button>
                </div>
            </div>
        </div>
    );

    