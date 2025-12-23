import { startWhatsApp } from "./whatsapp.js";

const sessions = new Map();

export async function createSession(req, res) {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "name é obrigatório" });
  }

  if (sessions.has(name)) {
    return res.json({ status: "já existe", session: name });
  }

  const session = await startWhatsApp(name);
  sessions.set(name, session);

  res.json({
    status: "created",
    session: name
  });
}

export function getQR(req, res) {
  const { id } = req.params;

  const session = sessions.get(id);

  if (!session || !session.qr) {
    return res.status(404).json({ error: "QR não disponível" });
  }

  res.json({ qr: session.qr });
}
