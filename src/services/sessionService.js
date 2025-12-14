import { makeWASocket, useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import { saveSession, getSession, deleteSession } from "../utils/sessionStore.js";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

// Garante pasta sessions
if (!fs.existsSync("sessions")) {
    fs.mkdirSync("sessions");
}

export const createSessionService = async (name) => {
    // LOG IMPORTANTE: Vamos ver se o código novo está rodando
    console.log(`[DEBUG] CÓDIGO NOVO RODANDO! Pedido recebido para: '${name}'`);

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

    saveSession(id, { name: id, sock, qr: null, status: 'INITIALIZING' });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { qr, connection, lastDisconnect } = update;

        if (qr) {
            console.log(`[DEBUG] 🔥 QR CODE GERADO: ${id}`);
            const qrBuffer = await QRCode.toBuffer(qr);
            saveSession(id, { qr: qrBuffer, status: 'QR_READY' });
        }

        if (connection === "open") {
            console.log(`[DEBUG] 🚀 CONECTADO: ${id}`);
            saveSession(id, { status: 'CONNECTED', qr: null });
        }

        if (connection === "close") {
           // Lógica simples de desconexão
           console.log(`[DEBUG] Fechou. Reiniciando...`);
           deleteSession(id);
        }
    });

    // RESPOSTA NOVA PARA PROVAR QUE ATUALIZOU
    return { 
        id, 
        status: 'INITIALIZING', 
        message: "AGORA SIM! O código foi atualizado." 
    };
};

export const getQRService = (id) => {
    const session = getSession(id);
    if (!session) return null;
    return session.qr;
};

export const getSessionStatusService = (id) => {
    const session = getSession(id);
    if (!session) return { status: "NOT_FOUND" };
    return { status: session.status };
};
