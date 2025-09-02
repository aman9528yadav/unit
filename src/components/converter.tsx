"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { conversionCategories, ConversionCategory, Unit } from "@/lib/conversions";
import { suggestCategory } from "@/ai/flows/smart-category-suggestion";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";

export function Converter() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<ConversionCategory>(conversionCategories[0]);
  const [fromUnit, setFromUnit] = useState<string>(conversionCategories[0].units[0].symbol);
  const [toUnit, setToUnit] = useState<string>(conversionCategories[0].units[1].symbol);
  const [inputValue, setInputValue] = useState<string>("1");
  const [outputValue, setOutputValue] = useState<string>("");
  const [history, setHistory] = useState<string[]>([]);
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);
  
  const [isAiSuggesting, startAiSuggestion] = useTransition();

  const debouncedInput = useDebounce(inputValue, 500);

  const currentUnits = useMemo(() => selectedCategory.units, [selectedCategory]);

  useEffect(() => {
    setFromUnit(currentUnits[0].symbol);
    setToUnit(currentUnits.length > 1 ? currentUnits[1].symbol : currentUnits[0].symbol);
  }, [currentUnits]);

  useEffect(() => {
    const performConversion = () => {
      const numValue = parseFloat(inputValue);
      if (isNaN(numValue) || !fromUnit || !toUnit) {
        setOutputValue("");
        return;
      }
      const result = selectedCategory.convert(numValue, fromUnit, toUnit);
      if (isNaN(result)) {
        setOutputValue("");
        return;
      }
      
      setOutputValue(result.toLocaleString(undefined, { maximumFractionDigits: 5, useGrouping: false }));
      
      const conversionString = `${selectedCategory.name}: ${fromUnit} to ${toUnit}`;
      if (!history.includes(conversionString)) {
        setHistory(prev => [conversionString, ...prev].slice(0, 5));
      }
    };
    performConversion();
  }, [inputValue, fromUnit, toUnit, selectedCategory, history]);

  useEffect(() => {
    if (debouncedInput.trim() === "" || Number.isNaN(parseFloat(debouncedInput))) {
        setSuggestedCategories([]);
        return;
    }
    
    startAiSuggestion(async () => {
      try {
        const suggestions = await suggestCategory({
            input: debouncedInput,
            conversionHistory: history
        });
        setSuggestedCategories(suggestions.suggestedCategories.filter(c => conversionCategories.some(cc => cc.name === c)));
      } catch (error) {
        console.error("AI suggestion failed:", error);
        setSuggestedCategories([]);
        toast({
          variant: "destructive",
          title: "AI Suggestion Error",
          description: "Could not fetch smart category suggestions.",
        })
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedInput, history, toast]);

  const handleCategoryChange = (categoryName: string) => {
    const category = conversionCategories.find(c => c.name === categoryName);
    if (category) {
      setSelectedCategory(category);
    }
  };

  const handleSwapUnits = () => {
    const currentInput = inputValue;
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    setInputValue(outputValue.replace(/,/g, ''));
  };
  
  return (
    <Card className="w-full max-w-md mx-auto shadow-2xl bg-card">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/20 rounded-lg">
                <selectedCategory.icon className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-3xl font-headline tracking-tight">UniConvert</CardTitle>
        </div>
        <CardDescription>A clean, fast, and smart unit converter.</CardDescription>
        { (isAiSuggesting || suggestedCategories.length > 0) && (
            <div className="flex flex-wrap items-center gap-2 pt-4">
                {isAiSuggesting ? (
                    <Badge variant="secondary" className="gap-1.5 font-normal"><Loader2 className="h-3 w-3 animate-spin" /> Smart suggestions...</Badge>
                ) : (
                  <>
                    {suggestedCategories.map(cat => (
                        <Badge key={cat} variant="outline" className="cursor-pointer transition-colors hover:bg-accent/50" onClick={() => handleCategoryChange(cat)}>{cat}</Badge>
                    ))}
                  </>
                )}
            </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
            <Label>Category</Label>
            <Select value={selectedCategory.name} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full text-base py-6">
                    <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                    {conversionCategories.map(cat => (
                        <SelectItem key={cat.name} value={cat.name}>
                            <div className="flex items-center gap-2">
                                <cat.icon className="w-4 h-4 text-muted-foreground" />
                                <span>{cat.name}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        
        <div className="grid grid-cols-1 gap-4 items-end sm:grid-cols-[1fr_auto_1fr]">
          <div className="space-y-2">
            <Label htmlFor="from-value">From</Label>
            <Input
              id="from-value"
              type="number"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              className="text-lg h-auto py-3"
            />
            <UnitSelect units={currentUnits} value={fromUnit} onValueChange={setFromUnit} />
          </div>

          <Button variant="outline" size="icon" className="hidden sm:flex self-center mb-[44px]" onClick={handleSwapUnits} aria-label="Swap units">
            <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
          </Button>

          <div className="space-y-2">
            <Label htmlFor="to-value">To</Label>
            <div id="to-value" className="flex items-center h-auto py-3 min-h-[48px] w-full rounded-md border border-input bg-muted/50 px-3 text-lg text-foreground font-semibold">
              {outputValue}
            </div>
            <UnitSelect units={currentUnits} value={toUnit} onValueChange={setToUnit} />
          </div>
        </div>
        
        <Button variant="outline" size="sm" className="w-full flex sm:hidden" onClick={handleSwapUnits}>
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Swap Units
        </Button>
      </CardContent>
    </Card>
  );
}

function Label({ children }: { children: React.ReactNode }) {
    return (
        <label className="text-sm font-medium text-muted-foreground ml-1">
            {children}
        </label>
    );
}

function UnitSelect({ units, value, onValueChange }: { units: Unit[], value: string, onValueChange: (value: string) => void }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-auto">
        <SelectValue placeholder="Select unit" />
      </SelectTrigger>
      <SelectContent>
        {units.map(unit => (
          <SelectItem key={unit.symbol} value={unit.symbol}>
            {unit.name} ({unit.symbol})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
