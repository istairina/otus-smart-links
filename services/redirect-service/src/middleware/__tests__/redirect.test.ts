import { Request, Response, NextFunction } from 'express';
import { redirectMiddleware } from '../redirect';

describe('redirectMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      redirect: jest.fn()
    };
    nextFunction = jest.fn();
  });

  it('should redirect when ruleResult is set', () => {
    mockRequest.ruleResult = 'https://example.com';

    redirectMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.redirect).toHaveBeenCalledWith(302, 'https://example.com');
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should call next when ruleResult is null', () => {
    mockRequest.ruleResult = null;

    redirectMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.redirect).not.toHaveBeenCalled();
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should call next when ruleResult is undefined', () => {
    mockRequest.ruleResult = undefined;

    redirectMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.redirect).not.toHaveBeenCalled();
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should redirect to different URLs', () => {
    mockRequest.ruleResult = 'https://test.com/page';

    redirectMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.redirect).toHaveBeenCalledWith(302, 'https://test.com/page');
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should redirect with status code 302', () => {
    mockRequest.ruleResult = 'https://example.com';

    redirectMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.redirect).toHaveBeenCalledWith(302, expect.any(String));
  });

  it('should prevent redirect loop when redirecting to same host', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    mockRequest.ruleResult = 'http://localhost:5000/test';
    mockRequest.headers = {
      host: 'localhost:5000'
    };
    mockResponse.status = jest.fn().mockReturnValue(mockResponse);
    mockResponse.json = jest.fn();

    redirectMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Preventing redirect loop'));
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Redirect loop detected' });
    expect(mockResponse.redirect).not.toHaveBeenCalled();
    expect(nextFunction).not.toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('should allow redirect to different host', () => {
    mockRequest.ruleResult = 'https://example.com';
    mockRequest.headers = {
      host: 'localhost:5000'
    };

    redirectMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.redirect).toHaveBeenCalledWith(302, 'https://example.com');
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should prevent redirect loop for localhost even with different port', () => {
    mockRequest.ruleResult = 'http://localhost:3000/test';
    mockRequest.headers = {
      host: 'localhost:5000'
    };
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    mockResponse.status = jest.fn().mockReturnValue(mockResponse);
    mockResponse.json = jest.fn();

    redirectMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Preventing redirect loop'));
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Redirect loop detected' });
    expect(mockResponse.redirect).not.toHaveBeenCalled();
    expect(nextFunction).not.toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('should handle invalid URL in isSameHost catch block', () => {
    mockRequest.ruleResult = 'invalid-url-without-protocol';
    mockRequest.headers = {
      host: 'localhost:5000'
    };
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    mockResponse.status = jest.fn().mockReturnValue(mockResponse);
    mockResponse.json = jest.fn();

    redirectMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Preventing redirect loop'));
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Redirect loop detected' });
    expect(mockResponse.redirect).not.toHaveBeenCalled();
    expect(nextFunction).not.toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('should prevent redirect for URL without protocol in catch block', () => {
    mockRequest.ruleResult = 'example.com/path';
    mockRequest.headers = {
      host: 'localhost:5000'
    };
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    mockResponse.status = jest.fn().mockReturnValue(mockResponse);
    mockResponse.json = jest.fn();

    redirectMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Preventing redirect loop'));
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Redirect loop detected' });
    expect(mockResponse.redirect).not.toHaveBeenCalled();
    expect(nextFunction).not.toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('should handle URL parsing in try block', () => {
    mockRequest.ruleResult = 'https://example.com/path';
    mockRequest.headers = {
      host: 'localhost:5000'
    };

    redirectMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.redirect).toHaveBeenCalledWith(302, 'https://example.com/path');
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should use default port when host header is missing in isSameHost', () => {
    mockRequest.ruleResult = 'http://localhost:5000/test';
    mockRequest.headers = {}; 

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    mockResponse.status = jest.fn().mockReturnValue(mockResponse);
    mockResponse.json = jest.fn();

    redirectMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Preventing redirect loop'));
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Redirect loop detected' });
    expect(mockResponse.redirect).not.toHaveBeenCalled();
    expect(nextFunction).not.toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('should allow redirect when host header is missing but redirect is to external domain', () => {
    mockRequest.ruleResult = 'https://example.com/path';
    mockRequest.headers = {}; 

    redirectMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.redirect).toHaveBeenCalledWith(302, 'https://example.com/path');
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should check redirectUrl.host === currentHost condition', () => {
    mockRequest.ruleResult = 'http://example.com:8080/path';
    mockRequest.headers = {
      host: 'example.com:8080'
    };

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    mockResponse.status = jest.fn().mockReturnValue(mockResponse);
    mockResponse.json = jest.fn();

    redirectMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Preventing redirect loop'));
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Redirect loop detected' });
    expect(mockResponse.redirect).not.toHaveBeenCalled();
    expect(nextFunction).not.toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('should check redirectUrl.hostname === localhost condition', () => {
    mockRequest.ruleResult = 'http://localhost:3000/path';
    mockRequest.headers = {
      host: 'example.com:5000'
    };

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    mockResponse.status = jest.fn().mockReturnValue(mockResponse);
    mockResponse.json = jest.fn();

    redirectMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Preventing redirect loop'));
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Redirect loop detected' });
    expect(mockResponse.redirect).not.toHaveBeenCalled();
    expect(nextFunction).not.toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('should allow redirect when hostname is not localhost and hosts differ', () => {
    mockRequest.ruleResult = 'http://example.com:8080/path';
    mockRequest.headers = {
      host: 'otherdomain.com:5000'
    };

    redirectMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.redirect).toHaveBeenCalledWith(302, 'http://example.com:8080/path');
    expect(nextFunction).not.toHaveBeenCalled();
  });
});

