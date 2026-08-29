import express from 'express';

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'sewflow-backend' });
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
