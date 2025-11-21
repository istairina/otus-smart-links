import { UserAgentCondition } from '../user-agent';
import { Context } from '@shared/types';

describe('UserAgentCondition', () => {
  let condition: UserAgentCondition;

  beforeEach(() => {
    condition = new UserAgentCondition();
  });

  it('should have type "user-agent"', () => {
    expect(condition.type).toBe('user-agent');
  });

  describe('check', () => {
    it('should return true when user-agent matches exactly', () => {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      const ctx: Context = { time: '10:00', userAgent, language: 'ru' };
      const cond = { is: userAgent };

      const result = condition.check(ctx, cond);
      expect(result).toBe(true);
    });

    it('should return false when user-agent does not match', () => {
      const ctx: Context = { 
        time: '10:00', 
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15',
        language: 'en' 
      };
      const cond = { is: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

      const result = condition.check(ctx, cond);
      expect(result).toBe(false);
    });

    it('should handle different user-agents', () => {
      const ctx: Context = { 
        time: '10:00', 
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Firefox/89.0',
        language: 'en' 
      };
      const cond = { is: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };

      const result = condition.check(ctx, cond);
      expect(result).toBe(false);
    });

    it('should handle case-sensitive matching', () => {
      const userAgent = 'mozilla/5.0';
      const ctx: Context = { time: '10:00', userAgent, language: 'ru' };
      const cond = { is: 'Mozilla/5.0' };

      const result = condition.check(ctx, cond);
      expect(result).toBe(false);
    });

    it('should handle empty user-agent', () => {
      const ctx: Context = { time: '10:00', userAgent: '', language: 'ru' };
      const cond = { is: '' };

      const result = condition.check(ctx, cond);
      expect(result).toBe(true);
    });

    it('should return true when user-agent includes the substring', () => {
      const ctx: Context = { 
        time: '10:00', 
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        language: 'ru' 
      };
      const cond = { include: 'Chrome' };

      const result = condition.check(ctx, cond);
      expect(result).toBe(true);
    });

    it('should return false when user-agent does not include the substring', () => {
      const ctx: Context = { 
        time: '10:00', 
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Firefox/89.0',
        language: 'en' 
      };
      const cond = { include: 'Chrome' };

      const result = condition.check(ctx, cond);
      expect(result).toBe(false);
    });

    it('should handle partial matching with include', () => {
      const ctx: Context = { 
        time: '10:00', 
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15',
        language: 'en' 
      };
      const cond = { include: 'Safari' };

      const result = condition.check(ctx, cond);
      expect(result).toBe(true);
    });

    it('should prioritize is over include when both are provided', () => {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      const ctx: Context = { time: '10:00', userAgent, language: 'ru' };
      const cond = { is: 'Different User Agent', include: 'Chrome' };

      const result = condition.check(ctx, cond);
      expect(result).toBe(false);
    });

    it('should return false when neither is nor include is provided', () => {
      const ctx: Context = { 
        time: '10:00', 
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        language: 'ru' 
      };
      const cond = {};

      const result = condition.check(ctx, cond);
      expect(result).toBe(false);
    });

    it('should return false when userAgent is undefined in context', () => {
      const ctx: Context = { 
        time: '10:00', 
        language: 'ru' 
      } as Context;
      const cond = { include: 'Chrome' };

      const result = condition.check(ctx, cond);
      expect(result).toBe(false);
    });

    it('should return false when userAgent is undefined and using is', () => {
      const ctx: Context = { 
        time: '10:00', 
        language: 'ru' 
      } as Context;
      const cond = { is: 'Mozilla/5.0' };

      const result = condition.check(ctx, cond);
      expect(result).toBe(false);
    });
  });
});

