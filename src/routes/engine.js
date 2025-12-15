import { makeWASocket, useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

// BANCO DE DADOS NA MEMÓRIA (Ram)
// Armazena: { id, sock, qr, status }
const sessoesAtivas = new Map();

// Garante que a pasta física de sessões existe
if (!fs.existsSync("sessions")) {
    fs.mkdirSync("sessions");
}

// --- FUNÇÃO PRINCIPAL: INICIAR ---
export const iniciarSessao = async (nome) => {
    const id = nome || uuidv4();
    console.log(`[ENGINE] Iniciando sessão para: ${id}`);

    // Se já existe e está conectada, retorna aviso
    if (sessoesAtivas.has(id)) {
        const sessao = sessoesAtivas.get(id);
        if (sessao.status === 'CONNECTED') {
            return { id, status: 'ALREADY_CONNECTED', message: "Sessão já existe e está conectada!" };
        }
    }

    const sessionPath = `sessions/${id}`;
    if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: ["Render-Postman", "Chrome", "1.0.0"],
        connectTimeoutMs: 60000
    });

    // Salva na memória RAM
    sessoesAtivas.set(id, { sock, qr: null, status: 'INITIALIZING' });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { qr, connection, lastDisconnect } = update;

        if (qr) {
            console.log(`[QR] Gerado para ${id}`);
            const qrBuffer = await QRCode.toBuffer(qr);
            
            // Atualiza memória
            const atual = sessoesAtivas.get(id);
            if (atual) {
                sessoesAtivas.set(id, { ...atual, qr: qrBuffer, status: 'QR_READY' });
            }
        }

        if (connection === "open") {
            console.log(`[CONEXAO] ${id} Conectado com sucesso!`);
            const atual = sessoesAtivas.get(id);
            if (atual) {
                sessoesAtivas.set(id, { ...atual, status: 'CONNECTED', qr: null });
            }
        }

        if (connection === "close") {
            const code = (lastDisconnect?.error)?.output?.statusCode;
            const shouldReconnect = code !== DisconnectReason.loggedOut;
            console.log(`[FECHOU] ${id}. Código: ${code}. Reconectar: ${shouldReconnect}`);
            
            if (!shouldReconnect) {
                sessoesAtivas.delete(id); // Remove da memória se for logout
            }
        }
    });

    return { 
        id, 
        status: 'INITIALIZING', 
        message: "Sessão criada! Aguarde 10 segundos e peça o QR Code." 
    };
};

// --- FUNÇÃO: PEGAR QR ---
export const pegarQR = (id) => {
    const sessao = sessoesAtivas.get(id);
    if (!sessao) return null;
    return sessao.qr;
};

// --- FUNÇÃO: VER STATUS ---
export const verStatus = (id) => {
    const sessao = sessoesAtivas.get(id);
    if (!sessao) return { status: "NOT_FOUND" };
    return { status: sessao.status };
};
