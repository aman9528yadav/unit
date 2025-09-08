

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
import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { enUS, hi } from 'date-fns/locale';
import { useDebounce } from "@/hooks/use-debounce";
import { useLanguage } from "@/context/language-context";
import { 
    listenToUserData, 
    clearAllHistory, 
    deleteHistoryItem,
} from "@/services/firestore";


interface HistoryItemData {
  type: 'conversion' | 'calculation' | 'favorite';
  fullString: string;
  display: string;
  categoryName?: string;
  timestamp: string;
}

const parseHistoryString = (item: string, type: HistoryItemData['type']): HistoryItemData | null => {
    const parts = item.split('|');
    if (type === 'conversion' && parts.length >= 3 && isValid(parseISO(parts[2]))) {
        return { type, fullString: item, display: parts[0], categoryName: parts[1], timestamp: parts[2] };
    }
     if (type === 'favorite' && parts.length >= 3 && isValid(parseISO(parts[2]))) {
        return { type, fullString: item, display: parts[0], categoryName: parts[1], timestamp: parts[2] };
    }
    if (type === 'calculation' && parts.length >= 2 && isValid(parseISO(parts[1]))) {
        return { type, fullString: item, display: parts[0], timestamp: parts[1] };
    }
    // Handle legacy items without timestamps
    if (parts.length < (type === 'conversion' || type === 'favorite' ? 3 : 2)) {
         return { type, fullString: item, display: parts[0], categoryName: (type === 'conversion' || type === 'favorite') ? parts[1] : undefined, timestamp: new Date(0).toISOString() };
    }
    return null;
}

export function History() {
  const [conversionHistory, setConversionHistory] = useState<HistoryItemData[]>([]);
  const [calculationHistory, setCalculationHistory] = useState<HistoryItemData[]>([]);
  const [favorites, setFavorites] = useState<HistoryItemData[]>([]);
  const [profile, setProfile] = useState<{email: string} | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromQuery = searchParams.get('tab') as 'conversions' | 'calculator' | 'favorites' | null;
  const [activeTab, setActiveTab] = useState(tabFromQuery || "conversions");
  const { language, t } = useLanguage();
  const [categoryFilter, setCategoryFilter] = useState<string>("All");


  useEffect(() => {
    setIsClient(true);
    const storedProfile = localStorage.getItem("userProfile");
    const userEmail = storedProfile ? JSON.parse(storedProfile).email : null;
    if(storedProfile) {
        setProfile(JSON.parse(storedProfile));
    }
    
    // Listen to RTDB for real-time updates
    const unsub = listenToUserData(userEmail, (data) => {
        const convHistory: string[] = data?.conversionHistory || [];
        const calcHistory: string[] = data?.calculationHistory || [];
        const favs: string[] = data?.favoriteConversions || [];

        setConversionHistory(convHistory.map(s => parseHistoryString(s, 'conversion')).filter(Boolean as any));
        setCalculationHistory(calcHistory.map(s => parseHistoryString(s, 'calculation')).filter(Boolean as any));
        setFavorites(favs.map(s => parseHistoryString(s, 'favorite')).filter(Boolean as any));
    });
    
    return () => unsub();
  }, []);

  const handleRestore = (item: HistoryItemData) => {
    localStorage.setItem("restoreConversion", item.fullString);
    router.push("/converter");
  };
  
  const handleClearAll = () => {
    const historyType = activeTab === 'conversions' ? 'conversionHistory'
                     : activeTab === 'calculator' ? 'calculationHistory'
                     : 'favoriteConversions';

    clearAllHistory(profile?.email || null, historyType);
  };
  
  const handleDeleteItem = (itemToDelete: HistoryItemData) => {
     const historyType = activeTab === 'conversions' ? 'conversionHistory'
                     : activeTab === 'calculator' ? 'calculationHistory'
                     : 'favoriteConversions';
    deleteHistoryItem(profile?.email || null, historyType, itemToDelete.fullString);
  };
  
  const itemsToDisplay = 
      activeTab === 'conversions' ? conversionHistory
    : activeTab === 'calculator' ? calculationHistory
    : favorites;
    
  const filteredItems = itemsToDisplay
    .filter((item): item is HistoryItemData => {
      if (!item) return false;
      
      const categoryMatch = categoryFilter === "All" || (item.categoryName && item.categoryName === categoryFilter);

      return (activeTab !== 'conversions' || categoryMatch);
    })
    .sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime());


  const availableCategories = ['All', ...new Set(conversionHistory.map(item => item.categoryName).filter(Boolean as any))];

  return (
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
        <header className="flex items-center justify-between sticky top-0 z-50 bg-background py-4">
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
            
            {activeTab === 'conversions' && (
                <div className="flex items-center gap-2 my-4">
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
              )}

            <div className="bg-card p-4 rounded-lg">
                {filteredItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredItems.map((item, index) => (
                         <HistoryItem 
                           key={`${item.fullString}-${index}`} 
                           item={item} 
                           onRestore={() => handleRestore(item)} 
                           onDelete={() => handleDeleteItem(item)} 
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
      </div>
  );
}


function HistoryItem({ item, onRestore, onDelete, t, language }: { item: HistoryItemData; onRestore: () => void; onDelete: () => void; t: (key: string, params?: any) => string; language: string; }) {
    const category = item.categoryName ? conversionCategories.find(c => c.name === item.categoryName) : null;
    let Icon;
    if (item.type === 'calculation') {
        Icon = CalculatorIcon;
    } else if (item.type === 'favorite') {
        Icon = Star;
    } else {
        Icon = category?.icon || ArrowRightLeft;
    }

    const locale = language === 'hi' ? hi : enUS;

    const formatTimestamp = (timestamp: string) => {
        try {
            const date = parseISO(timestamp);
            if (!isValid(date) || date.getTime() === 0) return 'some time ago';
            return formatDistanceToNow(date, { addSuffix: true, locale: locale });
        } catch(e) {
            return "some time ago"
        }
    };

    return (
        <div className="bg-secondary p-3 rounded-lg flex flex-col justify-between">
            <div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Icon size={14} className={item.type === 'favorite' ? 'text-yellow-500' : ''}/> 
                    {item.categoryName && <span>{t(`categories.${item.categoryName.toLowerCase().replace(/[\s().-]/g, '')}`, { defaultValue: item.categoryName })}</span>}
                    {item.categoryName && <span>•</span>}
                    <span>{formatTimestamp(item.timestamp)}</span>
                </div>
                <p className="font-semibold text-foreground break-all">{item.display}</p>
            </div>
            <div className="flex justify-end gap-1 mt-2">
                 {item.type !== 'calculation' && 
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onRestore}>
                        <RotateCcw className="h-4 w-4"/>
                    </Button>
                 }
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onDelete}>
                    <Trash2 className="h-4 w-4 text-destructive"/>
                </Button>
            </div>
        </div>
    )
}
