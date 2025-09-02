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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
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
    setInputValue("1");
  }, [selectedCategory, currentUnits]);

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
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    setInputValue(outputValue.replace(/,/g, ''));
  };
  
  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-6">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary">UNIT CONVERTER</h1>
      </header>
      
      <Tabs value={selectedCategory.name} onValueChange={handleCategoryChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted/80 backdrop-blur-sm rounded-lg p-1">
          {conversionCategories.map(cat => (
            <TabsTrigger key={cat.name} value={cat.name} className="flex items-center gap-2 text-base data-[state=active]:bg-background data-[state=active]:shadow-md">
                <cat.icon className="w-5 h-5" />
                <span>{cat.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        <Card className="mt-6 bg-card/50 border-2 border-border/80 rounded-2xl shadow-lg backdrop-blur-xl">
          <CardContent className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
              <ConversionInput
                label="FROM"
                units={currentUnits}
                selectedUnit={fromUnit}
                onUnitChange={setFromUnit}
                value={inputValue}
                onValueChange={setInputValue}
              />
              
              <Button variant="outline" size="icon" className="hidden md:flex justify-self-center self-center mt-8 rounded-full h-12 w-12 bg-background hover:bg-muted" onClick={handleSwapUnits} aria-label="Swap units">
                <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
              </Button>
              <Button variant="outline" className="flex md:hidden w-full mt-2" onClick={handleSwapUnits} aria-label="Swap units">
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Swap
              </Button>

              <ConversionInput
                label="TO"
                units={currentUnits}
                selectedUnit={toUnit}
                onUnitChange={setToUnit}
                value={outputValue}
                isReadOnly
              />
            </div>
            { (isAiSuggesting || suggestedCategories.length > 0) && (
              <div className="flex flex-wrap items-center gap-2 pt-6 justify-center">
                  {isAiSuggesting ? (
                      <div className="flex items-center text-sm text-muted-foreground gap-1.5 font-normal"><Loader2 className="h-4 w-4 animate-spin" /> Thinking...</div>
                  ) : (
                    <>
                      {suggestedCategories.map(cat => (
                          <Button key={cat} variant="ghost" size="sm" className="transition-colors hover:bg-accent/20" onClick={() => handleCategoryChange(cat)}>{cat}</Button>
                      ))}
                    </>
                  )}
              </div>
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}

function ConversionInput({
  label,
  units,
  selectedUnit,
  onUnitChange,
  value,
  onValueChange,
  isReadOnly = false
}: {
  label: string;
  units: Unit[];
  selectedUnit: string;
  onUnitChange: (value: string) => void;
  value: string;
  onValueChange?: (value: string) => void;
  isReadOnly?: boolean;
}) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-muted-foreground ml-2">{label}</label>
      <div className="relative">
        <Input
          type={isReadOnly ? "text" : "number"}
          value={value}
          onChange={onValueChange ? (e) => onValueChange(e.target.value) : undefined}
          readOnly={isReadOnly}
          className="text-4xl font-bold h-auto py-3 pr-28 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 pl-2"
          placeholder="0"
        />
        <div className="absolute right-0 top-0 h-full">
          <UnitSelect units={units} value={selectedUnit} onValueChange={onUnitChange} />
        </div>
      </div>
    </div>
  );
}


function UnitSelect({ units, value, onValueChange }: { units: Unit[], value: string, onValueChange: (value: string) => void }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-full w-auto bg-transparent border-0 text-muted-foreground text-sm font-medium focus:ring-0">
        <SelectValue placeholder="Unit" />
      </SelectTrigger>
      <SelectContent>
        {units.map(unit => (
          <SelectItem key={unit.symbol} value={unit.symbol}>
            {unit.symbol}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
