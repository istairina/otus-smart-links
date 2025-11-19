import { Context } from "../types";
import { AbstractCondition } from "../../../../shared/types/abstract-condition";

export class GeoCondition extends AbstractCondition {
    type = "geo";
    check(ctx: Context, cond: any): boolean {
        return ctx.geo === cond.is;
    }
}
