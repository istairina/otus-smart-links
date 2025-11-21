import request from 'supertest';
import express from 'express';
import { Rule } from '@shared/types';
import { app, engine, loadRulesFromDb } from '../server';

global.fetch = jest.fn();

describe('Rules Service API', () => {
  let testApp: express.Application;
  let testEngine: typeof engine;
  let testLoadRulesFromDb: typeof loadRulesFromDb;

  beforeEach(() => {
    jest.clearAllMocks();
    testApp = app;
    testEngine = engine;
    testLoadRulesFromDb = loadRulesFromDb;

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
    testEngine.loadRules(initialRules);
  });

  describe('POST /evaluate', () => {
    it('should evaluate context and return redirect URL', async () => {
      const context = { time: '10:00', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', language: 'ru' };

      const response = await request(testApp)
        .post('/evaluate')
        .send(context);

      expect(response.status).toBe(200);
      expect(response.body.redirectTo).toBe('https://test.com');
    });

    it('should return null when no rule matches', async () => {
      const context = { time: '10:00', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15', language: 'en' };

      const response = await request(testApp)
        .post('/evaluate')
        .send(context);

      expect(response.status).toBe(200);
      expect(response.body.redirectTo).toBeNull();
    });

    it('should handle invalid context gracefully', async () => {
      const response = await request(testApp)
        .post('/evaluate')
        .send({ invalid: 'data' });

      expect([200, 400]).toContain(response.status);
    });

    it('should handle missing context fields', async () => {
      const context = { time: '10:00' };

      const response = await request(testApp)
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
      testEngine.loadRules(rules);

      const context = { time: '10:00', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', language: 'ru' };

      const response = await request(testApp)
        .post('/evaluate')
        .send(context);

      expect(response.status).toBe(200);
      expect(response.body.redirectTo).toBe('https://time-test.com');
    });

    it('should return 400 when engine.evaluate throws an error', async () => {
      const originalEvaluate = testEngine.evaluate.bind(testEngine);
      jest.spyOn(testEngine, 'evaluate').mockImplementation(() => {
        throw new Error('Evaluation error');
      });

      const context = { time: '10:00', userAgent: 'test', language: 'ru' };

      const response = await request(testApp)
        .post('/evaluate')
        .send(context);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid context');

      jest.spyOn(testEngine, 'evaluate').mockImplementation(originalEvaluate);
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

      const response = await request(testApp).post('/reload');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Rules reloaded successfully');

      const context = { time: '10:00', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15', language: 'ru' };
      const evaluateResponse = await request(testApp)
        .post('/evaluate')
        .send(context);

      expect(evaluateResponse.body.redirectTo).toBe('https://reloaded.com');
    });

    it('should return 500 when db service fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const response = await request(testApp).post('/reload');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to reload rules');
    }, 15000);

    it('should return 500 when fetch throws error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const response = await request(testApp).post('/reload');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to reload rules');
    }, 15000);
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(testApp).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });
});

