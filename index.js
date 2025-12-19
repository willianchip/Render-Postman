import express from "express";
import QRCode from "qrcode";
import { makeWASocket, useMultiFileAuthState } from "@whiskeysockets/baileys";
import fs from "fs";

const app = express();
app.use(express.json());

const sessions = new Map();

/**
 * Criar sessão
 */
app.post("/sessions/:id", async (req, res) => {
  const { id } = req.params;

  if (sessions.has(id)) {
    return res.json({ status: "already_exists" });
  }

  const authDir = `./auth/${id}`;
  fs.mkdirSync(authDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(authDir);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { qr, connection } = update;

    if (qr) {
      sessions.set(id, { sock, qr });
    }

    if (connection === "open") {
      console.log("✅ WhatsApp conectado:", id);
    }
  });

  sessions.set(id, { sock });

  res.json({ status: "created", id });
});

/**
 * Gerar QR Code
 */
app.get("/sessions/:id/qr", async (req, res) => {
  const session = sessions.get(req.params.id);

  if (!session || !session.qr) {
    return res.status(404).json({ error: "QR ainda não disponível" });
  }

  const image = await QRCode.toBuffer(session.qr);
  res.type("png").send(image);
});

/**
 * Health
 */
app.get("/", (req, res) => {
  res.send("Evolution API ONLINE");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
