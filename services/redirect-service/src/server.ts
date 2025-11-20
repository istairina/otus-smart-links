import express from "express";
import "./types/express";
import { contextMiddleware } from "./middleware/context";
import { ruleEngineMiddleware } from "./middleware/rule-engine";
import { redirectMiddleware } from "./middleware/redirect";
import process from "node:process";

const app = express();

app.use(contextMiddleware);
app.use(async (req, res, next) => {
  await ruleEngineMiddleware(req, res, next);
});
app.use(redirectMiddleware);

const PORT = process.env.REDIRECT_SERVICE_PORT || 5000;

app.use((_req, res) => {
  res.status(404).send("No redirect rule matched");
});

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`Redirect service running on ${url}`);
});
