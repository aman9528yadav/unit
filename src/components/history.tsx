
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, Clock, Star, RotateCcw, Home, Search, X, Filter, Power } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "./ui/input";
import { conversionCategories } from "@/lib/conversions";
import { format, formatDistanceToNow, parseISO, isToday, isYesterday, isThisWeek } from 'date-fns';
import { useDebounce } from "@/hooks/use-debounce";


interface HistoryItemData {
  conversion: string;
  categoryName: string;
  timestamp: string;
  value: string;
  from: string;
  fromName: string;
  result: string;
  to: string;
  toName: string;
}

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
  
  const category = conversionCategories.find(c => c.name === categoryName);
  const fromUnit = category?.units.find(u => u.symbol === fromSymbol);
  const toUnit = category?.units.find(u => u.symbol === toSymbol);

  return {
    conversion,
    categoryName,
    timestamp,
    value,
    from: fromSymbol,
    fromName: fromUnit?.name || fromSymbol,
    result,
    to: toSymbol,
    toName: toUnit?.name || toSymbol,
  };
};

export function History() {
  const [history, setHistory] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("history");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    setIsClient(true);
    const storedHistory = localStorage.getItem("conversionHistory");
    const storedFavorites = localStorage.getItem("favoriteConversions");
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory));
    }
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
  }, []);

  const handleRestore = (item: string) => {
    localStorage.setItem("restoreConversion", item);
    router.push("/converter");
  };
  
  const handleClearAll = () => {
    if (activeTab === 'history') {
        setHistory([]);
        localStorage.removeItem("conversionHistory");
    }
    setFavorites([]);
    localStorage.removeItem("favoriteConversions");
  };
  
  const itemsToDisplay = activeTab === 'history' 
    ? history 
    : history.filter(item => favorites.includes(item));
    
  const filteredItems = itemsToDisplay.filter(item => {
    const parsed = parseHistoryString(item);
    if (!debouncedSearch) return true;
    return parsed.conversion.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
           parsed.categoryName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
           parsed.fromName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
           parsed.toName.toLowerCase().includes(debouncedSearch.toLowerCase());
  }).map(parseHistoryString);

  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6">
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
        <header className="flex items-center justify-between sticky top-0 z-50 bg-background py-4">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/">
                        <Home />
                    </Link>
                </Button>
                <h1 className="text-xl font-bold flex items-center gap-2"><Clock/> Conversion History</h1>
            </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={itemsToDisplay.length === 0}>
                <Trash2 className="mr-2"/> Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all {activeTab === 'history' ? 'history and favorites' : 'favorites'}. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAll} className="bg-destructive hover:bg-destructive/90">
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </header>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="favorites">Favorites</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2 my-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search conversions" className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <Button variant="outline"><Filter className="mr-2"/> Category: All</Button>
            </div>

            <div className="bg-card p-4 rounded-lg">
                <div className="grid grid-cols-4 text-muted-foreground text-sm font-semibold mb-2 px-2">
                    <span>When</span>
                    <span className="col-span-2">Conversion</span>
                    <span>Action</span>
                </div>
                {filteredItems.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {filteredItems.map((item, index) => (
                         <HistoryItem key={`${item.timestamp}-${index}`} item={item} onRestore={handleRestore}/>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    <p>No {activeTab} found.</p>
                  </div>
                )}
            </div>
        </Tabs>

      </div>
    </main>
  );
}


function HistoryItem({ item, onRestore }: { item: HistoryItemData; onRestore: (item: string) => void }) {
    const fullHistoryString = `${item.conversion}|${item.categoryName}|${item.timestamp}`;
    const category = conversionCategories.find(c => c.name === item.categoryName);
    const Icon = category?.icon || Power;

    const formatWhen = (timestamp: string) => {
        const date = parseISO(timestamp);
        if (isToday(date)) {
            return `Today, ${format(date, 'HH:mm')}`;
        }
        if (isYesterday(date)) {
            return `Yesterday, ${format(date, 'HH:mm')}`;
        }
         if (isThisWeek(date, { weekStartsOn: 1 })) {
            return `${format(date, 'EEEE')}, ${format(date, 'HH:mm')}`;
        }
        return format(date, 'd MMM, HH:mm');
    }

    return (
        <div className="grid grid-cols-4 items-center p-2 rounded-lg hover:bg-secondary group">
            <div className="flex flex-col">
                <span className="font-semibold text-foreground">{formatDistanceToNow(parseISO(item.timestamp), { addSuffix: true })}</span>
                <span className="text-xs">{formatWhen(item.timestamp)}</span>
            </div>
            <div className="col-span-2 flex items-center gap-3">
                 <div className="p-2 bg-primary/10 text-primary rounded-full">
                    <Icon/>
                </div>
                <div>
                    <p className="font-semibold text-foreground">{item.value} {item.from} → {item.result} {item.to}</p>
                    <p className="text-xs">From {item.fromName} to {item.toName}</p>
                </div>
            </div>
             <div className="flex justify-end">
                 <Button variant="ghost" onClick={() => onRestore(fullHistoryString)}>
                    <RotateCcw className="mr-2"/> Use
                </Button>
            </div>
        </div>
    )
}
