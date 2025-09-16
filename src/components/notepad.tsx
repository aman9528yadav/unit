

"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Menu, Search, MoreVertical, Edit, Star, Trash2, RotateCcw, StickyNote, LayoutGrid, List, Folder, Tag, X, Home, ShieldX, ChevronDown, Lock, FileText, Eye, EyeOff, KeyRound, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { enUS, hi } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { useLanguage } from '@/context/language-context';
import { listenToUserData, listenToUserNotes, updateUserNotes, UserData, updateUserData as updateUserDataInDb } from '@/services/firestore';
import { Label } from './ui/label';
import { reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { cn } from '@/lib/utils';


export interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt:string;
    isFavorite: boolean;
    deletedAt: string | null;
    category: string;
    attachment: string | null;
    isLocked: boolean;
    backgroundStyle?: 'none' | 'lines' | 'dots' | 'grid';
}

interface UserProfile {
    fullName: string;
    email: string;
    [key: string]: any;
}


export function Notepad() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [isClient, setIsClient] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
    const [showEmptyTrashDialog, setShowEmptyTrashDialog] = useState(false);
    const [view, setView] = useState<NoteView>('all');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [layout, setLayout] = useState<LayoutView>('list');
    const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [passwordPrompt, setPasswordPrompt] = useState<{note: Note; action: 'view' | 'edit' | 'delete'} | null>(null);
    const [passwordInput, setPasswordInput] = useState('');
    const [showUnlockPassword, setShowUnlockPassword] = useState(false);
    
    // States for password reset flow
    const [resetStep, setResetStep] = useState<'prompt' | 'verify' | 'new_pass' >('prompt');
    const [loginPassword, setLoginPassword] = useState('');
    const [newNotePassword, setNewNotePassword] = useState('');
    const [confirmNewNotePassword, setConfirmNewNotePassword] = useState('');

    const { language, t } = useLanguage();
    const dateLocale = language === 'hi' ? hi : enUS;

    const { toast } = useToast();
    const router = useRouter();

    type NoteView = 'all' | 'favorites' | 'trash' | 'category';
    type LayoutView = 'list' | 'card';
    type SortKey = 'updatedAt' | 'createdAt' | 'title';

    useEffect(() => {
        setIsClient(true);
        const storedProfile = localStorage.getItem('userProfile');
        if (storedProfile) {
            const parsedProfile = JSON.parse(storedProfile);
            setProfile(parsedProfile);
        }
    }, []);

    useEffect(() => {
        const userEmail = profile?.email || null;
        
        const unsubNotes = listenToUserNotes(userEmail, (notesFromDb) => {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const freshNotes = notesFromDb.filter(note => {
                if (note.deletedAt) {
                    return new Date(note.deletedAt) > thirtyDaysAgo;
                }
                return true;
            });
            
            setNotes(freshNotes);

            if (userEmail && freshNotes.length !== notesFromDb.length) {
                updateUserNotes(userEmail, freshNotes);
            }
        });
        
        const unsubUserData = listenToUserData(userEmail, setUserData);

        return () => {
            unsubNotes();
            unsubUserData();
        };
    }, [profile]);
    
    const handleNoteClick = (note: Note) => {
        if(note.isLocked) {
            setPasswordPrompt({ note, action: 'view' });
        } else {
            router.push(`/notes/view/${note.id}`);
        }
    }
    
    const executeProtectedAction = (note: Note, action: 'view' | 'edit' | 'delete') => {
        if (action === 'view') {
            sessionStorage.setItem('unlockedNote', JSON.stringify(note));
            router.push(`/notes/view/${note.id}`);
        } else if (action === 'edit') {
            router.push(`/notes/edit/${note.id}`);
        } else if (action === 'delete') {
            handleSoftDelete(note.id);
        }
    };

    const handlePasswordSubmit = () => {
        if (!passwordPrompt) return;

        if (passwordInput === userData?.notePassword) {
            toast({ title: "Unlocked!" });
            executeProtectedAction(passwordPrompt.note, passwordPrompt.action);
            setPasswordPrompt(null);
            setPasswordInput('');
        } else {
            toast({ title: "Incorrect Password", variant: "destructive" });
        }
    };
    
    const handleForgotPasswordClick = () => {
        setResetStep('verify');
    }

    const handleVerifyLoginPassword = async () => {
        if (!profile?.email || !loginPassword) {
            toast({ title: "Please enter your login password", variant: "destructive" });
            return;
        }

        const user = auth.currentUser;
        if (!user || !user.email) {
            toast({ title: "Authentication error", description: "No user is currently signed in.", variant: "destructive" });
            return;
        }

        try {
            const credential = EmailAuthProvider.credential(user.email, loginPassword);
            await reauthenticateWithCredential(user, credential);
            setResetStep('new_pass');
            toast({ title: "Verification Successful", description: "You can now set a new note password." });
        } catch (error) {
            console.error("Reauthentication failed", error);
            toast({ title: "Incorrect Login Password", description: "The password you entered for your account is incorrect.", variant: "destructive" });
        } finally {
            setLoginPassword('');
        }
    };

    const handleSetNewNotePassword = async () => {
        if (newNotePassword !== confirmNewNotePassword) {
            toast({ title: "Passwords do not match", variant: "destructive" });
            return;
        }
        if (newNotePassword.length < 4) {
            toast({ title: "Password must be at least 4 characters", variant: "destructive" });
            return;
        }
        if (profile?.email) {
            await updateUserDataInDb(profile.email, { notePassword: newNotePassword });
            toast({ title: "Note Password Reset Successfully" });
            closeAndResetPasswordDialog();
        }
    };

    const closeAndResetPasswordDialog = () => {
        setPasswordPrompt(null);
        setResetStep('prompt');
        setPasswordInput('');
        setLoginPassword('');
        setNewNotePassword('');
        setConfirmNewNotePassword('');
    }

    const handleSoftDelete = (noteId: string) => {
        const note = notes.find(n => n.id === noteId);
        if (note?.isLocked) {
             setPasswordPrompt({ note, action: 'delete' });
             return;
        }

        const updatedNotes = notes.map(note => 
            note.id === noteId ? { ...note, deletedAt: new Date().toISOString() } : note
        );
        updateUserNotes(profile?.email || null, updatedNotes);
        toast({ title: t('notepad.toast.movedToTrash') });
    };
    
    const handlePermanentDelete = (noteId: string) => {
        const updatedNotes = notes.filter(note => note.id !== noteId);
        updateUserNotes(profile?.email || null, updatedNotes);
        toast({ title: t('notepad.toast.permanentlyDeleted') });
    };

    const handleRestore = (noteId: string) => {
        const updatedNotes = notes.map(note =>
            note.id === noteId ? { ...note, deletedAt: null } : note
        );
        updateUserNotes(profile?.email || null, updatedNotes);
        toast({ title: t('notepad.toast.restored') });
    };

    const handleToggleFavorite = (noteId: string) => {
        const updatedNotes = notes.map(note =>
            note.id === noteId ? { ...note, isFavorite: !note.isFavorite } : note
        );
        updateUserNotes(profile?.email || null, updatedNotes);
    };
    
    const handleRestoreAll = () => {
        const updatedNotes = notes.map(note => note.deletedAt ? { ...note, deletedAt: null } : note);
        updateUserNotes(profile?.email || null, updatedNotes);
        toast({ title: t('notepad.toast.allRestored') });
    };

    const handleEmptyTrash = () => {
        const updatedNotes = notes.filter(note => !note.deletedAt);
        updateUserNotes(profile?.email || null, updatedNotes);
        toast({ title: t('notepad.toast.trashEmptied') });
        setShowEmptyTrashDialog(false);
    };
    
    const handleEditClick = (e: React.MouseEvent, note: Note) => {
        e.stopPropagation();
        if (note.isLocked) {
            setPasswordPrompt({ note, action: 'edit' });
        } else {
            router.push(`/notes/edit/${note.id}`);
        }
    };

    const categories = [...new Set(notes.filter(n => !n.deletedAt && n.category).map(n => n.category!))];

    const filteredNotes = notes.filter(note => {
        if (view === 'all' && !note.deletedAt) return true;
        if (view === 'favorites' && !note.deletedAt && note.isFavorite) return true;
        if (view === 'trash' && note.deletedAt) return true;
        if (view === 'category' && !note.deletedAt && note.category === activeCategory) return true;
        return false;
    });

    const sortedNotes = [...filteredNotes].sort((a, b) => {
        if (sortKey === 'title') {
            return a.title.localeCompare(b.title);
        }
        return new Date(b[sortKey]).getTime() - new Date(a[sortKey]).getTime();
    });

    const getHeading = () => {
        switch(view) {
            case 'all': return t('notepad.headings.all');
            case 'favorites': return t('notepad.headings.favorites');
            case 'trash': return t('notepad.headings.trash');
            case 'category': return activeCategory || t('notepad.headings.category');
            default: return t('notepad.headings.all');
        }
    };
    
    const getEmptyState = () => {
        switch(view) {
            case 'all': return { title: t('notepad.empty.all.title'), message: t('notepad.empty.all.message') };
            case 'favorites': return { title: t('notepad.empty.favorites.title'), message: t('notepad.empty.favorites.message') };
            case 'trash': return { title: t('notepad.empty.trash.title'), message: t('notepad.empty.trash.message') };
            case 'category': return { title: t('notepad.empty.category.title', {category: activeCategory}), message: t('notepad.empty.category.message') };
            default: return { title: t('notepad.empty.default.title'), message: ''};
        }
    }

    const handleCategoryClick = (category: string) => {
        setView('category');
        setActiveCategory(category);
    }

    const handleTabChange = (value: string) => {
        setView(value as NoteView);
        setActiveCategory(null);
    }
    
    const { title: emptyTitle, message: emptyMessage } = getEmptyState();

    if (!isClient) {
        return (
             <div className="w-full max-w-md mx-auto flex flex-col p-4">
                <header className="flex items-center justify-between">
                   <div className="w-10 h-10"></div>
                    <h1 className="text-xl font-bold">{t('notepad.headings.all')}</h1>
                    <div className="w-10 h-10"></div>
                </header>
                <div className="text-center p-8 text-muted-foreground">{t('notepad.loading')}</div>
            </div>
        )
    }

    const NoteAttachment = ({ note }: { note: Note }) => {
        if (!note.attachment) return null;
        
        const isImage = note.attachment.startsWith('data:image/');

        if (layout === 'list') {
            return (
                <div className="relative w-16 h-16 my-1 rounded-md overflow-hidden flex-shrink-0">
                    {isImage ? (
                        <Image src={note.attachment} alt={t('notepad.attachmentAlt')} layout="fill" objectFit="cover" />
                    ) : (
                        <div className="w-full h-full bg-secondary flex items-center justify-center">
                            <FileText className="w-8 h-8 text-muted-foreground"/>
                        </div>
                    )}
                </div>
            );
        }

        if (layout === 'card' && isImage) {
             return (
                 <div className="relative w-full h-32 my-2 rounded-md overflow-hidden">
                    <Image src={note.attachment} alt={t('notepad.attachmentAlt')} layout="fill" objectFit="cover" />
                </div>
            )
        }
        
        return null;
    };


    return (
        <div className="w-full max-w-md mx-auto flex flex-col h-screen">
             <header className="flex items-center justify-between p-4 flex-shrink-0 bg-background">
                <div>
                     <Link href="/notes/edit/new">
                        <Button variant="ghost" size="icon">
                            <Plus size={20} />
                        </Button>
                    </Link>
                </div>
                <h1 className="text-xl font-bold">{getHeading()}</h1>
                <div className="flex items-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>{t('notepad.menu.viewAs')}</DropdownMenuLabel>
                            <DropdownMenuRadioGroup value={layout} onValueChange={(v) => setLayout(v as LayoutView)}>
                            <DropdownMenuRadioItem value="list"><List className="mr-2"/> {t('notepad.menu.list')}</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="card"><LayoutGrid className="mr-2"/> {t('notepad.menu.card')}</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>{t('notepad.menu.sortBy')}</DropdownMenuLabel>
                            <DropdownMenuRadioGroup value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                            <DropdownMenuRadioItem value="updatedAt">{t('notepad.menu.dateModified')}</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="createdAt">{t('notepad.menu.dateCreated')}</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="title">{t('notepad.menu.title')}</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>
            
             <div className='text-center px-4 pb-4'>
                <p className="text-sm text-muted-foreground">{t('notepad.noteCount', {count: sortedNotes.length})}</p>
            </div>
            
            <div className="px-4 flex-shrink-0">
                <Tabs value={view === 'category' ? 'all' : view} onValueChange={handleTabChange} className="w-full">
                    <div className="flex justify-between items-center">
                        <TabsList>
                            <TabsTrigger value="all">{t('notepad.tabs.all')}</TabsTrigger>
                            <TabsTrigger value="favorites">{t('notepad.tabs.favorites')}</TabsTrigger>
                            <TabsTrigger value="trash">{t('notepad.tabs.trash')}</TabsTrigger>
                        </TabsList>

                        {categories.length > 0 && (
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        {t('notepad.categories.button')} <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuLabel>{t('notepad.categories.filter')}</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {categories.map(cat => (
                                        <DropdownMenuItem key={cat} onClick={() => handleCategoryClick(cat)}>
                                            <Tag className="mr-2 h-4 w-4" />
                                            {cat}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </Tabs>
            </div>


            <main className="flex-grow overflow-y-auto px-4 pb-24 mt-4">
                <div className="flex flex-col min-h-full">
                    {view === 'trash' && sortedNotes.length > 0 && (
                        <div className="flex justify-end gap-2 mb-4">
                            <Button variant="outline" onClick={handleRestoreAll}>
                                <RotateCcw className="mr-2 h-4 w-4" /> {t('notepad.trashActions.restoreAll')}
                            </Button>
                            <Button variant="destructive" onClick={() => setShowEmptyTrashDialog(true)}>
                                <ShieldX className="mr-2 h-4 w-4" /> {t('notepad.trashActions.deleteAll')}
                            </Button>
                        </div>
                    )}
                    {sortedNotes.length > 0 ? (
                        <ul className={layout === 'list' ? "space-y-2" : "grid grid-cols-1 sm:grid-cols-2 gap-4"}>
                            {sortedNotes.map(note => (
                                <li key={note.id} className={cn("bg-card p-4 rounded-lg flex flex-col justify-between", note.backgroundStyle && `note-bg-${note.backgroundStyle}`)} onClick={() => handleNoteClick(note)}>
                                    <div className="cursor-pointer group">
                                        <div className="flex items-center justify-between">
                                            <h2 className="font-semibold truncate group-hover:text-primary">{note.title || t('notepad.untitled')}</h2>
                                            <div className='flex items-center gap-1'>
                                                {note.isLocked && <Lock size={14} className="text-muted-foreground"/>}
                                                {note.isFavorite && view !== 'favorites' && <Star size={14} className="text-yellow-400 fill-yellow-400"/>}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-1">
                                            <NoteAttachment note={note} />
                                            <div className="text-sm text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: note.content || t('notepad.noContent') }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
                                            <span>{format(parseISO(note.updatedAt), "d MMM yyyy, h:mm a", { locale: dateLocale })}</span>
                                            {note.category && <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full">{note.category}</span>}
                                        </div>
                                        {note.deletedAt && (
                                            <p className="text-xs text-destructive mt-1">{t('notepad.inTrash', { time: formatDistanceToNow(new Date(note.deletedAt), { locale: dateLocale }) })}</p>
                                        )}
                                        <div className="flex items-center justify-end gap-2 mt-2">
                                            {view === 'trash' ? (
                                                <>
                                                    <Button size="sm" variant="ghost" onClick={(e) => {e.stopPropagation(); handleRestore(note.id)}}><RotateCcw size={16} /> {t('notepad.actions.restore')}</Button>
                                                    <Button size="sm" variant="destructive" onClick={(e) => {e.stopPropagation(); setNoteToDelete(note.id)}}><Trash2 size={16} /> {t('notepad.actions.delete')}</Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Button size="sm" variant="ghost" onClick={(e) => handleEditClick(e, note)}><Edit size={16} /></Button>
                                                    <Button size="sm" variant="ghost" onClick={(e) => {e.stopPropagation(); handleToggleFavorite(note.id)}}>
                                                        <Star size={16} className={note.isFavorite ? 'text-yellow-400 fill-yellow-400' : ''}/>
                                                    </Button>
                                                    <Button size="sm" variant="destructive" onClick={(e) => {e.stopPropagation(); handleSoftDelete(note.id)}}><Trash2 size={16} /></Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center p-8 text-muted-foreground flex flex-col items-center gap-4 mt-16 flex-grow justify-center">
                            <h2 className="text-xl font-semibold">{emptyTitle}</h2>
                            <p>{emptyMessage}</p>
                        </div>
                    )}
                </div>
            </main>
            
            <AlertDialog open={!!noteToDelete}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('notepad.dialog.permanentDelete.title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('notepad.dialog.permanentDelete.description')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setNoteToDelete(null)}>{t('notepad.dialog.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            if(noteToDelete) handlePermanentDelete(noteToDelete);
                            setNoteToDelete(null);
                        }}>
                            {t('notepad.dialog.permanentDelete.confirm')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={showEmptyTrashDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('notepad.dialog.emptyTrash.title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('notepad.dialog.emptyTrash.description')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowEmptyTrashDialog(false)}>{t('notepad.dialog.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleEmptyTrash}>
                            {t('notepad.dialog.emptyTrash.confirm')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={!!passwordPrompt} onOpenChange={(open) => !open && closeAndResetPasswordDialog()}>
                <AlertDialogContent>
                    {resetStep === 'prompt' && (
                        <>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Enter Password</AlertDialogTitle>
                                <AlertDialogDescription>This note is locked. Please enter your note password to continue.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="space-y-2">
                                <Label htmlFor="note-password">Password</Label>
                                <div className="relative flex items-center border border-input rounded-md focus-within:ring-2 focus-within:ring-ring">
                                    <Input id="note-password" type={showUnlockPassword ? "text" : "password"} value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="pr-10 border-none focus-visible:ring-0" onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()} />
                                    <button type="button" onClick={() => setShowUnlockPassword(!showUnlockPassword)} className="absolute right-3 text-muted-foreground">
                                        {showUnlockPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                <Button variant="link" size="sm" className="h-auto p-0 justify-start" onClick={handleForgotPasswordClick}>Forgot password?</Button>
                            </div>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handlePasswordSubmit}>Unlock</AlertDialogAction>
                            </AlertDialogFooter>
                        </>
                    )}
                     {resetStep === 'verify' && (
                        <>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Verify Your Identity</AlertDialogTitle>
                                <AlertDialogDescription>To reset your note password, please enter your main account login password.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="space-y-2">
                                <Label htmlFor="login-password">Login Password</Label>
                                 <Input id="login-password" type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleVerifyLoginPassword()}/>
                            </div>
                            <AlertDialogFooter>
                                <Button variant="ghost" onClick={() => setResetStep('prompt')}>Back</Button>
                                <AlertDialogAction onClick={handleVerifyLoginPassword}>Verify</AlertDialogAction>
                            </AlertDialogFooter>
                        </>
                    )}
                    {resetStep === 'new_pass' && (
                        <>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Set New Note Password</AlertDialogTitle>
                                <AlertDialogDescription>Enter a new password for your notes.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new-note-password">New Password</Label>
                                    <Input id="new-note-password" type="password" value={newNotePassword} onChange={e => setNewNotePassword(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-new-note-password">Confirm New Password</Label>
                                    <Input id="confirm-new-note-password" type="password" value={confirmNewNotePassword} onChange={e => setConfirmNewNotePassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSetNewNotePassword()}/>
                                </div>
                            </div>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleSetNewNotePassword}>Set New Password</AlertDialogAction>
                            </AlertDialogFooter>
                        </>
                    )}
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
