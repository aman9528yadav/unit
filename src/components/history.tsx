
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { useLanguage } from '@/context/language-context';
import { useRouter } from 'next/navigation';
import { ArrowLeft, History as HistoryIcon, Star, Trash2, RotateCcw, Search, Filter, Home, Power, Tag } from 'lucide-react';
import { conversionCategories } from '@/lib/conversions';
import { formatDistanceToNow } from "date-fns";

const HISTORY_STORAGE_KEY = 'conversionHistory';
const FAVORITES_STORAGE_KEY = 'favoriteConversions';

export function History() {
    const [history, setHistory] = useState<string[]>([]);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [isClient, setIsClient] = useState(false);
    const [tab, setTab] = useState<'history' | 'favorites'>('history');
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [showClearDialog, setShowClearDialog] = useState(false);
    
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const { t } = useLanguage();
    const { toast } = useToast();
    const router = useRouter();

    const loadData = () => {
        const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
        const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
        if (storedHistory) setHistory(JSON.parse(storedHistory));
        if (storedFavorites) setFavorites(JSON.parse(storedFavorites));
    };

    useEffect(() => {
        setIsClient(true);
        loadData();

        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === HISTORY_STORAGE_KEY || event.key === FAVORITES_STORAGE_KEY) {
                loadData();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const parseHistoryString = (item: string) => {
        const parts = item.split('|');
        const conversion = parts[0] || '';
        const categoryName = parts[1] || 'Unknown'; // Default to prevent crash
        const timestamp = parts[2] ? new Date(parts[2]) : new Date();

        return { conversion, categoryName, timestamp };
    };

    const handleClear = () => {
        const storageKey = tab === 'history' ? HISTORY_STORAGE_KEY : FAVORITES_STORAGE_KEY;
        const setState = tab === 'history' ? setHistory : setFavorites;
        
        localStorage.removeItem(storageKey);
        setState([]);
        setShowClearDialog(false);
        toast({ title: tab === 'history' ? 'History Cleared' : 'Favorites Cleared' });
        // Manually dispatch event for other tabs
        window.dispatchEvent(new StorageEvent('storage', { key: storageKey, newValue: '[]' }));
    };

    const handleDeleteItem = (item: string) => {
        const list = tab === 'history' ? history : favorites;
        const setList = tab === 'history' ? setHistory : setFavorites;
        const storageKey = tab === 'history' ? HISTORY_STORAGE_KEY : FAVORITES_STORAGE_KEY;
        
        const newList = list.filter(i => i !== item);
        setList(newList);
        localStorage.setItem(storageKey, JSON.stringify(newList));
        setItemToDelete(null);
        toast({ title: 'Item Removed' });
        // Manually dispatch event for other tabs
        window.dispatchEvent(new StorageEvent('storage', { key: storageKey, newValue: JSON.stringify(newList) }));
    };

    const handleRestore = (item: string) => {
        localStorage.setItem('restoreConversion', item);
        router.push('/converter');
    };

    const list = tab === 'history' ? history : favorites;
    const filteredList = list.filter(item => {
        const { conversion, categoryName } = parseHistoryString(item);
        const matchesSearch = conversion.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || categoryName === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const categories = [...new Set(history.map(item => parseHistoryString(item).categoryName))];

    const getEmptyStateMessage = () => {
        if (searchQuery) return `No results found for "${searchQuery}"`;
        if (tab === 'history') return 'Your conversion history is empty.';
        return 'You have no favorite conversions.';
    };

    if (!isClient) return null;

    return (
        <div className="w-full max-w-md mx-auto flex flex-col gap-4">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild><Link href="/"><Home /></Link></Button>
                    <h1 className="text-xl font-bold">{t('history.title')}</h1>
                </div>
                <Button variant="destructive" size="sm" onClick={() => setShowClearDialog(true)} disabled={list.length === 0}>
                    <Trash2 className="mr-2 h-4 w-4" /> {t('history.clearAll')}
                </Button>
            </header>

            <Input 
                placeholder={t('history.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-card"
            />
            
            <Tabs value={tab} onValueChange={(value) => setTab(value as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="history"><HistoryIcon className="mr-2 h-4 w-4" />{t('history.tabs.history')}</TabsTrigger>
                    <TabsTrigger value="favorites"><Star className="mr-2 h-4 w-4" />{t('history.tabs.favorites')}</TabsTrigger>
                </TabsList>
            </Tabs>
            
            <div className="flex-grow">
                {filteredList.length > 0 ? (
                    <div className="space-y-3">
                        {filteredList.map((item, index) => {
                            const { conversion, categoryName, timestamp } = parseHistoryString(item);
                            const category = conversionCategories.find(c => c.name === categoryName);
                            const Icon = category?.icon || Power;
                            return (
                                <div key={index} className="bg-card p-3 rounded-lg group relative">
                                    <div className="cursor-pointer" onClick={() => handleRestore(item)}>
                                        <p className="font-semibold">{conversion}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                            <Icon size={14} />
                                            <span>{t(`categories.${categoryName.toLowerCase().replace(/[\s().-]/g, '')}`, { defaultValue: categoryName })}</span>
                                            <span>•</span>
                                            <span>{formatDistanceToNow(new Date(timestamp), { addSuffix: true })}</span>
                                        </div>
                                    </div>
                                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRestore(item)}><RotateCcw size={14} /></Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-destructive/20 hover:text-destructive" onClick={() => setItemToDelete(item)}><Trash2 size={14} /></Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground mt-16">{getEmptyStateMessage()}</div>
                )}
            </div>
            
            <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('history.dialog.title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('history.dialog.description', {tab: tab})}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('history.dialog.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClear}>{t('history.dialog.confirm')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
             <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('history.dialog.deleteTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>{t('history.dialog.deleteDescription')}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setItemToDelete(null)}>{t('history.dialog.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteItem(itemToDelete!)}>{t('history.dialog.deleteConfirm')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

    