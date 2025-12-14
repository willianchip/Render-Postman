import { Router } from "express";
// Importamos as funções do Service Unificado
import { createSessionService, getQRService, getSessionStatusService } from "../services/sessionService.js";

const router = Router();

// 1. Rota para Criar Sessão (POST)
router.post("/create", async (req, res) => {
    try {
        const { sessionName } = req.body;
        // Chama o serviço
        const result = await createSessionService(sessionName);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: "Erro ao criar sessão: " + error.message });
    }
});

// 2. Rota para pegar QR Code (GET)
router.get("/:sessionName/qr", (req, res) => {
    const { sessionName } = req.params;
    const qrBuffer = getQRService(sessionName);

    if (!qrBuffer) {
        return res.status(404).json({ error: "QR Code não disponível (Aguarde ou recrie a sessão)" });
    }

    res.setHeader("Content-Type", "image/png");
    res.send(qrBuffer);
});

// 3. Rota para ver Status (GET)
router.get("/:sessionName/status", (req, res) => {
    const { sessionName } = req.params;
    const status = getSessionStatusService(sessionName);
    res.json(status);
});

export default router;
