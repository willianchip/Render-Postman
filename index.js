import express from "express";
import cors from "cors";

// CORREÇÃO AQUI: Apontamos para o arquivo REAL que você tem no GitHub
import sessionRoutes from "./src/routes/api.js"; 

const app = express();
app.use(cors());
app.use(express.json());

// A rota continua sendo /api/session
app.use("/api/session", sessionRoutes);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
