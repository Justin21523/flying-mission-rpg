import { defineConfig } from 'vitest/config';
import path from 'path';

// Unit/integration tests run under Vitest (jsdom). Kept separate from the Vite build config so the
// production bundle never pulls test tooling. Shares the `@/` → src alias.
export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
});
