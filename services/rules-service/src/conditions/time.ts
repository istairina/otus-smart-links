import { Context, AbstractCondition } from "@shared/types";

export class TimeCondition extends AbstractCondition {
  type = "time";

  check(ctx: Context, cond: any): boolean {
    if (!ctx.time) {
      return false;
    }
    const [start, end] = [cond.start, cond.end];

    const toMinutes = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    const current = toMinutes(ctx.time);
    const s = toMinutes(start);
    const e = toMinutes(end);
    
    return current >= s && current <= e;
  }
}
