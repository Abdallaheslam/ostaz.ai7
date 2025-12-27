# Icons and App Assets

Place your real icons in the `icons/` folder. The build expects the following files (SVG or PNG):

- `icons/icon-72x72.{svg,png}`
- `icons/icon-96x96.{svg,png}`
- `icons/icon-128x128.{svg,png}`
- `icons/icon-144x144.{svg,png}`
- `icons/icon-152x152.{svg,png}`
- `icons/icon-192x192.{svg,png}`
- `icons/icon-384x384.{svg,png}`
- `icons/icon-512x512.{svg,png}`
- `icons/apple-touch-icon.{svg,png}`
- `icons/favicon.svg` or `icons/favicon.ico`

Best practices:
- Provide both PNG (raster) and SVG vectors if possible. Modern browsers use SVG for sharp icons; some platforms (older Android/WebAPKs) may prefer PNG.
- Add compressed formats (WebP/AVIF) if you have them, but ensure filenames remain consistent in `manifest.json`.
- Keep `manifest.json` `start_url` and `scope` as `.` for hosting on Firebase.

How to replace:
1. Drop your icon files into the `icons/` folder using the names above.
2. Run `npm run build` to copy and update the `dist/` version of the manifest and site.
3. Check `dist/manifest.json` and `dist/index.html` to verify the references.

If you want, I can also convert and optimize uploaded icons automatically (WebP/AVIF generation, favicon creation, and compression).