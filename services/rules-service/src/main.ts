import * as Conditions from "./conditions";
import { RuleEngine } from './rule-engine';
import rules from "@db/data/rules.json";
import { AbstractCondition } from '../../../shared/types/abstract-condition';

const conditions = [];

const conditionModules = Conditions as Record<string, unknown>;

type ConditionConstructor = new () => AbstractCondition;

for (const key of Object.keys(conditionModules)) {
    const ConditionClass = conditionModules[key];
    if (typeof ConditionClass === "function" &&
        ConditionClass.prototype instanceof AbstractCondition) {
            const conditionClass = conditionModules[key] as ConditionConstructor;
        conditions.push(new conditionClass());
    }
}

const engine = new RuleEngine(conditions);
engine.loadRules(rules);

const ctx = { time: "11:00", browser: "Chrome", geo: "RU" };
const result = engine.evaluate(ctx);

console.log(result);  
