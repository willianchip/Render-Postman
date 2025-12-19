import { startWhatsApp } from "./whatsapp.js";

const sessions = new Map();
const qrs = new Map();

export async function createSession(name) {
  if (sessions.has(name)) return;

  const { sock, getQRBuffer } = await startWhatsApp(name);

  sessions.set(name, sock);

  const interval = setInterval(() => {
    const qr = getQRBuffer();
    if (qr) {
      qrs.set(name, qr);
      clearInterval(interval);
    }
  }, 1000);
}

export function getQR(name) {
  return qrs.get(name);
}
