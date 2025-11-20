import { Context } from './context-type';

export interface ConditionPlugin {
    type: string;
    check(ctx: Context, cond: any): boolean;
}

