import { Request, Response, NextFunction } from "express";
import { ruleEngine } from "../rule-engine-instance"; 

export function ruleEngineMiddleware(req: Request, res: Response, next: NextFunction) {
    if (!req.context) {
        return next();
    }

    const result = ruleEngine.evaluate(req.context);
    req.ruleResult = result;
    next();
}
