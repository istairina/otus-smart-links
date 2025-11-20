import request from 'supertest';
import express from 'express';
import { contextMiddleware } from '../middleware/context';
import { ruleEngineMiddleware } from '../middleware/rule-engine';
import { redirectMiddleware } from '../middleware/redirect';

global.fetch = jest.fn();

const createTestApp = () => {
  const app = express();

  app.use(contextMiddleware);
  app.use(async (req, res, next) => {
    await ruleEngineMiddleware(req, res, next);
  });
  app.use(redirectMiddleware);

  app.use((_req, res) => {
    res.status(404).send('No redirect rule matched');
  });

  return app;
};

describe('Redirect Service', () => {
  let app: express.Application;
  const originalEnv = process.env.RULES_SERVICE_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createTestApp();
    process.env.RULES_SERVICE_URL = 'http://localhost:5001';
  });

  afterEach(() => {
    process.env.RULES_SERVICE_URL = originalEnv;
  });

  describe('Middleware chain', () => {
    it('should process request through all middleware', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ redirectTo: 'https://example.com' })
      });

      const response = await request(app)
        .get('/test')
        .set('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        .set('accept-language', 'ru-RU,ru;q=0.9');

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('https://example.com');
    });

    it('should return 404 when no rule matches', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ redirectTo: null as string | null })
      });

      const response = await request(app)
        .get('/test')
        .set('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        .set('accept-language', 'ru-RU,ru;q=0.9');

      expect(response.status).toBe(404);
      expect(response.text).toBe('No redirect rule matched');
    });

    it('should handle rules service error gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const response = await request(app)
        .get('/test')
        .set('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        .set('accept-language', 'ru-RU,ru;q=0.9');

      expect(response.status).toBe(404);
    });

    it('should handle network error gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const response = await request(app)
        .get('/test')
        .set('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        .set('accept-language', 'ru-RU,ru;q=0.9');

      expect(response.status).toBe(404);
    });
  });

  describe('Context middleware integration', () => {
    it('should create context from headers', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ redirectTo: 'https://test.com' })
      });

      await request(app)
        .get('/test')
        .set('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15')
        .set('accept-language', 'en-US,en;q=0.9');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"userAgent"')
        })
      );
    });
  });

  describe('404 handler', () => {
    it('should return 404 for any unmatched route', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ redirectTo: null as string | null })
      });

      const response = await request(app)
        .get('/any/route/here')
        .set('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        .set('accept-language', 'ru-RU,ru;q=0.9');

      expect(response.status).toBe(404);
      expect(response.text).toBe('No redirect rule matched');
    });
  });
});

