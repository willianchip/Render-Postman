// src/services/sessionService.js
import { makeWASocket, useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import QRCode from "qrcode";
// Importamos do store universal que criamos
import { saveSession, getSession, deleteSession } from "../utils/sessionStore.js";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

// Garante pasta sessions
if (!fs.existsSync("sessions")) {
    fs.mkdirSync("sessions");
}

// --- FUNÇÃO 1: CRIAR SESSÃO ---
export const createSessionService = async (name) => {
    // Se o usuário não mandou nome, cria um ID aleatório
    const id = name || uuidv4(); 
    const sessionPath = `sessions/${id}`;

    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: ["Render-Postman", "Chrome", "1.0.0"],
        connectTimeoutMs: 60000
    });

    // Salva estado inicial
    saveSession(id, { name: id, sock, qr: null, status: 'INITIALIZING' });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { qr, connection, lastDisconnect } = update;

        if (qr) {
            console.log(`QR Gerado para ${id}`);
            const qrBuffer = await QRCode.toBuffer(qr);
            saveSession(id, { qr: qrBuffer, status: 'QR_READY' });
        }

        if (connection === "open") {
            console.log(`Conectado: ${id}`);
            saveSession(id, { status: 'CONNECTED', qr: null });
        }

        if (connection === "close") {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(`Conexão fechada (${id}). Reconectando: ${shouldReconnect}`);
            if (!shouldReconnect) {
                deleteSession(id);
            }
        }
    });

    return { id, status: 'INITIALIZING' };
};

// --- FUNÇÃO 2: PEGAR QR CODE ---
export const getQRService = (id) => {
    const session = getSession(id);
    if (!session) return null;
    return session.qr; // Retorna o Buffer da imagem
};

// --- FUNÇÃO 3: PEGAR STATUS ---
export const getSessionStatusService = (id) => {
    const session = getSession(id);
    if (!session) return { status: "NOT_FOUND" };
    return { status: session.status };
};
