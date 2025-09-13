import { describe, it, expect } from 'vitest';
import { 
  calculateYoY, 
  calculateMoM, 
  calculateStandardDeviation, 
  computeTrend, 
  getIdeas 
} from '../trends';

describe('trends', () => {
  describe('calculateYoY', () => {
    it('should calculate year-over-year percentage change', () => {
      const series = [
        { date: '2023-01', value: 100 },
        { date: '2023-02', value: 101 },
        // ... fill 11 more months
        ...Array.from({ length: 10 }, (_, i) => ({ 
          date: `2023-${String(i + 3).padStart(2, '0')}`, 
          value: 100 + i 
        })),
        { date: '2024-01', value: 110 }
      ];
      
      const yoy = calculateYoY(series);
      expect(yoy).toBeCloseTo(10, 1); // 10% increase
    });

    it('should return NaN for insufficient data', () => {
      const series = [{ date: '2023-01', value: 100 }];
      const yoy = calculateYoY(series);
      expect(yoy).toBeNaN();
    });
  });

  describe('calculateMoM', () => {
    it('should calculate month-over-month percentage change', () => {
      const series = [
        { date: '2023-01', value: 100 },
        { date: '2023-02', value: 105 }
      ];
      
      const mom = calculateMoM(series);
      expect(mom).toBeCloseTo(5, 1); // 5% increase
    });

    it('should return NaN for insufficient data', () => {
      const series = [{ date: '2023-01', value: 100 }];
      const mom = calculateMoM(series);
      expect(mom).toBeNaN();
    });
  });

  describe('calculateStandardDeviation', () => {
    it('should calculate standard deviation correctly', () => {
      const values = [1, 2, 3, 4, 5];
      const std = calculateStandardDeviation(values);
      expect(std).toBeCloseTo(1.414, 2);
    });

    it('should return 0 for empty array', () => {
      const std = calculateStandardDeviation([]);
      expect(std).toBe(0);
    });
  });

  describe('computeTrend', () => {
    const baseSeries = Array.from({ length: 12 }, (_, i) => ({
      date: `2023-${String(i + 1).padStart(2, '0')}`,
      value: 100 + i * 0.01 // very small, consistent changes
    }));

    it('should return STABLE for small changes', () => {
      const trend = computeTrend(baseSeries, 0.05, 'percent');
      expect(trend).toBe('STABLE');
    });

    it('should return RISING for positive MoM when not volatile', () => {
      // Create series with very consistent values for low volatility
      const stableSeries = Array.from({ length: 12 }, (_, i) => ({
        date: `2023-${String(i + 1).padStart(2, '0')}`,
        value: 100
      }));
      const trend = computeTrend(stableSeries, 0.2, 'percent');
      expect(trend).toBe('RISING');
    });

    it('should return FALLING for negative MoM when not volatile', () => {
      // Create series with very consistent values for low volatility
      const stableSeries = Array.from({ length: 12 }, (_, i) => ({
        date: `2023-${String(i + 1).padStart(2, '0')}`,
        value: 100
      }));
      const trend = computeTrend(stableSeries, -0.2, 'percent');
      expect(trend).toBe('FALLING');
    });

    it('should return STABLE for NaN MoM', () => {
      const trend = computeTrend(baseSeries, NaN, 'percent');
      expect(trend).toBe('STABLE');
    });
  });

  describe('getIdeas', () => {
    const mockIndicators = {
      DGS3MO: { latest: 5.0, mom: 0.1, yoy: 1.2 },
      DGS10: { latest: 4.8, mom: -0.2, yoy: 0.8 },
      CPI: { latest: 307.5, mom: 0.2, yoy: 3.1, trend: 'RISING' },
      UNRATE: { latest: 3.8, mom: -0.1, yoy: -0.3 },
      MORTGAGE30US: { latest: 6.5, mom: -0.3, yoy: 0.5 }
    };

    const mockFx = {
      USDNGN: { latest: 1650, mom: 2.5, yoy: 15.2 }
    };

    it('should generate cash yield idea when 3M Treasury > 4.5%', () => {
      const ideas = getIdeas(mockIndicators, mockFx);
      const cashIdea = ideas.find(idea => idea.title.includes('idle cash'));
      expect(cashIdea).toBeDefined();
      expect(cashIdea?.confidence).toBeGreaterThan(0.8);
    });

    it('should generate refi idea when mortgage rates drop significantly', () => {
      const ideas = getIdeas(mockIndicators, mockFx);
      const refiIdea = ideas.find(idea => idea.title.includes('Refi'));
      expect(refiIdea).toBeDefined();
    });

    it('should return maximum 5 ideas', () => {
      const ideas = getIdeas(mockIndicators, mockFx);
      expect(ideas.length).toBeLessThanOrEqual(5);
    });

    it('should include confidence scores between 0 and 1', () => {
      const ideas = getIdeas(mockIndicators, mockFx);
      ideas.forEach(idea => {
        expect(idea.confidence).toBeGreaterThanOrEqual(0);
        expect(idea.confidence).toBeLessThanOrEqual(1);
      });
    });
  });
});