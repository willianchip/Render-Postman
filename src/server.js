import express from 'express';
import { createSession, getQR } from './sessions.js';

const app = express();
app.use(express.json());

app.post('/sessions', createSession);
app.get('/sessions/:id/qr', getQR);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log('Servidor rodando na porta', PORT);
});
