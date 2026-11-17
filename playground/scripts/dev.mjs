import { fileURLToPath } from 'node:url';
import { build, createServer } from 'vite';

const libraryRoot = fileURLToPath(new URL('../..', import.meta.url));
const libraryConfig = fileURLToPath(new URL('../../vite.config.js', import.meta.url));
const playgroundConfig = fileURLToPath(new URL('../vite.config.js', import.meta.url));
// predev builds the package and types first. Keep dist current while consuming
// the same package exports that a real application uses.
const watcher = await build({ root: libraryRoot, configFile: libraryConfig,
  build: { watch: {}, emptyOutDir: false } });
let server;
async function close() {
  await Promise.all([watcher.close(), server?.close()]);
}
try {
  server = await createServer({ configFile: playgroundConfig });
  await server.listen();
  server.printUrls();
} catch (error) {
  await close();
  throw error;
}
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => { await close(); process.exit(0); });
}
