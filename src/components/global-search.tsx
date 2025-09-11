
"use client";

import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, StickyNote, History, HelpCircle, Settings, X, CornerDownLeft, ArrowRightLeft, Sigma, LayoutGrid } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { useLanguage } from '@/context/language-context';
import { listenToUserData, UserData } from '@/services/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import { searchIndex, isAlgoliaConfigured } from '@/lib/algolia';
import { conversionCategories as baseConversionCategories, Unit, ConversionCategory } from '@/lib/conversions';

interface SearchResult {
  objectID: string;
  type: 'Note' | 'History' | 'Help' | 'Setting' | 'Conversion' | 'Unit' | 'Category';
  title: string;
  description?: string;
  href: string;
}

export function GlobalSearch({ isSearchActive, onSearchToggle }: { isSearchActive: boolean, onSearchToggle: (open: boolean) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const debouncedQuery = useDebounce(query, 300);
  const router = useRouter();
  const { t } = useLanguage();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSearchActive) return;
    const storedProfile = localStorage.getItem('userProfile');
    const userEmail = storedProfile ? JSON.parse(storedProfile).email : null;
    
    const unsub = listenToUserData(userEmail, (data) => {
        setUserData(data);
    });

    return () => unsub();
  }, [isSearchActive]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        onSearchToggle(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onSearchToggle]);

  const search = useCallback(async () => {
    if (!debouncedQuery || !searchIndex) {
      setResults([]);
      return;
    }

    const { hits } = await searchIndex.search<SearchResult>(debouncedQuery, {
      hitsPerPage: 10,
      facetFilters: [['user:' + (userData?.email || 'guest')]]
    });
    setResults(hits);
  }, [debouncedQuery, userData]);

  useEffect(() => {
    if (isAlgoliaConfigured) {
      search();
    }
  }, [search]);
  
  const handleSelectResult = (result: SearchResult) => {
    if (result.type === 'History' || result.type === 'Conversion') {
        localStorage.setItem('restoreConversion', result.type === 'Conversion' ? query : result.objectID);
    }
    if (result.type === 'Category') {
      const category = baseConversionCategories.find(c => c.name === result.title.replace('Category: ', ''));
      if (category) {
        localStorage.setItem('restoreConversion', `1 ${category.units[0].symbol} to ${category.units[1]?.symbol || category.units[0].symbol}`);
      }
    }
     if (result.type === 'Unit') {
        const allUnits = baseConversionCategories.flatMap(c => c.units);
        const unit = allUnits.find(u => u.symbol === result.objectID);
        if(unit) {
            const category = baseConversionCategories.find(c => c.units.some(u => u.symbol === unit.symbol));
            if (category) {
                const toUnit = category.units.find(u => u.symbol !== unit.symbol) || unit;
                localStorage.setItem('restoreConversion', `1 ${unit.symbol} to ${toUnit.symbol}`);
            }
        }
    }
    router.push(result.href);
    onSearchToggle(false);
    setQuery('');
  }

  const ResultIcon = ({ type }: { type: SearchResult['type'] }) => {
    switch (type) {
      case 'Note': return <StickyNote className="w-5 h-5 text-yellow-500" />;
      case 'History': return <History className="w-5 h-5 text-blue-500" />;
      case 'Help': return <HelpCircle className="w-5 h-5 text-green-500" />;
      case 'Setting': return <Settings className="w-5 h-5 text-gray-500" />;
      case 'Conversion': return <ArrowRightLeft className="w-5 h-5 text-purple-500" />;
      case 'Category': return <LayoutGrid className="w-5 h-5 text-indigo-500" />;
      case 'Unit': return <Sigma className="w-5 h-5 text-orange-500" />;
      default: return null;
    }
  };

  return (
    <motion.div
        key="search-input"
        ref={searchContainerRef}
        initial={{ opacity: 0, width: "50%" }}
        animate={{ opacity: 1, width: "100%" }}
        exit={{ opacity: 0, width: "50%" }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="w-full relative"
    >
        <div className="flex items-center gap-2">
            <Search className="size-5 text-muted-foreground" />
            <Input 
                placeholder={isAlgoliaConfigured ? t('globalSearch.placeholder') : "Algolia not configured"}
                className="border-none focus-visible:ring-0 h-auto p-0 bg-transparent" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && results.length > 0 && handleSelectResult(results[0])}
                autoFocus
                disabled={!isAlgoliaConfigured}
            />
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => onSearchToggle(false)}><X className="w-4 h-4"/></Button>
        </div>
        <AnimatePresence>
            {debouncedQuery && (
                 <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full mt-2 w-full bg-card rounded-lg border shadow-lg max-h-96 overflow-y-auto p-2"
                >
                    {!isAlgoliaConfigured ? (
                        <p className="text-center text-muted-foreground py-4">Search is disabled. Please configure Algolia in your environment variables.</p>
                    ) : results.length > 0 ? (
                        <ul className="space-y-1">
                            {results.map((result) => (
                                <li 
                                  key={result.objectID} 
                                  className="flex items-center gap-4 p-2 rounded-md hover:bg-secondary cursor-pointer"
                                  onClick={() => handleSelectResult(result)}
                                >
                                    <ResultIcon type={result.type} />
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-semibold truncate">{result.title}</p>
                                        {result.description && <p className="text-sm text-muted-foreground truncate">{result.description}</p>}
                                    </div>
                                    <CornerDownLeft className="w-4 h-4 text-muted-foreground" />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-muted-foreground py-4">{t('globalSearch.noResults', { query: debouncedQuery })}</p>
                    )}
                 </motion.div>
            )}
        </AnimatePresence>
    </motion.div>
  );
}
