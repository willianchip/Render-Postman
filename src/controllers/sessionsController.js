import * as sessionService from "../services/sessionService.js";

export async function createSession(req, res) {
  try {
    const name = (req.body && req.body.name) || "session";
    const session = await sessionService.createSession({ name });
    return res.status(201).json(session);
  } catch (err) {
    console.error("createSession error:", err);
    return res.status(500).json({ error: "Erro ao criar sessão" });
  }
}

export async function getSessionStatus(req, res) {
  try {
    const { id } = req.params;
    const session = sessionService.getSession(id);
    if (!session) return res.status(404).json({ error: "Sessão não encontrada" });
    return res.json(session);
  } catch (err) {
    console.error("getSessionStatus error:", err);
    return res.status(500).json({ error: "Erro ao buscar status" });
  }
}

export async function getSessionQr(req, res) {
  try {
    const { id } = req.params;
    const session = sessionService.getSession(id);
    if (!session) return res.status(404).json({ error: "Sessão não encontrada" });

    // pede ao service o buffer PNG (se existir)
    const pngBuffer = await sessionService.getSessionQrPngBuffer(id);
    if (!pngBuffer) {
      return res.status(404).json({ error: "QR não disponível" });
    }

    res.setHeader("Content-Type", "image/png");
    return res.send(pngBuffer);
  } catch (err) {
    console.error("getSessionQr error:", err);
    return res.status(500).json({ error: "Erro ao gerar QR" });
  }
}
