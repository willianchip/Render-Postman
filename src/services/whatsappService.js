import { makeWASocket, useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import { saveSession, getSession, deleteSession } from "../utils/sessionStore.js";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

// Garante que a pasta sessions existe
if (!fs.existsSync("sessions")) {
    fs.mkdirSync("sessions");
}

// --- AQUI ESTÁ A CORREÇÃO DO NOME ---
// O erro pedia "createSessionService", aqui está ela:
export const createSessionService = async (name) => {
    console.log(`[DEBUG] Iniciando criação da sessão para: '${name}'`);

    const id = name || uuidv4(); 
    const sessionPath = `sessions/${id}`;

    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: ["Render-Postman", "Chrome", "1.0.0"],
        connectTimeoutMs: 60000
    });

    // Salva estado inicial
    saveSession(id, { name: id, sock, qr: null, status: 'INITIALIZING' });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { qr, connection, lastDisconnect } = update;

        if (qr) {
            console.log(`[DEBUG] 🔥 QR Code gerado para: ${id}`);
            const qrBuffer = await QRCode.toBuffer(qr);
            saveSession(id, { qr: qrBuffer, status: 'QR_READY' });
        }

        if (connection === "open") {
            console.log(`[DEBUG] 🚀 Conectado: ${id}`);
            saveSession(id, { status: 'CONNECTED', qr: null });
        }

        if (connection === "close") {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(`[DEBUG] Conexão fechada. Reconectar: ${shouldReconnect}`);
            if (!shouldReconnect) {
                deleteSession(id);
            }
        }
    });

    return { 
        id, 
        status: 'INITIALIZING', 
        message: "Serviço iniciado. Verifique os logs para o QR Code." 
    };
};

// --- FUNÇÃO 2 ---
export const getQRService = (id) => {
    const session = getSession(id);
    if (!session) return null;
    return session.qr;
};

// --- FUNÇÃO 3 ---
export const getSessionStatusService = (id) => {
    const session = getSession(id);
    if (!session) return { status: "NOT_FOUND" };
    return { status: session.status };
};
