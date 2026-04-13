import { defineConfig } from 'vite';

export default defineConfig({
  appType: 'mpa',
  server: {
    middlewareMode: false,
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        admin: 'admin.html',
      },
    },
  },
  plugins: [
    {
      name: 'spa-fallback',
      apply: 'serve',
      enforce: 'pre',
      configureServer(server) {
        return () => {
          server.middlewares.use((req: any, res: any, next: any) => {
            // Match /tenant/merchant paths and serve index.html
            if (req.url && req.url.match(/^\/[^\/\.]+\/[^\/\.]+(\?.*)?$/)) {
              req.url = '/index.html';
            }
            next();
          });
        };
      },
    },
  ],
});
