

"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import Link from 'next/link';
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Info, Copy, Star, Share2, Globe, LayoutGrid, Clock, RefreshCw, Zap, Square, Beaker, Trash2, RotateCcw, Search, Loader2, Home } from "lucide-react";
import { conversionCategories, ConversionCategory, Unit, Region } from "@/lib/conversions";
import { parseConversionQuery } from "@/ai/flows/parse-conversion-flow";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Calculator } from "./calculator";

const navItems = ["Unit", "Calculator", "Note", "Timer", "Date", "History"];
const regions: Region[] = ['International', 'India'];

export function Converter() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("Unit");
  const [selectedCategory, setSelectedCategory] = useState<ConversionCategory>(conversionCategories[0]);
  const [fromUnit, setFromUnit] = useState<string>(conversionCategories[0].units[0].symbol);
  const [toUnit, setToUnit] = useState<string>(conversionCategories[0].units[1].symbol);
  const [inputValue, setInputValue] = useState<string>("");
  const [outputValue, setOutputValue] = useState<string>("");
  const [history, setHistory] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [region, setRegion] = useState<Region>('International');

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, startSearchTransition] = useTransition();

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const currentUnits = useMemo(() => {
    return selectedCategory.units.filter(u => !u.region || u.region === region);
  }, [selectedCategory, region]);

  const fromUnitInfo = useMemo(() => currentUnits.find(u => u.symbol === fromUnit)?.info, [currentUnits, fromUnit]);
  const toUnitInfo = useMemo(() => currentUnits.find(u => u.symbol === toUnit)?.info, [currentUnits, toUnit]);


  useEffect(() => {
    const storedHistory = localStorage.getItem("conversionHistory");
    const storedFavorites = localStorage.getItem("favoriteConversions");
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory));
    }
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
    
    const itemToRestore = localStorage.getItem("restoreConversion");
    if (itemToRestore) {
      handleRestoreHistory(itemToRestore);
      localStorage.removeItem("restoreConversion");
    }
  }, []);
  
  const getCurrentConversionString = (value: number, from: string, to: string, result: number) => {
    const formattedResult = result.toLocaleString(undefined, { maximumFractionDigits: 5, useGrouping: false });
    return `${value} ${from} → ${formattedResult} ${to}`;
  };

  useEffect(() => {
    setFromUnit(currentUnits[0].symbol);
    setToUnit(currentUnits.length > 1 ? currentUnits[1].symbol : currentUnits[0].symbol);
    setInputValue("1");
  }, [selectedCategory, currentUnits, region]);
  
  const performConversion = (value?: number, from?: string, to?: string) => {
      const numValue = value ?? parseFloat(inputValue);
      const fromUnitValue = from ?? fromUnit;
      const toUnitValue = to ?? toUnit;

      if (isNaN(numValue) || !fromUnitValue || !toUnitValue) {
        setOutputValue("");
        setIsFavorite(false);
        return;
      }
      const result = selectedCategory.convert(numValue, fromUnitValue, toUnitValue, region);
      if (isNaN(result)) {
        setOutputValue("");
        setIsFavorite(false);
        return;
      }
      
      const formattedResult = result.toLocaleString(undefined, { maximumFractionDigits: 5, useGrouping: false });
      setOutputValue(formattedResult);
      
      const conversionString = getCurrentConversionString(numValue, fromUnitValue, toUnitValue, result);
      
      const newHistory = [conversionString, ...history.filter(item => item !== conversionString)];
      setHistory(newHistory);
      localStorage.setItem("conversionHistory", JSON.stringify(newHistory));

      setIsFavorite(favorites.includes(conversionString));
    };

  useEffect(() => {
    if(inputValue) {
      performConversion();
    } else {
      setOutputValue("");
      setIsFavorite(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, fromUnit, toUnit, selectedCategory, region, favorites]);
  
  useEffect(() => {
    if (debouncedSearchQuery.trim() === "") {
      return;
    }

    startSearchTransition(async () => {
      try {
        const parsed = await parseConversionQuery({ query: debouncedSearchQuery });
        const category = conversionCategories.find(c => c.name === parsed.category);

        if (category) {
          const categoryUnits = category.units.filter(u => !u.region || u.region === region);
          const fromUnitExists = categoryUnits.some(u => u.symbol === parsed.fromUnit);
          const toUnitExists = categoryUnits.some(u => u.symbol === parsed.toUnit);

          if (fromUnitExists && toUnitExists) {
            setSelectedCategory(category);
            setFromUnit(parsed.fromUnit);
            setToUnit(parsed.toUnit);
            setInputValue(String(parsed.value));
            setSearchQuery(""); // Clear search
          } else {
             toast({ title: "Cannot perform conversion", description: `One of the units may belong to a different region. Current region: ${region}.`, variant: "destructive"});
          }
        } else {
          toast({ title: "Cannot perform conversion", description: "Could not determine the conversion category.", variant: "destructive"});
        }
      } catch (error) {
        console.error("Search conversion failed:", error);
        toast({ title: "Invalid Search", description: "The search query could not be understood.", variant: "destructive"});
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery, region]);

  const handleCategoryChange = (categoryName: string) => {
    const category = conversionCategories.find(c => c.name === categoryName);
    if (category) {
      setSelectedCategory(category);
    }
  };

  const handleRegionChange = (value: string) => {
    setRegion(value as Region);
  }

  const handleSwapUnits = () => {
    const currentInput = inputValue;
    const currentOutput = outputValue;
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    setInputValue(currentOutput.replace(/,/g, ''));
    setOutputValue(currentInput);
  };

  const handleConvertClick = () => {
    performConversion();
  };
  
  const handleToggleFavorite = () => {
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue) || !outputValue) return;

    const result = parseFloat(outputValue.replace(/,/g, ''));
    const conversionString = getCurrentConversionString(numValue, fromUnit, toUnit, result);

    let newFavorites: string[];
    if (favorites.includes(conversionString)) {
      newFavorites = favorites.filter(fav => fav !== conversionString);
      toast({ title: "Removed from favorites." });
    } else {
      newFavorites = [conversionString, ...favorites];
      toast({ title: "Added to favorites!" });
    }
    setFavorites(newFavorites);
    localStorage.setItem("favoriteConversions", JSON.stringify(newFavorites));
    setIsFavorite(newFavorites.includes(conversionString));
  };


  const handleRestoreHistory = (item: string) => {
    const parts = item.split(' ');
    if (parts.length < 5) return; // Basic validation
  
    const value = parts[0];
    const from = parts[1];
    // parts[2] is '→'
    const to = parts[4];
  
    // Find category that has both units
    const category = conversionCategories.find(c => 
      c.units.some(u => u.symbol === from) && c.units.some(u => u.symbol === to)
    );
  
    if (category) {
      const categoryUnits = category.units.filter(u => !u.region || u.region === region);
      const fromUnitExists = categoryUnits.some(u => u.symbol === from);
      const toUnitExists = categoryUnits.some(u => u.symbol === to);

      if(fromUnitExists && toUnitExists) {
        setSelectedCategory(category);
        setInputValue(value);
        setFromUnit(from);
        setToUnit(to);
        performConversion(parseFloat(value), from, to);
      } else {
        toast({ title: "Cannot restore", description: `One of the units may belong to a different region. Current region: ${region}.`, variant: "destructive"});
      }
    } else {
        toast({ title: "Cannot restore", description: "Could not determine the conversion category.", variant: "destructive"});
    }
  };

  const handleDeleteHistory = (index: number) => {
    const itemToDelete = history[index];
    const newHistory = history.filter((_, i) => i !== index);
    setHistory(newHistory);
    localStorage.setItem("conversionHistory", JSON.stringify(newHistory));
    
    // Also remove from favorites if it's there
    if (favorites.includes(itemToDelete)) {
      const newFavorites = favorites.filter(fav => fav !== itemToDelete);
      setFavorites(newFavorites);
      localStorage.setItem("favoriteConversions", JSON.stringify(newFavorites));
    }
  };
  
  const handleClearHistory = () => {
    setHistory([]);
    setFavorites([]);
    localStorage.removeItem("conversionHistory");
    localStorage.removeItem("favoriteConversions");
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4 text-white">
      <header className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
             <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                  <Home />
                </Link>
              </Button>
            <h1 className="text-xl font-bold">Unit Converter</h1>
            <Button variant="ghost" size="icon" asChild>
                <Link href="/history">
                  <Clock />
                </Link>
              </Button>
        </div>
      </header>

      <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search e.g., '10 km to m'"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-card h-12 text-base pl-10 pr-10"
            />
            {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />}
          </div>
          
    
          <div className="bg-card p-4 rounded-xl flex flex-col gap-4">
            <h2 className="font-bold text-lg">Quick Convert</h2>
            <p className="text-sm text-muted-foreground -mt-2">Enter a value and choose units. Converts automatically.</p>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm text-muted-foreground flex items-center gap-1.5"><Globe size={16}/> Region</label>
                    <Select value={region} onValueChange={handleRegionChange}>
                        <SelectTrigger className="bg-background mt-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="text-sm text-muted-foreground flex items-center gap-1.5"><LayoutGrid size={16}/> Category</label>
                     <Select value={selectedCategory.name} onValueChange={handleCategoryChange}>
                        <SelectTrigger className="bg-background mt-1">
                             <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {conversionCategories.map(cat => (
                                <SelectItem key={cat.name} value={cat.name}>
                                    <div className="flex items-center gap-2">
                                        <cat.icon className="w-4 h-4" />
                                        <span>{cat.name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
    
            <div>
                <label className="text-sm text-muted-foreground">From</label>
                <Input
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="bg-background mt-1 h-12 text-lg"
                    placeholder="Enter Value"
                  />
            </div>
            
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                <UnitSelect units={currentUnits} value={fromUnit} onValueChange={setFromUnit} />
                <Button variant="outline" size="icon" className="rounded-full h-10 w-10 bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSwapUnits}>
                    <ArrowRightLeft className="w-5 h-5" />
                </Button>
                <UnitSelect units={currentUnits} value={toUnit} onValueChange={setToUnit} />
            </div>
    
            <div className="grid grid-cols-2 gap-2 text-xs">
                {fromUnitInfo && <InfoBox text={fromUnitInfo} />}
                {toUnitInfo && <InfoBox text={toUnitInfo} />}
            </div>
            
            <div className="bg-background rounded-lg p-4 flex justify-between items-center h-16">
                <span className={`text-lg ${!outputValue ? 'text-muted-foreground' : ''}`}>{outputValue || "Result will appear here !"}</span>
                {outputValue && (
                     <div className="flex items-center gap-3">
                        <Copy size={20} className="text-muted-foreground cursor-pointer hover:text-white" onClick={() => {
                            navigator.clipboard.writeText(outputValue)
                            toast({ title: "Copied to clipboard!"})
                            }} />
                        <Star 
                          size={20} 
                          className={`cursor-pointer transition-colors ${isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground hover:text-white'}`}
                          onClick={handleToggleFavorite}
                        />
                        <Share2 size={20} className="text-muted-foreground cursor-pointer hover:text-white" />
                     </div>
                )}
            </div>
            
            <Button onClick={handleConvertClick} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 text-base font-bold">convert</Button>
          </div>
    
          {history.length > 0 && (
              <div className="bg-card p-4 rounded-xl flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg flex items-center gap-2"><Clock size={20} /> Recent Conversions</h3>
                    <RefreshCw size={18} className="text-muted-foreground cursor-pointer hover:text-white" onClick={handleClearHistory}/>
                  </div>
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                      {history.slice(0, 3).map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-2 rounded hover:bg-background group">
                             <div className="flex items-center gap-2">
                               {favorites.includes(item) && <Star size={16} className="text-yellow-400 fill-yellow-400" />}
                               <span>{item}</span>
                             </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <RotateCcw size={16} className="cursor-pointer hover:text-white" onClick={() => handleRestoreHistory(item)} />
                                <Trash2 size={16} className="cursor-pointer hover:text-white" onClick={() => handleDeleteHistory(index)} />
                            </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}
        </>
      
    </div>
  );
}

function UnitSelect({ units, value, onValueChange }: { units: Unit[], value: string, onValueChange: (value: string) => void }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="bg-background h-12 text-base">
        <SelectValue placeholder="Unit" />
      </SelectTrigger>
      <SelectContent>
        {units.map(unit => (
          <SelectItem key={unit.symbol} value={unit.symbol}>
            {`${unit.name} (${unit.symbol})`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function InfoBox({ text }: { text: string }) {
    return (
        <div className="bg-background/50 rounded-lg p-2 flex items-center gap-2">
            <Info size={16} className="text-accent" />
            <span className="text-muted-foreground">{text}</span>
        </div>
    )
}
