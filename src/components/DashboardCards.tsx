import React from 'react';
import type { Indicator } from '../types';
import { formatNumber, formatPercentage, getTrendColor, getTrendIcon } from '../utils/formatters';

interface DashboardCardsProps {
  indicators: Indicator[];
  loading: boolean;
}

export const DashboardCards: React.FC<DashboardCardsProps> = ({ indicators, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {indicators.map((indicator) => (
        <div key={indicator.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-gray-600">{indicator.label}</h3>
            <span 
              className="px-2 py-1 text-xs font-semibold rounded"
              style={{ 
                backgroundColor: `${getTrendColor(indicator.trend)}20`,
                color: getTrendColor(indicator.trend)
              }}
            >
              {getTrendIcon(indicator.trend)} {indicator.trend}
            </span>
          </div>
          
          <div className="mb-4">
            <p className="text-2xl font-bold text-gray-900">
              {formatNumber(indicator.latest, indicator.unit)}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">YoY:</span>
              <span className={`ml-1 font-medium ${indicator.yoy >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(indicator.yoy)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">MoM:</span>
              <span className={`ml-1 font-medium ${indicator.mom >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(indicator.mom)}
              </span>
            </div>
          </div>
          
          <div className="mt-3 text-xs text-gray-400">
            Updated: {indicator.updatedAt}
          </div>
        </div>
      ))}
    </div>
  );
};