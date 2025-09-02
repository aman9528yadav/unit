
const API_BASE_URL = 'https://api.frankfurter.app';

export interface Currency {
    name: string;
    symbol: string;
}

// Cache for the currencies list
let currenciesCache: Currency[] | null = null;
let currenciesPromise: Promise<Currency[]> | null = null;

export const getCurrencies = async (): Promise<Currency[]> => {
    if (currenciesCache) {
        return currenciesCache;
    }

    // If a request is already in flight, return its promise
    if (currenciesPromise) {
        return currenciesPromise;
    }

    // Create a new promise for this request
    currenciesPromise = (async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/currencies`);
            if (!response.ok) {
                throw new Error('Failed to fetch currencies');
            }
            const data: { [key: string]: string } = await response.json();
            
            const currencyList = Object.entries(data).map(([symbol, name]) => ({
                symbol,
                name,
            }));

            currenciesCache = currencyList;
            return currencyList;
        } catch (error) {
            console.error("Error fetching currencies:", error);
            // In case of error, reset the promise to allow retries
            currenciesPromise = null;
            return []; // Return empty array on error
        }
    })();

    return currenciesPromise;
};

// Cache for rates to avoid redundant API calls within a short time
// Key format: "FROM-TO", e.g., "USD-EUR"
const ratesCache = new Map<string, { rate: number, timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export const getLatestRate = async (from: string, to: string): Promise<number | null> => {
    const cacheKey = `${from}-${to}`;
    const cached = ratesCache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
        return cached.rate;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/latest?from=${from}&to=${to}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch rate for ${from} to ${to}`);
        }
        const data = await response.json();
        const rate = data.rates[to];

        if (typeof rate !== 'number') {
            throw new Error(`Invalid rate received for ${from} to ${to}`);
        }
        
        // Cache the new rate
        ratesCache.set(cacheKey, { rate, timestamp: Date.now() });

        return rate;
    } catch (error) {
        console.error("Error fetching latest rate:", error);
        return null; // Return null on error
    }
};
