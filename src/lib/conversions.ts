import { Ruler, Scale, Thermometer, Database } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type Region = 'International' | 'India';

export type Unit = {
  name: string;
  symbol: string;
  info?: string;
  region?: Region;
};

// For simple linear conversions (Length, Weight)
type LinearConversionFactors = { [unitSymbol: string]: number };

// For complex conversions (Temperature)
type ConversionFunctions = { [from: string]: { [to: string]: (value: number) => number } };

export type ConversionCategory = {
  name: 'Length' | 'Weight' | 'Temperature' | 'Data';
  icon: LucideIcon;
  units: Unit[];
  convert: (value: number, from: string, to: string, region?: Region) => number;
};

// --- LENGTH ---
const lengthUnits: Unit[] = [
  { name: 'Meters', symbol: 'm', info: 'It is the standard unit' },
  { name: 'Kilometers', symbol: 'km', info: '1km = 1000 m' },
  { name: 'Centimeters', symbol: 'cm', info: '1cm = 0.01 m' },
  { name: 'Millimeters', symbol: 'mm', info: '1mm = 0.001 m' },
  { name: 'Miles', symbol: 'mi', info: '1mi = 1609.34 m' },
  { name: 'Yards', symbol: 'yd', info: '1yd = 0.9144 m' },
  { name: 'Feet', symbol: 'ft', info: '1ft = 0.3048 m' },
  { name: 'Inches', symbol: 'in', info: '1in = 0.0254 m' },
  { name: 'Gaj', symbol: 'gaj', info: '1 gaj = 0.9144 m', region: 'India' },
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
  'gaj': 0.9144,
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
    { name: 'Kilograms', symbol: 'kg', info: 'It is the standard unit' },
    { name: 'Grams', symbol: 'g', info: '1g = 0.001 kg' },
    { name: 'Milligrams', symbol: 'mg', info: '1mg = 0.000001 kg' },
    { name: 'Pounds', symbol: 'lb', info: '1lb = 0.453592 kg' },
    { name: 'Ounces', symbol: 'oz', info: '1oz = 0.0283495 kg' },
    { name: 'Tola', symbol: 'tola', info: '1 tola ≈ 11.6638 g', region: 'India' },
    { name: 'Ratti', symbol: 'ratti', info: '1 ratti ≈ 0.1215 g', region: 'India' },
];
const weightFactors: LinearConversionFactors = { // to kg
  'kg': 1,
  'g': 0.001,
  'mg': 0.000001,
  'lb': 0.453592,
  'oz': 0.0283495,
  'tola': 0.0116638,
  'ratti': 0.0001215,
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
    { name: 'Celsius', symbol: '°C', info: 'Used by most of the world' },
    { name: 'Fahrenheit', symbol: '°F', info: 'Used primarily in the US' },
    { name: 'Kelvin', symbol: 'K', info: 'It is the standard unit' },
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

// --- DATA ---
const dataUnits: Unit[] = [
    { name: 'Bytes', symbol: 'B', info: 'It is the standard unit' },
    { name: 'Kilobytes', symbol: 'KB', info: '1KB = 1024 B' },
    { name: 'Megabytes', symbol: 'MB', info: '1MB = 1024 KB' },
    { name: 'Gigabytes', symbol: 'GB', info: '1GB = 1024 MB' },
    { name: 'Terabytes', symbol: 'TB', info: '1TB = 1024 GB' },
];
const dataFactors: LinearConversionFactors = { // to Bytes
  'B': 1,
  'KB': 1024,
  'MB': 1024 ** 2,
  'GB': 1024 ** 3,
  'TB': 1024 ** 4,
};
const dataCategory: ConversionCategory = {
    name: 'Data',
    icon: Database,
    units: dataUnits,
    convert: (value, from, to) => {
        const fromFactor = dataFactors[from];
        const toFactor = dataFactors[to];
        if (fromFactor === undefined || toFactor === undefined) return NaN;
        const valueInBase = value * fromFactor;
        return valueInBase / toFactor;
    },
};


export const conversionCategories: ConversionCategory[] = [lengthCategory, weightCategory, temperatureCategory, dataCategory];

    