import fs from "fs";

export const saveSession = (id, data) => {
  fs.writeFileSync(`sessions/${id}.json`, JSON.stringify(data));
};

export const loadSession = (id) => {
  if (!fs.existsSync(`sessions/${id}.json`)) return null;
  return JSON.parse(fs.readFileSync(`sessions/${id}.json`));
};
