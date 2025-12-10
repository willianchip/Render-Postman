import express from "express";
import sessionRoutes from "./src/routes/sessionRoutes.js";

const app = express();
app.use(express.json());

app.use("/api/session", sessionRoutes);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
