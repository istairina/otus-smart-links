import { ConditionPlugin } from "./condition-plugin-type";
import { Context } from "./context-type";

export abstract class AbstractCondition implements ConditionPlugin { 
    abstract type: string;
    abstract check(_ctx: Context, _cond: any): boolean; 
}

