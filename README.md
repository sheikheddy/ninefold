# Ninefold

A pixel-art battler of nine mythic bringers of civilization. Choose three,
enter the figure, and unlock the fragment archive.

Play: https://sheikheddy.github.io/ninefold/

## Development

```bash
npm install
npm run dev
```

## Deploying

`docs/index.html` is a single self-contained page (styles, script, and archive
art all inlined), served by GitHub Pages from the `docs/` folder on `main`.

```bash
npm run build
node scripts/build-standalone.mjs docs/index.html
```

The builder inlines archive art from `.archive-jpg/` when that folder exists
(JPEG, ~1.9 MB) and falls back to the PNG originals in `public/archive/`.
