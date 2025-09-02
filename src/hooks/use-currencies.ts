
import { useState, useEffect } from 'react';
import { getCurrencies, type Currency } from '@/lib/currency';

export function useCurrencies() {
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let isMounted = true;
        
        const fetchCurrencies = async () => {
            try {
                setLoading(true);
                const currencyList = await getCurrencies();
                if (isMounted) {
                    setCurrencies(currencyList);
                }
            } catch (e) {
                if (isMounted) {
                    setError(e instanceof Error ? e : new Error('Failed to fetch currencies'));
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchCurrencies();

        return () => {
            isMounted = false;
        };
    }, []);

    return { currencies, loading, error };
}
