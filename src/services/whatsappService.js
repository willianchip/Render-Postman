import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import path from "path";
import fs from "fs-extra";
import QRCode from "qrcode";
import { getBaileysConfig } from "../utils/baileys.js";
import { updateSession, deleteSession } from "../utils/sessionStore.js";

export const connectWASocket = async (sessionName) => {
    // Define onde a pasta 'auth_info_baileys' vai ficar
    const sessionPath = path.resolve("sessions", sessionName);
    
    // Cria a pasta se não existir
    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const config = getBaileysConfig();

    const sock = makeWASocket({
        auth: state,
        ...config
    });

    // Escuta eventos de conexão
    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log(`QR Code gerado para: ${sessionName}`);
            const qrBuffer = await QRCode.toBuffer(qr);
            // Atualiza a loja com o QR Code novo
            updateSession(sessionName, { qr: qrBuffer, status: "QR_READY", sock: sock });
        }

        if (connection === "open") {
            console.log(`Conectado: ${sessionName}`);
            // Limpa o QR e define status conectado
            updateSession(sessionName, { qr: null, status: "CONNECTED", sock: sock });
        }

        if (connection === "close") {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
            console.log(`Conexão fechada (${sessionName}). Reconectando: ${shouldReconnect}`);
            
            if (shouldReconnect) {
                connectWASocket(sessionName); // Tenta reconectar
            } else {
                updateSession(sessionName, { status: "DISCONNECTED", sock: null });
            }
        }
    });

    // Salva as credenciais sempre que atualizam
    sock.ev.on("creds.update", saveCreds);

    return sock;
};