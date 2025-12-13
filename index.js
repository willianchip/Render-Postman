import express from "express";
import cors from "cors";
import sessionRoutes from "./src/routes/api.js"; // <--- Mudamos para api.js

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/session", sessionRoutes);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
