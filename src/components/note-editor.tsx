

"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, Save, Trash2, Bold, Italic, List, Underline, Strikethrough, Link2, ListOrdered, Code2, Paperclip, Smile, Image as ImageIcon, X, Undo, Redo, Palette, CaseSensitive, Pilcrow, Heading1, Heading2, Text, Circle, CalculatorIcon, ArrowRightLeft, CheckSquare, Baseline, Highlighter, File, Lock, Unlock, KeyRound, Share2, FileText, Download, Notebook } from 'lucide-react';
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
import { listenToUserNotes, updateUserNotes, listenToUserData, UserData, getGuestKey, updateUserData } from '@/services/firestore';
import { cn } from '@/lib/utils';
import { Label } from './ui/label';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import RichTextEditor from './ui/rich-text-editor';


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
    [key:string]: any;
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
    const [userData, setUserData] = useState<UserData | null>(null);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
    const { t } = useLanguage();
    const [allNotes, setAllNotes] = useState<Note[]>([]);
    const [isLocked, setIsLocked] = useState(false);
    const [showSetPasswordDialog, setShowSetPasswordDialog] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [isExportLocked, setIsExportLocked] = useState(true);
    const [showPremiumLockDialog, setShowPremiumLockDialog] = useState(false);
    const [backgroundStyle, setBackgroundStyle] = useState<'none' | 'lines' | 'dots' | 'grid'>('none');


    const router = useRouter();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isNewNote = noteId === 'new';
    
    const contentSetRef = useRef(false);

    useEffect(() => {
        setIsClient(true);
        const storedProfile = localStorage.getItem('userProfile');
        const userEmail = storedProfile ? JSON.parse(storedProfile).email : null;
        setProfile(userEmail ? { email: userEmail } : null);

        if (!userEmail) { // Guest user
            const localNotes = localStorage.getItem(getGuestKey('notes'));
            setAllNotes(localNotes ? JSON.parse(localNotes) : []);
            setIsExportLocked(true);
        }

    }, []);

    useEffect(() => {
        const userEmail = profile?.email || null;

        if (!userEmail) {
             if (!isNewNote) {
                const noteToEdit = allNotes.find(note => note.id === noteId);
                if (noteToEdit) {
                    setTitle(noteToEdit.title);
                    if (!contentSetRef.current) {
                        setContent(noteToEdit.content);
                        contentSetRef.current = true;
                    }
                    setIsFavorite(noteToEdit.isFavorite || false);
                    setCategory(noteToEdit.category || '');
                    setAttachment(noteToEdit.attachment || null);
                    setIsLocked(noteToEdit.isLocked || false);
                    setBackgroundStyle(noteToEdit.backgroundStyle || 'none');
                }
            }
            return;
        }
        
        const unsubNotes = listenToUserNotes(userEmail, (notesFromDb) => {
            setAllNotes(notesFromDb);
            if (!isNewNote) {
                const noteToEdit = notesFromDb.find(note => note.id === noteId);
                if (noteToEdit) {
                    setTitle(noteToEdit.title);
                    if (!contentSetRef.current) {
                        setContent(noteToEdit.content);
                        contentSetRef.current = true;
                    }
                    setIsFavorite(noteToEdit.isFavorite || false);
                    setCategory(noteToEdit.category || '');
                    setAttachment(noteToEdit.attachment || null);
                    setIsLocked(noteToEdit.isLocked || false);
                    setBackgroundStyle(noteToEdit.backgroundStyle || 'none');
                } else {
                    toast({ title: t('noteEditor.toast.notFound'), variant: "destructive" });
                    router.push('/notes');
                }
            }
        });

        const unsubUserData = listenToUserData(userEmail, (data) => {
            setUserData(data);
            const isPremium = data?.settings?.isPremium || false; // Assume a premium flag
            setIsExportLocked(!isPremium && data?.email !== "amanyadavyadav9458@gmail.com");
        });
        
        return () => {
            unsubNotes();
            unsubUserData();
        };

    }, [isNewNote, noteId, router, toast, profile, t]);


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

    const handleLockToggle = () => {
        if (!isLocked && !userData?.notePassword) {
            setShowSetPasswordDialog(true);
        } else {
            setIsLocked(!isLocked);
            setIsDirty(true);
        }
    }
    
    const handleSetInitialPassword = async () => {
        if (newPassword !== confirmNewPassword) {
            toast({ title: "Passwords do not match", variant: "destructive" });
            return;
        }
        if (newPassword.length < 4) {
            toast({ title: "Password must be at least 4 characters", variant: "destructive" });
            return;
        }
        if (profile?.email) {
            await updateUserNotes(profile.email, allNotes); // Save other changes first
            await updateUserData(profile.email, { notePassword: newPassword });
            setIsLocked(true);
            setIsDirty(true);
            setShowSetPasswordDialog(false);
            setNewPassword('');
            setConfirmNewPassword('');
            toast({ title: "Password Set & Note Locked", description: "You can change this password in settings." });
        }
    };


    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                const fileInfo = `${file.name}|${result}`;
                setAttachment(fileInfo);
                toast({ title: "File attached successfully!"});
                setIsDirty(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setAttachment(null);
        toast({ title: t('noteEditor.toast.imageRemoved')});
        setIsDirty(true);
    }
    
    const showComingSoonToast = () => {
        toast({ title: t('noteEditor.toast.comingSoon.title'), description: t('noteEditor.toast.comingSoon.description')});
    }
    

    const handleSave = () => {
         if (!title.trim() && !content.trim()) {
            toast({
                title: t('noteEditor.toast.emptyNote.title'),
                description: t('noteEditor.toast.emptyNote.description'),
                variant: "destructive"
            });
            return;
        }

        const notes: Note[] = [...allNotes];
        const now = new Date().toISOString();

        if (isNewNote) {
            const newNote: Note = {
                id: uuidv4(),
                title,
                content: content,
                isFavorite: isFavorite || false,
                category: category || '',
                attachment: attachment || null,
                createdAt: now,
                updatedAt: now,
                deletedAt: null,
                isLocked,
                backgroundStyle,
            };
            notes.push(newNote);
        } else {
            const noteIndex = notes.findIndex(note => note.id === noteId);
            if (noteIndex > -1) {
                notes[noteIndex] = {
                    ...notes[noteIndex],
                    title,
                    content: content,
                    isFavorite: isFavorite || false,
                    category: category || '',
                    attachment: attachment || null,
                    updatedAt: now,
                    isLocked,
                    backgroundStyle,
                };
            }
        }
        
        updateUserNotes(profile?.email || null, notes);

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
        if (isNewNote) {
             router.push('/notes');
             return;
        };
        const updatedNotes = allNotes.map(note => 
            note.id === noteId ? { ...note, deletedAt: new Date().toISOString() } : note
        );
        
        updateUserNotes(profile?.email || null, updatedNotes);
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
    
    const handleExport = async (type: 'png' | 'pdf' | 'txt') => {
        if (isExportLocked) {
            setShowPremiumLockDialog(true);
            return;
        }

        const contentEl = document.querySelector('.ProseMirror');
        if (!contentEl) return;
        
        if (type === 'txt') {
            const textContent = (contentEl as HTMLElement).innerText || '';
            const noteString = `Title: ${title}\nCategory: ${category}\n\n${textContent}\n\nSutradhaar | Made by Aman Yadav`;
            const blob = new Blob([noteString], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${title || 'note'}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast({ title: "Exported as TXT!" });
            return;
        }

        const exportContainer = document.createElement('div');
        const tempContent = contentEl.cloneNode(true) as HTMLElement;
        exportContainer.style.width = contentEl.scrollWidth + 'px';
        exportContainer.style.height = contentEl.scrollHeight + 'px';
        exportContainer.style.padding = '1rem';
        exportContainer.style.backgroundColor = 'white';
        exportContainer.style.color = 'black';
        exportContainer.appendChild(tempContent);
        
        const credit = document.createElement('p');
        credit.innerText = "Sutradhaar | Made by Aman Yadav";
        credit.style.textAlign = 'center';
        credit.style.fontSize = '12px';
        credit.style.color = '#888';
        credit.style.marginTop = '20px';
        exportContainer.appendChild(credit);

        document.body.appendChild(exportContainer);

        try {
            const canvas = await html2canvas(exportContainer, {
                scale: 2,
                useCORS: true,
                width: exportContainer.scrollWidth,
                height: exportContainer.scrollHeight
            });

            if (type === 'png') {
                const image = canvas.toDataURL("image/png", 1.0);
                const link = document.createElement('a');
                link.href = image;
                link.download = `${title || 'note'}.png`;
                link.click();
                toast({ title: "Exported as Image!" });
            } else if (type === 'pdf') {
                const pdf = new jsPDF({
                    orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
                    unit: 'px',
                    format: [canvas.width, canvas.height]
                });
                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
                pdf.save(`${title || 'note'}.pdf`);
                toast({ title: "Exported as PDF!" });
            }
        } catch (error) {
            console.error('Export error:', error);
            toast({ title: "Could not export", variant: "destructive" });
        } finally {
            document.body.removeChild(exportContainer);
        }
    };
    
    const renderAttachment = () => {
        if (!attachment) return null;

        const parts = attachment.split('|');
        const fileName = parts[0];
        const dataUri = parts[1] || attachment;

        const isImage = dataUri.startsWith('data:image/');

        if (isImage) {
            return (
                 <div className="relative w-full h-64 my-4 group">
                    <Image src={dataUri} alt={t('notepad.attachmentAlt')} layout="fill" objectFit="contain" className="rounded-md" />
                    <Button variant="destructive" size="icon" className="absolute top-2 right-2 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleRemoveImage}>
                       <X size={16}/>
                    </Button>
                </div>
            )
        }

        return (
            <div className="relative group p-2 border rounded-lg my-4">
                 <a href={dataUri} download={fileName} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
                    <File className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm text-foreground truncate font-medium">{fileName}</span>
                </a>
                 <Button variant="destructive" size="icon" className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleRemoveImage}>
                   <X size={14}/>
                </Button>
            </div>
        )
    }


    if (!isClient && !isNewNote) {
        return null;
    }

    return (
        <div className="w-full max-w-md mx-auto flex flex-col h-screen">
            <header className="flex items-center justify-between p-4 flex-shrink-0 sticky top-0 z-50 bg-background">
                <Button variant="secondary" className="rounded-xl shadow-md" onClick={handleBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                             <Button variant="ghost" size="icon">
                                <Notebook />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                             <DropdownMenuItem onSelect={() => {setBackgroundStyle('none'); setIsDirty(true);}}>None</DropdownMenuItem>
                             <DropdownMenuItem onSelect={() => {setBackgroundStyle('lines'); setIsDirty(true);}}>Lines</DropdownMenuItem>
                             <DropdownMenuItem onSelect={() => {setBackgroundStyle('dots'); setIsDirty(true);}}>Dots</DropdownMenuItem>
                             <DropdownMenuItem onSelect={() => {setBackgroundStyle('grid'); setIsDirty(true);}}>Grid</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Share2 />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => handleExport('png')}>
                                <ImageIcon className="mr-2 h-4 w-4" />
                                <span>Export as Image</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleExport('txt')}>
                                <FileText className="mr-2 h-4 w-4" />
                                <span>Export as TXT</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleExport('pdf')}>
                                <Download className="mr-2 h-4 w-4" />
                                <span>Export as PDF</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="ghost" size="icon" onClick={handleLockToggle} className={cn(isLocked && "bg-primary/10 text-primary")}>
                       {isLocked ? <Lock /> : <Unlock/>}
                    </Button>
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
            <div className={cn("bg-card p-4 rounded-t-xl flex-grow flex flex-col gap-4 mt-4", backgroundStyle && `note-bg-${backgroundStyle}`)}>
                
                {renderAttachment()}

                 <RichTextEditor
                    value={content}
                    onChange={(newContent) => {
                        setContent(newContent);
                        setIsDirty(true);
                    }}
                    className={cn(backgroundStyle && `note-bg-${backgroundStyle}`)}
                />
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <Button variant="ghost" size="icon" onMouseDown={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}>
                        <Paperclip />
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                    <Button variant="ghost" size="icon" onClick={() => showComingSoonToast()}><Smile /></Button>
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
            
            <AlertDialog open={showSetPasswordDialog} onOpenChange={setShowSetPasswordDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Set Your Note Password</AlertDialogTitle>
                        <AlertDialogDescription>
                           This password will be used to lock and unlock your notes. You can change it later in settings.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                           <Label htmlFor="new-password">New Password</Label>
                           <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                           <Label htmlFor="confirm-password">Confirm Password</Label>
                           <Input id="confirm-password" type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} />
                        </div>
                         <Button variant="link" size="sm" className="h-auto p-0 justify-start" onClick={() => router.push('/forgot-password')}>Forgot password?</Button>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowSetPasswordDialog(false)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSetInitialPassword}>Set Password & Lock</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
             <AlertDialog open={showPremiumLockDialog} onOpenChange={setShowPremiumLockDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Premium Feature Locked</AlertDialogTitle>
                        <AlertDialogDescription>
                            This is a premium feature. Please upgrade to use it.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => router.push('/premium')}>
                            Go Premium
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
