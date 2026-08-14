// Bundles the built site into one self-contained HTML file with the archive
// art inlined, so it can be hosted anywhere without a server or asset paths.
//
//   npm run build && node scripts/build-standalone.mjs docs/index.html
//
// Fragment PNGs are re-encoded to JPEG first (see scripts/encode-archive.mjs)
// when a jpg cache exists, because 14 PNGs come to 4.6 MB.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const outPath = path.resolve(root, process.argv[2] || 'docs/index.html');

const built = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const jsFile = built.match(/<script type="module"[^>]*src="([^"]+)"/)[1];
const cssFile = built.match(/<link rel="stylesheet"[^>]*href="([^"]+)"/)[1];
const js = fs.readFileSync(path.join(dist, jsFile.replace(/^\//, '')), 'utf8');
const css = fs.readFileSync(path.join(dist, cssFile.replace(/^\//, '')), 'utf8');

const jpgDir = path.join(root, '.archive-jpg');
const useJpg = fs.existsSync(jpgDir);
const archiveDir = useJpg ? jpgDir : path.join(root, 'public/archive');
const ext = useJpg ? '.jpg' : '.png';
const mime = useJpg ? 'image/jpeg' : 'image/png';

const embed = {};
for (const file of fs.readdirSync(archiveDir).filter((f) => f.endsWith(ext)).sort()) {
  const data = fs.readFileSync(path.join(archiveDir, file)).toString('base64');
  embed[file.replace(ext, '.png')] = `data:${mime};base64,${data}`;
}

let body = built.match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
body = body.replace('/archive/fragment-01.png', embed['fragment-01.png'] || '');

const closer = '</scr' + 'ipt>';
if (js.includes(closer) || JSON.stringify(embed).includes(closer)) {
  throw new Error('inline script content would terminate its own tag');
}

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="theme-color" content="#070b18" />
<meta name="description" content="Ninefold: a pixel-art battler of nine mythic bringers of civilization." />
<title>Ninefold</title>
<style>
${css}
</style>
</head>
<body>
${body}
<script>window.ARCHIVE_EMBED = ${JSON.stringify(embed)};${closer}
<script type="module">
${js}
${closer}
</body>
</html>
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, page);
console.log(`wrote ${path.relative(root, outPath)} — ${Math.round(page.length / 1024)} KB (${useJpg ? 'jpeg' : 'png'} archive)`);
