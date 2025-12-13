import { Router } from "express";
import { createSession, getStatus, getQR } from "../controllers/sessionController.js";

const router = Router();

// Rota para CRIAR a conexão (POST)
// Exemplo de uso: POST /sessions/create { "sessionName": "loja1" }
router.post("/create", createSession);

// Rota para VERIFICAR se está conectado (GET)
// Exemplo de uso: GET /sessions/loja1/status
router.get("/:sessionName/status", getStatus);

// Rota para PEGAR A IMAGEM do QR Code (GET)
// Exemplo de uso: GET /sessions/loja1/qr
router.get("/:sessionName/qr", getQR);

export default router;
