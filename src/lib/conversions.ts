

import { Ruler, Scale, Thermometer, Database, Clock, Zap, Square, Beaker, Hourglass, Gauge, Flame, DollarSign, Fuel } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type Region = 'International' | 'India' | 'Japan' | 'Korea' | 'China' | 'Middle East';

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
  name: string; // Allow any string for custom categories
  icon: LucideIcon;
  units: Unit[];
  factors?: LinearConversionFactors;
  convert: (value: number, from: string, to: string, region?: Region) => number | Promise<number>;
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
  factors: lengthFactors,
  convert: function(value, from, to) {
    const fromFactor = this.factors![from];
    const toFactor = this.factors![to];
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
    factors: weightFactors,
    convert: function(value, from, to) {
        const fromFactor = this.factors![from];
        const toFactor = this.factors![to];
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
    factors: dataFactors,
    convert: function(value, from, to) {
        const fromFactor = this.factors![from];
        const toFactor = this.factors![to];
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
    factors: timeFactors,
    convert: function(value, from, to) {
        const fromFactor = this.factors![from];
        const toFactor = this.factors![to];
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
    factors: speedFactors,
    convert: function(value, from, to) {
        const fromFactor = this.factors![from];
        const toFactor = this.factors![to];
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
    factors: areaFactors,
    convert: function(value, from, to, region) {
        // Special handling for Indian units that vary
        let bighaFactor = this.factors!['bigha'];
        if (from === 'bigha' || to === 'bigha') {
            // In a real app, you might have a sub-region selector
            // For now, we use a common (but not universal) value.
        }

        const customFactors = {...this.factors, 'bigha': bighaFactor};

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
    factors: volumeFactors,
    convert: function(value, from, to) {
        const fromFactor = this.factors![from];
        const toFactor = this.factors![to];
        if (fromFactor === undefined || toFactor === undefined) return NaN;
        const valueInBase = value * fromFactor;
        return valueInBase / toFactor;
    },
};

// --- PRESSURE ---
const pressureUnits: Unit[] = [
    { name: 'Pascal', symbol: 'Pa', info: 'It is the standard unit' },
    { name: 'Kilopascal', symbol: 'kPa', info: '1kPa = 1000 Pa' },
    { name: 'Bar', symbol: 'bar', info: '1bar = 100,000 Pa' },
    { name: 'Standard atmosphere', symbol: 'atm', info: '1atm ≈ 101325 Pa' },
    { name: 'Pounds per square inch', symbol: 'psi', info: '1psi ≈ 6894.76 Pa' },
];
const pressureFactors: LinearConversionFactors = { // to Pascal
    'Pa': 1,
    'kPa': 1000,
    'bar': 100000,
    'atm': 101325,
    'psi': 6894.76,
};
const pressureCategory: ConversionCategory = {
    name: 'Pressure',
    icon: Gauge,
    units: pressureUnits,
    factors: pressureFactors,
    convert: function(value, from, to) {
        const fromFactor = this.factors![from];
        const toFactor = this.factors![to];
        if (fromFactor === undefined || toFactor === undefined) return NaN;
        const valueInBase = value * fromFactor;
        return valueInBase / toFactor;
    },
};

// --- ENERGY ---
const energyUnits: Unit[] = [
    { name: 'Joule', symbol: 'J', info: 'It is the standard unit' },
    { name: 'Kilojoule', symbol: 'kJ', info: '1kJ = 1000 J' },
    { name: 'Calorie', symbol: 'cal', info: '1cal ≈ 4.184 J' },
    { name: 'Kilocalorie', symbol: 'kcal', info: '1kcal = 1000 cal' },
    { name: 'Kilowatt-hour', symbol: 'kWh', info: '1kWh = 3.6e+6 J' },
];
const energyFactors: LinearConversionFactors = { // to Joule
    'J': 1,
    'kJ': 1000,
    'cal': 4.184,
    'kcal': 4184,
    'kWh': 3600000,
};
const energyCategory: ConversionCategory = {
    name: 'Energy',
    icon: Flame,
    units: energyUnits,
    factors: energyFactors,
    convert: function(value, from, to) {
        const fromFactor = this.factors![from];
        const toFactor = this.factors![to];
        if (fromFactor === undefined || toFactor === undefined) return NaN;
        const valueInBase = value * fromFactor;
        return valueInBase / toFactor;
    },
};

// --- CURRENCY ---
const currencyUnits: Unit[] = [
    { name: 'United States Dollar', symbol: 'USD', info: 'Base currency' },
    { name: 'Euro', symbol: 'EUR', info: '1 EUR ≈ 1.08 USD' },
    { name: 'Japanese Yen', symbol: 'JPY', info: '1 JPY ≈ 0.0064 USD' },
    { name: 'British Pound', symbol: 'GBP', info: '1 GBP ≈ 1.27 USD' },
    { name: 'Indian Rupee', symbol: 'INR', info: '1 INR ≈ 0.012 USD' },
    { name: 'Australian Dollar', symbol: 'AUD', info: '1 AUD ≈ 0.66 USD' },
    { name: 'Canadian Dollar', symbol: 'CAD', info: '1 CAD ≈ 0.73 USD' },
    { name: 'Swiss Franc', symbol: 'CHF', info: '1 CHF ≈ 1.11 USD' },
    { name: 'Chinese Yuan', symbol: 'CNY', info: '1 CNY ≈ 0.14 USD' },
];
const currencyFactors: LinearConversionFactors = {
    'USD': 1,
    'EUR': 1.08,
    'JPY': 0.0064,
    'GBP': 1.27,
    'INR': 0.012,
    'AUD': 0.66,
    'CAD': 0.73,
    'CHF': 1.11,
    'CNY': 0.14,
};
const currencyCategory: ConversionCategory = {
    name: 'Currency',
    icon: DollarSign,
    units: currencyUnits,
    factors: currencyFactors,
    convert: function(value, from, to) {
        // This is a simplified conversion. For real applications, use a live API.
        const fromFactor = this.factors![from]; // Factor relative to USD
        const toFactor = this.factors![to]; // Factor relative to USD
        if (fromFactor === undefined || toFactor === undefined) return NaN;
        
        // First, convert the value to the base currency (USD)
        const valueInUsd = value * fromFactor;
        
        // Then, convert from the base currency to the target currency
        return valueInUsd / toFactor;
    },
};

// --- FUEL ECONOMY ---
const fuelEconomyUnits: Unit[] = [
    { name: 'Liters per 100km', symbol: 'L/100km', info: 'Standard consumption unit' },
    { name: 'Miles per gallon', symbol: 'MPG', info: 'US standard efficiency unit' },
    { name: 'Kilometers per liter', symbol: 'km/L', info: 'Common efficiency unit' },
];
const fuelEconomyCategory: ConversionCategory = {
    name: 'Fuel Economy',
    icon: Fuel,
    units: fuelEconomyUnits,
    convert: (value, from, to) => {
        if (from === to) return value;
        if (value === 0) return 0;

        let valueInLitersPer100Km: number;

        // First, convert the input value to the base unit (L/100km)
        switch (from) {
            case 'L/100km':
                valueInLitersPer100Km = value;
                break;
            case 'MPG': // US MPG
                valueInLitersPer100Km = 235.214583 / value;
                break;
            case 'km/L':
                valueInLitersPer100Km = 100 / value;
                break;
            default:
                return NaN;
        }

        // Then, convert from the base unit to the target unit
        switch (to) {
            case 'L/100km':
                return valueInLitersPer100Km;
            case 'MPG': // US MPG
                return 235.214583 / valueInLitersPer100Km;
            case 'km/L':
                return 100 / valueInLitersPer100Km;
            default:
                return NaN;
        }
    },
};


export const conversionCategories: ConversionCategory[] = [
    lengthCategory, 
    weightCategory, 
    temperatureCategory, 
    dataCategory, 
    timeCategory, 
    speedCategory, 
    areaCategory, 
    volumeCategory,
    pressureCategory,
    energyCategory,
    currencyCategory,
    fuelEconomyCategory,
];
