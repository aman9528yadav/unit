

"use client";

import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, StickyNote, History, HelpCircle, Settings, X, CornerDownLeft, ArrowRightLeft, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { Note } from './notepad';
import { FAQ } from './help';
import { conversionCategories as baseConversionCategories, Unit, ConversionCategory } from '@/lib/conversions';
import { CustomCategory, CustomUnit } from './custom-unit-manager';
import { useLanguage } from '@/context/language-context';
import type { ParseConversionQueryOutput } from "@/ai/flows/parse-conversion-flow.ts";


interface SearchResult {
  type: 'Note' | 'History' | 'Help' | 'Setting' | 'Conversion';
  title: string;
  description?: string;
  id: string;
  href: string;
}

const getUserNotesKey = (email: string | null) => email ? `${email}_notes` : `guest_notes`;

// Offline parser to replace the AI flow
export const offlineParseConversionQuery = (query: string, allUnits: Unit[], categories: ConversionCategory[]): ParseConversionQueryOutput | null => {
    const normalizedQuery = query.trim().toLowerCase();

    // Regex to capture value, from unit (can have spaces), and to unit (can have spaces)
    const regex = /^([0-9.,\s]+)\s*([^0-9\s].*?)\s+(?:to|in|as)\s+([^0-9\s].*?)$/i;
    const match = normalizedQuery.match(regex);
    
    if (!match) return null;
    
    const [, valueStr, fromUnitStr, toUnitStr] = match;
    const value = parseFloat(valueStr.replace(/,/g, ''));
    if (isNaN(value)) return null;

    // Sort units by length of name descending to match longer names first ("Square Meters" before "Meters")
    const sortedUnits = [...allUnits].sort((a, b) => b.name.length - a.name.length);

    const findUnit = (unitStr: string): Unit | undefined => {
        const lowerUnitStr = unitStr.trim().toLowerCase().replace(/\s/g, '');
        return sortedUnits.find(u => 
            u.name.toLowerCase().replace(/\s/g, '') === lowerUnitStr || 
            u.symbol.toLowerCase().replace(/\s/g, '') === lowerUnitStr
        );
    };

    const fromUnit = findUnit(fromUnitStr);
    const toUnit = findUnit(toUnitStr);

    if (!fromUnit || !toUnit) return null;

    const category = categories.find(c =>
        c.units.some(u => u.symbol === fromUnit.symbol) &&
        c.units.some(u => u.symbol === toUnit.symbol)
    );

    if (!category) return null;

    return {
        value,
        fromUnit: fromUnit.symbol,
        toUnit: toUnit.symbol,
        category: category.name,
    };
};


export function GlobalSearch() {
  const [isFocused, setIsFocused] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [profile, setProfile] = useState<{ email: string } | null>(null);
  const debouncedQuery = useDebounce(query, 300);
  const router = useRouter();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  
  const [customUnits, setCustomUnits] = useState<CustomUnit[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  
  const conversionCategories = React.useMemo(() => {
    // This logic should be kept in sync with the converter component
    const categoriesWithCustomData = [...baseConversionCategories].map(c => ({ ...c }));
    customCategories.forEach(cc => {
        if (!categoriesWithCustomData.some(c => c.name === cc.name)) {
            categoriesWithCustomData.push({
                name: cc.name,
                icon: () => null, // Icon not needed for logic
                units: [{ name: cc.baseUnitName, symbol: cc.baseUnitSymbol, info: '' }],
                factors: { [cc.baseUnitSymbol]: 1 },
                convert: function(value: number, from: string, to: string) {
                    const fromFactor = this.factors![from];
                    const toFactor = this.factors![to];
                    if (fromFactor === undefined || toFactor === undefined) return NaN;
                    return (value * fromFactor) / toFactor;
                },
            });
        }
    });
    return categoriesWithCustomData.map(category => {
        const newCategory = { ...category, units: [...category.units], factors: { ...category.factors } };
        const applicableUnits = customUnits.filter(cu => cu.category === category.name);
        applicableUnits.forEach(cu => {
            if (!newCategory.units.some(u => u.symbol === cu.symbol)) {
                newCategory.units.push({ name: cu.name, symbol: cu.symbol, info: '' });
            }
            if (newCategory.factors && newCategory.name !== 'Temperature') {
                newCategory.factors[cu.symbol] = cu.factor;
            }
        });
        return newCategory;
    });
  }, [customUnits, customCategories]);
  
  const allUnits = React.useMemo(() => conversionCategories.flatMap(c => c.units), [conversionCategories]);


  useEffect(() => {
    const storedProfile = localStorage.getItem('userProfile');
    const userEmail = storedProfile ? JSON.parse(storedProfile).email : null;

    if (storedProfile) {
      setProfile(JSON.parse(storedProfile));
    }
    
    const savedCustomUnits = localStorage.getItem(`${userEmail || 'guest'}_customUnits`);
    const savedCustomCategories = localStorage.getItem(`${userEmail || 'guest'}_customCategories`);

    if (savedCustomUnits) setCustomUnits(JSON.parse(savedCustomUnits));
    if (savedCustomCategories) setCustomCategories(JSON.parse(savedCustomCategories));

  }, [isFocused]);

  const search = useCallback(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }
    
    const SETTINGS_PAGES: Omit<SearchResult, 'id' | 'type'>[] = [
        { title: t('globalSearch.settings.general.title'), description: t('globalSearch.settings.general.description'), href: '/settings' },
        { title: t('globalSearch.settings.customUnits.title'), description: t('globalSearch.settings.customUnits.description'), href: '/settings/custom-units' },
        { title: t('globalSearch.settings.theme.title'), description: t('globalSearch.settings.theme.description'), href: '/settings/theme' },
        { title: t('globalSearch.settings.developer.title'), description: t('globalSearch.settings.developer.description'), href: '/dev' },
    ];

    const lowerQuery = debouncedQuery.toLowerCase();
    const allResults: SearchResult[] = [];

    // Search Conversion first
    const parsedConversion = offlineParseConversionQuery(debouncedQuery, allUnits, conversionCategories);
    if (parsedConversion) {
      allResults.push({
        type: 'Conversion',
        title: `${t('globalSearch.results.conversion.title')}: ${debouncedQuery}`,
        description: t('globalSearch.results.conversion.description'),
        id: 'conversion-result',
        href: '/converter',
      });
    }


    // Search Notes
    const notesKey = getUserNotesKey(profile?.email || null);
    const notesData = localStorage.getItem(notesKey);
    if (notesData) {
      try {
        const notes: Note[] = JSON.parse(notesData);
        notes
          .filter(n => !n.deletedAt && (n.title.toLowerCase().includes(lowerQuery) || n.content.toLowerCase().includes(lowerQuery)))
          .forEach(n => allResults.push({
            type: 'Note',
            title: n.title || t('globalSearch.results.note.untitled'),
            description: n.content.replace(/<[^>]*>?/gm, '').substring(0, 100),
            id: n.id,
            href: `/notes/edit/${n.id}`,
          }));
      } catch (e) {
        console.error("Failed to parse notes:", e);
      }
    }

    // Search History
    const historyData = localStorage.getItem('conversionHistory');
    if (historyData) {
      try {
        const history: string[] = JSON.parse(historyData);
        history
          .filter(h => h.toLowerCase().includes(lowerQuery))
          .forEach(h => allResults.push({
            type: 'History',
            title: h.split('|')[0],
            id: h,
            href: `/converter`,
          }));
      } catch (e) {
        console.error("Failed to parse history:", e);
      }
    }

    // Search Help/FAQs
    const faqData = localStorage.getItem('faqs');
    if (faqData) {
      try {
        const faqs: FAQ[] = JSON.parse(faqData);
        faqs
          .filter(f => f.question.toLowerCase().includes(lowerQuery) || f.answer.toLowerCase().includes(lowerQuery))
          .forEach(f => allResults.push({
            type: 'Help',
            title: f.question,
            description: f.answer.replace(/<[^>]*>?/gm, '').substring(0, 100),
            id: f.id,
            href: '/help',
          }));
      } catch (e) {
        console.error("Failed to parse FAQs:", e);
      }
    }

    // Search Settings
    SETTINGS_PAGES
      .filter(p => p.title.toLowerCase().includes(lowerQuery) || p.description?.toLowerCase().includes(lowerQuery))
      .forEach(p => allResults.push({ ...p, id: p.href, type: 'Setting' }));

    setResults(allResults);
  }, [debouncedQuery, profile, allUnits, conversionCategories, t]);

  useEffect(() => {
    search();
  }, [search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleSelectResult = (result: SearchResult) => {
    if (result.type === 'History' || result.type === 'Conversion') {
        localStorage.setItem('restoreConversion', result.type === 'Conversion' ? query : result.id);
    }
    router.push(result.href);
    setIsFocused(false);
    setQuery('');
  }

  const ResultIcon = ({ type }: { type: SearchResult['type'] }) => {
    switch (type) {
      case 'Note': return <StickyNote className="w-5 h-5 text-yellow-500" />;
      case 'History': return <History className="w-5 h-5 text-blue-500" />;
      case 'Help': return <HelpCircle className="w-5 h-5 text-green-500" />;
      case 'Setting': return <Settings className="w-5 h-5 text-gray-500" />;
      case 'Conversion': return <ArrowRightLeft className="w-5 h-5 text-purple-500" />;
      default: return null;
    }
  };

  return (
    <div className="relative w-full" ref={searchContainerRef}>
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input 
                placeholder={t('globalSearch.placeholder')}
                className="pl-10 h-11 rounded-lg bg-secondary border-border text-foreground placeholder-muted-foreground w-full" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                 onKeyDown={(e) => e.key === 'Enter' && results.length > 0 && handleSelectResult(results[0])}
            />
             <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground p-1.5 border border-border rounded-md">⌘K</div>
        </div>

      {isFocused && (
        <div className="absolute top-full mt-2 w-full bg-card rounded-lg border shadow-lg z-50 max-h-[400px] overflow-y-auto">
            <div className="p-4">
                {debouncedQuery && results.length > 0 ? (
                    <ul className="space-y-2">
                        {results.map((result) => (
                            <li 
                              key={`${result.type}-${result.id}`} 
                              className="flex items-center gap-4 p-2 rounded-lg hover:bg-secondary cursor-pointer"
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
                ) : debouncedQuery ? (
                    <p className="text-center text-muted-foreground py-8">{t('globalSearch.noResults', { query: debouncedQuery })}</p>
                ) : (
                    <p className="text-center text-muted-foreground py-8">{t('globalSearch.prompt')}</p>
                )}
            </div>
        </div>
      )}
    </div>
  );
}
