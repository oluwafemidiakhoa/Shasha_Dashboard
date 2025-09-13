import { z } from 'zod';
import type { FxRate } from '../types';

const FX_BASE = 'https://api.exchangerate.host';

const FxTimeseriesSchema = z.object({
  success: z.boolean().optional(),
  rates: z.record(z.string(), z.record(z.string(), z.number()))
});

const FxLatestSchema = z.object({
  success: z.boolean().optional(),
  rates: z.record(z.string(), z.number())
});

const cache = new Map<string, { data: any; timestamp: number }>();
const FX_CACHE_TTL = 60 * 60 * 1000; // 60 minutes

function getCached(key: string): any | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < FX_CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export async function fetchFxTimeseries(
  base: string = 'USD',
  symbols: string[] = ['NGN', 'GBP', 'EUR'],
  months: number = 13
): Promise<Record<string, Array<{ date: string; value: number }>>> {
  const cacheKey = `fx:${base}:${symbols.join(',')}:${months}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const end = new Date();
  const start = new Date(end);
  start.setMonth(end.getMonth() - months);

  const params = new URLSearchParams({
    base,
    symbols: symbols.join(','),
    start_date: start.toISOString().slice(0, 10),
    end_date: end.toISOString().slice(0, 10)
  });

  const response = await fetch(`${FX_BASE}/timeseries?${params}`);
  if (!response.ok) {
    throw new Error(`FX API error: ${response.status}`);
  }

  const json = await response.json();
  const validated = FxTimeseriesSchema.parse(json);

  const result: Record<string, Array<{ date: string; value: number }>> = {};
  for (const symbol of symbols) {
    result[symbol] = [];
  }

  const dates = Object.keys(validated.rates || {}).sort();
  for (const date of dates) {
    const row = validated.rates?.[date] || {};
    for (const symbol of symbols) {
      const value = row[symbol];
      if (typeof value === 'number') {
        result[symbol].push({ date, value });
      }
    }
  }

  setCache(cacheKey, result);
  return result;
}

export async function fetchFxLatest(
  base: string = 'USD',
  symbols: string[] = ['NGN', 'GBP', 'EUR']
): Promise<Record<string, number>> {
  const cacheKey = `fx:latest:${base}:${symbols.join(',')}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    base,
    symbols: symbols.join(',')
  });

  const response = await fetch(`${FX_BASE}/latest?${params}`);
  if (!response.ok) {
    throw new Error(`FX API error: ${response.status}`);
  }

  const json = await response.json();
  const validated = FxLatestSchema.parse(json);

  setCache(cacheKey, validated.rates || {});
  return validated.rates || {};
}

function computeFxDeltas(series: Array<{ date: string; value: number }>): {
  latest: number;
  mom: number;
  yoy: number;
} {
  if (!series || series.length === 0) {
    return { latest: NaN, mom: NaN, yoy: NaN };
  }

  const latest = series[series.length - 1]?.value || NaN;
  const m1 = series[series.length - 2]?.value;
  const y1 = series[series.length - 13]?.value;

  const mom = m1 ? ((latest / m1) - 1) * 100 : NaN;
  const yoy = y1 ? ((latest / y1) - 1) * 100 : NaN;

  return { latest, mom, yoy };
}

export async function fetchFxRates(): Promise<FxRate[]> {
  const symbols = ['NGN', 'GBP', 'EUR'];
  const timeseries = await fetchFxTimeseries('USD', symbols);
  
  const rates: FxRate[] = [];
  for (const symbol of symbols) {
    const series = timeseries[symbol];
    const { latest, mom, yoy } = computeFxDeltas(series);
    
    rates.push({
      pair: `USD/${symbol}`,
      latest,
      mom,
      yoy,
      series
    });
  }

  return rates;
}