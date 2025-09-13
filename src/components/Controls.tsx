import React from 'react';
import type { Indicator, FxRate } from '../types';
import { exportAllData } from '../utils/csvExport';
import { SERIES_METADATA } from '../services/economicDataService';

interface ControlsProps {
  selectedIndicators: string[];
  onSelectionChange: (selected: string[]) => void;
  indicators: Indicator[];
  fxRates: FxRate[];
  onRefresh: () => void;
  loading: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
  selectedIndicators,
  onSelectionChange,
  indicators,
  fxRates,
  onRefresh,
  loading
}) => {
  const handleIndicatorToggle = (id: string) => {
    if (selectedIndicators.includes(id)) {
      onSelectionChange(selectedIndicators.filter(s => s !== id));
    } else {
      onSelectionChange([...selectedIndicators, id]);
    }
  };

  const handleExport = () => {
    if (indicators.length > 0 || fxRates.length > 0) {
      exportAllData(indicators, fxRates);
    }
  };

  const lastUpdate = indicators.length > 0 
    ? Math.max(...indicators.map(i => new Date(i.updatedAt).getTime()))
    : null;

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h2 className="text-lg font-semibold">Dashboard Controls</h2>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            ) : (
              '↻'
            )}
            Refresh
          </button>
          <button
            onClick={handleExport}
            disabled={indicators.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📊 Export CSV
          </button>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Chart Indicators</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(SERIES_METADATA).map(([id, meta]) => (
            <label key={id} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIndicators.includes(id)}
                onChange={() => handleIndicatorToggle(id)}
                className="mr-2"
              />
              <span className="text-sm text-gray-600">{meta.label}</span>
            </label>
          ))}
        </div>
      </div>

      {lastUpdate && (
        <div className="text-xs text-gray-500">
          Last updated: {new Date(lastUpdate).toLocaleString()}
        </div>
      )}
    </div>
  );
};