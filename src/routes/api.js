import { Router } from "express";
import { createSessionService, getSessionStatusService, getQRService } from "../services/sessionService.js";

const router = Router();

// --- LÓGICA DO CONTROLLER EMBUTIDA (Para não dar erro de arquivo não encontrado) ---

const createSession = async (req, res) => {
    try {
        const { sessionName } = req.body;
        if (!sessionName) return res.status(400).json({ error: "Nome da sessão (sessionName) é obrigatório" });

        const result = await createSessionService(sessionName);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro interno ao criar sessão" });
    }
};

const getStatus = (req, res) => {
    const { sessionName } = req.params;
    const status = getSessionStatusService(sessionName);
    res.json(status);
};

const getQR = (req, res) => {
    const { sessionName } = req.params;
    const qrBuffer = getQRService(sessionName);

    if (!qrBuffer) {
        return res.status(404).json({ error: "QR Code não disponível (Sessão não existe ou já conectada)" });
    }

    res.setHeader("Content-Type", "image/png");
    res.send(qrBuffer);
};

// --- DEFINIÇÃO DAS ROTAS ---

router.post("/create", createSession);
router.get("/:sessionName/status", getStatus);
router.get("/:sessionName/qr", getQR);

export default router;
