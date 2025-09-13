import type { Indicator, FxRate } from '../types';

export function exportCurrentIndicatorsCSV(indicators: Indicator[]): string {
  const headers = ['indicator', 'label', 'latest', 'yoy', 'mom', 'trend', 'updatedAt', 'unit'];
  const rows = [headers.join(',')];

  for (const indicator of indicators) {
    const row = [
      indicator.id,
      `"${indicator.label}"`,
      indicator.latest.toFixed(2),
      indicator.yoy.toFixed(2),
      indicator.mom.toFixed(2),
      indicator.trend,
      indicator.updatedAt,
      indicator.unit
    ];
    rows.push(row.join(','));
  }

  return rows.join('\n');
}

export function exportHistoricalSeriesCSV(indicators: Indicator[]): string {
  const headers = ['indicator', 'date', 'value', 'unit'];
  const rows = [headers.join(',')];

  for (const indicator of indicators) {
    for (const point of indicator.series) {
      const row = [
        indicator.id,
        point.date,
        point.value.toFixed(2),
        indicator.unit
      ];
      rows.push(row.join(','));
    }
  }

  return rows.join('\n');
}

export function exportFxSeriesCSV(fxRates: FxRate[]): string {
  const headers = ['pair', 'date', 'rate'];
  const rows = [headers.join(',')];

  for (const fx of fxRates) {
    if (fx.series) {
      for (const point of fx.series) {
        const row = [
          fx.pair,
          point.date,
          point.value.toFixed(4)
        ];
        rows.push(row.join(','));
      }
    }
  }

  return rows.join('\n');
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export function exportAllData(indicators: Indicator[], fxRates: FxRate[]): void {
  const timestamp = new Date().toISOString().slice(0, 10);
  
  // Export current indicators
  const currentCSV = exportCurrentIndicatorsCSV(indicators);
  downloadCSV(currentCSV, `indicators_current_${timestamp}.csv`);
  
  // Export historical series
  const historicalCSV = exportHistoricalSeriesCSV(indicators);
  downloadCSV(historicalCSV, `indicators_historical_${timestamp}.csv`);
  
  // Export FX series
  const fxCSV = exportFxSeriesCSV(fxRates);
  downloadCSV(fxCSV, `fx_rates_${timestamp}.csv`);
}