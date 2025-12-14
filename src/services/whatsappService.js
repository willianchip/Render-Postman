import { makeWASocket, useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import QRCode from "qrcode";
// CORREÇÃO AQUI: Mudamos de updateSession para saveSession
import { saveSession, deleteSession } from "../utils/sessionStore.js";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

// Garante que a pasta existe
if (!fs.existsSync("sessions")) {
    fs.mkdirSync("sessions");
}

export const createNewSession = async (name) => {
    const id = uuidv4();
    const sessionPath = `sessions/${id}`;

    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: ["Render-Postman", "Chrome", "1.0.0"]
    });

    // CORREÇÃO AQUI: Usamos saveSession
    saveSession(id, { name, sock, qr: null, status: 'INITIALIZING' });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { qr, connection, lastDisconnect } = update;

        if (qr) {
            const qrPng = await QRCode.toBuffer(qr);
            // CORREÇÃO AQUI: Usamos saveSession
            saveSession(id, { qr: qrPng, status: 'QR_READY' });
        }

        if (connection === "open") {
            // CORREÇÃO AQUI: Usamos saveSession
            saveSession(id, { status: 'CONNECTED', qr: null });
        }

        if (connection === "close") {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                // Opcional: reconectar
            } else {
                deleteSession(id);
            }
        }
    });

    return { id, name };
};
