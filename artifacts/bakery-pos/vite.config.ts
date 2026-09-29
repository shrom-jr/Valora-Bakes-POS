import path from 'path';
import { createHash } from 'node:crypto';
import { mkdir, readFile, rm } from 'node:fs/promises';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import sharp from 'sharp';
import { defineConfig, type Plugin } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

import { VitePWA } from 'vite-plugin-pwa';

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    'PORT environment variable is required but was not provided.',
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    'BASE_PATH environment variable is required but was not provided.',
  );
}

const publicDirectory = path.resolve(import.meta.dirname, 'public');
const logoPath = path.join(publicDirectory, 'logo.png');
const generatedLogoDirectory = path.join(publicDirectory, 'generated');

type GeneratedLogoIcons = {
  version: string;
  favicon: string;
  appleTouchIcon: string;
  pwa192: string;
  pwa512: string;
};

async function generateLogoIcons(): Promise<GeneratedLogoIcons> {
  const logo = await readFile(logoPath);
  const metadata = await sharp(logo).metadata();
  if (metadata.format !== 'png' || !metadata.width || !metadata.height) {
    throw new Error('public/logo.png must be a valid PNG image.');
  }

  const version = createHash('sha256').update(logo).digest('hex').slice(0, 12);
  const names = {
    favicon: `generated/favicon-${version}.png`,
    appleTouchIcon: `generated/apple-touch-${version}.png`,
    pwa192: `generated/pwa-192-${version}.png`,
    pwa512: `generated/pwa-512-${version}.png`,
  };

  await rm(generatedLogoDirectory, { recursive: true, force: true });
  await mkdir(generatedLogoDirectory, { recursive: true });

  const variants = [
    { file: names.favicon, size: 32 },
    { file: names.appleTouchIcon, size: 180 },
    { file: names.pwa192, size: 192 },
    { file: names.pwa512, size: 512 },
  ];

  await Promise.all(
    variants.map(({ file, size }) =>
      sharp(logo)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 247, g: 240, b: 227, alpha: 1 },
        })
        .png()
        .toFile(path.join(publicDirectory, file)),
    ),
  );

  return { version, ...names };
}

let generatedLogoIcons = await generateLogoIcons();
const baseUrl = basePath === '/' ? '' : `/${basePath.replace(/^\/+|\/+$/g, '')}`;
const publicAssetUrl = (assetPath: string) => `${baseUrl}/${assetPath}`;

const logoAssetsPlugin: Plugin = {
  name: 'bakery-pos-logo-assets',
  transformIndexHtml: {
    order: 'pre',
    handler(html) {
      return html
        .replaceAll('__APP_FAVICON_URL__', publicAssetUrl(generatedLogoIcons.favicon))
        .replaceAll('__APP_APPLE_ICON_URL__', publicAssetUrl(generatedLogoIcons.appleTouchIcon));
    },
  },
  configureServer(server) {
    let restartTimer: ReturnType<typeof setTimeout> | undefined;
    const restartAfterLogoChange = (changedPath: string) => {
      if (path.resolve(changedPath) !== logoPath) return;
      if (restartTimer) clearTimeout(restartTimer);
      restartTimer = setTimeout(() => {
        void server.restart().catch((error: unknown) => {
          server.config.logger.error(
            `Could not refresh logo assets: ${error instanceof Error ? error.message : String(error)}`,
          );
        });
      }, 200);
    };

    server.watcher.add(logoPath);
    server.watcher.on('add', restartAfterLogoChange);
    server.watcher.on('change', restartAfterLogoChange);
    server.httpServer?.once('close', () => {
      if (restartTimer) clearTimeout(restartTimer);
      server.watcher.off('add', restartAfterLogoChange);
      server.watcher.off('change', restartAfterLogoChange);
    });
  },
};

export default defineConfig({
  base: basePath,
  define: {
    __LOGO_URL__: JSON.stringify(`${baseUrl}/logo.png?v=${generatedLogoIcons.version}`),
  },
  plugins: [
    logoAssetsPlugin,
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        generatedLogoIcons.favicon,
        generatedLogoIcons.appleTouchIcon,
        generatedLogoIcons.pwa192,
        generatedLogoIcons.pwa512,
      ],
      manifest: {
        name: 'Bakery POS',
        short_name: 'Bakery POS',
        description: 'Mission-critical point-of-sale for bakery teams',
        theme_color: '#0B0C10',
        background_color: '#0B0C10',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: generatedLogoIcons.pwa192,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: generatedLogoIcons.pwa512,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      }
    }),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
