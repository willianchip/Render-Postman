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
    // LOG 1: Vamos ver o que chegou aqui
    console.log(`[DEBUG] Pedido de criação recebido. Nome enviado: '${name}'`);

    const id = name || uuidv4(); 
    console.log(`[DEBUG] ID Final da sessão será: '${id}'`);

    const sessionPath = `sessions/${id}`;

    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true, // Mudamos para true para ver se aparece no log do Render
        browser: ["Render-Postman", "Chrome", "1.0.0"],
        connectTimeoutMs: 60000
    });

    saveSession(id, { name: id, sock, qr: null, status: 'INITIALIZING' });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { qr, connection, lastDisconnect } = update;

        if (qr) {
            console.log(`[DEBUG] 🔥 QR CODE GERADO PELO BAILEYS PARA: ${id}`);
            try {
                const qrBuffer = await QRCode.toBuffer(qr);
                saveSession(id, { qr: qrBuffer, status: 'QR_READY' });
                console.log(`[DEBUG] ✅ QR Code salvo na memória com sucesso!`);
            } catch (err) {
                console.error(`[DEBUG] ❌ Erro ao converter QR Code:`, err);
            }
        }

        if (connection === "open") {
            console.log(`[DEBUG] 🚀 Conexão estabelecida: ${id}`);
            saveSession(id, { status: 'CONNECTED', qr: null });
        }

        if (connection === "close") {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(`[DEBUG] ⚠️ Conexão fechada (${id}). Reconectar? ${shouldReconnect}`);
            if (!shouldReconnect) {
                deleteSession(id);
            }
        }
    });

    return { id, status: 'INITIALIZING', message: "Verifique os logs do Render para ver o progresso." };
};

export const getQRService = (id) => {
    const session = getSession(id);
    if (!session) {
        console.log(`[DEBUG] Tentativa de pegar QR para '${id}' falhou. Sessão não encontrada na memória.`);
        return null;
    }
    if (!session.qr) {
        console.log(`[DEBUG] Sessão '${id}' encontrada, mas QR Code ainda é null.`);
    }
    return session.qr;
};

export const getSessionStatusService = (id) => {
    const session = getSession(id);
    if (!session) return { status: "NOT_FOUND" };
    return { status: session.status };
};
