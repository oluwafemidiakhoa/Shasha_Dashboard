import React from 'react';
import type { FxRate } from '../types';
import { formatCurrency, formatPercentage } from '../utils/formatters';

interface ExchangeRatesProps {
  rates: FxRate[];
  loading: boolean;
}

export const ExchangeRates: React.FC<ExchangeRatesProps> = ({ rates, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Exchange Rates</h2>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Exchange Rates</h2>
      <div className="space-y-4">
        {rates.map((rate) => (
          <div key={rate.pair} className="border-b border-gray-100 pb-3 last:border-0">
            <div className="flex justify-between items-start mb-2">
              <span className="font-medium text-gray-700">{rate.pair}</span>
              <span className="text-xl font-bold">
                {formatCurrency(rate.latest)}
              </span>
            </div>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-gray-500">MoM:</span>
                <span className={`ml-1 font-medium ${rate.mom >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(rate.mom)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">YoY:</span>
                <span className={`ml-1 font-medium ${rate.yoy >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(rate.yoy)}
                </span>
              </div>
            </div>
            {Math.abs(rate.mom) >= 3 && (
              <div className="mt-2 text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
                ⚡ Significant monthly movement (&gt;3%)
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};