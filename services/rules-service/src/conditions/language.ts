import { Context, AbstractCondition } from "@shared/types";

export class LanguageCondition extends AbstractCondition {
  type = "language";
  check(ctx: Context, cond: any): boolean {
    if (cond.is !== undefined) {
      return ctx.language === cond.is;
    }
    if (cond.include !== undefined) {
      return ctx.language?.includes(cond.include) ?? false;
    }
    return false;
  }
}

