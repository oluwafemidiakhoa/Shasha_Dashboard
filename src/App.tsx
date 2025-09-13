import React, { useState } from 'react';
import { DashboardCards } from './components/DashboardCards';
import { TimeSeriesChart } from './components/TimeSeriesChart';
import { ExchangeRates } from './components/ExchangeRates';
import { IdeasPanel } from './components/IdeasPanel';
import { Controls } from './components/Controls';
import { useIndicators } from './hooks/useIndicators';

export const App: React.FC = () => {
  const { indicators, fxRates, ideas, loading, error, refresh } = useIndicators();
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(['CPI', 'UNRATE']);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-8 max-w-md w-full">
          <div className="text-red-500 text-center mb-4">
            <div className="text-4xl mb-2">⚠️</div>
            <h2 className="text-xl font-semibold">Error Loading Data</h2>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Economic Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Real-time economic indicators with trend analysis and market insights
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Controls
          selectedIndicators={selectedIndicators}
          onSelectionChange={setSelectedIndicators}
          indicators={indicators}
          fxRates={fxRates}
          onRefresh={refresh}
          loading={loading}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <DashboardCards indicators={indicators} loading={loading} />
          </div>
          <div>
            <ExchangeRates rates={fxRates} loading={loading} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TimeSeriesChart
              indicators={indicators}
              selectedIndicators={selectedIndicators}
            />
          </div>
          <div>
            <IdeasPanel ideas={ideas} loading={loading} />
          </div>
        </div>
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>
              Data sources: Federal Reserve Economic Data (FRED), exchangerate.host
            </p>
            <p className="mt-1">
              <strong>Disclaimer:</strong> This information is for educational purposes only and is not financial advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};