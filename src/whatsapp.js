import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";

import qrcode from "qrcode";

export async function startWhatsApp(sessionName) {
  const { state, saveCreds } = await useMultiFileAuthState(`sessions/${sessionName}`);

  let qrBuffer = null;

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { qr, connection, lastDisconnect } = update;

    if (qr) {
      qrBuffer = await qrcode.toBuffer(qr);
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect) {
        startWhatsApp(sessionName);
      }
    }

    if (connection === "open") {
      console.log(`WhatsApp conectado: ${sessionName}`);
    }
  });

  return {
    sock,
    getQRBuffer: () => qrBuffer
  };
}
