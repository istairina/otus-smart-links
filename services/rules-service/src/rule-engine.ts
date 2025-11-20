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
        if (!plugin) {
          console.warn(`[RuleEngine] Plugin not found for type: ${cond.type}`);
          match = false;
          break;
        }
        const conditionResult = plugin.check(ctx, cond);
        if (!conditionResult) {
          console.warn(`[RuleEngine] Condition failed: type=${cond.type}, condition=${JSON.stringify(cond)}, context=${JSON.stringify(ctx)}`);
          match = false;
          break;
        }
      }

      if (match) {
        console.warn(`[RuleEngine] Rule matched: id=${rule.id}, redirectTo=${rule.action.redirectTo}`);
        return rule.action.redirectTo;
      }
    }
    console.warn(`[RuleEngine] No rules matched for context: ${JSON.stringify(ctx)}`);
    return null;
  }
}
