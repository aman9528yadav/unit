
"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
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
import { ArrowRightLeft, Loader2, Search, Info, Copy, Star, Share2, Globe, LayoutGrid, Clock, RefreshCw, Zap, Square } from "lucide-react";
import { conversionCategories, ConversionCategory, Unit, Region } from "@/lib/conversions";
import { suggestCategory, SuggestCategoryInput } from "@/ai/flows/smart-category-suggestion";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const navItems = ["Unit", "Calculator", "Note", "Timer", "Date", "History"];
const regions: Region[] = ['International', 'India'];

export function Converter() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<ConversionCategory>(conversionCategories[0]);
  const [fromUnit, setFromUnit] = useState<string>(conversionCategories[0].units[0].symbol);
  const [toUnit, setToUnit] = useState<string>(conversionCategories[0].units[1].symbol);
  const [inputValue, setInputValue] = useState<string>("");
  const [outputValue, setOutputValue] = useState<string>("");
  const [history, setHistory] = useState<string[]>([]);
  const [region, setRegion] = useState<Region>('International');

  const [isAiSuggesting, startAiSuggestion] = useTransition();

  const debouncedInput = useDebounce<SuggestCategoryInput>({input: inputValue, conversionHistory: history}, 500);

  const currentUnits = useMemo(() => {
    return selectedCategory.units.filter(u => !u.region || u.region === region);
  }, [selectedCategory, region]);

  const fromUnitInfo = useMemo(() => currentUnits.find(u => u.symbol === fromUnit)?.info, [currentUnits, fromUnit]);
  const toUnitInfo = useMemo(() => currentUnits.find(u => u.symbol === toUnit)?.info, [currentUnits, toUnit]);


  useEffect(() => {
    setFromUnit(currentUnits[0].symbol);
    setToUnit(currentUnits.length > 1 ? currentUnits[1].symbol : currentUnits[0].symbol);
    setInputValue("1");
  }, [selectedCategory, currentUnits, region]);
  
  const performConversion = () => {
      const numValue = parseFloat(inputValue);
      if (isNaN(numValue) || !fromUnit || !toUnit) {
        setOutputValue("");
        return;
      }
      const result = selectedCategory.convert(numValue, fromUnit, toUnit, region);
      if (isNaN(result)) {
        setOutputValue("");
        return;
      }
      
      const formattedResult = result.toLocaleString(undefined, { maximumFractionDigits: 5, useGrouping: false });
      setOutputValue(formattedResult);
      
      const conversionString = `${numValue} ${fromUnit} → ${formattedResult} ${toUnit}`;
      if (!history.includes(conversionString)) {
        setHistory(prev => [conversionString, ...prev].slice(0, 5));
      }
    };

  useEffect(() => {
    if(inputValue) {
      performConversion();
    } else {
      setOutputValue("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, fromUnit, toUnit, selectedCategory, region]);

  useEffect(() => {
    if (debouncedInput.input.trim() === "" || Number.isNaN(parseFloat(debouncedInput.input))) {
        return;
    }
    
    startAiSuggestion(async () => {
      try {
        const suggestions = await suggestCategory({
            input: `${debouncedInput.input} ${fromUnit} to ${toUnit}`,
            conversionHistory: history
        });
        const suggested = conversionCategories.find(c => c.name === suggestions.suggestedCategories[0])
        if (suggested && suggested.name !== selectedCategory.name) {
          // You could potentially show a suggestion UI here
          // For now, we won't auto-switch categories to avoid being too disruptive
        }
      } catch (error) {
        console.error("AI suggestion failed:", error);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedInput, history]);

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
  
  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4 text-white">
      <header className="flex flex-col gap-4">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex space-x-2 pb-2">
            {navItems.map((item, index) => (
              <Button key={item} variant={index === 0 ? "secondary" : "outline"} className={`rounded-full ${index === 0 ? 'bg-accent text-accent-foreground' : 'border-gray-500'}`}>
                {item}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="h-1" />
        </ScrollArea>
        <div className="relative">
          <Input 
            className="bg-card border-gray-500 rounded-full pl-10 h-12" 
            placeholder="search here Ex. 10 km to m" 
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>
      </header>

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
                    <Star size={20} className="text-muted-foreground cursor-pointer hover:text-white" />
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
                <RefreshCw size={18} className="text-muted-foreground cursor-pointer hover:text-white" onClick={() => setHistory([])}/>
              </div>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                  {history.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 rounded hover:bg-background">
                        <span>{item}</span>
                      </div>
                  ))}
              </div>
          </div>
      )}
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

    
