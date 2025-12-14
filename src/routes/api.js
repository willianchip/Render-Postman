import { Router } from "express";
// AQUI ESTÁ A CORREÇÃO: Apontando para o arquivo que você editou (whatsappService.js)
import { createSessionService, getQRService, getSessionStatusService } from "../services/whatsappService.js";

const router = Router();

// Rota 1: Criar Sessão
router.post("/create", async (req, res) => {
    try {
        const { sessionName } = req.body;
        const result = await createSessionService(sessionName);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: "Erro: " + error.message });
    }
});

// Rota 2: Pegar QR Code
router.get("/:sessionName/qr", (req, res) => {
    const { sessionName } = req.params;
    const qrBuffer = getQRService(sessionName);

    if (!qrBuffer) {
        return res.status(404).json({ error: "QR Code não disponível. (Recrie a sessão ou aguarde)" });
    }

    res.setHeader("Content-Type", "image/png");
    res.send(qrBuffer);
});

// Rota 3: Pegar Status
router.get("/:sessionName/status", (req, res) => {
    const { sessionName } = req.params;
    const status = getSessionStatusService(sessionName);
    res.json(status);
});

export default router;
