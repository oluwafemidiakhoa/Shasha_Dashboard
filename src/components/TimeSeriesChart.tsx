import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { Indicator } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TimeSeriesChartProps {
  indicators: Indicator[];
  selectedIndicators: string[];
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ 
  indicators, 
  selectedIndicators 
}) => {
  const filteredIndicators = indicators.filter(ind => selectedIndicators.includes(ind.id));
  
  if (filteredIndicators.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">Select indicators to display chart</p>
      </div>
    );
  }

  // Get unique dates from all series
  const allDates = new Set<string>();
  filteredIndicators.forEach(ind => {
    ind.series.forEach(point => allDates.add(point.date));
  });
  const dates = Array.from(allDates).sort().slice(-24); // Last 24 months

  const colors = [
    'rgb(59, 130, 246)',
    'rgb(34, 197, 94)',
    'rgb(168, 85, 247)',
    'rgb(251, 146, 60)',
    'rgb(236, 72, 153)'
  ];

  const datasets = filteredIndicators.map((indicator, index) => {
    const data = dates.map(date => {
      const point = indicator.series.find(p => p.date === date);
      return point ? point.value : null;
    });

    return {
      label: indicator.label,
      data,
      borderColor: colors[index % colors.length],
      backgroundColor: `${colors[index % colors.length]}20`,
      tension: 0.2,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4
    };
  });

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Historical Trends (24 Months)',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          callback: function(_, index) {
            // Show every 3rd label
            return index % 3 === 0 ? dates[index] : '';
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: function(value) {
            return typeof value === 'number' ? value.toFixed(1) : value;
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  const data = {
    labels: dates,
    datasets
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div style={{ height: '400px' }}>
        <Line options={options} data={data} />
      </div>
    </div>
  );
};