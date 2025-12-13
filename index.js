import express from "express";
import cors from "cors";
import sessionRoutes from "./src/routes/sessionRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

// Rota de Health Check (para o Render saber que está vivo)
app.get("/", (req, res) => {
  res.json({ status: "online", message: "API WhatsApp Pronta" });
});

// Rotas da API
app.use("/sessions", sessionRoutes);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});