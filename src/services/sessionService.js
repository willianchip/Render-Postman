import { connectWASocket } from "./whatsappService.js";
import { getSession, addSession } from "../utils/sessionStore.js";

export const createSessionService = async (name) => {
    const existing = getSession(name);
    // Se já existe e está conectado, não faz nada
    if (existing && existing.status === "CONNECTED") {
        return { message: "Sessão já está conectada", status: "CONNECTED" };
    }

    // Inicializa no store
    addSession(name, { status: "INITIALIZING", qr: null });
    
    // Chama o serviço do WhatsApp para iniciar a conexão
    await connectWASocket(name);

    return { message: "Iniciando sessão...", status: "INITIALIZING" };
};

export const getSessionStatusService = (name) => {
    const session = getSession(name);
    if (!session) return { status: "NOT_FOUND" };
    return { status: session.status };
};

export const getQRService = (name) => {
    const session = getSession(name);
    if (!session || !session.qr) return null;
    return session.qr;
};