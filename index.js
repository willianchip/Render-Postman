import express from "express";
import cors from "cors";
import { makeWASocket, useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(cors());
app.use(express.json());

// --- MEMÓRIA VOLÁTIL ---
const sessoes = new Map();

// --- FUNÇÃO DE LIMPEZA E INÍCIO ---
async function criarSessao(id) {
    // 1. LIMPEZA DE SUJEIRA (CRUCIAL):
    // Se a pasta da sessão já existe, DELETA ela para forçar um QR novo.
    const sessionPath = `sessions/${id}`;
    if (fs.existsSync(sessionPath)) {
        console.log(`[LIMPEZA] Apagando sessão antiga/suja de: ${id}`);
        fs.rmSync(sessionPath, { recursive: true, force: true });
    }

    // 2. Cria a pasta nova do zero
    if (!fs.existsSync("sessions")) fs.mkdirSync("sessions");
    // Não precisa criar a subpasta sessionPath manualmente, o Baileys cria.

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: ["Render-Limpo", "Chrome", "1.0.0"],
        connectTimeoutMs: 60000
    });

    // Salva na memória
    sessoes.set(id, { sock, qr: null, status: 'INITIALIZING' });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { qr, connection, lastDisconnect } = update;

        if (qr) {
            console.log(`[NOVO QR] Gerado com sucesso para: ${id}`);
            const qrBuffer = await QRCode.toBuffer(qr);
            
            // Atualiza memória
            const atual = sessoes.get(id);
            if (atual) sessoes.set(id, { ...atual, qr: qrBuffer, status: 'QR_READY' });
        }

        if (connection === "open") {
            console.log(`[CONECTADO] ${id} está online!`);
            const atual = sessoes.get(id);
            if (atual) sessoes.set(id, { ...atual, status: 'CONNECTED', qr: null });
        }

        if (connection === "close") {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(`[FECHOU] ${id}. Reconectar? ${shouldReconnect}`);
            
            if (!shouldReconnect) {
                sessoes.delete(id); // Remove da memória
            }
        }
    });
}

// --- ROTAS ---

app.post("/api/session/create", async (req, res) => {
    const { sessionName } = req.body;
    const id = sessionName || uuidv4();

    console.log(`[API] Solicitando sessão limpa para: ${id}`);

    // Remove da memória se já existir
    if (sessoes.has(id)) {
        sessoes.delete(id);
    }

    // Inicia processo
    await criarSessao(id);
    
    res.json({ 
        id, 
        status: "INITIALIZING", 
        message: "Limpamos a pasta antiga e iniciamos. Aguarde 10s pelo QR." 
    });
});

app.get("/api/session/:id/qr", (req, res) => {
    const { id } = req.params;
    const sessao = sessoes.get(id);

    // Diagnóstico preciso do erro
    if (!sessao) {
        console.log(`[FALHA GET] Sessão '${id}' não está na memória RAM.`);
        return res.status(404).json({ error: "Sessão não encontrada na memória. Você fez o POST?" });
    }
    
    if (!sessao.qr) {
        console.log(`[FALHA GET] Sessão '${id}' existe, mas QR é null.`);
        return res.status(404).json({ error: "O QR Code ainda não foi gerado. Aguarde mais uns segundos." });
    }

    console.log(`[SUCESSO GET] Entregando imagem para ${id}`);
    res.setHeader("Content-Type", "image/png");
    res.send(sessao.qr);
});

// TESTE DE VIDA
app.get("/", (req, res) => res.send("Servidor Limpo Online"));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor rodando limpo na porta ${PORT}`));
