/**
 * store simples em memória (Map)
 * Em produção você deve persistir em disco ou BD.
 */

const sessions = new Map();

export function create(id, data) {
  sessions.set(id, { ...data });
}

export function get(id) {
  const s = sessions.get(id);
  return s ? { ...s } : null;
}

export function setStatus(id, status) {
  const s = sessions.get(id);
  if (!s) return;
  s.status = status;
  sessions.set(id, s);
}

export function setQrValue(id, qrValue) {
  const s = sessions.get(id);
  if (!s) return;
  s.qrValue = qrValue;
  s.qrGeneratedAt = new Date().toISOString();
  sessions.set(id, s);
}

export function setQrPngBuffer(id, buf) {
  const s = sessions.get(id);
  if (!s) return;
  s.qrPngBuffer = buf;
  sessions.set(id, s);
}

export function deleteSession(id) {
  return sessions.delete(id);
}

export function listAll() {
  return Array.from(sessions.values()).map(s => ({ ...s }));
}
