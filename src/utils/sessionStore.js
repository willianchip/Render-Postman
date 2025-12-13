// Armazenamento em memória das sessões do WhatsApp
const sessions = new Map();

// Adiciona ou atualiza uma sessão
export const addSession = (name, data) => {
    const current = sessions.get(name) || {};
    sessions.set(name, { ...current, ...data });
};

// Recupera os dados de uma sessão
export const getSession = (name) => {
    return sessions.get(name);
};

// Atualiza dados específicos de uma sessão existente
export const updateSession = (name, data) => {
    const current = sessions.get(name);
    if (current) {
        sessions.set(name, { ...current, ...data });
    }
};

// Remove uma sessão (logout)
export const deleteSession = (name) => {
    sessions.delete(name);
};

// Lista todas as sessões (útil para debug)
export const getAllSessions = () => {
    return Array.from(sessions.keys());
};