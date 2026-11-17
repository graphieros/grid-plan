import { cpSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('..', import.meta.url));
const consumer = mkdtempSync(join(tmpdir(), 'grid-plan-types-'));
const installed = join(consumer, 'node_modules/grid-plan');
mkdirSync(installed, { recursive: true });
// Copy only published files. No source imports or ambient module shims can
// rescue a broken declaration entry in this isolated consumer.
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
for (const file of ['package.json', 'README.md', 'LICENSE', ...manifest.files]) {
  cpSync(join(root, file), join(installed, file), { recursive: true });
}
for (const file of ['consumer.ts', 'Consumer.vue', 'tsconfig.json']) {
  cpSync(join(root, 'type-tests', file), join(consumer, file));
}
writeFileSync(join(consumer, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
// Vue re-exports its public component types from runtime-dom. The minimum
// version fixture needs those declarations, not a second SSR runtime.
const vueLink = join(consumer, 'node_modules/vue');
for (const vue of ['vue', 'vue-types-min']) {
  symlinkSync(dirname(require.resolve(`${vue}/package.json`)), vueLink, 'dir');
  for (const compiler of ['typescript/bin/tsc', 'vue-tsc/bin/vue-tsc.js']) {
    const result = spawnSync(process.execPath, [require.resolve(compiler), '-p', join(consumer, 'tsconfig.json')], { stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
  console.log(`Consumer types pass with Vue ${JSON.parse(readFileSync(join(vueLink, 'package.json'))).version}.`);
  unlinkSync(vueLink);
}
console.log('Published declarations pass without library source files or handwritten shims.');
