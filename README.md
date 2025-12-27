# سوبر ماركت الأستاذ — PWA

Project prepared for production with build & CI tooling.

## Quick commands

- Install deps: `npm ci`
- Validate icons: `node scripts/validate-icons.js`
- Optimize icons: `npm run build` (includes optimization + build)
- Preview: `npm run preview` (serves `dist/` locally)
- Lint: `npm run lint`
- Deploy (Firebase): `npm run deploy` (requires `FIREBASE_TOKEN` in CI secrets)

## Icons
Place your real icons in `icons/` using the filenames listed in `ICONS.md`. Running `npm run build` will produce `webp`, `avif` and `favicon.ico` variants.

## CI / CD
A GitHub Actions workflow builds the project, runs Lighthouse CI (with assertions), runs end-to-end tests, and deploys to Firebase Hosting on `main`.

### Firebase deployment (setup)
1. Create a CI token: `firebase login:ci` and copy the token.
2. Go to GitHub → Settings → Secrets → Actions and add a secret named `FIREBASE_TOKEN` with that token value.
3. Push to `main` to trigger the workflow; the deploy step will fail early if `FIREBASE_TOKEN` is missing.

Notes: the deploy step runs `npm run build` before deploying to ensure the latest `dist/` is published.
## Notes
- The project is configured to serve from `dist/` (see `firebase.json`).
- Service Worker (`sw.js`) is included and optimized for offline usage.
- For any breaking dependency updates (npm audit suggests `--force`), review changes before applying.

If you want, I can continue with end-to-end tests, accessibility fixes, or performance tuning (Lighthouse thresholds).