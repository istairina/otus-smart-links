import { Context } from "@shared/types";

declare global {
    namespace Express {
        interface Request {
            context?: Context;
            ruleResult?: string | null;
        }
    }
}

export const __expressTypes = {};

