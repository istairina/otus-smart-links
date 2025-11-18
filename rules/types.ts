export type Context = {
    time: string;       
    browser: string;    
    geo: string;        
};

export interface ConditionPlugin {
    type: string;
    check(ctx: Context, cond: any): boolean;
}

export type Rule = {
    id: number;
    conditions: { type: string; [k: string]: any }[];
    action: { redirectTo: string };
};