import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";

const sessions = {};

export async function startWhatsApp(sessionId) {
  if (sessions[sessionId]) return sessions[sessionId];

  const { state, saveCreds } = await useMultiFileAuthState(
    `./sessions/${sessionId}`
  );

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  sessions[sessionId] = {
    sock,
    qr: null,
    connected: false
  };

  sock.ev.on("connection.update", (update) => {
    const { qr, connection, lastDisconnect } = update;

    if (qr) {
      sessions[sessionId].qr = qr;
    }

    if (connection === "open") {
      sessions[sessionId].connected = true;
      sessions[sessionId].qr = null;
      console.log("✅ WhatsApp conectado:", sessionId);
    }

    if (connection === "close") {
      const reason =
        lastDisconnect?.error?.output?.statusCode;

      if (reason !== DisconnectReason.loggedOut) {
        startWhatsApp(sessionId);
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);

  return sessions[sessionId];
}

export function getSession(sessionId) {
  return sessions[sessionId];
}
