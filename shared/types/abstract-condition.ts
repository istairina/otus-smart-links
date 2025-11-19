import { ConditionPlugin, Context } from "@shared/types";

export abstract class AbstractCondition implements ConditionPlugin { 
    abstract type: string;
    abstract check(_ctx: Context, _cond: any): boolean; 
}