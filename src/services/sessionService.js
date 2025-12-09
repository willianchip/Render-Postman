import { initBaileys, getSessionStatusBaileys } from "./whatsappService.js";

export const startSession = async (id) => {
  return await initBaileys(id);
};

export const getState = async (id) => {
  return await getSessionStatusBaileys(id);
};
