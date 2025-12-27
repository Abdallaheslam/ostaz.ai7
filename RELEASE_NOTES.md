## 2026.3.1 - Production Prep

- Added production build pipeline (`npm run build`) and hashed asset injection.
- Added icons optimization and placeholders (SVG + generated WebP/AVIF + favicon).
- Added Playwright E2E tests and GitHub Actions job to run them.
- Integrated Lighthouse CI with assertions and thresholds to catch regressions.
- Hardened dependencies and removed vulnerable packages. 
- Improved service worker and PWA manifest for production.
