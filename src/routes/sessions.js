import { Router } from "express";
import {
  createSession,
  getSessionStatus,
  getSessionQr
} from "../controllers/sessionController.js";

const router = Router();

router.post("/create", createSession);
router.get("/status/:id", getSessionStatus);
router.get("/:id/qr", getSessionQr);

export default router;
