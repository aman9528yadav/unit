
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, Clock, Star, RotateCcw, Home, Search, Filter, Power, ChevronDown, ShieldX, CalculatorIcon, ArrowRightLeft } from "lucide-react";
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
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "./ui/input";
import { conversionCategories } from "@/lib/conversions";
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { enUS, hi } from 'date-fns/locale';
import { useDebounce } from "@/hooks/use-debounce";
import { useLanguage } from "@/context/language-context";


interface HistoryItemData {
  type: 'conversion' | 'calculation';
  fullString: string;
  display: string;
  categoryName?: string;
  timestamp: string;
}

export function History() {
  const [conversionHistory, setConversionHistory] = useState<string[]>([]);
  const [calculationHistory, setCalculationHistory] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromQuery = searchParams.get('tab') as 'conversions' | 'calculator' | 'favorites' | null;
  const [activeTab, setActiveTab] = useState(tabFromQuery || "conversions");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [itemToDelete, setItemToDelete] = useState<{item: string, type: 'conversion' | 'calculation' | 'favorite'} | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const { language, t } = useLanguage();

  const parseConversionHistoryString = useCallback((item: string): HistoryItemData | null => {
    const parts = item.split('|');
    if (parts.length < 3) return null;
    return {
      type: 'conversion',
      fullString: item,
      display: parts[0] || '',
      categoryName: parts[1] || '',
      timestamp: parts[2] || new Date().toISOString(),
    };
  }, []);

  const parseCalculationHistoryString = useCallback((item: string): HistoryItemData | null => {
    const parts = item.split('|');
    if (parts.length < 2) return null;
    return {
      type: 'calculation',
      fullString: item,
      display: parts[0] || '',
      timestamp: parts[1] || new Date().toISOString(),
    };
  }, []);

  const loadData = useCallback(() => {
    const storedConvHistory = localStorage.getItem("conversionHistory");
    const storedCalcHistory = localStorage.getItem("calculationHistory");
    const storedFavorites = localStorage.getItem("favoriteConversions");
    if (storedConvHistory) setConversionHistory(JSON.parse(storedConvHistory));
    if (storedCalcHistory) setCalculationHistory(JSON.parse(storedCalcHistory));
    if (storedFavorites) setFavorites(JSON.parse(storedFavorites));
  }, []);

  useEffect(() => {
    loadData();
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'conversionHistory' || e.key === 'favoriteConversions' || e.key === 'calculationHistory') {
            loadData();
        }
    };
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            loadData();
        }
    };

    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
        window.removeEventListener('storage', handleStorageChange);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadData]);

  const handleRestore = (item: string) => {
    localStorage.setItem("restoreConversion", item);
    router.push("/converter");
  };
  
  const handleClearAll = () => {
    if (activeTab === 'conversions') {
        setConversionHistory([]);
        localStorage.removeItem("conversionHistory");
    } else if (activeTab === 'calculator') {
        setCalculationHistory([]);
        localStorage.removeItem("calculationHistory");
    } else {
        setFavorites([]);
        localStorage.removeItem("favoriteConversions");
    }
  };

  const handleDeleteItem = (itemString: string, type: 'conversion' | 'calculation' | 'favorite') => {
    if (type === 'conversion' || type === 'favorite') {
        const newHistory = conversionHistory.filter(h => h !== itemString);
        setConversionHistory(newHistory);
        localStorage.setItem("conversionHistory", JSON.stringify(newHistory));
    } 
    if (type === 'calculation') {
        const newHistory = calculationHistory.filter(h => h !== itemString);
        setCalculationHistory(newHistory);
        localStorage.setItem("calculationHistory", JSON.stringify(newHistory));
    }
    
    // Also remove from favorites if it's there
    const newFavorites = favorites.filter(fav => fav !== itemString);
    setFavorites(newFavorites);
    localStorage.setItem("favoriteConversions", JSON.stringify(newFavorites));
    
    setItemToDelete(null);
  };
  
  const itemsToDisplay = 
      activeTab === 'conversions' ? conversionHistory.map(parseConversionHistoryString)
    : activeTab === 'calculator' ? calculationHistory.map(parseCalculationHistoryString)
    : favorites.map(parseConversionHistoryString); // Favorites are only for conversions
    
  const filteredItems = itemsToDisplay.filter((parsed): parsed is HistoryItemData => {
    if (!parsed) return false;
    
    const searchMatch = !debouncedSearch || 
           parsed.display.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
           (parsed.categoryName && parsed.categoryName.toLowerCase().includes(debouncedSearch.toLowerCase()));
    
    const categoryMatch = categoryFilter === "All" || (parsed.categoryName && parsed.categoryName === categoryFilter);

    return searchMatch && (activeTab !== 'conversions' || categoryMatch);
  });

  const availableCategories = ['All', ...new Set(conversionHistory.map(item => parseConversionHistoryString(item)?.categoryName).filter(Boolean as any))];

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
                    {t('history.dialog.description', {tab: activeTab})}
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
        
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="conversions">Conversions</TabsTrigger>
                <TabsTrigger value="calculator">Calculator</TabsTrigger>
                <TabsTrigger value="favorites">Favorites</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2 my-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder={t('history.searchPlaceholder')} className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              {activeTab === 'conversions' && (
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
              )}
            </div>

            <div className="bg-card p-4 rounded-lg">
                {filteredItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredItems.map((item, index) => (
                         <HistoryItem 
                           key={`${item.timestamp}-${index}`} 
                           item={item} 
                           onRestore={handleRestore} 
                           onDelete={() => setItemToDelete({item: item.fullString, type: activeTab as any})} 
                           t={t} 
                           language={language} 
                         />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-4">
                    <ShieldX size={48} />
                    <p className="font-semibold">{t('history.emptyState', {tab: activeTab})}</p>
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
              <AlertDialogAction onClick={() => handleDeleteItem(itemToDelete!.item, itemToDelete!.type)} className="bg-destructive hover:bg-destructive/90">
                {t('history.dialog.deleteConfirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
  );
}


function HistoryItem({ item, onRestore, onDelete, t, language }: { item: HistoryItemData; onRestore: (item: string) => void; onDelete: () => void; t: (key: string, params?: any) => string; language: string; }) {
    const category = item.categoryName ? conversionCategories.find(c => c.name === item.categoryName) : null;
    const Icon = item.type === 'conversion' ? category?.icon || ArrowRightLeft : CalculatorIcon;
    const locale = language === 'hi' ? hi : enUS;

    const formatTimestamp = (timestamp: string) => {
        try {
            const date = parseISO(timestamp);
            return formatDistanceToNow(date, { addSuffix: true, locale: locale });
        } catch(e) {
            return "some time ago"
        }
    };

    return (
        <div className="bg-secondary p-3 rounded-lg group relative">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Icon size={14}/> 
                {item.categoryName && <span>{t(`categories.${item.categoryName.toLowerCase().replace(/[\s().-]/g, '')}`, { defaultValue: item.categoryName })}</span>}
                {item.categoryName && <span>•</span>}
                <span>{formatTimestamp(item.timestamp)}</span>
            </div>
            <p className="font-semibold text-foreground break-all">{item.display}</p>
            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-2 right-2">
                 {item.type === 'conversion' && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onRestore(item.fullString)}>
                    <RotateCcw className="h-4 w-4"/>
                </Button>}
                <Button size="icon" variant="destructive" className="h-7 w-7" onClick={onDelete}>
                    <Trash2 className="h-4 w-4"/>
                </Button>
            </div>
        </div>
    )
}
