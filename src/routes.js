import { Router } from "express";
import { iniciarSessao, pegarQR, verStatus } from "./engine.js";

const router = Router();

// POST: Criar Sessão
router.post("/create", async (req, res) => {
    try {
        const { sessionName } = req.body;
        if (!sessionName) return res.status(400).json({ error: "Faltou o sessionName no JSON!" });

        const resultado = await iniciarSessao(sessionName);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Pegar QR
router.get("/:sessionName/qr", (req, res) => {
    const { sessionName } = req.params;
    const qr = pegarQR(sessionName);

    if (!qr) {
        return res.status(404).json({ 
            error: "QR Code não encontrado. Certifique-se de que fez o POST primeiro e aguardou 10s." 
        });
    }

    res.setHeader("Content-Type", "image/png");
    res.send(qr);
});

// GET: Status
router.get("/:sessionName/status", (req, res) => {
    const { sessionName } = req.params;
    res.json(verStatus(sessionName));
});

export default router;
