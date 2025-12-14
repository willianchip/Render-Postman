// src/utils/sessionStore.js
const sessions = new Map();

// A função principal de salvar/atualizar
export const updateSession = (id, data) => {
  const existing = sessions.get(id) || {};
  sessions.set(id, { ...existing, ...data });
};

// Criamos um "apelido" para ela. 
// Se algum arquivo chamar "saveSession" ou "updateSession", ambos funcionam.
export const saveSession = updateSession;

export const getSession = (id) => {
  return sessions.get(id);
};

export const deleteSession = (id) => {
  sessions.delete(id);
};
