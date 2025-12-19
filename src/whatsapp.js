import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import fs from "fs";
import path from "path";

const sessions = {};

export async function startWhatsApp(sessionId, onQR) {
  if (sessions[sessionId]) {
    return sessions[sessionId];
  }

  const sessionPath = path.resolve("sessions", sessionId);
  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr && onQR) {
      onQR(qr);
    }

    if (connection === "close") {
      const shouldReconnect =
        (lastDisconnect?.error instanceof Boom) &&
        lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect) {
        delete sessions[sessionId];
        startWhatsApp(sessionId, onQR);
      } else {
        delete sessions[sessionId];
      }
    }

    if (connection === "open") {
      console.log(`✅ WhatsApp conectado: ${sessionId}`);
    }
  });

  sessions[sessionId] = sock;
  return sock;
}

export function getSession(sessionId) {
  return sessions[sessionId];
}
