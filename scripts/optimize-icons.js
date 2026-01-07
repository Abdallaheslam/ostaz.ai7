const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');
const pngToIco = require('png-to-ico');

const sizes = [72,96,128,144,152,192,384,512];

async function run() {
  const dir = path.join(process.cwd(), 'icons');
  if (!await fs.pathExists(dir)) {
    console.warn('icons/ not found, skipping optimization');
    return;
  }

  // For each svg/png generate webp and avif
  for (const size of sizes) {
    const baseNames = [`icon-${size}x${size}`];
    for (const base of baseNames) {
      const svg = path.join(dir, base + '.svg');
      const png = path.join(dir, base + '.png');
      let input = null;
      if (await fs.pathExists(svg)) input = svg;
      else if (await fs.pathExists(png)) input = png;
      if (!input) continue;

      try {
        const webpOut = path.join(dir, `${base}.webp`);
        const avifOut = path.join(dir, `${base}.avif`);

        await sharp(input).resize(size, size).webp({quality: 80}).toFile(webpOut);
        await sharp(input).resize(size, size).avif({quality: 50}).toFile(avifOut);
        console.log(`Optimized ${base} -> webp,avif`);
      } catch (err) {
        console.warn(`Failed to optimize ${base}:`, err.message);
      }
    }
  }

  // Create favicon.ico from the 192 icon resized to 32 and 16
  try {
    const src = (await fs.pathExists(path.join(dir, 'icon-192x192.png'))) ? path.join(dir, 'icon-192x192.png') : path.join(dir, 'icon-192x192.svg');
    if (await fs.pathExists(src)) {
      const tmpDir = path.join(process.cwd(), '.tmp-icons');
      await fs.ensureDir(tmpDir);
      const tmp32 = path.join(tmpDir, 'tmp-32.png');
      const tmp16 = path.join(tmpDir, 'tmp-16.png');
      await sharp(src).resize(32,32).png().toFile(tmp32);
      await sharp(src).resize(16,16).png().toFile(tmp16);

      // Debug: ensure files exist
      const s1 = await fs.stat(tmp32).catch(()=>null);
      const s2 = await fs.stat(tmp16).catch(()=>null);
      if (!s1 || !s2) {
        console.warn('favicon temp files missing, skipping ico');
      } else {
        console.log('tmp32 size', s1.size, 'tmp16 size', s2.size);
        try {
          const icoFunc = pngToIco.default || pngToIco;
          const icoBuf = await icoFunc([tmp32, tmp16]);
          await fs.writeFile(path.join(dir, 'favicon.ico'), icoBuf);
          await fs.remove(tmpDir);
          console.log('Generated favicon.ico');
        } catch (err) {
          console.warn('favicon.ico generation failed:', err.message);
        }
      }
    }
  } catch (err) {
    console.warn('favicon.ico generation failed:', err.message);
  }

}

run().catch(err => {
  console.error(err);
  process.exit(1);
});