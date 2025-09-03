
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, Clock, Star, RotateCcw, Home } from "lucide-react";
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


export default function HistoryPage() {
  const [history, setHistory] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

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

  const handleDelete = (itemToDelete: string) => {
    const newHistory = history.filter(h => h !== itemToDelete);
    setHistory(newHistory);
    localStorage.setItem("conversionHistory", JSON.stringify(newHistory));

    if (favorites.includes(itemToDelete)) {
      const newFavorites = favorites.filter(fav => fav !== itemToDelete);
      setFavorites(newFavorites);
      localStorage.setItem("favoriteConversions", JSON.stringify(newFavorites));
    }
  };

  const handleRestore = (item: string) => {
    localStorage.setItem("restoreConversion", item);
    router.push("/converter");
  };
  
  const handleClearAll = () => {
    setHistory([]);
    setFavorites([]);
    localStorage.removeItem("conversionHistory");
    localStorage.removeItem("favoriteConversions");
  };

  const handleToggleFavorite = (item: string) => {
    let newFavorites: string[];
    if (favorites.includes(item)) {
      newFavorites = favorites.filter(fav => fav !== item);
    } else {
      newFavorites = [item, ...favorites];
    }
    setFavorites(newFavorites);
    localStorage.setItem("favoriteConversions", JSON.stringify(newFavorites));
  };


  if (!isClient) {
    return null; // or a loading spinner
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6">
      <div className="w-full max-w-md mx-auto flex flex-col gap-4">
        <header className="flex items-center justify-between">
            <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                    <Home />
                </Link>
            </Button>
            <div className="text-center">
                <h1 className="text-xl font-bold">History</h1>
                <p className="text-sm text-muted-foreground">{history.length} items</p>
            </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" disabled={history.length === 0}>
                <Trash2 className="text-destructive"/>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all your conversion history, including favorites. This action cannot be undone.
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
        
        {history.length > 0 ? (
          <div className="flex flex-col gap-3">
            {history.map((item, index) => (
                 <div key={index} className="bg-card p-4 rounded-xl flex items-center justify-between group">
                    <div className="flex-1 cursor-pointer" onClick={() => handleRestore(item)}>
                        <p className="text-sm text-muted-foreground">{item.split('→')[0]}</p>
                        <p className="font-bold text-lg">→ {item.split('→')[1]}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleToggleFavorite(item)}>
                            <Star className={`transition-colors ${favorites.includes(item) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`}/>
                        </Button>
                         <Button variant="ghost" size="icon" onClick={() => handleDelete(item)}>
                            <Trash2 className="text-muted-foreground group-hover:text-destructive transition-colors"/>
                        </Button>
                    </div>
                 </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground bg-card p-8 rounded-xl gap-4 mt-16">
            <Clock size={48} />
            <h2 className="text-xl font-semibold">No History Yet</h2>
            <p>Your recent conversions will appear here.</p>
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 mt-4">
              <Link href="/converter">Start Converting</Link>
            </Button>
          </div>
        )}

      </div>
    </main>
  );
}
