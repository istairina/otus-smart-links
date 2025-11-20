import { db } from '../action';
import { Rule } from '@shared/types';

describe('db', () => {
  beforeEach(() => {
    const rules = [...db.getRules()];
    rules.forEach(rule => {
      db.deleteRule(rule.id);
    });
    db.putRule({
      conditions: [
        { type: 'time', start: '09:00', end: '12:00' },
        { type: 'user-agent', is: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
        { type: 'language', is: 'ru' }
      ],
      action: { redirectTo: 'test' }
    });
  });

  describe('getRules', () => {
    it('should return all rules', () => {
      const rules = db.getRules();
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0]).toHaveProperty('id');
      expect(rules[0]).toHaveProperty('conditions');
      expect(rules[0]).toHaveProperty('action');
    });
  });

  describe('getRule', () => {
    it('should return a rule by id', () => {
      const rules = db.getRules();
      const ruleId = rules[0].id;
      const rule = db.getRule(ruleId);
      
      expect(rule).toBeDefined();
      expect(rule?.id).toBe(ruleId);
      expect(rule?.conditions).toBeDefined();
      expect(rule?.action).toBeDefined();
    });

    it('should return undefined for non-existent id', () => {
      const rule = db.getRule(99999);
      expect(rule).toBeUndefined();
    });
  });

  describe('putRule', () => {
    it('should create a new rule with auto-incremented id', () => {
      const initialRules = [...db.getRules()];
      const initialLength = initialRules.length;
      const maxId = Math.max(...initialRules.map(r => r.id), 0);

      const newRule = db.putRule({
        conditions: [{ type: 'user-agent', is: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15' }],
        action: { redirectTo: 'https://example.com' }
      });

      expect(newRule.id).toBe(maxId + 1);
      expect(newRule.conditions).toEqual([{ type: 'user-agent', is: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15' }]);
      expect(newRule.action.redirectTo).toBe('https://example.com');

      const allRules = db.getRules();
      expect(allRules.length).toBe(initialLength + 1);
      expect(allRules.find(r => r.id === newRule.id)).toEqual(newRule);
    });

    it('should create rule with id 1 when no rules exist', () => {
      const rules = db.getRules();
      rules.forEach(rule => db.deleteRule(rule.id));

      const newRule = db.putRule({
        conditions: [{ type: 'language', is: 'en' }],
        action: { redirectTo: 'https://test.com' }
      });

      expect(newRule.id).toBe(1);
    });
  });

  describe('updateRule', () => {
    it('should update an existing rule', () => {
      const rules = db.getRules();
      const ruleId = rules[0].id;

      const updatedRule = db.updateRule(ruleId, {
        conditions: [{ type: 'user-agent', is: 'Mozilla/5.0 (X11; Linux x86_64) Firefox/89.0' }],
        action: { redirectTo: 'https://updated.com' }
      });

      expect(updatedRule).toBeDefined();
      expect(updatedRule?.id).toBe(ruleId);
      expect(updatedRule?.conditions).toEqual([{ type: 'user-agent', is: 'Mozilla/5.0 (X11; Linux x86_64) Firefox/89.0' }]);
      expect(updatedRule?.action.redirectTo).toBe('https://updated.com');

      const rule = db.getRule(ruleId);
      expect(rule?.conditions).toEqual([{ type: 'user-agent', is: 'Mozilla/5.0 (X11; Linux x86_64) Firefox/89.0' }]);
    });

    it('should update only conditions when provided', () => {
      const rules = db.getRules();
      const ruleId = rules[0].id;
      const originalAction = rules[0].action;

      const updatedRule = db.updateRule(ruleId, {
        conditions: [{ type: 'time', start: '10:00', end: '11:00' }]
      });

      expect(updatedRule?.conditions).toEqual([{ type: 'time', start: '10:00', end: '11:00' }]);
      expect(updatedRule?.action).toEqual(originalAction);
    });

    it('should update only action when provided', () => {
      const rules = db.getRules();
      const ruleId = rules[0].id;
      const originalConditions = rules[0].conditions;

      const updatedRule = db.updateRule(ruleId, {
        action: { redirectTo: 'https://new-action.com' }
      });

      expect(updatedRule?.action.redirectTo).toBe('https://new-action.com');
      expect(updatedRule?.conditions).toEqual(originalConditions);
    });

    it('should return null for non-existent id', () => {
      const result = db.updateRule(99999, {
        conditions: [{ type: 'user-agent', is: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }]
      });
      expect(result).toBeNull();
    });
  });

  describe('deleteRule', () => {
    it('should delete an existing rule', () => {
      const rules = db.getRules();
      const ruleId = rules[0].id;
      const initialCount = rules.length;

      const deleted = db.deleteRule(ruleId);

      expect(deleted).toBe(true);
      expect(db.getRules().length).toBe(initialCount - 1);
      expect(db.getRule(ruleId)).toBeUndefined();
    });

    it('should return false for non-existent id', () => {
      const deleted = db.deleteRule(99999);
      expect(deleted).toBe(false);
    });
  });
});

