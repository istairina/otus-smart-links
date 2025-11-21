import { Request, Response, NextFunction } from "express";
import process from "node:process";

export function getRulesServiceUrl(): string {
  return process.env.RULES_SERVICE_URL || "http://localhost:4000";
}

export async function ruleEngineMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.context) {
    return next();
  }

  try {
    const response = await fetch(`${getRulesServiceUrl()}/evaluate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.context),
    });

    if (!response.ok) {
      throw new Error(`Rules service returned ${response.status}`);
    }

    const data = await response.json();
    req.ruleResult = data.redirectTo;
  } catch (error) {
    console.error("Error evaluating rules:", error);
    req.ruleResult = null;
  }

  next();
}
