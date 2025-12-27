const fs = require('fs-extra');
const path = require('path');
const { minify } = require('html-minifier-terser');

const root = process.cwd();
const dist = path.join(root, 'dist');

async function build() {
  console.log('Building into', dist);

  // 1. Clean
  await fs.remove(dist);
  await fs.ensureDir(dist);

  // 2. Copy static files except node and source-only files
  const keep = ['index.html', 'offline.html', 'manifest.json', 'sw.js', 'icons', 'firebase-config.js', 'admin-responsive.js', 'favicon.ico'];

  for (const item of keep) {
    const src = path.join(root, item);
    if (await fs.pathExists(src)) {
      await fs.copy(src, path.join(dist, item));
      console.log('Copied:', item);
    }
  }

  // 3. Fix manifest: make start_url relative and localize icons
  const manifestPath = path.join(dist, 'manifest.json');
  if (await fs.pathExists(manifestPath)) {
    const manifest = await fs.readJson(manifestPath);
    manifest.start_url = '.';
    manifest.scope = '.';
    if (Array.isArray(manifest.icons)) {
      manifest.icons = manifest.icons.map(icon => {
        const fileName = path.basename(icon.src);
        return Object.assign({}, icon, { src: `./icons/${fileName}` });
      });
    }
    await fs.writeJson(manifestPath, manifest, { spaces: 2 });
    console.log('Updated manifest.json');
  }

  // 4. Minify index.html
  const indexPath = path.join(dist, 'index.html');
  if (await fs.pathExists(indexPath)) {
    let html = await fs.readFile(indexPath, 'utf8');

    // Ensure manifest link is relative
    html = html.replace(/href=("|')https?:\/\/[^\s"']*manifest\.json("|')/i, 'href="./manifest.json"');

    const minified = await minify(html, {
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      minifyCSS: true,
      minifyJS: true,
      useShortDoctype: true
    });

    await fs.writeFile(indexPath, minified, 'utf8');
    console.log('Minified index.html');
  }

  // 5. Bundle and minify local JS into dist/assets
  try {
    const esbuild = require('esbuild');
    const assetsDir = path.join(dist, 'assets');
    await fs.ensureDir(assetsDir);
    const entryFiles = [];
    ['admin-responsive.js', 'firebase-config.js'].forEach(f => {
      const p = path.join(root, f);
      if (fs.existsSync(p)) entryFiles.push(p);
    });

    if (entryFiles.length) {
      // Build a single bundled file with content hash for cache-busting
      const entryScript = path.join(root, 'scripts', 'entry.js');
      if (await fs.pathExists(entryScript)) {
        await esbuild.build({
          entryPoints: [entryScript],
          outdir: assetsDir,
          bundle: true,
          minify: true,
          target: ['es2017'],
          sourcemap: false,
          format: 'iife',
          entryNames: 'app-[hash]'
        });

        // Find generated file name
        const files = await fs.readdir(assetsDir);
        const appFile = files.find(f => f.startsWith('app-') && f.endsWith('.js'));
        if (appFile) {
          // Inject script tag into dist/index.html
          const distIndex = path.join(dist, 'index.html');
          let indexHtml = await fs.readFile(distIndex, 'utf8');
          indexHtml = indexHtml.replace('<!-- APP_SCRIPT_PLACEHOLDER -->', `<script src="./assets/${appFile}" defer></script>`);
          await fs.writeFile(distIndex, indexHtml, 'utf8');
          console.log('Injected bundled app script:', appFile);

          // Also add bundled file to SW static cache (dist/sw.js)
          const swPath = path.join(dist, 'sw.js');
          if (await fs.pathExists(swPath)) {
            let sw = await fs.readFile(swPath, 'utf8');
            // Insert the asset before the closing bracket of STATIC_CACHE_FILES
            sw = sw.replace("'/icons/icon-512x512.svg',", `'/icons/icon-512x512.svg',\n  '/assets/${appFile}',`);
            await fs.writeFile(swPath, sw, 'utf8');
            console.log('Added asset to sw.js cache list');
          }
        }
      }
    }
  } catch (err) {
    console.warn('esbuild step failed (optional):', err);
  }

  // 6. Copy icons if exist in repo icons folder
  const iconsSrc = path.join(root, 'icons');
  const iconsDest = path.join(dist, 'icons');
  if (await fs.pathExists(iconsSrc)) {
    await fs.copy(iconsSrc, iconsDest);
    console.log('Copied icons');
  }

  // 7. Copy sw.js to dist root (already copied above), ensure registration path is '/sw.js'

  console.log('Build finished. Files in dist/');
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});