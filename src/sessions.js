import { createWhatsAppSession } from "./whatsapp.js";

const sessions = {};

export async function createSession(id) {
  let qrCode = null;

  const socket = await createWhatsAppSession(id, (qr) => {
    qrCode = qr;
  });

  sessions[id] = { socket, getQR: () => qrCode };
}

export function getSessionQR(id) {
  const session = sessions[id];
  if (!session) return null;
  return session.getQR();
}
