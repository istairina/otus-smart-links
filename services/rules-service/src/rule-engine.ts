import { ConditionPlugin, Rule, Context } from "@shared/types";

export class RuleEngine {
    private rules: Rule[] = [];
    private plugins: Map<string, ConditionPlugin> = new Map();

    constructor(plugins: ConditionPlugin[]) {
        plugins.forEach(p => this.plugins.set(p.type, p));
    }

    loadRules(rules: Rule[]) {
        this.rules = rules;
    }

    evaluate(ctx: Context): string | null {
        for (const rule of this.rules) {
            let match = true;

            for (const cond of rule.conditions) {
                const plugin = this.plugins.get(cond.type);
                if (!plugin) { match = false; break; }
                if (!plugin.check(ctx, cond)) { match = false; break; }
            }

            if (match) return rule.action.redirectTo;
        }
        return null;
    }
}
