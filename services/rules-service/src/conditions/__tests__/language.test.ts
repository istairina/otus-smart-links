import { LanguageCondition } from '../language';
import { Context } from '@shared/types';

describe('LanguageCondition', () => {
  let condition: LanguageCondition;

  beforeEach(() => {
    condition = new LanguageCondition();
  });

  it('should have type "language"', () => {
    expect(condition.type).toBe('language');
  });

  describe('check', () => {
    it('should return true when language matches', () => {
      const ctx: Context = { time: '10:00', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', language: 'ru' };
      const cond = { is: 'ru' };

      const result = condition.check(ctx, cond);
      expect(result).toBe(true);
    });

    it('should return false when language does not match', () => {
      const ctx: Context = { time: '10:00', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', language: 'en' };
      const cond = { is: 'ru' };

      const result = condition.check(ctx, cond);
      expect(result).toBe(false);
    });

    it('should handle different language codes', () => {
      const ctx: Context = { time: '10:00', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', language: 'en' };
      const cond = { is: 'fr' };

      const result = condition.check(ctx, cond);
      expect(result).toBe(false);
    });

    it('should handle case-sensitive matching', () => {
      const ctx: Context = { time: '10:00', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', language: 'ru' };
      const cond = { is: 'RU' };

      const result = condition.check(ctx, cond);
      expect(result).toBe(false);
    });

    it('should return true when language includes the substring', () => {
      const ctx: Context = { time: '10:00', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', language: 'ru' };
      const cond = { include: 'r' };

      const result = condition.check(ctx, cond);
      expect(result).toBe(true);
    });

    it('should return false when language does not include the substring', () => {
      const ctx: Context = { time: '10:00', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', language: 'en' };
      const cond = { include: 'ru' };

      const result = condition.check(ctx, cond);
      expect(result).toBe(false);
    });

    it('should prioritize is over include when both are provided', () => {
      const ctx: Context = { time: '10:00', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', language: 'ru' };
      const cond = { is: 'en', include: 'r' };

      const result = condition.check(ctx, cond);
      expect(result).toBe(false);
    });

    it('should return false when neither is nor include is provided', () => {
      const ctx: Context = { time: '10:00', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', language: 'ru' };
      const cond = {};

      const result = condition.check(ctx, cond);
      expect(result).toBe(false);
    });
  });
});

