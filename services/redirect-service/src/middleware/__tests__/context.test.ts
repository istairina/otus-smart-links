import { Request, Response, NextFunction } from 'express';
import { contextMiddleware } from '../context';

describe('contextMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {}
    };
    mockResponse = {};
    nextFunction = jest.fn();
  });

  it('should set context with time, userAgent, and language', () => {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    mockRequest.headers = {
      'user-agent': userAgent,
      'accept-language': 'ru-RU,ru;q=0.9'
    };

    contextMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.context).toBeDefined();
    expect(mockRequest.context?.time).toMatch(/^\d{2}:\d{2}$/);
    expect(mockRequest.context?.userAgent).toBe(userAgent);
    expect(mockRequest.context?.language).toBe('ru');
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should preserve full Safari user-agent', () => {
    const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15';
    mockRequest.headers = {
      'user-agent': userAgent,
      'accept-language': 'en-US,en;q=0.9'
    };

    contextMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.context?.userAgent).toBe(userAgent);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should preserve full Chrome user-agent', () => {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    mockRequest.headers = {
      'user-agent': userAgent,
      'accept-language': 'en-GB,en;q=0.9'
    };

    contextMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.context?.userAgent).toBe(userAgent);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should preserve full Firefox user-agent', () => {
    const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) Firefox/89.0';
    mockRequest.headers = {
      'user-agent': userAgent,
      'accept-language': 'de-DE,de;q=0.9'
    };

    contextMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.context?.userAgent).toBe(userAgent);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should set language to Unknown when accept-language header is missing', () => {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    mockRequest.headers = {
      'user-agent': userAgent
    };

    contextMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.context?.language).toBe('Unknown');
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should extract language code from accept-language header', () => {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    mockRequest.headers = {
      'user-agent': userAgent,
      'accept-language': 'fr-FR,fr;q=0.9,en;q=0.8'
    };

    contextMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.context?.language).toBe('fr');
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should handle language without region code', () => {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    mockRequest.headers = {
      'user-agent': userAgent,
      'accept-language': 'es;q=0.9'
    };

    contextMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.context?.language).toBe('es');
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should set time in HH:MM format', () => {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    mockRequest.headers = {
      'user-agent': userAgent,
      'accept-language': 'ru-RU,ru;q=0.9'
    };

    contextMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    const timeRegex = /^\d{2}:\d{2}$/;
    expect(mockRequest.context?.time).toMatch(timeRegex);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should set userAgent to Unknown when user-agent header is missing', () => {
    mockRequest.headers = {
      'accept-language': 'ru-RU,ru;q=0.9'
    };

    contextMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.context?.userAgent).toBe('Unknown');
    expect(mockRequest.context?.language).toBe('ru');
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should handle all headers missing', () => {
    mockRequest.headers = {};

    contextMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.context).toBeDefined();
    expect(mockRequest.context?.userAgent).toBe('Unknown');
    expect(mockRequest.context?.language).toBe('Unknown');
    expect(mockRequest.context?.time).toMatch(/^\d{2}:\d{2}$/);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should accept all headers but only include Context fields in output', () => {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    mockRequest.headers = {
      'user-agent': userAgent,
      'accept-language': 'en-US,en;q=0.9',
      'x-custom-header': 'custom-value',
      'authorization': 'Bearer token123',
      'content-type': 'application/json',
      'x-forwarded-for': '192.168.1.1',
      'cookie': 'session=abc123'
    };

    contextMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.context).toBeDefined();
    expect(Object.keys(mockRequest.context || {})).toEqual(['time', 'userAgent', 'language']);
    
    expect(mockRequest.context).not.toHaveProperty('x-custom-header');
    expect(mockRequest.context).not.toHaveProperty('authorization');
    expect(mockRequest.context).not.toHaveProperty('content-type');
    expect(mockRequest.context).not.toHaveProperty('x-forwarded-for');
    expect(mockRequest.context).not.toHaveProperty('cookie');
    
    expect(mockRequest.context?.userAgent).toBe(userAgent);
    expect(mockRequest.context?.language).toBe('en');
    expect(mockRequest.context?.time).toMatch(/^\d{2}:\d{2}$/);
    expect(nextFunction).toHaveBeenCalled();
  });
});
