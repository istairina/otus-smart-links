export type Rule = {
    id: number;
    conditions: { type: string; [k: string]: any }[];
    action: { redirectTo: string };
};

