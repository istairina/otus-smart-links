import express from "express";
import { db } from "./data/action";
import process from "node:process";

const app = express();
app.use(express.json());

const PORT = process.env.DB_PORT || 5000;

app.get("/rules", (_req, res) => res.json(db.getRules()));


app.listen(PORT, () => console.log(`DB running on port ${PORT}`));