import { RuleEngine } from '../rule-engine';
import { ConditionPlugin, Rule, Context } from '@shared/types';

class MockCondition implements ConditionPlugin {
  type: string;
  private shouldMatch: boolean;

  constructor(type: string, shouldMatch: boolean = true) {
    this.type = type;
    this.shouldMatch = shouldMatch;
  }

  check(_ctx: Context, _cond: any): boolean {
    return this.shouldMatch;
  }
}

describe('RuleEngine', () => {
  let engine: RuleEngine;
  let plugins: ConditionPlugin[];

  beforeEach(() => {
    plugins = [
      new MockCondition('user-agent', true),
      new MockCondition('language', true),
      new MockCondition('time', true)
    ];
    engine = new RuleEngine(plugins);
  });

  describe('constructor', () => {
    it('should initialize with plugins', () => {
      expect(engine).toBeDefined();
    });

    it('should register all plugins', () => {
      const newPlugins = [
        new MockCondition('plugin1'),
        new MockCondition('plugin2')
      ];
      const newEngine = new RuleEngine(newPlugins);
      expect(newEngine).toBeDefined();
    });
  });

  describe('loadRules', () => {
    it('should load rules', () => {
      const rules: Rule[] = [
        {
          id: 1,
          conditions: [{ type: 'user-agent', is: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }],
          action: { redirectTo: 'https://example.com' }
        }
      ];

      engine.loadRules(rules);
      const result = engine.evaluate({ time: '10:00', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', language: 'ru' });
      expect(result).toBe('https://example.com');
    });

    it('should replace existing rules', () => {
      const rules1: Rule[] = [
        {
          id: 1,
          conditions: [{ type: 'user-agent', is: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }],
          action: { redirectTo: 'https://first.com' }
        }
      ];

      const rules2: Rule[] = [
        {
          id: 2,
          conditions: [{ type: 'user-agent', is: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15' }],
          action: { redirectTo: 'https://second.com' }
        }
      ];

      engine.loadRules(rules1);
      engine.loadRules(rules2);

      const result = engine.evaluate({ time: '10:00', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15', language: 'ru' });
      expect(result).toBe('https://second.com');
    });
  });

  describe('evaluate', () => {
    it('should return redirect URL when all conditions match', () => {
      const rules: Rule[] = [
        {
          id: 1,
          conditions: [
            { type: 'user-agent', is: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
            { type: 'language', is: 'ru' }
          ],
          action: { redirectTo: 'https://example.com' }
        }
      ];

      engine.loadRules(rules);
      const result = engine.evaluate({ time: '10:00', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', language: 'ru' });
      
      expect(result).toBe('https://example.com');
    });

    it('should return null when no conditions match', () => {
      const rules: Rule[] = [
        {
          id: 1,
          conditions: [{ type: 'user-agent', is: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }],
          action: { redirectTo: 'https://example.com' }
        }
      ];

      engine.loadRules(rules);
      const nonMatchingPlugin = new MockCondition('user-agent', false);
      const newEngine = new RuleEngine([nonMatchingPlugin]);
      newEngine.loadRules(rules);

      const result = newEngine.evaluate({ time: '10:00', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15', language: 'ru' });
      
      expect(result).toBeNull();
    });

    it('should return null when plugin is not found', () => {
      const rules: Rule[] = [
        {
          id: 1,
          conditions: [{ type: 'unknown-plugin', is: 'value' }],
          action: { redirectTo: 'https://example.com' }
        }
      ];

      engine.loadRules(rules);
      const result = engine.evaluate({ time: '10:00', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', language: 'ru' });
      
      expect(result).toBeNull();
    });

    it('should return null when no rules are loaded', () => {
      const result = engine.evaluate({ time: '10:00', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', language: 'ru' });
      expect(result).toBeNull();
    });

    it('should return first matching rule', () => {
      const rules: Rule[] = [
        {
          id: 1,
          conditions: [{ type: 'user-agent', is: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }],
          action: { redirectTo: 'https://first.com' }
        },
        {
          id: 2,
          conditions: [{ type: 'user-agent', is: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }],
          action: { redirectTo: 'https://second.com' }
        }
      ];

      engine.loadRules(rules);
      const result = engine.evaluate({ time: '10:00', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', language: 'ru' });
      
      expect(result).toBe('https://first.com');
    });

    it('should skip rules when any condition fails', () => {
      const rules: Rule[] = [
        {
          id: 1,
          conditions: [
            { type: 'user-agent', is: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
            { type: 'language', is: 'ru' }
          ],
          action: { redirectTo: 'https://first.com' }
        },
        {
          id: 2,
          conditions: [{ type: 'user-agent', is: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }],
          action: { redirectTo: 'https://second.com' }
        }
      ];

      const matchingPlugin = new MockCondition('user-agent', true);
      const nonMatchingPlugin = new MockCondition('language', false);
      const newEngine = new RuleEngine([matchingPlugin, nonMatchingPlugin]);
      newEngine.loadRules(rules);

      const result = newEngine.evaluate({ time: '10:00', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', language: 'ru' });
      
      expect(result).toBe('https://second.com');
    });

    it('should handle empty conditions array', () => {
      const rules: Rule[] = [
        {
          id: 1,
          conditions: [],
          action: { redirectTo: 'https://example.com' }
        }
      ];

      engine.loadRules(rules);
      const result = engine.evaluate({ time: '10:00', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', language: 'ru' });
      
      expect(result).toBe('https://example.com');
    });
  });
});

