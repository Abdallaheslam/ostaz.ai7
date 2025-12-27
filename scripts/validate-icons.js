'use strict';
const fs = require('fs');
const path = require('path');

const required = [
  'icon-72x72',
  'icon-96x96',
  'icon-128x128',
  'icon-144x144',
  'icon-152x152',
  'icon-192x192',
  'icon-384x384',
  'icon-512x512',
  'apple-touch-icon',
  'favicon'
];

function fileExists(dir, base) {
  const exts = ['.svg', '.png', '.ico'];
  for (const ext of exts) {
    if (fs.existsSync(path.join(dir, base + ext))) return path.join(dir, base + ext);
  }
  return null;
}

function run() {
  const dir = path.join(process.cwd(), 'icons');
  if (!fs.existsSync(dir)) {
    console.warn('WARN: icons/ folder not found. Add your icons to icons/ and re-run build.');
    process.exit(0);
  }

  let missing = [];
  for (const name of required) {
    if (!fileExists(dir, name)) missing.push(name);
  }

  if (missing.length) {
    console.warn('\nMissing icons:\n - ' + missing.join('\n - ') + '\n\nDrop the missing files into the icons/ folder and re-run `npm run build`.');
    process.exit(0);
  }

  console.log('All required icons are present.');
}

run();