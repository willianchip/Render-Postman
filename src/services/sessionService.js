import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import * as store from "../utils/sessionStore.js";
import * as whatsapp from "./whatsappService.js";

/**
 * createSession: cria registro, dispara geração de QR (simulado/placeholder)
 */
export async function createSession({ name }) {
  const id = uuidv4();
  const newSession = {
    id,
    name,
    status: "CREATED",
    createdAt: new Date().toISOString(),
    qrValue: null, // string usado para gerar QR
    qrGeneratedAt: null
  };
  store.create(id, newSession);

  // Tenta iniciar handshake com whatsappService (simulado): recebe um qrValue string
  try {
    const qrValue = await whatsapp.requestQrValue(id);
    if (qrValue) {
      store.setQrValue(id, qrValue);
      // gera buffer PNG e guarda (opcional) -> geramos e guardamos buffer base64
      const pngBuffer = await QRCode.toBuffer(qrValue, { type: "png", width: 400 });
      store.setQrPngBuffer(id, pngBuffer);
      store.setStatus(id, "QR_GENERATED");
    } else {
      store.setStatus(id, "AWAITING_QR");
    }
  } catch (err) {
    console.warn("Erro ao solicitar QR:", err);
    store.setStatus(id, "ERROR");
  }

  return store.get(id);
}

/**
 * getSession(id)
 */
export function getSession(id) {
  return store.get(id);
}

/**
 * getSessionQrPngBuffer(id) -> Buffer | null
 */
export async function getSessionQrPngBuffer(id) {
  const session = store.get(id);
  if (!session) return null;

  // se já temos buffer, retorna
  if (session.qrPngBuffer) return session.qrPngBuffer;

  // se existe qrValue, gera agora
  if (session.qrValue) {
    const buf = await QRCode.toBuffer(session.qrValue, { type: "png", width: 400 });
    store.setQrPngBuffer(id, buf);
    return buf;
  }

  // se não há qrValue, tenta requisitar ao whatsappService (tenta reconectar)
  const qrValue = await whatsapp.requestQrValue(id);
  if (qrValue) {
    store.setQrValue(id, qrValue);
    const buf = await QRCode.toBuffer(qrValue, { type: "png", width: 400 });
    store.setQrPngBuffer(id, buf);
    store.setStatus(id, "QR_GENERATED");
    return buf;
  }

  return null;
}
