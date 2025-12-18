import express from "express";
import cors from "cors";
import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import fs from "fs";
import pino from "pino";
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(cors());
app.use(express.json());

// --- BANCO DE DADOS NA MEMÓRIA ---
const sessoes = new Map();

// --- FUNÇÃO DE CONEXÃO ---
async function iniciarBaileys(id) {
    // 1. Limpeza de Cache (Remove a pasta antiga para forçar QR Novo)
    const sessionPath = `sessions/${id}`;
    if (fs.existsSync(sessionPath)) {
        console.log(`[RESET] Limpando sessão antiga: ${id}`);
        fs.rmSync(sessionPath, { recursive: true, force: true });
    }

    // 2. Prepara Autenticação
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    console.log(`[START] Iniciando Baileys v${version.join('.')} para ID: ${id}`);

    // 3. Cria o Socket (AQUI ESTÁ O SEGREDO DA CONEXÃO)
    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }), // Log limpo para não travar o Render
        browser: ["Ubuntu", "Chrome", "20.0.04"], // Navegador Linux padrão
        connectTimeoutMs: 60000, // Espera até 60s
        keepAliveIntervalMs: 10000,
        syncFullHistory: false
    });

    // Salva na memória
    sessoes.set(id, { sock, qr: null, status: 'INITIALIZING' });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { qr, connection, lastDisconnect } = update;

        if (qr) {
            console.log(`[SUCESSO] QR Code gerado para: ${id}`);
            const qrBuffer = await QRCode.toBuffer(qr);
            
            // Atualiza a memória com o QR pronto
            const atual = sessoes.get(id);
            if (atual) {
                sessoes.set(id, { ...atual, qr: qrBuffer, status: 'QR_READY' });
            }
        }

        if (connection === "open") {
            console.log(`[CONECTADO] ${id} validado no WhatsApp!`);
            const atual = sessoes.get(id);
            if (atual) sessoes.set(id, { ...atual, status: 'CONNECTED', qr: null });
        }

        if (connection === "close") {
            const reason = (lastDisconnect?.error)?.output?.statusCode;
            console.log(`[FECHOU] Motivo: ${reason}`);
            if (reason !== DisconnectReason.loggedOut) {
                sessoes.delete(id); // Deleta para poder recriar limpo
            }
        }
    });
}

// --- ROTAS (API) ---

// ROTA 1: POST (Ligar o Robô)
app.post("/api/session/create", async (req, res) => {
    const { sessionName } = req.body;
    const id = sessionName || "loja1";

    // Se já existe, mata a antiga e cria nova
    if (sessoes.has(id)) {
        sessoes.delete(id);
    }

    try {
        iniciarBaileys(id); // Não usamos await aqui para liberar o Postman rápido
        res.json({ 
            id, 
            status: "INITIALIZING", 
            message: "Processo iniciado. Aguarde 15 segundos e chame o GET." 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ROTA 2: GET (Pegar a Imagem)
app.get("/api/session/:id/qr", (req, res) => {
    const { id } = req.params;
    const sessao = sessoes.get(id);

    // Se a sessão nem existe na memória (não fez POST ou o servidor reiniciou)
    if (!sessao) {
        return res.status(404).json({ error: "Sessão não encontrada. Faça o POST primeiro." });
    }

    // Se a sessão existe, mas o QR ainda é null
    if (!sessao.qr) {
        // Se já estiver conectado, avisa
        if (sessao.status === 'CONNECTED') {
             return res.status(400).json({ message: "Já está conectado! Não precisa de QR." });
        }
        // Se ainda estiver carregando
        return res.status(404).json({ 
            error: "QR ainda não gerado.",
            dica: "O Baileys está carregando. Tente de novo em 5 segundos."
        });
    }

    // Se tiver QR, entrega a imagem
    res.setHeader("Content-Type", "image/png");
    res.send(sessao.qr);
});

// ROTA 3: Status
app.get("/api/session/:id/status", (req, res) => {
    const { id } = req.params;
    const sessao = sessoes.get(id);
    res.json({ status: sessao ? sessao.status : "NOT_FOUND" });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
