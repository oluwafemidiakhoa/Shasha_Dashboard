import React from 'react';
import type { Idea } from '../types';

interface IdeasPanelProps {
  ideas: Idea[];
  loading: boolean;
}

export const IdeasPanel: React.FC<IdeasPanelProps> = ({ ideas, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Market Insights</h2>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (ideas.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Market Insights</h2>
        <p className="text-gray-500 text-sm">No actionable insights available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Market Insights</h2>
      <div className="space-y-4">
        {ideas.map((idea, index) => (
          <div key={index} className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-gray-900">{idea.title}</h3>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {Math.round(idea.confidence * 100)}%
              </span>
            </div>
            <p className="text-sm text-gray-700">{idea.rationale}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 text-xs text-gray-500 bg-gray-50 rounded p-3">
        <strong>Disclaimer:</strong> This information is for educational purposes only and is not financial advice. 
        Always consider your personal circumstances and consult a licensed professional.
      </div>
    </div>
  );
};