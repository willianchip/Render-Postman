// src/utils/sessionStore.js
const sessions = new Map();

// A função original
export const saveSession = (id, data) => {
  const existing = sessions.get(id) || {};
  sessions.set(id, { ...existing, ...data });
};

// --- AQUI ESTÁ O TRUQUE ---
// Criamos apelidos para a mesma função.
// Assim, se o código pedir "addSession" ou "updateSession", vai funcionar.
export const addSession = saveSession;
export const updateSession = saveSession;

export const getSession = (id) => {
  return sessions.get(id);
};

export const deleteSession = (id) => {
  sessions.delete(id);
};
