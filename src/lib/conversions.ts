import { Ruler, Scale, Thermometer } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type Unit = {
  name: string;
  symbol: string;
};

// For simple linear conversions (Length, Weight)
type LinearConversionFactors = { [unitSymbol: string]: number };

// For complex conversions (Temperature)
type ConversionFunctions = { [from: string]: { [to: string]: (value: number) => number } };

export type ConversionCategory = {
  name: 'Length' | 'Weight' | 'Temperature';
  icon: LucideIcon;
  units: Unit[];
  convert: (value: number, from: string, to: string) => number;
};

// --- LENGTH ---
const lengthUnits: Unit[] = [
  { name: 'Meters', symbol: 'm' },
  { name: 'Kilometers', symbol: 'km' },
  { name: 'Centimeters', symbol: 'cm' },
  { name: 'Millimeters', symbol: 'mm' },
  { name: 'Miles', symbol: 'mi' },
  { name: 'Yards', symbol: 'yd' },
  { name: 'Feet', symbol: 'ft' },
  { name: 'Inches', symbol: 'in' },
];
const lengthFactors: LinearConversionFactors = { // to meter
  'm': 1,
  'km': 1000,
  'cm': 0.01,
  'mm': 0.001,
  'mi': 1609.34,
  'yd': 0.9144,
  'ft': 0.3048,
  'in': 0.0254,
};
const lengthCategory: ConversionCategory = {
  name: 'Length',
  icon: Ruler,
  units: lengthUnits,
  convert: (value, from, to) => {
    const fromFactor = lengthFactors[from];
    const toFactor = lengthFactors[to];
    if (fromFactor === undefined || toFactor === undefined) return NaN;
    const valueInBase = value * fromFactor;
    return valueInBase / toFactor;
  },
};

// --- WEIGHT ---
const weightUnits: Unit[] = [
    { name: 'Kilograms', symbol: 'kg' },
    { name: 'Grams', symbol: 'g' },
    { name: 'Milligrams', symbol: 'mg' },
    { name: 'Pounds', symbol: 'lb' },
    { name: 'Ounces', symbol: 'oz' },
];
const weightFactors: LinearConversionFactors = { // to kg
  'kg': 1,
  'g': 0.001,
  'mg': 0.000001,
  'lb': 0.453592,
  'oz': 0.0283495,
};
const weightCategory: ConversionCategory = {
    name: 'Weight',
    icon: Scale,
    units: weightUnits,
    convert: (value, from, to) => {
        const fromFactor = weightFactors[from];
        const toFactor = weightFactors[to];
        if (fromFactor === undefined || toFactor === undefined) return NaN;
        const valueInBase = value * fromFactor;
        return valueInBase / toFactor;
    },
};

// --- TEMPERATURE ---
const temperatureUnits: Unit[] = [
    { name: 'Celsius', symbol: '°C' },
    { name: 'Fahrenheit', symbol: '°F' },
    { name: 'Kelvin', symbol: 'K' },
];
const tempConversions: ConversionFunctions = {
  '°C': {
    '°F': (c) => (c * 9/5) + 32,
    'K': (c) => c + 273.15,
    '°C': (c) => c,
  },
  '°F': {
    '°C': (f) => (f - 32) * 5/9,
    'K': (f) => ((f - 32) * 5/9) + 273.15,
    '°F': (f) => f,
  },
  'K': {
    '°C': (k) => k - 273.15,
    '°F': (k) => ((k - 273.15) * 9/5) + 32,
    'K': (k) => k,
  }
};
const temperatureCategory: ConversionCategory = {
    name: 'Temperature',
    icon: Thermometer,
    units: temperatureUnits,
    convert: (value, from, to) => {
        const conversionFunc = tempConversions[from]?.[to];
        if (!conversionFunc) return NaN;
        return conversionFunc(value);
    }
};

export const conversionCategories: ConversionCategory[] = [lengthCategory, weightCategory, temperatureCategory];
