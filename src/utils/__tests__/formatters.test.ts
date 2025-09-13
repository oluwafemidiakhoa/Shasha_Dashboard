import { describe, it, expect } from 'vitest';
import { 
  formatNumber, 
  formatPercentage, 
  formatCurrency, 
  formatDateString, 
  getTrendColor, 
  getTrendIcon 
} from '../formatters';

describe('formatters', () => {
  describe('formatNumber', () => {
    it('should format index values with 1 decimal', () => {
      expect(formatNumber(123.456, 'index')).toBe('123.5');
    });

    it('should format percent values with % symbol', () => {
      expect(formatNumber(5.678, 'percent')).toBe('5.68%');
    });

    it('should format rate values with % symbol', () => {
      expect(formatNumber(3.25, 'rate')).toBe('3.25%');
    });

    it('should return em dash for null values', () => {
      expect(formatNumber(null, 'percent')).toBe('—');
      expect(formatNumber(undefined, 'percent')).toBe('—');
      expect(formatNumber(NaN, 'percent')).toBe('—');
    });
  });

  describe('formatPercentage', () => {
    it('should add + sign for positive values', () => {
      expect(formatPercentage(2.5)).toBe('+2.5%');
    });

    it('should keep - sign for negative values', () => {
      expect(formatPercentage(-1.8)).toBe('-1.8%');
    });

    it('should return em dash for invalid values', () => {
      expect(formatPercentage(null)).toBe('—');
      expect(formatPercentage(NaN)).toBe('—');
    });
  });

  describe('formatCurrency', () => {
    it('should format to 4 decimals by default', () => {
      expect(formatCurrency(1.23456)).toBe('1.2346');
    });

    it('should format to specified decimals', () => {
      expect(formatCurrency(1.23456, 2)).toBe('1.23');
    });

    it('should return em dash for invalid values', () => {
      expect(formatCurrency(null)).toBe('—');
    });
  });

  describe('formatDateString', () => {
    it('should format valid date strings', () => {
      const result = formatDateString('2023-12-25');
      // Date parsing can vary by timezone, just check format
      expect(result).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{4}$/);
    });

    it('should format Date objects', () => {
      const date = new Date(2023, 11, 25); // Month is 0-indexed
      const result = formatDateString(date);
      expect(result).toBe('Dec 25, 2023');
    });

    it('should return em dash for invalid dates', () => {
      expect(formatDateString('invalid-date')).toBe('—');
    });
  });

  describe('getTrendColor', () => {
    it('should return correct colors for each trend', () => {
      expect(getTrendColor('RISING')).toBe('#10b981');
      expect(getTrendColor('FALLING')).toBe('#ef4444');
      expect(getTrendColor('VOLATILE_UP')).toBe('#f59e0b');
      expect(getTrendColor('VOLATILE_DOWN')).toBe('#f97316');
      expect(getTrendColor('STABLE')).toBe('#6b7280');
      expect(getTrendColor('UNKNOWN')).toBe('#6b7280');
    });
  });

  describe('getTrendIcon', () => {
    it('should return correct icons for each trend', () => {
      expect(getTrendIcon('RISING')).toBe('↑');
      expect(getTrendIcon('FALLING')).toBe('↓');
      expect(getTrendIcon('VOLATILE_UP')).toBe('⚡↑');
      expect(getTrendIcon('VOLATILE_DOWN')).toBe('⚡↓');
      expect(getTrendIcon('STABLE')).toBe('→');
      expect(getTrendIcon('UNKNOWN')).toBe('•');
    });
  });
});