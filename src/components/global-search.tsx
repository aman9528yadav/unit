

"use client";

import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Search, StickyNote, History, HelpCircle, Settings, X, CornerDownLeft, ArrowRightLeft, Loader2, Sigma, LayoutGrid } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { Note } from './notepad';
import { FAQ } from './help';
import { conversionCategories as baseConversionCategories, Unit, ConversionCategory } from '@/lib/conversions';
import { CustomCategory, CustomUnit } from './custom-unit-manager';
import { useLanguage } from '@/context/language-context';
import type { ParseConversionQueryOutput } from "@/ai/flows/parse-conversion-flow.ts";
import { listenToUserData, UserData } from '@/services/firestore';


interface SearchResult {
  type: 'Note' | 'History' | 'Help' | 'Setting' | 'Conversion' | 'Unit' | 'Category';
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
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const debouncedQuery = useDebounce(query, 300);
  const router = useRouter();
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
    if (!open) return;
    const storedProfile = localStorage.getItem('userProfile');
    const userEmail = storedProfile ? JSON.parse(storedProfile).email : null;
    
    const unsub = listenToUserData(userEmail, (data) => {
        setUserData(data);
        setCustomUnits(data?.customUnits || []);
        setCustomCategories(data?.customCategories || []);
    });

    return () => unsub();
  }, [open]);

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
    const notes = userData?.notes || [];
    notes
      .filter(n => !n.deletedAt && (
        n.title.toLowerCase().includes(lowerQuery) || 
        n.content.toLowerCase().includes(lowerQuery) ||
        (n.category && n.category.toLowerCase().includes(lowerQuery))
      ))
      .forEach(n => allResults.push({
          type: 'Note',
          title: n.title || t('globalSearch.results.note.untitled'),
          description: n.content.replace(/<[^>]*>?/gm, '').substring(0, 100),
          id: n.id,
          href: `/notes/edit/${n.id}`,
      }));

    // Search History
    const conversionHistory = userData?.conversionHistory || [];
    conversionHistory
        .filter(h => h.toLowerCase().includes(lowerQuery))
        .forEach(h => allResults.push({
            type: 'History',
            title: h.split('|')[0],
            id: h,
            href: `/converter`,
        }));

    // Search Help/FAQs from RTDB
    const faqData = userData?.faqs; // Assuming faqs are part of userdata now
    if (faqData) {
        faqData
          .filter((f: FAQ) => f.question.toLowerCase().includes(lowerQuery) || f.answer.toLowerCase().includes(lowerQuery))
          .forEach((f: FAQ) => allResults.push({
            type: 'Help',
            title: f.question,
            description: f.answer.replace(/<[^>]*>?/gm, '').substring(0, 100),
            id: f.id,
            href: '/help',
          }));
    }

    // Search Conversion Categories
    conversionCategories
      .filter(c => c.name.toLowerCase().includes(lowerQuery))
      .forEach(c => allResults.push({
        type: 'Category',
        title: `Category: ${c.name}`,
        description: `Go to the ${c.name} converter`,
        id: c.name,
        href: '/converter'
      }));

    // Search Units
    allUnits
      .filter(u => u.name.toLowerCase().includes(lowerQuery) || u.symbol.toLowerCase() === lowerQuery)
      .forEach(u => allResults.push({
        type: 'Unit',
        title: `${u.name} (${u.symbol})`,
        id: u.symbol,
        href: '/converter'
      }));


    // Search Settings
    SETTINGS_PAGES
      .filter(p => p.title.toLowerCase().includes(lowerQuery) || p.description?.toLowerCase().includes(lowerQuery))
      .forEach(p => allResults.push({ ...p, id: p.href, type: 'Setting' }));

    setResults(allResults);
  }, [debouncedQuery, userData, allUnits, conversionCategories, t]);

  useEffect(() => {
    search();
  }, [search]);
  
  const handleSelectResult = (result: SearchResult) => {
    if (result.type === 'History' || result.type === 'Conversion') {
        localStorage.setItem('restoreConversion', result.type === 'Conversion' ? query : result.id);
    }
    if (result.type === 'Category') {
      const category = conversionCategories.find(c => c.name === result.id);
      if (category) {
        localStorage.setItem('restoreConversion', `1 ${category.units[0].symbol} to ${category.units[1]?.symbol || category.units[0].symbol}`);
      }
    }
     if (result.type === 'Unit') {
      const unit = allUnits.find(u => u.symbol === result.id);
      if(unit) {
        const category = conversionCategories.find(c => c.units.some(u => u.symbol === unit.symbol));
        if (category) {
          const toUnit = category.units.find(u => u.symbol !== unit.symbol) || unit;
          localStorage.setItem('restoreConversion', `1 ${unit.symbol} to ${toUnit.symbol}`);
        }
      }
    }
    router.push(result.href);
    setOpen(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
                <Search />
            </Button>
        </DialogTrigger>
        <DialogContent className="p-0 gap-0 max-w-lg">
            <DialogHeader className="sr-only">
              <DialogTitle>Global Search</DialogTitle>
              <DialogDescription>Search for notes, history, conversions, and more.</DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2 p-4 border-b">
                <Search className="size-5 text-muted-foreground" />
                <Input 
                    placeholder={t('globalSearch.placeholder')}
                    className="border-none focus-visible:ring-0 h-auto p-0" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && results.length > 0 && handleSelectResult(results[0])}
                    autoFocus
                />
            </div>

             <div className="p-4 max-h-[400px] overflow-y-auto">
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
        </DialogContent>
    </Dialog>
  );
}
