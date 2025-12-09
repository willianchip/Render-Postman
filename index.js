import express from "express";
import cors from "cors";
import sessionRoutes from "./src/routes/sessionRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

// base route
app.get("/", (req, res) => res.send("Evo API - OK"));

// mount
app.use("/api/session", sessionRoutes);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
