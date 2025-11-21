import express from "express";
import * as Conditions from "./conditions";
import { RuleEngine } from './rule-engine';
import { AbstractCondition, Rule, ConditionPlugin } from '@shared/types';
import process from "node:process";

const app = express();
app.use(express.json());

function initializeConditions(): ConditionPlugin[] {
  const conditions: ConditionPlugin[] = [];
  const conditionModules = Conditions as Record<string, unknown>;

  type ConditionConstructor = new () => AbstractCondition;

  for (const key of Object.keys(conditionModules)) {
    const ConditionClass = conditionModules[key];
    if (typeof ConditionClass === "function" &&
        ConditionClass.prototype instanceof AbstractCondition) {
      const conditionClass = ConditionClass as ConditionConstructor;
      const instance = new conditionClass();
      conditions.push(instance);
      console.log(`Registered condition: ${instance.type}`);
    }
  }

  return conditions;
}

const conditions = initializeConditions();
const engine = new RuleEngine(conditions);

const DB_URL = process.env.DB_URL || "http://localhost:5000";
const PORT = process.env.RULES_SERVICE_PORT || 5001;

async function loadRulesFromDb(retries = 5, delay = 2000): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`${DB_URL}/rules`);
      if (!response.ok) {
        throw new Error(`Failed to fetch rules: ${response.status} ${response.statusText}`);
      }
      const rules: Rule[] = await response.json();
      engine.loadRules(rules);
      console.log(`Loaded ${rules.length} rules from db service`);
      return;
    } catch (error) {
      if (i === retries - 1) {
        console.error("Error loading rules from db service after retries:", error);
        throw error;
      }
      console.log(`Failed to load rules (attempt ${i + 1}/${retries}), retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

app.post("/evaluate", (req, res) => {
  try {
    const ctx = req.body;
    const result = engine.evaluate(ctx);
    res.json({ redirectTo: result });
  } catch (error) {
    res.status(400).json({ error: "Invalid context" });
  }
});

app.post("/reload", async (req, res) => {
  try {
    await loadRulesFromDb();
    res.json({ message: "Rules reloaded successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to reload rules" });
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

export { app, engine, loadRulesFromDb };

function startServer(): void {
  app.listen(PORT, () => {
    const url = `http://localhost:${PORT}`;
    console.log(`Rules service running on ${url}`);
    
    loadRulesFromDb().catch((error) => {
      console.error("Failed to load initial rules, service will continue without rules:", error);
      console.log("Rules can be loaded later via POST /reload endpoint");
    });
  });
}

export { startServer };

if (require.main === module) {
  startServer();
}
