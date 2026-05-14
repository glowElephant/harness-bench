import { promises as fs } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

async function main() {
  const inPath = resolve(repoRoot, 'docs/sample-card.svg');
  const outPath = resolve(repoRoot, 'docs/sample-card.png');

  const svg = await fs.readFile(inPath, 'utf-8');

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1280 },
    font: {
      loadSystemFonts: true,
      defaultFontFamily: 'Segoe UI',
    },
    background: '#0b0d10',
  });

  const pngData = resvg.render().asPng();
  await fs.writeFile(outPath, pngData);
  console.log(`PNG written: ${outPath} (${pngData.byteLength} bytes)`);
}

main().catch((err) => {
  console.error('PNG render failed:', err);
  process.exit(1);
});
