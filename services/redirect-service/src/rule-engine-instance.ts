import * as Conditions from "@shared/rules";
import { AbstractCondition } from "@shared/rules";
import rules from "../rules/db/rules.json";
import { RuleEngine } from "../rules/rule-engine";

const plugins = [];
const exported = Conditions as Record<string, any>;

type ConditionConstructor = new () => AbstractCondition;

for (const key of Object.keys(exported)) {
    const Candidate = exported[key];
    if (typeof Candidate === "function" && Candidate.prototype instanceof AbstractCondition) {
        plugins.push(new (Candidate as ConditionConstructor)());
    }
}

export const ruleEngine = new RuleEngine(plugins);
ruleEngine.loadRules(rules);
