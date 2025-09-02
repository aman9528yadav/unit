
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, Clock, Star } from "lucide-react";
import Link from "next/link";
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

  const handleDeleteHistory = (index: number) => {
    const itemToDelete = history[index];
    const newHistory = history.filter((_, i) => i !== index);
    setHistory(newHistory);
    localStorage.setItem("conversionHistory", JSON.stringify(newHistory));

    // Also remove from favorites if it exists there
    if (favorites.includes(itemToDelete)) {
      const newFavorites = favorites.filter(fav => fav !== itemToDelete);
      setFavorites(newFavorites);
      localStorage.setItem("favoriteConversions", JSON.stringify(newFavorites));
    }
  };
  
  const handleClearAll = () => {
    setHistory([]);
    setFavorites([]); // Also clear favorites from state
    localStorage.removeItem("conversionHistory");
    localStorage.removeItem("favoriteConversions"); // And from storage
  };

  if (!isClient) {
    return null; // or a loading spinner
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6">
      <div className="w-full max-w-md mx-auto flex flex-col gap-4 text-white">
        <header className="flex items-center justify-between">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="text-xl font-bold">Conversion History</h1>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon" disabled={history.length === 0}>
                <Trash2 />
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
                <AlertDialogAction onClick={handleClearAll}>
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </header>

        {history.length > 0 ? (
          <div className="bg-card p-4 rounded-xl flex flex-col gap-3">
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                  {history.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 rounded hover:bg-background group">
                        <div className="flex items-center gap-2">
                           {favorites.includes(item) && <Star size={16} className="text-yellow-400 fill-yellow-400" />}
                           <span>{item}</span>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={16} className="cursor-pointer hover:text-white" onClick={() => handleDeleteHistory(index)} />
                        </div>
                      </div>
                  ))}
              </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground bg-card p-8 rounded-xl gap-4">
            <Clock size={48} />
            <h2 className="text-xl font-semibold">No History Yet</h2>
            <p>Your recent conversions will appear here.</p>
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/">Start Converting</Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
