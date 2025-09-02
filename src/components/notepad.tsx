
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, Search, MoreVertical, Edit, Star, Trash2, RotateCcw, StickyNote, LayoutGrid, List, Folder, Tag, X } from 'lucide-react';
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
import { format, formatDistanceToNow } from 'date-fns';
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
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel
} from '@/components/ui/sidebar';
import { useDebounce } from '@/hooks/use-debounce';


export interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt:string;
    isFavorite?: boolean;
    deletedAt?: string | null;
    category?: string;
}

export const NOTES_STORAGE_KEY = 'userNotesV2';

type NoteView = 'all' | 'favorites' | 'trash' | 'category';
type LayoutView = 'list' | 'card';
type SortKey = 'updatedAt' | 'createdAt' | 'title';

export function Notepad() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [isClient, setIsClient] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
    const [view, setView] = useState<NoteView>('all');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [layout, setLayout] = useState<LayoutView>('list');
    const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const { toast } = useToast();
    const router = useRouter();
    
    useEffect(() => {
        setIsClient(true);
        const savedNotes = localStorage.getItem(NOTES_STORAGE_KEY);
        if (savedNotes) {
            const parsedNotes: Note[] = JSON.parse(savedNotes);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const freshNotes = parsedNotes.filter(note => {
                if (note.deletedAt) {
                    return new Date(note.deletedAt) > thirtyDaysAgo;
                }
                return true;
            });

            if (freshNotes.length !== parsedNotes.length) {
                localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(freshNotes));
            }
            setNotes(freshNotes);
        }
    }, []);

    const updateNotes = (newNotes: Note[]) => {
        setNotes(newNotes);
        localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(newNotes));
    };

    const handleSoftDelete = (noteId: string) => {
        const updatedNotes = notes.map(note => 
            note.id === noteId ? { ...note, deletedAt: new Date().toISOString() } : note
        );
        updateNotes(updatedNotes);
        toast({ title: "Note moved to Recycle Bin." });
    };
    
    const handlePermanentDelete = (noteId: string) => {
        const updatedNotes = notes.filter(note => note.id !== noteId);
        updateNotes(updatedNotes);
        toast({ title: "Note permanently deleted." });
    };

    const handleRestore = (noteId: string) => {
        const updatedNotes = notes.map(note =>
            note.id === noteId ? { ...note, deletedAt: null } : note
        );
        updateNotes(updatedNotes);
        toast({ title: "Note restored." });
    };

    const handleToggleFavorite = (noteId: string) => {
        const updatedNotes = notes.map(note =>
            note.id === noteId ? { ...note, isFavorite: !note.isFavorite } : note
        );
        updateNotes(updatedNotes);
    };

    const categories = [...new Set(notes.filter(n => !n.deletedAt && n.category).map(n => n.category!))];

    const filteredNotes = notes.filter(note => {
        const matchesSearch = debouncedSearchQuery.trim() === '' || 
                              note.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || 
                              note.content.toLowerCase().includes(debouncedSearchQuery.toLowerCase());

        if (!matchesSearch) return false;
        
        switch (view) {
            case 'all': return !note.deletedAt;
            case 'favorites': return !note.deletedAt && note.isFavorite;
            case 'trash': return !!note.deletedAt;
            case 'category': return !note.deletedAt && note.category === activeCategory;
            default: return true;
        }
    });

    const sortedNotes = [...filteredNotes].sort((a, b) => {
        if (sortKey === 'title') {
            return a.title.localeCompare(b.title);
        }
        return new Date(b[sortKey]).getTime() - new Date(a[sortKey]).getTime();
    });

    const getHeading = () => {
        switch(view) {
            case 'all': return 'All Notes';
            case 'favorites': return 'Favorites';
            case 'trash': return 'Recycle Bin';
            case 'category': return activeCategory || 'Category';
            default: return 'All Notes';
        }
    };
    
    const getEmptyState = () => {
        if (debouncedSearchQuery && sortedNotes.length === 0) {
            return { title: 'No results found', message: `No notes matched your search for "${debouncedSearchQuery}".` };
        }
        switch(view) {
            case 'all': return { title: 'No Notes Yet', message: 'Click the button to create your first note.' };
            case 'favorites': return { title: 'No Favorites', message: 'Mark a note as favorite to see it here.' };
            case 'trash': return { title: 'Recycle Bin is Empty', message: 'Deleted notes will appear here.' };
            case 'category': return { title: `No notes in ${activeCategory}`, message: 'Add a note to this category to see it here.' };
            default: return { title: 'No Notes', message: ''};
        }
    }

    const handleCategoryClick = (category: string) => {
        setView('category');
        setActiveCategory(category);
    }
    
    const { title: emptyTitle, message: emptyMessage } = getEmptyState();

    if (!isClient) {
        return (
             <div className="w-full max-w-md mx-auto flex flex-col text-white p-4">
                <header className="flex items-center justify-between">
                   <div className="w-10 h-10"></div>
                    <h1 className="text-xl font-bold">All notes</h1>
                    <div className="w-10 h-10"></div>
                </header>
                <div className="text-center p-8 text-muted-foreground">Loading notes...</div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-md mx-auto text-white h-screen bg-background">
            <SidebarProvider>
                <Sidebar>
                    <SidebarContent>
                        <SidebarHeader>
                            <h2 className="text-xl font-bold">UniConvert Notes</h2>
                        </SidebarHeader>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={() => { setView('all'); setActiveCategory(null); }} isActive={view === 'all'}><StickyNote />All Notes</SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={() => { setView('favorites'); setActiveCategory(null); }} isActive={view === 'favorites'}><Star />Favorites</SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={() => { setView('trash'); setActiveCategory(null); }} isActive={view === 'trash'}><Trash2/>Recycle Bin</SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                         <SidebarSeparator />
                         <SidebarGroup>
                            <SidebarGroupLabel>Categories</SidebarGroupLabel>
                            <SidebarMenu>
                                {categories.map(cat => (
                                    <SidebarMenuItem key={cat}>
                                        <SidebarMenuButton onClick={() => handleCategoryClick(cat)} isActive={view === 'category' && activeCategory === cat}>
                                            <Tag /> {cat}
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                         </SidebarGroup>
                    </SidebarContent>
                </Sidebar>

                <SidebarInset className="flex flex-col pb-24">
                     <header className="flex items-center justify-between p-4">
                        <SidebarTrigger asChild>
                           <Button variant="ghost" size="icon"><Menu/></Button>
                        </SidebarTrigger>
                        <div className='text-center'>
                             {isSearchVisible ? (
                                <div className="flex items-center gap-2">
                                    <Search className="text-muted-foreground" />
                                    <Input 
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search notes..."
                                        className="w-full bg-transparent border-none focus:ring-0"
                                        autoFocus
                                    />
                                    <Button variant="ghost" size="icon" onClick={() => {setIsSearchVisible(false); setSearchQuery('');}}><X/></Button>
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-2xl font-bold">{getHeading()}</h1>
                                    <p className="text-sm text-muted-foreground">{sortedNotes.length} notes</p>
                                </>
                            )}
                        </div>
                        <div className="flex items-center">
                            {!isSearchVisible && (
                                <Button variant="ghost" size="icon" onClick={() => setIsSearchVisible(true)}>
                                    <Search />
                                </Button>
                            )}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreVertical />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuLabel>View as</DropdownMenuLabel>
                                    <DropdownMenuRadioGroup value={layout} onValueChange={(v) => setLayout(v as LayoutView)}>
                                    <DropdownMenuRadioItem value="list"><List className="mr-2"/> List</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="card"><LayoutGrid className="mr-2"/> Card</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                                    <DropdownMenuRadioGroup value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                                    <DropdownMenuRadioItem value="updatedAt">Date Modified</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="createdAt">Date Created</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="title">Title</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </header>
                    <div className="flex-grow overflow-y-auto px-4">
                        {sortedNotes.length > 0 ? (
                            <ul className={layout === 'list' ? "divide-y divide-border" : "grid grid-cols-1 sm:grid-cols-2 gap-4"}>
                                {sortedNotes.map(note => (
                                    <li key={note.id} className={layout === 'list' ? 'cursor-pointer group' : 'bg-card p-4 rounded-lg cursor-pointer group'}>
                                        <div onClick={() => router.push(`/notes/edit/${note.id}`)} className={layout === 'list' ? 'py-4' : ''}>
                                            <div className="flex items-center justify-between">
                                                <h2 className="font-semibold truncate">{note.title || 'Untitled Note'}</h2>
                                                {note.isFavorite && view !== 'favorites' && <Star size={14} className="text-yellow-400 fill-yellow-400"/>}
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate h-10">{note.content || 'No content'}</p>
                                            <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
                                                <span>{format(new Date(note.updatedAt), "d MMM yyyy")}</span>
                                                {note.category && <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full">{note.category}</span>}
                                            </div>
                                             {note.deletedAt && (
                                                <p className="text-xs text-destructive mt-1">In bin for {formatDistanceToNow(new Date(note.deletedAt))}</p>
                                             )}
                                        </div>
                                        <div className="flex items-center justify-end gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {view === 'trash' ? (
                                                <>
                                                    <Button size="sm" variant="ghost" onClick={() => handleRestore(note.id)}><RotateCcw size={16} /> Restore</Button>
                                                    <Button size="sm" variant="destructive" onClick={() => setNoteToDelete(note.id)}><Trash2 size={16} /> Delete</Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Button size="sm" variant="ghost" onClick={() => router.push(`/notes/edit/${note.id}`)}><Edit size={16} /></Button>
                                                    <Button size="sm" variant="ghost" onClick={() => handleToggleFavorite(note.id)}>
                                                        <Star size={16} className={note.isFavorite ? 'text-yellow-400 fill-yellow-400' : ''}/>
                                                    </Button>
                                                    <Button size="sm" variant="destructive" onClick={() => handleSoftDelete(note.id)}><Trash2 size={16} /></Button>
                                                </>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center p-8 text-muted-foreground flex flex-col items-center gap-4 mt-16">
                                <h2 className="text-xl font-semibold">{emptyTitle}</h2>
                                <p>{emptyMessage}</p>
                            </div>
                        )}
                    </div>
                     <Link href="/notes/edit/new" passHref>
                        <Button className="fixed bottom-8 right-1/2 translate-x-1/2 sm:right-8 sm:translate-x-0 w-16 h-16 rounded-full bg-accent text-accent-foreground shadow-lg hover:bg-accent/90">
                            <Edit size={24} />
                        </Button>
                    </Link>
                    <AlertDialog open={!!noteToDelete}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete the note. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setNoteToDelete(null)}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => {
                                    if(noteToDelete) handlePermanentDelete(noteToDelete);
                                    setNoteToDelete(null);
                                }}>
                                    Delete Permanently
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </SidebarInset>
            </SidebarProvider>
        </div>
    );
}
