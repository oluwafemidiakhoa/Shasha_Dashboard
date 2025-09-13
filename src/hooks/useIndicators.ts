import { useState, useEffect, useCallback } from 'react';
import type { Indicator, FxRate, Idea } from '../types';
import { fetchAllIndicators } from '../services/economicDataService';
import { fetchFxRates } from '../services/fxService';
import { getIdeas } from '../utils/trends';

interface UseIndicatorsResult {
  indicators: Indicator[];
  fxRates: FxRate[];
  ideas: Idea[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useIndicators(): UseIndicatorsResult {
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [fxRates, setFxRates] = useState<FxRate[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const apiKey = import.meta.env.VITE_FRED_API_KEY;
      if (!apiKey) {
        throw new Error('FRED API key not configured. Please set VITE_FRED_API_KEY in your environment.');
      }

      const [indicatorsData, fxData] = await Promise.all([
        fetchAllIndicators(apiKey),
        fetchFxRates()
      ]);

      setIndicators(indicatorsData);
      setFxRates(fxData);

      // Generate ideas
      const indicatorsMap = indicatorsData.reduce((acc, ind) => {
        acc[ind.id] = ind;
        return acc;
      }, {} as Record<string, Indicator>);

      const fxMap = fxData.reduce((acc, fx) => {
        const key = fx.pair.replace('/', '').replace('USD', '');
        acc[`USD${key}`] = fx;
        return acc;
      }, {} as Record<string, FxRate>);

      const generatedIdeas = getIdeas(indicatorsMap, fxMap);
      setIdeas(generatedIdeas);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    indicators,
    fxRates,
    ideas,
    loading,
    error,
    refresh: fetchData
  };
}