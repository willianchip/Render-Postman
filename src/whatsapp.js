import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";

import P from "pino";
import qrcode from "qrcode";
import fs from "fs";

export async function createWhatsAppSession(sessionId, onQR) {
  const sessionPath = `sessions/${sessionId}`;

  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" })
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, qr } = update;

    if (qr) {
      const qrBase64 = await qrcode.toDataURL(qr);
      onQR(qrBase64);
    }

    if (connection === "open") {
      console.log(`✅ WhatsApp conectado: ${sessionId}`);
    }

    if (connection === "close") {
      console.log(`❌ WhatsApp desconectado: ${sessionId}`);
    }
  });

  sock.ev.on("creds.update", saveCreds);

  return sock;
}
