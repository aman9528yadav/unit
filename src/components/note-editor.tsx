
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, Save, Trash2, Bold, Italic, List, Underline, Strikethrough, Link2, ListOrdered, Code2, Paperclip, Smile, Image as ImageIcon, X, Undo, Redo, Palette, CaseSensitive, Pilcrow, Heading1, Heading2, Text, Circle, CalculatorIcon, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Note, NOTES_STORAGE_KEY_BASE } from './notepad';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';


const getUserNotesKey = (email: string | null) => email ? `${email}_${NOTES_STORAGE_KEY_BASE}` : `guest_${NOTES_STORAGE_KEY_BASE}`;

const FONT_COLORS = [
  { name: 'Default', color: 'inherit' },
  { name: 'Black', color: '#000000' },
  { name: 'Red', color: '#E53E3E' },
  { name: 'Green', color: '#48BB78' },
  { name: 'Blue', color: '#4299E1' },
  { name: 'Purple', color: '#9F7AEA' },
];

interface UserProfile {
    fullName: string;
    email: string;
    [key: string]: any;
}


export function NoteEditor({ noteId }: { noteId: string }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('');
    const [isFavorite, setIsFavorite] = useState(false);
    const [attachment, setAttachment] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [customFontSize, setCustomFontSize] = useState('16');
    const [isDirty, setIsDirty] = useState(false);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);


    const router = useRouter();
    const { toast } = useToast();
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const colorInputRef = useRef<HTMLInputElement>(null);
    const isNewNote = noteId === 'new';
    
    const contentSetRef = useRef(false);
    const notesKey = getUserNotesKey(profile?.email || null);


    useEffect(() => {
        setIsClient(true);
        const storedProfile = localStorage.getItem('userProfile');
        if (storedProfile) {
            const parsedProfile = JSON.parse(storedProfile);
            setProfile(parsedProfile);
        }
    }, []);

    useEffect(() => {
        if (!isNewNote && notesKey) {
            const savedNotes = localStorage.getItem(notesKey);
            if (savedNotes) {
                const notes: Note[] = JSON.parse(savedNotes);
                const noteToEdit = notes.find(note => note.id === noteId);
                if (noteToEdit) {
                    setTitle(noteToEdit.title);
                    setContent(noteToEdit.content);
                    contentSetRef.current = false;
                    setIsFavorite(noteToEdit.isFavorite || false);
                    setCategory(noteToEdit.category || '');
                    setAttachment(noteToEdit.attachment || null);
                } else {
                    toast({ title: "Note not found", variant: "destructive" });
                    router.push('/notes');
                }
            }
        }
    }, [noteId, isNewNote, router, toast, notesKey]);

    useEffect(() => {
        if (editorRef.current && content && !contentSetRef.current) {
            editorRef.current.innerHTML = content;
            contentSetRef.current = true; // Mark that initial content has been set
        }
    }, [content]);

     useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = ''; // Required for legacy browsers
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isDirty]);


    const applyStyle = (style: string, value: string) => {
        editorRef.current?.focus();
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        if (range.collapsed) {
            const span = document.createElement('span');
            span.style[style as any] = value;
            span.innerHTML = '&#8203;';
            range.insertNode(span);
            range.selectNodeContents(span);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
             document.execCommand('styleWithCSS', false, 'true');
             if (style === 'color') {
                 document.execCommand('foreColor', false, value);
             } else if (style === 'fontSize') {
                 const span = document.createElement('span');
                 span.style.fontSize = value;
                 span.innerHTML = range.toString();
                 range.deleteContents();
                 range.insertNode(span);
             }
              document.execCommand('styleWithCSS', false, 'false');
        }
        setIsDirty(true);
    };


    const handleFormat = (command: string, value?: string) => {
        editorRef.current?.focus();
        document.execCommand(command, false, value);
        setIsDirty(true);
    };
    
    const handleFormatBlock = (tag: string) => {
      handleFormat('formatBlock', `<${tag}>`);
    };

    const handleColorChange = (color: string) => {
      handleFormat('foreColor', color);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setAttachment(reader.result as string);
                toast({ title: "Image attached successfully!"});
                setIsDirty(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setAttachment(null);
        toast({ title: "Image removed."});
        setIsDirty(true);
    }
    
    const showComingSoonToast = () => {
        toast({ title: "Feature Coming Soon!", description: "This functionality is currently under development."});
    }
    
    const handleApplyCustomFontSize = () => {
        const size = parseInt(customFontSize, 10);
        if(!isNaN(size) && size > 0){
            applyStyle('fontSize', `${size}px`);
        } else {
            toast({ title: "Invalid Font Size", variant: "destructive"});
        }
    }

    const handleInsertCalculation = () => {
        const lastCalc = localStorage.getItem('lastCalculation');
        if (lastCalc && editorRef.current) {
            editorRef.current.focus();
            document.execCommand('insertText', false, lastCalc);
            setIsDirty(true);
        } else {
            toast({ title: "No calculation found", description: "Perform a calculation in the calculator first."});
        }
    };

    const handleInsertConversion = () => {
        const lastConv = localStorage.getItem('lastConversion');
        if (lastConv && editorRef.current) {
            editorRef.current.focus();
            document.execCommand('insertText', false, lastConv);
            setIsDirty(true);
        } else {
            toast({ title: "No conversion found", description: "Perform a conversion in the converter first."});
        }
    };


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

        const savedNotes = localStorage.getItem(notesKey);
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

        localStorage.setItem(notesKey, JSON.stringify(notes));
        setIsDirty(false);

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
        const savedNotes = localStorage.getItem(notesKey);
        const notes: Note[] = savedNotes ? JSON.parse(savedNotes) : [];
        const updatedNotes = notes.map(note => 
            note.id === noteId ? { ...note, deletedAt: new Date().toISOString() } : note
        );
        localStorage.setItem(notesKey, JSON.stringify(updatedNotes));
        setIsDirty(false);
        toast({ title: "Note moved to Recycle Bin." });
        router.push('/notes');
    };

    const handleBack = () => {
        if (isDirty) {
            setShowUnsavedDialog(true);
        } else {
            router.back();
        }
    };


    if (!isClient && !isNewNote) {
        return null;
    }

    return (
        <div className="w-full max-w-md mx-auto flex flex-col h-screen">
            <header className="flex items-center justify-between p-4 flex-shrink-0 sticky top-0 z-50 bg-background">
                <Button variant="ghost" size="icon" onClick={handleBack}>
                    <ArrowLeft />
                </Button>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleSave()}>
                        <Save />
                    </Button>
                </div>
            </header>
            <div className="px-4 flex-shrink-0">
                <Input
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); setIsDirty(true); }}
                    placeholder="Write title here"
                    className="w-full bg-card border-border h-12 text-lg font-bold focus-visible:ring-1 focus-visible:ring-ring mb-2"
                />
                 <Input
                    value={category}
                    onChange={(e) => { setCategory(e.target.value); setIsDirty(true); }}
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
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><CaseSensitive /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => handleFormatBlock('h1')}>
                                <Heading1 className="mr-2 h-4 w-4" /> Heading 1
                            </DropdownMenuItem>
                             <DropdownMenuItem onSelect={() => handleFormatBlock('h2')}>
                                <Heading2 className="mr-2 h-4 w-4" /> Heading 2
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleFormatBlock('p')}>
                                <Pilcrow className="mr-2 h-4 w-4" /> Paragraph
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                             <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <div className="flex items-center gap-2">
                                     <Text className="mr-2 h-4 w-4" />
                                     <Input 
                                        type="number" 
                                        value={customFontSize} 
                                        onChange={(e) => setCustomFontSize(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-16 h-8"
                                        placeholder="16"
                                     />
                                     <span>px</span>
                                     <Button size="sm" onClick={handleApplyCustomFontSize}>Apply</Button>
                                </div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><Palette /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {FONT_COLORS.map(item => (
                                <DropdownMenuItem key={item.name} onSelect={() => handleColorChange(item.color)}>
                                    <div className="w-4 h-4 rounded-full mr-2 border" style={{ backgroundColor: item.color === 'inherit' ? 'transparent' : item.color, color: item.color }} >
                                       {item.color !== 'inherit' && <Circle className='w-full h-full'/>}
                                    </div>
                                    {item.name}
                                </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <label htmlFor="customColor" className="flex items-center gap-2 cursor-pointer">
                                    <div className="w-4 h-4 rounded-full mr-2 border" style={{ backgroundColor: 'transparent' }} />
                                    Custom
                                    <input 
                                        id="customColor"
                                        ref={colorInputRef}
                                        type="color" 
                                        className="w-0 h-0 opacity-0"
                                        onChange={(e) => handleColorChange(e.target.value)}
                                    />
                                </label>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => fileInputRef.current?.click()}><ImageIcon /></Button>
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                    <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={handleInsertCalculation}><CalculatorIcon /></Button>
                    <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={handleInsertConversion}><ArrowRightLeft /></Button>
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
                    onInput={() => {
                        setIsDirty(true);
                    }}
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

             <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>You have unsaved changes!</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to leave? Your changes will be discarded.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={() => {
                                setIsDirty(false); // Allow navigation now
                                router.back();
                            }}
                        >
                            Discard Changes
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
