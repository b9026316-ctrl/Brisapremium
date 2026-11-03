import { defineConfig } from 'vite';
import { handleApiRequest } from './src/server/apiHandler.ts';

function apiServerPlugin() {
  return {
    name: 'brisa-api-server-plugin',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url || '';
        if (!url.startsWith('/api/')) {
          return next();
        }

        const method = req.method || 'GET';
        const pathname = url.split('?')[0];

        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const result = await handleApiRequest(method, pathname, body, req.headers);
            res.statusCode = result.statusCode;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify(result.data));
          } catch (error: any) {
            console.error('API Error:', error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: error?.message || 'Error interno del servidor' }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [apiServerPlugin()],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
  },
});
