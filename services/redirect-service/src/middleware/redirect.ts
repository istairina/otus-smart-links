import { Request, Response, NextFunction } from "express";
import process from "node:process";

const REDIRECT_SERVICE_PORT = process.env.REDIRECT_SERVICE_PORT || 5000;

function isSameHost(url: string, req: Request): boolean {
  try {
    const redirectUrl = new URL(url, `http://${req.headers.host || `localhost:${REDIRECT_SERVICE_PORT}`}`);
    const currentHost = req.headers.host || `localhost:${REDIRECT_SERVICE_PORT}`;
    return redirectUrl.host === currentHost || redirectUrl.hostname === 'localhost';
  } catch {
    return url === 'localhost' || url.startsWith('localhost:') || !url.includes('://');
  }
}

export function redirectMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.ruleResult) {
    if (isSameHost(req.ruleResult, req)) {
      console.warn(`[Redirect] Preventing redirect loop: ${req.ruleResult} -> same host`);
      return res.status(400).json({ error: "Redirect loop detected" });
    }
    return res.redirect(302, req.ruleResult);
  }
  next();
}
