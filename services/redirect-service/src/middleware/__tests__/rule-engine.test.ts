import { Request, Response, NextFunction } from 'express';
import { ruleEngineMiddleware } from '../rule-engine';

global.fetch = jest.fn();

describe('ruleEngineMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  const originalEnv = process.env.RULES_SERVICE_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {};
    mockResponse = {};
    nextFunction = jest.fn();
    process.env.RULES_SERVICE_URL = 'http://localhost:5001';
  });

  afterEach(() => {
    process.env.RULES_SERVICE_URL = originalEnv;
  });

  it('should call next when context is missing', async () => {
    mockRequest.context = undefined;

    await ruleEngineMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(global.fetch).not.toHaveBeenCalled();
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should fetch rules service and set ruleResult', async () => {
    mockRequest.context = { time: '10:00', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', language: 'ru' };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ redirectTo: 'https://example.com' })
    });

    await ruleEngineMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5001/evaluate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockRequest.context),
      }
    );
    expect(mockRequest.ruleResult).toBe('https://example.com');
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should set ruleResult to null when service returns null', async () => {
    mockRequest.context = { time: '10:00', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15', language: 'en' };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ redirectTo: null as string | null })
    });

    await ruleEngineMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.ruleResult).toBeNull();
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should handle service error and set ruleResult to null', async () => {
    mockRequest.context = { time: '10:00', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', language: 'ru' };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await ruleEngineMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.ruleResult).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(nextFunction).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should handle network error and set ruleResult to null', async () => {
    mockRequest.context = { time: '10:00', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', language: 'ru' };

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await ruleEngineMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.ruleResult).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(nextFunction).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should use default RULES_SERVICE_URL when env var is not set', async () => {
    delete process.env.RULES_SERVICE_URL;
    mockRequest.context = { time: '10:00', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', language: 'ru' };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ redirectTo: 'https://default.com' })
    });

    await ruleEngineMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5001/evaluate',
      expect.any(Object)
    );
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should send correct context to rules service', async () => {
    const context = { time: '15:30', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15', language: 'en' };
    mockRequest.context = context;

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ redirectTo: 'https://test.com' })
    });

    await ruleEngineMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify(context)
      })
    );
  });
});

