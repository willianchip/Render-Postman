import { makeWASocket, useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import { saveSession, deleteSession } from "../utils/sessionStore.js";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

// Garante que a pasta sessions existe na raiz
if (!fs.existsSync("sessions")) {
    fs.mkdirSync("sessions");
}

export const createNewSession = async (name) => {
    // Gera um ID único para a sessão
    const id = uuidv4();
    const sessionPath = `sessions/${id}`;

    // Cria a subpasta para salvar as credenciais do Baileys
    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: ["Render-Postman", "Chrome", "1.0.0"],
        connectTimeoutMs: 60000 // Aumenta tempo para evitar timeout
    });

    // Salva estado inicial
    saveSession(id, { name, sock, qr: null, status: 'INITIALIZING' });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { qr, connection, lastDisconnect } = update;

        if (qr) {
            // Converte QR para Buffer de imagem e salva
            const qrBuffer = await QRCode.toBuffer(qr);
            saveSession(id, { qr: qrBuffer, status: 'QR_READY' });
            console.log(`QR Code gerado para sessão: ${id}`);
        }

        if (connection === "open") {
            saveSession(id, { status: 'CONNECTED', qr: null });
            console.log(`Conectado: ${id}`);
        }

        if (connection === "close") {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(`Conexão fechada (${id}). Reconectando: ${shouldReconnect}`);
            
            if (!shouldReconnect) {
                deleteSession(id);
            }
        }
    });

    return { id, name };
};
