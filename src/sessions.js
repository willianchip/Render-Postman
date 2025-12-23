import { startWhatsApp, getSession } from "./whatsapp.js";

export function sessionRoutes(app) {

  // CRIAR SESSÃO + INICIAR WHATSAPP
  app.post("/sessions", async (req, res) => {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "name é obrigatório" });
    }

    await startWhatsApp(name);

    res.json({
      status: "started",
      session: name
    });
  });

  // OBTER QR CODE
  app.get("/sessions/:id/qr", (req, res) => {
    const session = getSession(req.params.id);

    if (!session) {
      return res.status(404).json({ error: "Sessão não existe" });
    }

    if (session.connected) {
      return res.json({ status: "connected" });
    }

    if (!session.qr) {
      return res.status(404).json({ error: "QR não disponível" });
    }

    res.json({ qr: session.qr });
  });
}
