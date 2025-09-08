

"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, Save, Trash2, Bold, Italic, List, Underline, Strikethrough, Link2, ListOrdered, Code2, Paperclip, Smile, Image as ImageIcon, X, Undo, Redo, Palette, CaseSensitive, Pilcrow, Heading1, Heading2, Text, Circle, CalculatorIcon, ArrowRightLeft, CheckSquare, Baseline, Highlighter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Note } from './notepad';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { useLanguage } from '@/context/language-context';
import { listenToUserNotes, updateUserNotes } from '@/services/firestore';


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
    const { t } = useLanguage();
    const [allNotes, setAllNotes] = useState<Note[]>([]);


    const router = useRouter();
    const { toast } = useToast();
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const colorInputRef = useRef<HTMLInputElement>(null);
    const highlightInputRef = useRef<HTMLInputElement>(null);
    const isNewNote = noteId === 'new';
    
    const contentSetRef = useRef(false);

    useEffect(() => {
        setIsClient(true);
        const storedProfile = localStorage.getItem('userProfile');
        if (storedProfile) {
            const parsedProfile = JSON.parse(storedProfile);
            setProfile(parsedProfile);
        }
    }, []);

    useEffect(() => {
        if (!profile) return;
        
        const unsubscribe = listenToUserNotes(profile.email, (notesFromDb) => {
            setAllNotes(notesFromDb);
            if (!isNewNote) {
                const noteToEdit = notesFromDb.find(note => note.id === noteId);
                if (noteToEdit) {
                    setTitle(noteToEdit.title);
                    setContent(noteToEdit.content);
                    contentSetRef.current = false;
                    setIsFavorite(noteToEdit.isFavorite || false);
                    setCategory(noteToEdit.category || '');
                    setAttachment(noteToEdit.attachment || null);
                } else {
                    toast({ title: t('noteEditor.toast.notFound'), variant: "destructive" });
                    router.push('/notes');
                }
            }
        });
        
        return () => unsubscribe();

    }, [noteId, isNewNote, router, toast, profile, t]);

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
    
    const handleHighlightChange = (color: string) => {
      handleFormat('hiliteColor', color);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                if (file.type.startsWith('image/')) {
                    setAttachment(result);
                } else {
                    // For non-image files, we'll store the data URI and display the name.
                    // This isn't ideal for large files, but works for simple cases.
                    const fileInfo = `${file.name}|${result}`;
                    setAttachment(fileInfo);
                }
                toast({ title: t('noteEditor.toast.imageAttached')});
                setIsDirty(true);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleInsertEmoji = (emoji: string) => {
        editorRef.current?.focus();
        document.execCommand('insertText', false, emoji);
        setIsDirty(true);
    };

    const handleRemoveImage = () => {
        setAttachment(null);
        toast({ title: t('noteEditor.toast.imageRemoved')});
        setIsDirty(true);
    }
    
    const showComingSoonToast = () => {
        toast({ title: t('noteEditor.toast.comingSoon.title'), description: t('noteEditor.toast.comingSoon.description')});
    }
    
    const handleApplyCustomFontSize = () => {
        const size = parseInt(customFontSize, 10);
        if(!isNaN(size) && size > 0){
            applyStyle('fontSize', `${size}px`);
        } else {
            toast({ title: t('noteEditor.toast.invalidFontSize'), variant: "destructive"});
        }
    }

    const handleInsertCalculation = () => {
        const lastCalc = localStorage.getItem('lastCalculation');
        if (lastCalc && editorRef.current) {
            editorRef.current.focus();
            document.execCommand('insertText', false, lastCalc.split('|')[0]);
            setIsDirty(true);
        } else {
            toast({ title: t('noteEditor.toast.noCalculation.title'), description: t('noteEditor.toast.noCalculation.description')});
        }
    };

    const handleInsertConversion = () => {
        const lastConv = localStorage.getItem('lastConversion');
        if (lastConv && editorRef.current) {
            editorRef.current.focus();
            document.execCommand('insertText', false, lastConv.split('|')[0]);
            setIsDirty(true);
        } else {
            toast({ title: t('noteEditor.toast.noConversion.title'), description: t('noteEditor.toast.noConversion.description')});
        }
    };


    const handleSave = () => {
         const currentContent = editorRef.current?.innerHTML || '';
        if (!title.trim() && !currentContent.trim()) {
            toast({
                title: t('noteEditor.toast.emptyNote.title'),
                description: t('noteEditor.toast.emptyNote.description'),
                variant: "destructive"
            });
            return;
        }

        if (!profile) {
            toast({ title: "Error", description: "User profile not found. Cannot save.", variant: "destructive" });
            return;
        }

        const notes: Note[] = [...allNotes];
        const now = new Date().toISOString();

        if (isNewNote) {
            const newNote: Note = {
                id: uuidv4(),
                title,
                content: currentContent,
                isFavorite: isFavorite || false,
                category: category || '',
                attachment: attachment || null,
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
                    isFavorite: isFavorite || false,
                    category: category || '',
                    attachment: attachment || null,
                    updatedAt: now,
                };
            }
        }
        
        updateUserNotes(profile.email, notes);

        const lastNoteString = `${title || 'Untitled Note'}|${new Date().toISOString()}`;
        localStorage.setItem('lastNote', lastNoteString);
        window.dispatchEvent(new StorageEvent('storage', { key: 'lastNote', newValue: lastNoteString }));
        setIsDirty(false);

        toast({
            title: t('noteEditor.toast.saved.title'),
            description: t('noteEditor.toast.saved.description'),
        });
        router.push('/notes');
    };
    
    const handleSoftDelete = () => {
        if (!profile) return;

        if (isNewNote) {
             router.push('/notes');
             return;
        };
        const updatedNotes = allNotes.map(note => 
            note.id === noteId ? { ...note, deletedAt: new Date().toISOString() } : note
        );
        
        updateUserNotes(profile.email, updatedNotes);
        setIsDirty(false);
        toast({ title: t('notepad.toast.movedToTrash') });
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
                    placeholder={t('noteEditor.placeholders.title')}
                    className="w-full bg-card border-border h-12 text-lg font-bold focus-visible:ring-1 focus-visible:ring-ring mb-2"
                />
                 <Input
                    value={category}
                    onChange={(e) => { setCategory(e.target.value); setIsDirty(true); }}
                    placeholder={t('noteEditor.placeholders.category')}
                    className="w-full bg-card border-border h-12 text-base focus-visible:ring-1 focus-visible:ring-ring"
                />
            </div>
            <div className="bg-card p-4 rounded-t-xl flex-grow flex flex-col gap-4 mt-4">
                <div className="flex items-center gap-1 border-b border-border pb-2 flex-wrap">
                    <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('undo')}><Undo /></Button>
                    <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('redo')}><Redo /></Button>
                    <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('bold')}><Bold /></Button>
                    <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('italic')}><Italic /></Button>
                    <Button variant="ghost" size="icon" onMouseDown={(e) => epreventDefault()} onClick={() => handleFormat('underline')}><Underline /></Button>
                    <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('strikeThrough')}><Strikethrough /></Button>
                    <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={showComingSoonToast}><Link2 /></Button>
                    <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('insertUnorderedList')}><List /></Button>
                    <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('insertOrderedList')}><ListOrdered /></Button>
                    <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => handleFormat('insertHTML', '<div><input type="checkbox" disabled/>&nbsp;</div>')}><CheckSquare /></Button>
                    <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={showComingSoonToast}><Code2 /></Button>
                    <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => colorInputRef.current?.click()}><Baseline/></Button>
                    <input type="color" ref={colorInputRef} onChange={(e) => handleColorChange(e.target.value)} className="w-0 h-0 opacity-0 absolute" />
                    <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => highlightInputRef.current?.click()}><Highlighter/></Button>
                     <input type="color" ref={highlightInputRef} onChange={(e) => handleHighlightChange(e.target.value)} className="w-0 h-0 opacity-0 absolute" />

                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><CaseSensitive /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => handleFormatBlock('h1')}>
                                <Heading1 className="mr-2 h-4 w-4" /> {t('noteEditor.formatting.heading1')}
                            </DropdownMenuItem>
                             <DropdownMenuItem onSelect={() => handleFormatBlock('h2')}>
                                <Heading2 className="mr-2 h-4 w-4" /> {t('noteEditor.formatting.heading2')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleFormatBlock('p')}>
                                <Pilcrow className="mr-2 h-4 w-4" /> {t('noteEditor.formatting.paragraph')}
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
                                     <Button size="sm" onClick={handleApplyCustomFontSize}>{t('noteEditor.formatting.apply')}</Button>
                                </div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={() => fileInputRef.current?.click()}><ImageIcon /></Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                    <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={handleInsertCalculation}><CalculatorIcon /></Button>
                    <Button variant="ghost" size="icon" onMouseDown={(e) => e.preventDefault()} onClick={handleInsertConversion}><ArrowRightLeft /></Button>
                </div>
                {attachment && (
                    <div className="relative w-full h-64 group">
                        <Image src={attachment} alt={t('noteEditor.attachmentAlt')} layout="fill" objectFit="contain" className="rounded-md" />
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
                    data-placeholder={t('noteEditor.placeholders.content')}
                    className="w-full h-full flex-grow bg-transparent border-none resize-none focus-visible:outline-none text-base p-0 empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground"
                    style={{ direction: 'ltr' }}
                />
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}><Paperclip /></Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                    <Button variant="ghost" size="icon" onClick={() => handleInsertEmoji('😀')}><Smile /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={handleSoftDelete}><Trash2 /></Button>
                </div>
            </div>

             <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('noteEditor.unsavedDialog.title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('noteEditor.unsavedDialog.description')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('noteEditor.unsavedDialog.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={() => {
                                setIsDirty(false); // Allow navigation now
                                router.back();
                            }}
                        >
                            {t('noteEditor.unsavedDialog.confirm')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}



