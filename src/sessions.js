import { startWhatsApp, getSession } from './whatsapp.js';

export async function createSession(req, res) {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'id é obrigatório' });
  }

  await startWhatsApp(id);

  res.json({
    id,
    status: 'CREATED'
  });
}

export function getQR(req, res) {
  const { id } = req.params;
  const session = getSession(id);

  if (!session || !session.qr) {
    return res.status(404).json({ error: 'QR não disponível' });
  }

  const base64 = session.qr.split(',')[1];
  const buffer = Buffer.from(base64, 'base64');

  res.setHeader('Content-Type', 'image/png');
  res.send(buffer);
}
