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
});

