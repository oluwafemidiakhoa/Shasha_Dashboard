import { z } from 'zod';
import type { Indicator, IndicatorId } from '../types';
import { computeTrend, calculateYoY, calculateMoM } from '../utils/trends';

const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations';

const FredResponseSchema = z.object({
  observations: z.array(z.object({
    date: z.string(),
    value: z.string()
  }))
});

export const SERIES_METADATA = {
  CPI: { id: 'CPIAUCSL', label: 'Consumer Price Index', unit: 'index' as const },
  UNRATE: { id: 'UNRATE', label: 'Unemployment Rate', unit: 'percent' as const },
  DGS10: { id: 'DGS10', label: '10-Year Treasury', unit: 'percent' as const },
  DGS3MO: { id: 'DGS3MO', label: '3-Month Treasury', unit: 'percent' as const },
  MORTGAGE30US: { id: 'MORTGAGE30US', label: '30-Year Mortgage Rate', unit: 'percent' as const }
};

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key: string): any | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export async function fetchFredSeries(
  seriesId: string, 
  apiKey: string, 
  months: number = 60
): Promise<Array<{ date: string; value: number }>> {
  const cacheKey = `fred:${seriesId}:${months}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const end = new Date();
  const start = new Date(end);
  start.setMonth(end.getMonth() - months - 1);
  
  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: apiKey,
    file_type: 'json',
    observation_start: start.toISOString().slice(0, 10),
    observation_end: end.toISOString().slice(0, 10)
  });

  const response = await fetch(`${FRED_BASE}?${params}`);
  if (!response.ok) {
    throw new Error(`FRED API error: ${response.status}`);
  }

  const json = await response.json();
  const validated = FredResponseSchema.parse(json);
  
  const series = validated.observations
    .map(obs => ({
      date: obs.date,
      value: parseFloat(obs.value)
    }))
    .filter(point => !isNaN(point.value) && point.value !== null);

  setCache(cacheKey, series);
  return series;
}

export async function fetchIndicator(
  id: IndicatorId,
  apiKey: string
): Promise<Indicator> {
  const metadata = SERIES_METADATA[id];
  const series = await fetchFredSeries(metadata.id, apiKey);
  
  if (series.length < 13) {
    throw new Error(`Insufficient data for ${id}`);
  }

  const latest = series[series.length - 1].value;
  const yoy = calculateYoY(series);
  const mom = calculateMoM(series);
  const trend = computeTrend(series, mom, metadata.unit);

  return {
    id,
    label: metadata.label,
    unit: metadata.unit,
    latest,
    yoy,
    mom,
    trend,
    updatedAt: series[series.length - 1].date,
    series
  };
}

export async function fetchAllIndicators(apiKey: string): Promise<Indicator[]> {
  const indicators = await Promise.all(
    Object.keys(SERIES_METADATA).map(id => 
      fetchIndicator(id as IndicatorId, apiKey)
    )
  );
  return indicators;
}