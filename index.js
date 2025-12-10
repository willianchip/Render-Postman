import express from "express";
import sessionRoutes from "./src/routes/sessionRoutes.js";

const app = express();
app.use(express.json());

// Rotas da API
app.use("/api/session", sessionRoutes);

// Porta do servidor (Render usa variable PORT)
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
