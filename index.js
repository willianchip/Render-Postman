import express from "express";
import cors from "cors";
import router from "./src/routes.js"; // Aponta para o novo arquivo de rotas

const app = express();
app.use(cors());
app.use(express.json());

// Rota de teste para ver se o servidor está vivo
app.get("/", (req, res) => {
    res.send("Servidor Online! Use o Postman em /api/session/create");
});

// Usa as rotas definidas na pasta src
app.use("/api/session", router);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Servidor rodando na porta ${PORT}`));
