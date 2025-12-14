import { Router } from "express";
// Importa do Service Unificado
import { createSessionService, getQRService, getSessionStatusService } from "../services/sessionService.js";

const router = Router();

// Rota: POST /api/session/create
router.post("/create", async (req, res) => {
    try {
        const { sessionName } = req.body;
        const result = await createSessionService(sessionName);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: "Erro: " + error.message });
    }
});

// Rota: GET /api/session/{nome}/qr
router.get("/:sessionName/qr", (req, res) => {
    const { sessionName } = req.params;
    const qrBuffer = getQRService(sessionName);

    if (!qrBuffer) {
        return res.status(404).json({ error: "QR Code não disponível. (Recrie a sessão ou aguarde)" });
    }

    res.setHeader("Content-Type", "image/png");
    res.send(qrBuffer);
});

// Rota: GET /api/session/{nome}/status
router.get("/:sessionName/status", (req, res) => {
    const { sessionName } = req.params;
    const status = getSessionStatusService(sessionName);
    res.json(status);
});

export default router;
