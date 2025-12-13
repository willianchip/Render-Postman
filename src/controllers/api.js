import { createSessionService, getSessionStatusService, getQRService } from "../services/sessionService.js";

export const createSession = async (req, res) => {
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

export const getStatus = (req, res) => {
    const { sessionName } = req.params;
    const status = getSessionStatusService(sessionName);
    res.json(status);
};

export const getQR = (req, res) => {
    const { sessionName } = req.params;
    const qrBuffer = getQRService(sessionName);

    if (!qrBuffer) {
        return res.status(404).json({ error: "QR Code não disponível (Sessão não existe ou já conectada)" });
    }

    res.setHeader("Content-Type", "image/png");
    res.send(qrBuffer);
};
