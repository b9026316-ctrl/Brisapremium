import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleApiRequest } from './src/server/apiHandler.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Proxy all /api/* routes to handleApiRequest
app.all('/api/*', async (req, res) => {
  const method = req.method;
  const pathname = req.path;
  const bodyText = JSON.stringify(req.body || {});

  try {
    const result = await handleApiRequest(method, pathname, bodyText, req.headers);
    return res.status(result.statusCode).json(result.data);
  } catch (error: any) {
    console.error('Server API error:', error);
    return res.status(500).json({ error: error?.message || 'Error en el servidor' });
  }
});

// Serve static assets in production
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌸 BRISA PREMIUM running on http://localhost:${PORT}`);
});
