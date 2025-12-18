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

// --- MAPA DE SESSÕES (MEMÓRIA RAM) ---
const sessoes = new Map();

// --- FUNÇÃO DE CONEXÃO ---
async function iniciarBaileys(id) {
    // 1. Limpeza de Pasta (Remove sujeira antiga para garantir QR novo)
    const sessionPath = `sessions/${id}`;
    
    // Se a pasta existe, deletamos para forçar uma nova tentativa limpa
    if (fs.existsSync(sessionPath)) {
        console.log(`[LIMPEZA] Removendo sessão antiga: ${id}`);
        fs.rmSync(sessionPath, { recursive: true, force: true });
    }

    // 2. Prepara Autenticação
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    console.log(`[INICIO] Iniciando Baileys v${version.join('.')} para ID: ${id}`);

    // 3. Cria o Socket (CONFIGURAÇÃO ANTI-BLOQUEIO RENDER)
    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }), // Log limpo para não estourar memória
        browser: ["Ubuntu", "Chrome", "20.0.04"], // Simula Linux Desktop
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 10000,
        syncFullHistory: false
    });

    // Salva na memória
    sessoes.set(id, { sock, qr: null, status: 'INITIALIZING' });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { qr, connection, lastDisconnect } = update;

        if (qr) {
            console.log(`[SUCESSO] QR Code novo gerado para: ${id}`);
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
            
            // Se não for logout manual, deleta para permitir reconexão limpa
            if (reason !== DisconnectReason.loggedOut) {
                sessoes.delete(id); 
            }
        }
    });
}

// --- ROTAS (API) ---

// ROTA 1: POST (Ligar o Robô)
app.post("/api/session/create", async (req, res) => {
    const { sessionName } = req.body;
    const id = sessionName || "loja1";

    // Se já existe, remove da memória para reiniciar processo
    if (sessoes.has(id)) {
        sessoes.delete(id);
    }

    try {
        // Não usamos await no iniciarBaileys para liberar o Postman rápido
        iniciarBaileys(id); 
        
        res.json({ 
            id, 
            status: "INITIALIZING", 
            message: "Processo de criação iniciado. Aguarde 15 segundos e peça o QR." 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ROTA 2: GET (Pegar a Imagem)
app.get("/api/session/:id/qr", (req, res) => {
    const { id } = req.params;
    const sessao = sessoes.get(id);

    // Se a sessão nem existe na memória
    if (!sessao) {
        return res.status(404).json({ error: "Sessão não encontrada. Faça o POST primeiro." });
    }

    // Se a sessão existe, mas o QR ainda é null
    if (!sessao.qr) {
        if (sessao.status === 'CONNECTED') {
             return res.status(400).json({ message: "Já está conectado! Não precisa de QR." });
        }
        return res.status(404).json({ 
            error: "QR ainda não gerado.",
            dica: "O servidor está lento. Tente de novo em 5 segundos."
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
