// src/utils/sessionStore.js
const sessions = new Map();

// Função principal
export const saveSession = (id, data) => {
  const existing = sessions.get(id) || {};
  sessions.set(id, { ...existing, ...data });
};

// --- AQUI ESTÁ A CORREÇÃO ---
// Criamos "apelidos" para a mesma função.
// Isso resolve o erro "does not provide an export named 'addSession'"
export const addSession = saveSession;     // <--- O log pediu isso aqui
export const updateSession = saveSession;  // <--- Previne futuros erros

export const getSession = (id) => {
  return sessions.get(id);
};

export const deleteSession = (id) => {
  sessions.delete(id);
};
