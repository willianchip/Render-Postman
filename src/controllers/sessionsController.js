import {
  startSession,
  getState
} from "../services/sessionService.js";

export const createSession = async (req, res) => {
  try {
    const { id } = req.body;

    const qr = await startSession(id);
    return res.status(200).json({ qrcode: qr });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getSessionStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const state = await getState(id);
    return res.status(200).json({ state });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
