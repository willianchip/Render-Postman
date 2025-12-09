import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import { saveSession, loadSession } from "../utils/sessionStore.js";

export const initBaileys = async (sessionId) => {
  const { state, saveCreds } = await useMultiFileAuthState(`sessions/${sessionId}`);

  const socket = makeWASocket({
    auth: state,
    printQRInTerminal: false
  });

  return new Promise((resolve) => {
    socket.ev.on("connection.update", async ({ qr }) => {
      if (qr) {
        const qrImage = await QRCode.toDataURL(qr);
        resolve(qrImage);
      }
    });

    socket.ev.on("creds.update", saveCreds);
  });
};

export const getSessionStatusBaileys = async (sessionId) => {
  const session = loadSession(sessionId);
  return session ? "CONNECTED" : "NOT_CONNECTED";
};
