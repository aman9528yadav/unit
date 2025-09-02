import { Ruler, Scale, Thermometer, Database, Clock, Zap, Square, Beaker } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type Region = 'International' | 'India';

export type Unit = {
  name: string;
  symbol: string;
  info?: string;
  region?: Region;
};

// For simple linear conversions
type LinearConversionFactors = { [unitSymbol: string]: number };

// For complex conversions (Temperature)
type ConversionFunctions = { [from: string]: { [to: string]: (value: number) => number } };

export type ConversionCategory = {
  name: 'Length' | 'Weight' | 'Temperature' | 'Data' | 'Time' | 'Speed' | 'Area' | 'Volume';
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
  { name: 'Nautical Miles', symbol: 'nmi', info: '1nmi = 1852 m' },
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
  'nmi': 1852,
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
    { name: 'Metric Tonnes', symbol: 't', info: '1t = 1000 kg' },
    { name: 'Pounds', symbol: 'lb', info: '1lb = 0.453592 kg' },
    { name: 'Ounces', symbol: 'oz', info: '1oz = 0.0283495 kg' },
    { name: 'Quintal', symbol: 'q', info: '1q = 100 kg', region: 'India' },
    { name: 'Tola', symbol: 'tola', info: '1 tola ≈ 11.6638 g', region: 'India' },
    { name: 'Ratti', symbol: 'ratti', info: '1 ratti ≈ 0.1215 g', region: 'India' },
];
const weightFactors: LinearConversionFactors = { // to kg
  'kg': 1,
  'g': 0.001,
  'mg': 0.000001,
  't': 1000,
  'lb': 0.453592,
  'oz': 0.0283495,
  'q': 100,
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
    { name: 'Petabytes', symbol: 'PB', info: '1PB = 1024 TB' },
];
const dataFactors: LinearConversionFactors = { // to Bytes
  'B': 1,
  'KB': 1024,
  'MB': 1024 ** 2,
  'GB': 1024 ** 3,
  'TB': 1024 ** 4,
  'PB': 1024 ** 5,
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

// --- TIME ---
const timeUnits: Unit[] = [
    { name: 'Seconds', symbol: 's', info: 'It is the standard unit' },
    { name: 'Minutes', symbol: 'min', info: '1min = 60s' },
    { name: 'Hours', symbol: 'h', info: '1h = 60min' },
    { name: 'Days', symbol: 'd', info: '1d = 24h' },
    { name: 'Weeks', symbol: 'wk', info: '1wk = 7d' },
];
const timeFactors: LinearConversionFactors = { // to seconds
  's': 1,
  'min': 60,
  'h': 3600,
  'd': 86400,
  'wk': 604800,
};
const timeCategory: ConversionCategory = {
    name: 'Time',
    icon: Clock,
    units: timeUnits,
    convert: (value, from, to) => {
        const fromFactor = timeFactors[from];
        const toFactor = timeFactors[to];
        if (fromFactor === undefined || toFactor === undefined) return NaN;
        const valueInBase = value * fromFactor;
        return valueInBase / toFactor;
    },
};

// --- SPEED ---
const speedUnits: Unit[] = [
    { name: 'Meters/second', symbol: 'm/s', info: 'It is the standard unit' },
    { name: 'Kilometers/hour', symbol: 'km/h', info: 'Commonly used for vehicles' },
    { name: 'Miles/hour', symbol: 'mph', info: 'Used in the US and UK' },
    { name: 'Knots', symbol: 'kn', info: 'Used in maritime/aviation' },
];
const speedFactors: LinearConversionFactors = { // to m/s
  'm/s': 1,
  'km/h': 1 / 3.6,
  'mph': 0.44704,
  'kn': 0.514444,
};
const speedCategory: ConversionCategory = {
    name: 'Speed',
    icon: Zap,
    units: speedUnits,
    convert: (value, from, to) => {
        const fromFactor = speedFactors[from];
        const toFactor = speedFactors[to];
        if (fromFactor === undefined || toFactor === undefined) return NaN;
        const valueInBase = value * fromFactor;
        return valueInBase / toFactor;
    },
};

// --- AREA ---
const areaUnits: Unit[] = [
    { name: 'Square Meters', symbol: 'm²', info: 'It is the standard unit' },
    { name: 'Square Kilometers', symbol: 'km²', info: '1km² = 1,000,000m²' },
    { name: 'Square Miles', symbol: 'mi²', info: '1mi² ≈ 2.59e6 m²' },
    { name: 'Square Feet', symbol: 'ft²', info: '1ft² = 0.0929 m²' },
    { name: 'Square Inches', symbol: 'in²', info: '1in² = 0.000645 m²' },
    { name: 'Hectares', symbol: 'ha', info: '1ha = 10,000 m²' },
    { name: 'Acres', symbol: 'acre', info: '1 acre ≈ 4046.86 m²' },
    { name: 'Bigha', symbol: 'bigha', info: 'Varies by region', region: 'India' },
];
const areaFactors: LinearConversionFactors = { // to m²
  'm²': 1,
  'km²': 1000000,
  'mi²': 2589988.11,
  'ft²': 0.092903,
  'in²': 0.00064516,
  'ha': 10000,
  'acre': 4046.86,
  'bigha': 2508.38, // Note: This is an approximation for some regions.
};
const areaCategory: ConversionCategory = {
    name: 'Area',
    icon: Square,
    units: areaUnits,
    convert: (value, from, to, region) => {
        // Special handling for Indian units that vary
        let bighaFactor = areaFactors['bigha'];
        if (from === 'bigha' || to === 'bigha') {
            // In a real app, you might have a sub-region selector
            // For now, we use a common (but not universal) value.
        }

        const customFactors = {...areaFactors, 'bigha': bighaFactor};

        const fromFactor = customFactors[from];
        const toFactor = customFactors[to];
        if (fromFactor === undefined || toFactor === undefined) return NaN;
        const valueInBase = value * fromFactor;
        return valueInBase / toFactor;
    },
};

// --- VOLUME ---
const volumeUnits: Unit[] = [
    { name: 'Liters', symbol: 'L', info: 'It is the standard unit' },
    { name: 'Milliliters', symbol: 'mL', info: '1mL = 0.001L' },
    { name: 'US Gallons', symbol: 'gal', info: '1gal = 3.78541L' },
    { name: 'US Quarts', symbol: 'qt', info: '1qt = 0.946353L' },
    { name: 'US Pints', symbol: 'pt', info: '1pt = 0.473176L' },
    { name: 'US Cups', symbol: 'cup', info: '1cup = 0.24L' },
    { name: 'US Fluid Ounces', symbol: 'fl-oz', info: '1fl-oz = 0.0295735L' },
];
const volumeFactors: LinearConversionFactors = { // to Liters
    'L': 1,
    'mL': 0.001,
    'gal': 3.78541,
    'qt': 0.946353,
    'pt': 0.473176,
    'cup': 0.24,
    'fl-oz': 0.0295735,
};
const volumeCategory: ConversionCategory = {
    name: 'Volume',
    icon: Beaker,
    units: volumeUnits,
    convert: (value, from, to) => {
        const fromFactor = volumeFactors[from];
        const toFactor = volumeFactors[to];
        if (fromFactor === undefined || toFactor === undefined) return NaN;
        const valueInBase = value * fromFactor;
        return valueInBase / toFactor;
    },
};


export const conversionCategories: ConversionCategory[] = [lengthCategory, weightCategory, temperatureCategory, dataCategory, timeCategory, speedCategory, areaCategory, volumeCategory];
