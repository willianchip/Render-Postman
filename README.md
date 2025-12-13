# Evolution Lite - API WhatsApp para Render

API simplificada baseada na biblioteca Baileys para conexão de WhatsApp em nuvem.

## Como rodar localmente

1. `npm install`
2. `npm start`

## Rotas Disponíveis

### 1. Criar Sessão (Conectar)
- **Método:** POST
- **URL:** `/sessions/create`
- **Body:** `{ "sessionName": "meuzap" }`

### 2. Pegar QR Code (Imagem PNG)
- **Método:** GET
- **URL:** `/sessions/meuzap/qr`
- **Uso:** Pode colocar direto numa tag `<img src="...">`

### 3. Ver Status
- **Método:** GET
- **URL:** `/sessions/meuzap/status`
- **Retorno:** `INITIALIZING`, `QR_READY`, `CONNECTED` ou `DISCONNECTED`