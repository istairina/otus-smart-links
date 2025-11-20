import request from 'supertest';
import express from 'express';
import * as Conditions from '../conditions';
import { RuleEngine } from '../rule-engine';
import { AbstractCondition, Rule, ConditionPlugin } from '@shared/types';

global.fetch = jest.fn();

function initializeConditions(): ConditionPlugin[] {
  const conditions: ConditionPlugin[] = [];
  const conditionModules = Conditions as Record<string, unknown>;

  type ConditionConstructor = new () => AbstractCondition;

  for (const key of Object.keys(conditionModules)) {
    const ConditionClass = conditionModules[key];
    if (typeof ConditionClass === 'function' &&
        ConditionClass.prototype instanceof AbstractCondition) {
      const conditionClass = ConditionClass as ConditionConstructor;
      const instance = new conditionClass();
      conditions.push(instance);
    }
  }

  return conditions;
}

const createTestApp = () => {
  const app = express();
  app.use(express.json());

  const conditions = initializeConditions();
  const engine = new RuleEngine(conditions);

  const DB_URL = process.env.DB_URL || 'http://localhost:5000';

  async function loadRulesFromDb(): Promise<void> {
    try {
      const response = await fetch(`${DB_URL}/rules`);
      if (!response.ok) {
        throw new Error(`Failed to fetch rules: ${response.status} ${response.statusText}`);
      }
      const rules: Rule[] = await response.json();
      engine.loadRules(rules);
    } catch (error) {
      console.error('Error loading rules from db service:', error);
      throw error;
    }
  }

  app.post('/evaluate', (req, res) => {
    try {
      const ctx = req.body;
      const result = engine.evaluate(ctx);
      res.json({ redirectTo: result });
    } catch (error) {
      res.status(400).json({ error: 'Invalid context' });
    }
  });

  app.post('/reload', async (req, res) => {
    try {
      await loadRulesFromDb();
      res.json({ message: 'Rules reloaded successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to reload rules' });
    }
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return { app, engine, loadRulesFromDb };
};

describe('Rules Service API', () => {
  let app: express.Application;
  let engine: RuleEngine;
  let loadRulesFromDb: () => Promise<void>;

  beforeEach(() => {
    jest.clearAllMocks();
    const testApp = createTestApp();
    app = testApp.app;
    engine = testApp.engine;
    loadRulesFromDb = testApp.loadRulesFromDb;

    const initialRules: Rule[] = [
      {
        id: 1,
        conditions: [
          { type: 'user-agent', is: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
          { type: 'language', is: 'ru' }
        ],
        action: { redirectTo: 'https://test.com' }
      }
    ];
    engine.loadRules(initialRules);
  });

  describe('POST /evaluate', () => {
    it('should evaluate context and return redirect URL', async () => {
      const context = { time: '10:00', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', language: 'ru' };

      const response = await request(app)
        .post('/evaluate')
        .send(context);

      expect(response.status).toBe(200);
      expect(response.body.redirectTo).toBe('https://test.com');
    });

    it('should return null when no rule matches', async () => {
      const context = { time: '10:00', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15', language: 'en' };

      const response = await request(app)
        .post('/evaluate')
        .send(context);

      expect(response.status).toBe(200);
      expect(response.body.redirectTo).toBeNull();
    });

    it('should handle invalid context gracefully', async () => {
      const response = await request(app)
        .post('/evaluate')
        .send({ invalid: 'data' });

      expect([200, 400]).toContain(response.status);
    });

    it('should handle missing context fields', async () => {
      const context = { time: '10:00' };

      const response = await request(app)
        .post('/evaluate')
        .send(context);

      expect(response.status).toBe(200);
    });

    it('should evaluate with time condition', async () => {
      const rules: Rule[] = [
        {
          id: 1,
          conditions: [
            { type: 'time', start: '09:00', end: '12:00' },
            { type: 'user-agent', is: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
          ],
          action: { redirectTo: 'https://time-test.com' }
        }
      ];
      engine.loadRules(rules);

      const context = { time: '10:00', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', language: 'ru' };

      const response = await request(app)
        .post('/evaluate')
        .send(context);

      expect(response.status).toBe(200);
      expect(response.body.redirectTo).toBe('https://time-test.com');
    });
  });

  describe('POST /reload', () => {
    it('should reload rules from db service', async () => {
      const mockRules: Rule[] = [
        {
          id: 1,
          conditions: [{ type: 'user-agent', is: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15' }],
          action: { redirectTo: 'https://reloaded.com' }
        }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRules
      });

      const response = await request(app).post('/reload');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Rules reloaded successfully');

      const context = { time: '10:00', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15', language: 'ru' };
      const evaluateResponse = await request(app)
        .post('/evaluate')
        .send(context);

      expect(evaluateResponse.body.redirectTo).toBe('https://reloaded.com');
    });

    it('should return 500 when db service fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const response = await request(app).post('/reload');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to reload rules');
    });

    it('should return 500 when fetch throws error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const response = await request(app).post('/reload');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to reload rules');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });
});

