import { ConditionPlugin, Context } from "../types";

export abstract class AbstractCondition implements ConditionPlugin { 
    abstract type: string;
    abstract check(_ctx: Context, _cond: any): boolean; 
}