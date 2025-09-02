
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, Save, Trash2, Bold, Italic, List, Underline, Strikethrough, Link2, ListOrdered, Code2, Paperclip, Smile, Image as ImageIcon, X, Undo, Redo, Palette, CaseSensitive } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isNewNote = noteId === 'new';
    
    // Flag to prevent setting innerHTML on every render
    const contentSetRef = useRef(false);

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
                    toast({ title: "Note not found", variant: "destructive" });
                    router.push('/notes');
                }
            }
        }
    }, [noteId, isNewNote, router, toast]);

    // Set initial content only once when the note is loaded
    useEffect(() => {
        if (editorRef.current && content && !contentSetRef.current) {
            editorRef.current.innerHTML = content;
            contentSetRef.current = true;
        }
    }, [content]);


    const handleFormat = (command: string) => {
        document.execCommand(command, false);
        editorRef.current?.focus();
        handleContentChange();
    };

    const handleContentChange = () => {
        if(editorRef.current) {
            setContent(editorRef.current.innerHTML);
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
         const currentContent = editorRef.current?.innerHTML || '';
        if (!title.trim() && !currentContent.trim()) {
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
                content: currentContent,
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
                    content: currentContent,
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
        return null;
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
                    <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('undo')}><Undo /></Button>
                    <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('redo')}><Redo /></Button>
                    <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('bold')}><Bold /></Button>
                    <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('italic')}><Italic /></Button>
                    <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('underline')}><Underline /></Button>
                    <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('strikeThrough')}><Strikethrough /></Button>
                    <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={showComingSoonToast}><Link2 /></Button>
                    <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('insertUnorderedList')}><List /></Button>
                    <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('insertOrderedList')}><ListOrdered /></Button>
                    <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={showComingSoonToast}><Code2 /></Button>
                    <Button variant="ghost" size="icon" onMouseDown={(e) => e-preventDefault()} onClick={showComingSoonToast}><CaseSensitive /></Button>
                    <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={showComingSoonToast}><Palette /></Button>
                    <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => fileInputRef.current?.click()}><ImageIcon /></Button>
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
                 <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleContentChange}
                    data-placeholder="Type your message"
                    className="w-full h-full flex-grow bg-transparent border-none resize-none focus-visible:outline-none text-base p-0 empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground"
                    style={{ direction: 'ltr' }}
                />
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <Button variant="ghost" size="icon" onClick={showComingSoonToast}><Paperclip /></Button>
                    <Button variant="ghost" size="icon" onClick={showComingSoonToast}><Smile /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={handleSoftDelete}><Trash2 /></Button>
                </div>
            </div>
        </div>
    );
}
