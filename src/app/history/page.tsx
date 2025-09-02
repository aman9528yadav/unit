
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, Clock, Star, RotateCcw } from "lucide-react";
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
  
  const getHistoryIndex = (item: string) => {
    return history.findIndex(h => h === item);
  }

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
    router.push("/");
  };
  
  const handleClearAll = () => {
    setHistory([]);
    setFavorites([]);
    localStorage.removeItem("conversionHistory");
    localStorage.removeItem("favoriteConversions");
  };

  if (!isClient) {
    return null; // or a loading spinner
  }
  
  const favoriteItems = history.filter(item => favorites.includes(item));


  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6">
      <div className="w-full max-w-md mx-auto flex flex-col gap-4 text-white">
        <header className="flex items-center justify-between">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="text-xl font-bold">History</h1>
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
          <div className="flex flex-col gap-4">
            {favoriteItems.length > 0 && (
              <div className="bg-card p-4 rounded-xl flex flex-col gap-3">
                  <h3 className="font-bold text-lg flex items-center gap-2"><Star size={20} className="text-yellow-400" /> Favorites</h3>
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                      {favoriteItems.map((item, index) => (
                          <div key={`fav-${index}`} className="flex justify-between items-center p-2 rounded hover:bg-background group">
                            <div className="flex items-center gap-2">
                               <Star size={16} className="text-yellow-400 fill-yellow-400" />
                               <span>{item}</span>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <RotateCcw size={16} className="cursor-pointer hover:text-white" onClick={() => handleRestore(item)} />
                                <Trash2 size={16} className="cursor-pointer hover:text-white" onClick={() => handleDelete(item)} />
                            </div>
                          </div>
                      ))}
                  </div>
              </div>
            )}

            <div className="bg-card p-4 rounded-xl flex flex-col gap-3">
                <h3 className="font-bold text-lg flex items-center gap-2"><Clock size={20} /> History</h3>
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    {history.map((item, index) => (
                        <div key={`hist-${index}`} className="flex justify-between items-center p-2 rounded hover:bg-background group">
                          <div className="flex items-center gap-2">
                             {favorites.includes(item) && <Star size={16} className="text-yellow-400 fill-yellow-400" />}
                             {!favorites.includes(item) && <Star size={16} className="text-transparent" />}
                             <span>{item}</span>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <RotateCcw size={16} className="cursor-pointer hover:text-white" onClick={() => handleRestore(item)} />
                              <Trash2 size={16} className="cursor-pointer hover:text-white" onClick={() => handleDelete(item)} />
                          </div>
                        </div>
                    ))}
                </div>
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
