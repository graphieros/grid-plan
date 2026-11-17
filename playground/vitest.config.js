import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(viteConfig, defineConfig({
  test: { environment: 'jsdom', include: ['src/**/__tests__/**/*.test.js'] },
}));
