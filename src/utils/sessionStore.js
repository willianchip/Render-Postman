const sessions = new Map();

// Exportamos com os dois nomes para evitar confusão de importação
export const saveSession = (id, data) => {
  const existing = sessions.get(id) || {};
  sessions.set(id, { ...existing, ...data });
};

// Se alguém chamar updateSession, usa a mesma lógica
export const updateSession = saveSession;

export const getSession = (id) => {
  return sessions.get(id);
};

export const deleteSession = (id) => {
  sessions.delete(id);
};
