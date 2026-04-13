import { defineConfig } from 'vite';

declare const process: { env: Record<string, string | undefined> };

export default defineConfig({
  appType: 'mpa',
  base: process.env['GITHUB_PAGES'] ? '/apay-config-poc/' : '/',
  server: {
    middlewareMode: false,
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        payment: 'payment.html',
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
            // Match /tenant/merchant paths and serve payment.html
            if (req.url && req.url.match(/^\/[^\/\.]+\/[^\/\.]+(\?.*)?$/)) {
              req.url = '/payment.html';
            }
            next();
          });
        };
      },
    },
  ],
});
