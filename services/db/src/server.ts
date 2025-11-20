import express from "express";
import { db } from "./data/action";
import process from "node:process";
import { Rule } from "@shared/types";

const app = express();
app.use(express.json());

const PORT = process.env.DB_PORT || 5000;

app.get("/rules", (_req, res) => res.json(db.getRules()));

app.get("/rules/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid rule id" });
  }
    
  const rule = db.getRule(id);
  if (!rule) {
    return res.status(404).json({ error: "Rule not found" });
  }
    
  res.json(rule);
});

app.post("/rules", (req, res) => {
  try {
    const { conditions, action } = req.body;
        
    if (!conditions || !Array.isArray(conditions) || !action || !action.redirectTo) {
      return res.status(400).json({ error: "Invalid rule data" });
    }
        
    const newRule = db.putRule({ conditions, action });
    res.status(201).json(newRule);
  } catch (error) {
    res.status(400).json({ error: "Failed to create rule" });
  }
});

app.put("/rules/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid rule id" });
  }
    
  const { conditions, action } = req.body;
  const ruleData: Partial<Omit<Rule, 'id'>> = {};
    
  if (conditions !== undefined) {
    if (!Array.isArray(conditions)) {
      return res.status(400).json({ error: "Invalid conditions format" });
    }
    ruleData.conditions = conditions;
  }
    
  if (action !== undefined) {
    if (!action.redirectTo) {
      return res.status(400).json({ error: "Invalid action format" });
    }
    ruleData.action = action;
  }
    
  const updatedRule = db.updateRule(id, ruleData);
  if (!updatedRule) {
    return res.status(404).json({ error: "Rule not found" });
  }
    
  res.json(updatedRule);
});

app.delete("/rules/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid rule id" });
  }
    
  const deleted = db.deleteRule(id);
  if (!deleted) {
    return res.status(404).json({ error: "Rule not found" });
  }
    
  res.status(204).send();
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});


app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`DB service is running on ${url}`);
});