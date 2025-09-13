export type IndicatorId = 'CPI' | 'UNRATE' | 'DGS10' | 'DGS3MO' | 'MORTGAGE30US';
export type Unit = 'index' | 'percent' | 'rate';
export type Trend = 'RISING' | 'FALLING' | 'VOLATILE_UP' | 'VOLATILE_DOWN' | 'STABLE';

export interface Indicator {
  id: IndicatorId;
  label: string;
  unit: Unit;
  latest: number;
  yoy: number;
  mom: number;
  trend: Trend;
  updatedAt: string;
  series: Array<{ date: string; value: number }>;
}

export interface FxRate {
  pair: string;
  latest: number;
  mom: number;
  yoy: number;
  series?: Array<{ date: string; value: number }>;
}

export interface Idea {
  title: string;
  rationale: string;
  confidence: number;
}

export interface FredObservation {
  date: string;
  value: string;
}

export interface FredResponse {
  observations: FredObservation[];
}