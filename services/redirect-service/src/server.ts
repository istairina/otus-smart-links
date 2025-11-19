import express from "express";
import { contextMiddleware } from "./middleware/context";
import { ruleEngineMiddleware } from "./middleware/rule-engine";
import { redirectMiddleware } from "./middleware/redirect";
import process from "node:process";


const app = express();

app.use(contextMiddleware);
app.use(ruleEngineMiddleware);
app.use(redirectMiddleware);

const PORT = process.env.REDIRECT_SERVICE_PORT || 5000;

app.get("*", (req, res) => {
    res.send("No redirect rule matched");
});

app.listen(PORT, () => {
    console.log(`Redirector running on port ${PORT}`);
});
