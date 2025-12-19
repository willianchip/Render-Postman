import { initWhatsApp } from './whatsapp.js';

const sessions = new Map();

export async function createSession(name) {
  if (sessions.has(name)) return;
  const data = await initWhatsApp(name);
  sessions.set(name, data);
}

export async function getQR(name) {
  const session = sessions.get(name);
  return session?.qr || null;
}
