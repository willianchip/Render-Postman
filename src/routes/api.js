import { Router } from "express";
// Importamos APENAS o service, que sabemos que funciona
import { createSessionService, getSessionStatusService, getQRService } from "../services/sessionService.js";

const router = Router();

// --- SOLUÇÃO UNIFICADA: Lógica direto na rota para evitar erro de arquivo não encontrado ---

// 1. Criar Sessão
router.post("/create", async (req, res) => {
    try {
        const { sessionName } = req.body;
        if (!sessionName) return res.status(400).json({ error: "Nome da sessão (sessionName) é obrigatório" });

        const result = await createSessionService(sessionName);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro interno ao criar sessão" });
    }
});

// 2. Status
router.get("/:sessionName/status", async (req, res) => {
    try {
        const { sessionName } = req.params;
        const status = await getSessionStatusService(sessionName);
        res.json({ status });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. QR Code
router.get("/:sessionName/qr", async (req, res) => {
    try {
        const { sessionName } = req.params;
        const qrBuffer = await getQRService(sessionName);

        if (!qrBuffer) {
            return res.status(404).json({ error: "QR Code não disponível (Sessão não existe ou já conectada)" });
        }

        res.setHeader("Content-Type", "image/png");
        res.send(qrBuffer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
