import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { build, createServer } from 'vite';

const libraryRoot = fileURLToPath(new URL('../..', import.meta.url));
const libraryConfig = fileURLToPath(new URL('../../vite.config.js', import.meta.url));
const playgroundConfig = fileURLToPath(new URL('../vite.config.js', import.meta.url));
// predev builds the package and types first. Keep dist current while consuming
// the same package exports that a real application uses.
const watcher = await build({ root: libraryRoot, configFile: libraryConfig,
  build: { watch: {}, emptyOutDir: false } });
const require = createRequire(import.meta.url);
const declarations = spawn(process.execPath, [require.resolve('vue-tsc/bin/vue-tsc.js'),
  '-p', fileURLToPath(new URL('../../tsconfig.build.json', import.meta.url)), '--watch'],
  { cwd: libraryRoot, stdio: 'inherit' });
let server;
async function close() {
  declarations.kill('SIGTERM');
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
