import { Context } from "../types";
import { AbstractCondition } from "../../../../shared/types/abstract-condition";

export class TimeCondition extends AbstractCondition {
    type = "time";

    check(ctx: Context, cond: any): boolean {
        const [start, end] = [cond.start, cond.end];

        //TODO: привести время к числам
        return ctx.time >= start && ctx.time <= end;
    }
}
