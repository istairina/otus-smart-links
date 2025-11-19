import { Request, Response, NextFunction } from "express";

export function redirectMiddleware(req: Request, res: Response, next: NextFunction) {
    if (req.ruleResult) {
        return res.redirect(302, req.ruleResult);
    }
    next();
}
