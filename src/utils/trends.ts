import type { Trend, Unit } from '../types';

export const THRESHOLDS = {
  index: {
    stable: 0.1,
    volatilityMultiplier: 1.25
  },
  percent: {
    stable: 0.15,
    volatilityMultiplier: 1.25
  },
  rate: {
    stable: 0.15,
    volatilityMultiplier: 1.25
  }
};

export function calculateYoY(series: Array<{ date: string; value: number }>): number {
  if (!series || series.length < 13) return NaN;
  
  const latest = series[series.length - 1].value;
  const yearAgo = series[series.length - 13]?.value;
  
  if (!yearAgo || yearAgo === 0) return NaN;
  
  return ((latest / yearAgo) - 1) * 100;
}

export function calculateMoM(series: Array<{ date: string; value: number }>): number {
  if (!series || series.length < 2) return NaN;
  
  const latest = series[series.length - 1].value;
  const monthAgo = series[series.length - 2]?.value;
  
  if (!monthAgo || monthAgo === 0) return NaN;
  
  return ((latest / monthAgo) - 1) * 100;
}

export function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  
  return Math.sqrt(variance);
}

export function computeTrend(
  series: Array<{ date: string; value: number }>,
  mom: number,
  unit: Unit
): Trend {
  if (!Number.isFinite(mom)) return 'STABLE';
  
  // Calculate 6-month rolling volatility
  const last7 = series.slice(-7).map((point, i, arr) => {
    if (i === 0) return null;
    const prev = arr[i - 1].value;
    const curr = point.value;
    if (prev === 0) return null;
    return ((curr / prev) - 1) * 100;
  }).filter((v): v is number => v !== null);
  
  const volatility = calculateStandardDeviation(last7);
  const threshold = THRESHOLDS[unit];
  
  // Check if stable
  if (Math.abs(mom) <= threshold.stable) {
    return 'STABLE';
  }
  
  // Check if volatile
  if (Math.abs(mom) > threshold.volatilityMultiplier * volatility && volatility > 0) {
    return mom > 0 ? 'VOLATILE_UP' : 'VOLATILE_DOWN';
  }
  
  // Otherwise rising or falling based on MoM
  return mom > 0 ? 'RISING' : 'FALLING';
}

export function getIdeas(
  indicators: Record<string, any>,
  fx: Record<string, any>
): Array<{ title: string; rationale: string; confidence: number }> {
  const ideas = [];
  
  const d3 = indicators.DGS3MO;
  const d10 = indicators.DGS10;
  const cpi = indicators.CPI;
  const unrate = indicators.UNRATE;
  const mortgage = indicators.MORTGAGE30US;
  const usdngn = fx.USDNGN;

  // Cash vs Bonds
  if (d3?.latest >= 4.5) {
    ideas.push({
      title: 'Earn yield on idle cash',
      rationale: 'Short T-Bills/HYSA may offer attractive yields versus checking accounts.',
      confidence: 0.9
    });
  }

  if (d3?.latest >= d10?.latest && cpi?.yoy >= 0) {
    ideas.push({
      title: 'Stay short duration',
      rationale: 'Yield curve inversion with non-falling inflation favors short-duration over long bonds.',
      confidence: 0.7
    });
  }

  if (d10?.mom < 0 && unrate?.latest <= 4) {
    ideas.push({
      title: 'Consider intermediate bonds',
      rationale: 'Falling 10-year yields with low unemployment suggests duration exposure may be favorable.',
      confidence: 0.6
    });
  }

  // Risk-on/off equity
  if (unrate?.yoy <= -0.2 && cpi?.mom <= 0) {
    ideas.push({
      title: 'Risk-on DCA',
      rationale: 'Improving labor + non-accelerating inflation supports steady DCA into broad equities.',
      confidence: 0.6
    });
  }

  if (cpi?.mom > 0.3 || cpi?.trend === 'VOLATILE_UP') {
    ideas.push({
      title: 'De-risk portfolio',
      rationale: 'Rising/volatile inflation suggests increasing cash buffer and defensive positioning.',
      confidence: 0.65
    });
  }

  // Mortgage/Refi
  if (mortgage?.mom <= -0.25) {
    ideas.push({
      title: 'Refi check',
      rationale: 'Mortgage rates dropped ≥25bp MoM; consider a refinance quote.',
      confidence: 0.65
    });
  }

  // FX
  if (usdngn && Math.abs(usdngn.mom) >= 3) {
    const direction = usdngn.mom > 0 ? 'weakening' : 'strengthening';
    ideas.push({
      title: 'Optimize USD↔NGN conversions',
      rationale: `NGN ${direction} >3% MoM. Use big monthly moves to batch or stagger transfers depending on direction.`,
      confidence: 0.8
    });
  }

  return ideas.slice(0, 5);
}