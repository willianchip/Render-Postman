import express from "express";
import cors from "cors";
import { makeWASocket, useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

// --- CONFIGURAÇÃO DO SERVIDOR ---
const app = express();
app.use(cors());
app.use(express.json());

// --- BANCO DE DADOS NA MEMÓRIA ---
// Guarda: { id, sock, qr, status }
const sessoes = new Map();

// --- LÓGICA DO BAILEYS (WHATSAPP) ---
async function criarSessao(id) {
    // Garante pasta sessions
    if (!fs.existsSync("sessions")) fs.mkdirSync("sessions");
    const sessionPath = `sessions/${id}`;
    if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: ["Render-API", "Chrome", "1.0.0"],
        connectTimeoutMs: 60000
    });

    // Salva estado inicial
    sessoes.set(id, { sock, qr: null, status: 'INITIALIZING' });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { qr, connection, lastDisconnect } = update;

        if (qr) {
            console.log(`[QR] Novo QR gerado para: ${id}`);
            const qrBuffer = await QRCode.toBuffer(qr);
            
            // Atualiza na memória
            const atual = sessoes.get(id);
            if (atual) sessoes.set(id, { ...atual, qr: qrBuffer, status: 'QR_READY' });
        }

        if (connection === "open") {
            console.log(`[SUCESSO] ${id} Conectado!`);
            const atual = sessoes.get(id);
            if (atual) sessoes.set(id, { ...atual, status: 'CONNECTED', qr: null });
        }

        if (connection === "close") {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(`[FECHOU] ${id}. Reconectar: ${shouldReconnect}`);
            if (!shouldReconnect) {
                sessoes.delete(id);
            }
        }
    });
}

// --- ROTAS DA API ---

// 1. Criar Sessão (POST)
app.post("/api/session/create", async (req, res) => {
    const { sessionName } = req.body;
    const id = sessionName || uuidv4();

    console.log(`[API] Pedido de criação para: ${id}`);

    if (sessoes.has(id)) {
        return res.json({ id, status: "EXISTS", message: "Sessão já existe. Pode buscar o QR." });
    }

    await criarSessao(id);
    
    res.json({ 
        id, 
        status: "INITIALIZING", 
        message: "Sessão iniciada. Aguarde 10s e busque o QR Code." 
    });
});

// 2. Pegar QR Code (GET)
app.get("/api/session/:id/qr", (req, res) => {
    const { id } = req.params;
    const sessao = sessoes.get(id);

    if (!sessao) {
        return res.status(404).json({ error: "Sessão não encontrada. Faça o POST primeiro." });
    }
    if (!sessao.qr) {
        return res.status(404).json({ error: "QR ainda não gerado. Aguarde um pouco..." });
    }

    res.setHeader("Content-Type", "image/png");
    res.send(sessao.qr);
});

// 3. Status (GET)
app.get("/api/session/:id/status", (req, res) => {
    const { id } = req.params;
    const sessao = sessoes.get(id);
    if (!sessao) return res.json({ status: "NOT_FOUND" });
    res.json({ status: sessao.status });
});

// 4. Rota Raiz (Teste)
app.get("/", (req, res) => {
    res.send("Servidor API WhatsApp Online! 🚀");
});

// --- INICIAR SERVIDOR ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
