
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, Clock, Star, RotateCcw, Home, Search, X, Filter, Power, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "./ui/input";
import { conversionCategories } from "@/lib/conversions";
import { format, formatDistanceToNow, parseISO, isToday, isYesterday, isThisWeek } from 'date-fns';
import { enUS, hi } from 'date-fns/locale';
import { useDebounce } from "@/hooks/use-debounce";
import { useLanguage } from "@/context/language-context";


interface HistoryItemData {
  conversion: string;
  categoryName: string;
  timestamp: string;
  value: string;
  from: string;
  result: string;
  to: string;
}

export function History() {
  const [history, setHistory] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromQuery = searchParams.get('tab') as 'history' | 'favorites' | null;
  const [activeTab, setActiveTab] = useState(tabFromQuery || "history");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const { language, t } = useLanguage();


  const parseHistoryString = (item: string): HistoryItemData => {
    const parts = item.split('|');
    const conversion = parts[0] || '';
    const categoryName = parts[1] || '';
    const timestamp = parts[2] || new Date().toISOString();
  
    const convParts = conversion.split(' ');
    const value = convParts[0];
    const fromSymbol = convParts[1];
    const result = convParts[3];
    const toSymbol = convParts[4];
    
    return {
      conversion,
      categoryName,
      timestamp,
      value,
      from: fromSymbol,
      result,
      to: toSymbol,
    };
  };
  
  const loadData = () => {
      const storedHistory = localStorage.getItem("conversionHistory");
      const storedFavorites = localStorage.getItem("favoriteConversions");
      if (storedHistory) setHistory(JSON.parse(storedHistory));
      if (storedFavorites) setFavorites(JSON.parse(storedFavorites));
  };


  useEffect(() => {
    setIsClient(true);
    loadData();
    
    const handleDataChange = () => loadData();
    
    // Listen for custom storage events from the converter
    window.addEventListener('storage', handleDataChange);
    // Also listen for when the tab becomes visible again
    document.addEventListener('visibilitychange', handleDataChange);

    return () => {
        window.removeEventListener('storage', handleDataChange);
        document.removeEventListener('visibilitychange', handleDataChange);
    };
  }, []);

  const handleRestore = (item: string) => {
    localStorage.setItem("restoreConversion", item);
    router.push("/converter");
  };
  
  const handleClearAll = () => {
      const targetKey = activeTab === 'history' ? 'conversionHistory' : 'favoriteConversions';
      localStorage.removeItem(targetKey);
      window.dispatchEvent(new StorageEvent('storage', { key: targetKey, newValue: '[]' }));
  };

  const handleDeleteItem = (itemString: string) => {
    // Remove from history
    const currentHistory = JSON.parse(localStorage.getItem('conversionHistory') || '[]');
    const newHistory = currentHistory.filter((h: string) => h !== itemString);
    localStorage.setItem("conversionHistory", JSON.stringify(newHistory));

    // Also remove from favorites if it's there
    const currentFavorites = JSON.parse(localStorage.getItem('favoriteConversions') || '[]');
    const newFavorites = currentFavorites.filter((fav: string) => !fav.startsWith(itemString.split('|')[0]));
    localStorage.setItem("favoriteConversions", JSON.stringify(newFavorites));
    
    window.dispatchEvent(new StorageEvent('storage', { key: 'conversionHistory', newValue: JSON.stringify(newHistory) }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'favoriteConversions', newValue: JSON.stringify(newFavorites) }));
    
    setItemToDelete(null);
  };
  
  const itemsToDisplay = activeTab === 'history' 
    ? history 
    : favorites;
    
  const filteredItems = itemsToDisplay.map(parseHistoryString).filter(parsed => {
    const category = conversionCategories.find(c => c.name === parsed.categoryName);
    const fromUnit = category?.units.find(u => u.symbol === parsed.from);
    const toUnit = category?.units.find(u => u.symbol === parsed.to);

    const fromName = fromUnit ? t(`units.${fromUnit.name.toLowerCase().replace(/[\s().-]/g, '')}`, { defaultValue: fromUnit.name }) : parsed.from;
    const toName = toUnit ? t(`units.${toUnit.name.toLowerCase().replace(/[\s().-]/g, '')}`, { defaultValue: toUnit.name }) : parsed.to;
    
    const searchMatch = !debouncedSearch || 
           parsed.conversion.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
           parsed.categoryName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
           fromName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
           toName.toLowerCase().includes(debouncedSearch.toLowerCase());
    
    const categoryMatch = categoryFilter === "All" || parsed.categoryName === categoryFilter;

    return searchMatch && categoryMatch;
  });

  const availableCategories = ['All', ...new Set(history.map(item => parseHistoryString(item).categoryName).filter(Boolean))];

  return (
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
        <header className="flex items-center justify-between sticky top-0 z-50 bg-background py-4">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/">
                        <Home />
                    </Link>
                </Button>
                <h1 className="text-xl font-bold flex items-center gap-2"><Clock/> {t('history.title')}</h1>
            </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={itemsToDisplay.length === 0}>
                <Trash2 className="mr-2"/> {t('history.clearAll')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('history.dialog.title')}</AlertDialogTitle>
                <AlertDialogDescription>
                    {t('history.dialog.description', {tab: activeTab === 'history' ? t('history.tabs.history') : t('history.tabs.favorites')})}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('history.dialog.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAll} className="bg-destructive hover:bg-destructive/90">
                  {t('history.dialog.confirm')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </header>
        
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'history' | 'favorites')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="history">{t('history.tabs.history')}</TabsTrigger>
                <TabsTrigger value="favorites">{t('history.tabs.favorites')}</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2 my-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder={t('history.searchPlaceholder')} className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline"><Filter className="mr-2"/> {categoryFilter === 'All' ? t('history.filter.all') : t(`categories.${categoryFilter.toLowerCase().replace(/[\s().-]/g, '')}`, { defaultValue: categoryFilter })} <ChevronDown className="ml-2 h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuRadioGroup value={categoryFilter} onValueChange={setCategoryFilter}>
                        {availableCategories.map(cat => (
                            <DropdownMenuRadioItem key={cat} value={cat}>{cat === 'All' ? t('history.filter.all') : t(`categories.${cat.toLowerCase().replace(/[\s().-]/g, '')}`, { defaultValue: cat })}</DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="bg-card p-4 rounded-lg">
                {filteredItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredItems.map((item, index) => (
                         <HistoryItem key={`${item.timestamp}-${index}`} item={item} onRestore={handleRestore} onDelete={() => setItemToDelete(`${item.conversion}|${item.categoryName}|${item.timestamp}`)} t={t} language={language} activeTab={activeTab}/>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    <p>{t('history.emptyState', {tab: t(`history.tabs.${activeTab}`)})}</p>
                  </div>
                )}
            </div>
        </Tabs>

        <AlertDialog open={!!itemToDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('history.dialog.deleteTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('history.dialog.deleteDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setItemToDelete(null)}>{t('history.dialog.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDeleteItem(itemToDelete!)} className="bg-destructive hover:bg-destructive/90">
                {t('history.dialog.deleteConfirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
  );
}


function HistoryItem({ item, onRestore, onDelete, t, language, activeTab }: { item: HistoryItemData; onRestore: (item: string) => void; onDelete: () => void; t: (key: string, params?: any) => string; language: string; activeTab: string; }) {
    const fullHistoryString = `${item.conversion}|${item.categoryName}|${item.timestamp}`;
    const category = conversionCategories.find(c => c.name === item.categoryName);
    const Icon = category?.icon || Power;
    const locale = language === 'hi' ? hi : enUS;

    const fromUnit = category?.units.find(u => u.symbol === item.from);
    const toUnit = category?.units.find(u => u.symbol === item.to);
    
    const fromName = fromUnit ? t(`units.${fromUnit.name.toLowerCase().replace(/[\s().-]/g, '')}`, { defaultValue: fromUnit.name }) : item.from;
    const toName = toUnit ? t(`units.${toUnit.name.toLowerCase().replace(/[\s().-]/g, '')}`, { defaultValue: toUnit.name }) : item.to;
    
    const translatedConversion = `${item.value} ${fromName} → ${item.result} ${toName}`;

    const formatTimestamp = (timestamp: string) => {
        const date = parseISO(timestamp);
        return formatDistanceToNow(date, { addSuffix: true, locale: locale });
    };

    return (
        <div className="bg-secondary p-3 rounded-lg group relative">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                {activeTab === 'favorites' && <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />}
                <Icon size={14}/> 
                <span>{t(`categories.${item.categoryName.toLowerCase().replace(/[\s().-]/g, '')}`, { defaultValue: item.categoryName })}</span>
                <span>•</span>
                <span>{formatTimestamp(item.timestamp)}</span>
            </div>
            <p className="font-semibold text-foreground">{translatedConversion}</p>
            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-2 right-2">
                 <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onRestore(fullHistoryString)}>
                    <RotateCcw className="h-4 w-4"/>
                </Button>
                <Button size="icon" variant="destructive" className="h-7 w-7" onClick={onDelete}>
                    <Trash2 className="h-4 w-4"/>
                </Button>
            </div>
        </div>
    )
}
