import { describe, it, expect } from 'vitest';
import { generateEmailHTML } from '../emailService';
import type { DigestData } from '../emailService';

describe('emailService', () => {
  describe('generateEmailHTML', () => {
    const mockData: DigestData = {
      indicators: [
        {
          id: 'CPI',
          label: 'Consumer Price Index',
          unit: 'index',
          latest: 307.5,
          yoy: 3.2,
          mom: 0.3,
          trend: 'RISING',
          updatedAt: '2023-12-01',
          series: []
        },
        {
          id: 'UNRATE',
          label: 'Unemployment Rate',
          unit: 'percent',
          latest: 3.7,
          yoy: -0.2,
          mom: -0.1,
          trend: 'FALLING',
          updatedAt: '2023-12-01',
          series: []
        }
      ],
      fx: [
        {
          pair: 'USD/NGN',
          latest: 1650.25,
          mom: 2.1,
          yoy: 12.5
        }
      ],
      ideas: [
        {
          title: 'Test Idea',
          rationale: 'This is a test rationale for the idea.',
          confidence: 0.8
        }
      ],
      date: '2023-12-01',
      timezone: 'America/New_York',
      dashboardUrl: 'https://example.com/dashboard'
    };

    it('should generate valid HTML email', () => {
      const html = generateEmailHTML(mockData);
      
      expect(html).toContain('<!doctype html>');
      expect(html).toContain('<html>');
      expect(html).toContain('Morning Macro Brief');
      expect(html).toContain('2023-12-01');
      expect(html).toContain('America/New_York');
    });

    it('should include all indicators', () => {
      const html = generateEmailHTML(mockData);
      
      expect(html).toContain('Consumer Price Index');
      expect(html).toContain('Unemployment Rate');
      expect(html).toContain('307.5');
      expect(html).toContain('3.70%');
    });

    it('should include FX rates', () => {
      const html = generateEmailHTML(mockData);
      
      expect(html).toContain('USD/NGN');
      expect(html).toContain('1650.2500');
      expect(html).toContain('+2.1%');
      expect(html).toContain('+12.5%');
    });

    it('should include ideas with confidence', () => {
      const html = generateEmailHTML(mockData);
      
      expect(html).toContain('Test Idea');
      expect(html).toContain('This is a test rationale');
      expect(html).toContain('80%');
    });

    it('should include dashboard link', () => {
      const html = generateEmailHTML(mockData);
      
      expect(html).toContain('https://example.com/dashboard');
      expect(html).toContain('Open Full Dashboard');
    });

    it('should include disclaimer', () => {
      const html = generateEmailHTML(mockData);
      
      expect(html).toContain('Disclaimer');
      expect(html).toContain('not investment advice');
    });

    it('should handle color coding for trends', () => {
      const html = generateEmailHTML(mockData);
      
      // Should include trend styling
      expect(html).toContain('RISING');
      expect(html).toContain('FALLING');
    });

    it('should handle positive and negative percentage formatting', () => {
      const html = generateEmailHTML(mockData);
      
      // Positive values should have + sign, negative should have - sign
      expect(html).toContain('+3.2%'); // CPI YoY
      expect(html).toContain('-0.2%'); // UNRATE YoY
    });
  });
});