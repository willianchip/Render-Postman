import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from '@whiskeysockets/baileys';

import QRCode from 'qrcode';

export async function initWhatsApp(name) {
  const { state, saveCreds } = await useMultiFileAuthState(`sessions/${name}`);

  let qrImage = null;

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    if (update.qr) {
      qrImage = await QRCode.toBuffer(update.qr);
    }

    if (update.connection === 'close') {
      const reason = update.lastDisconnect?.error?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        initWhatsApp(name);
      }
    }
  });

  return {
    socket: sock,
    get qr() {
      return qrImage;
    }
  };
}
