import { Context } from "../types";
import { AbstractCondition } from "../../../../shared/types/abstract-condition";

export class BrowserCondition extends AbstractCondition {
    type = "browser";
    check(ctx: Context, cond: any): boolean {
        return ctx.browser === cond.is;
    }
}
