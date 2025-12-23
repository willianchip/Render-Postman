import express from "express";
import { sessionRoutes } from "./sessions.js";

const app = express();
app.use(express.json());

app.get("/", (_, res) => {
  res.json({ status: "API online" });
});

sessionRoutes(app);

export default app;
