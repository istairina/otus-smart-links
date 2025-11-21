import { Context, AbstractCondition } from "@shared/types";

export class UserAgentCondition extends AbstractCondition {
  type = "user-agent";
  check(ctx: Context, cond: any): boolean {
    if (cond.is !== undefined) {
      return ctx.userAgent === cond.is;
    }
    if (cond.include !== undefined) {
      return ctx.userAgent?.includes(cond.include) ?? false;
    }
    return false;
  }
}

