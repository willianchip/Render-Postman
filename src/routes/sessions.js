import { Router } from "express";
import {
  createSession,
  getSessionStatus
} from "../controllers/sessionController.js";

const router = Router();

router.post("/create", createSession);
router.get("/status/:id", getSessionStatus);

export default router;
