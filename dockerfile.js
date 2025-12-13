FROM node:20-bullseye-slim

# Instala dependências do sistema necessárias para o Node/Baileys (caso precise)
RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 10000

CMD ["npm", "start"]