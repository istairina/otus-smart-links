import { TimeCondition } from '../time';
import { Context } from '@shared/types';

describe('TimeCondition', () => {
  let condition: TimeCondition;

  beforeEach(() => {
    condition = new TimeCondition();
  });

  it('should have type "time"', () => {
    expect(condition.type).toBe('time');
  });

  describe('check', () => {
    it('should return true when time is within range', () => {
      const ctx: Context = { time: '10:00', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', language: 'ru' };
      const cond = { start: '09:00', end: '12:00' };

      const result = condition.check(ctx, cond);
      expect(result).toBe(true);
    });

    it('should return true when time equals start', () => {
      const ctx: Context = { time: '09:00', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', language: 'ru' };
      const cond = { start: '09:00', end: '12:00' };

      const result = condition.check(ctx, cond);
      expect(result).toBe(true);
    });

    it('should return true when time equals end', () => {
      const ctx: Context = { time: '12:00', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', language: 'ru' };
      const cond = { start: '09:00', end: '12:00' };

      const result = condition.check(ctx, cond);
      expect(result).toBe(true);
    });

    it('should return false when time is before start', () => {
      const ctx: Context = { time: '08:00', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', language: 'ru' };
      const cond = { start: '09:00', end: '12:00' };

      const result = condition.check(ctx, cond);
      expect(result).toBe(false);
    });

    it('should return false when time is after end', () => {
      const ctx: Context = { time: '13:00', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', language: 'ru' };
      const cond = { start: '09:00', end: '12:00' };

      const result = condition.check(ctx, cond);
      expect(result).toBe(false);
    });

    it('should handle minutes correctly', () => {
      const ctx: Context = { time: '10:30', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', language: 'ru' };
      const cond = { start: '10:00', end: '11:00' };

      const result = condition.check(ctx, cond);
      expect(result).toBe(true);
    });

    it('should handle range spanning midnight', () => {
      const ctx: Context = { time: '23:30', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', language: 'ru' };
      const cond = { start: '22:00', end: '01:00' };

      const result = condition.check(ctx, cond);
      expect(result).toBe(false);
    });

    it('should handle single minute ranges', () => {
      const ctx: Context = { time: '10:00', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', language: 'ru' };
      const cond = { start: '10:00', end: '10:00' };

      const result = condition.check(ctx, cond);
      expect(result).toBe(true);
    });

    it('should handle different hour ranges', () => {
      const ctx: Context = { time: '15:45', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', language: 'ru' };
      const cond = { start: '14:00', end: '16:00' };

      const result = condition.check(ctx, cond);
      expect(result).toBe(true);
    });
  });
});

