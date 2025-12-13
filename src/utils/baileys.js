import pino from "pino";

export const getBaileysConfig = () => {
    return {
        printQRInTerminal: true, // Mostra QR no log do Render também
        logger: pino({ level: "silent" }), // "silent" para limpar o log, ou "info" para debugar
        browser: ["Evolution Lite", "Chrome", "1.0.0"],
        connectTimeoutMs: 60000,
    };
};