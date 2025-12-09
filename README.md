# Render-Postman (Evo API minimal)

Endpoints principais:
- POST  /api/session/create          -> cria nova sessão (retorna id, name, status, createdAt)
- GET   /api/session/status/:id      -> status da sessão
- GET   /api/session/:id/qr          -> retorna QR PNG (`image/png`)

Como testar:
1. `npm install`
2. `npm start`
3. Postman:
   - POST https://<your-app>/api/session/create   body JSON: { "name": "teste" }
   - GET  https://<your-app>/api/session/{id}/qr  => retorna imagem PNG
