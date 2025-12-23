import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from '@whiskeysockets/baileys';

import QRCode from 'qrcode';
import fs from 'fs';

const sessions = new Map();

export async function startWhatsApp(sessionId) {
  if (sessions.has(sessionId)) return sessions.get(sessionId);

  const authPath = `./sessions/${sessionId}`;
  fs.mkdirSync(authPath, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(authPath);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    if (update.qr) {
      const qrPng = await QRCode.toDataURL(update.qr);
      sessions.set(sessionId, { sock, qr: qrPng });
    }

    if (update.connection === 'close') {
      if (update.lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
        startWhatsApp(sessionId);
      }
    }
  });

  sessions.set(sessionId, { sock, qr: null });
  return sessions.get(sessionId);
}

export function getSession(sessionId) {
  return sessions.get(sessionId);
}
