/**
 * Serviço simulador/placeholder para integrar com Baileys / WPPConnect.
 * Não contém a implementação real do WhatsApp (evita dependências nativas no Render).
 *
 * Quando quiser conectar de verdade, substitua este arquivo com lógica do baileys/wppconnect
 * que gere o QR string (passo a passo).
 *
 * Atualmente ele retorna uma string QR temporária para teste (ex: "WA-QR-<id>-<timestamp>")
 */

export async function requestQrValue(sessionId) {
  // Simula delay e retorna um valor de QR temporário (para o cliente gerar PNG)
  // Em produção: aqui você invocaria Baileys e retornaria o conteúdo do evento 'qr' recebido da lib.
  await new Promise((r) => setTimeout(r, 60)); // simula async
  const ts = Date.now();
  return `WA-QR:${sessionId}:${ts}`;
}

export async function connect(sessionId) {
  // placeholder - em prod: inicia conexão com WhatsApp, persiste auth state, etc.
  return { ok: true, sessionId };
}

export async function disconnect(sessionId) {
  return { ok: true, sessionId };
}
