// src/utils/sessionStore.js
const sessions = new Map();

export const saveSession = (id, data) => {
  // Se já existe, atualiza mantendo os dados antigos
  const existing = sessions.get(id) || {};
  sessions.set(id, { ...existing, ...data });
};

export const getSession = (id) => {
  return sessions.get(id);
};

export const deleteSession = (id) => {
  sessions.delete(id);
};
