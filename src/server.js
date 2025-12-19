import express from 'express';
import { createSession, getQR } from './sessions.js';

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'API online' });
});

app.post('/sessions', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name obrigatório' });

  await createSession(name);
  res.json({ status: 'created', session: name });
});

app.get('/sessions/:name/qr', async (req, res) => {
  const qr = await getQR(req.params.name);
  if (!qr) return res.status(404).json({ error: 'QR não disponível' });

  res.type('image/png').send(qr);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('Server running on port', PORT));
