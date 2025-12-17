import express from "express";
import cors from "cors";
import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import fs from "fs";
import pino from "pino"; // <--- A FERRAMENTA QUE FALTAVA
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(cors());
app.use(express.json());

const sessoes = new Map();

async function criarSessao(id) {
    // Limpa a pasta antiga para garantir
    const sessionPath = `sessions/${id}`;
    if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    console.log(`[DEBUG] Versão do WA: ${version.join('.')}`);

    // --- AQUI ESTÁ A CORREÇÃO DO ERRO "CEGO" ---
    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true,
        // ESTA LINHA ABAIXO VAI MOSTRAR O ERRO REAL NO LOG DO RENDER:
        logger: pino({ level: 'debug' }), 
        browser: ["Render-Debug", "Chrome", "1.0.0"],
        connectTimeoutMs: 60000
    });
    // -------------------------------------------

    sessoes.set(id, { sock, qr: null, status: 'INITIALIZING' });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { qr, connection, lastDisconnect } = update;

        if (qr) {
            console.log(`[SUCESSO] QR Code gerado para: ${id}`);
            const qrBuffer = await QRCode.toBuffer(qr);
            const atual = sessoes.get(id);
            if (atual) sessoes.set(id, { ...atual, qr: qrBuffer, status: 'QR_READY' });
        }

        if (connection === "close") {
            const reason = (lastDisconnect?.error)?.output?.statusCode;
            // AQUI VAI APARECER O MOTIVO EXATO DA QUEDA:
            console.error(`[ERRO CRÍTICO] Conexão caiu! Motivo: ${reason}`, lastDisconnect?.error);
            
            if (reason !== DisconnectReason.loggedOut) {
                // Tenta reconectar (ou delete a sessão se preferir não insistir)
                sessoes.delete(id); 
            }
        }
    });
}

// --- ROTAS ---
app.post("/api/session/create", async (req, res) => {
    const { sessionName } = req.body;
    const id = sessionName || "loja1";

    if (sessoes.has(id)) sessoes.delete(id);

    try {
        await criarSessao(id);
        res.json({ message: "Iniciando COM DEBUG. Olhe o Log do Render agora!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/session/:id/qr", (req, res) => {
    const { id } = req.params;
    const sessao = sessoes.get(id);

    if (!sessao) return res.status(404).json({ error: "Sessão não existe." });
    
    if (!sessao.qr) {
        return res.status(404).json({ error: "QR ainda não gerado. Verifique o LOG do Render para ver o erro." });
    }

    res.setHeader("Content-Type", "image/png");
    res.send(sessao.qr);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor Debug rodando na porta ${PORT}`));
