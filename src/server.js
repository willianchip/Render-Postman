import express from "express";
import { createSession, getQR } from "./sessions.js";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "API WhatsApp online" });
});

app.post("/sessions", async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "name é obrigatório" });
  }

  await createSession(name);
  res.json({ status: "created", session: name });
});

app.get("/sessions/:id/qr", (req, res) => {
  const qr = getQR(req.params.id);

  if (!qr) {
    return res.status(404).json({ error: "QR não disponível" });
  }

  res.type("png").send(qr);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});
