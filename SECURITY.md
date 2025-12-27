# Security checklist & notes

This project includes basic production hardening. Follow these before/after deployment:

1. Secrets
   - Never commit private keys or CI tokens to git. Use GitHub Secrets for `FIREBASE_TOKEN` and any other CI secrets.
   - Use an `.env` file locally and add it to `.gitignore`.

2. HTTP headers
   - `firebase.json` includes HSTS, CSP (basic), X-Frame-Options, X-Content-Type-Options, Referrer-Policy and Permissions-Policy.
   - If you add third-party origins later, update `Content-Security-Policy` accordingly.

3. Dependency hygiene
   - Run `npm audit` periodically and review suggested upgrades. Use `npm audit fix` for safe upgrades; `--force` may include breaking changes.

4. Application monitoring
   - Add Sentry or similar (optional) for runtime error monitoring.

5. Further improvements
   - Move inline CSS into an external stylesheet to remove `style-src 'unsafe-inline'` from CSP.
   - Add a Content Security Policy nonce for inline scripts if/when you add inline JS.
   - Consider a Web Application Firewall (Cloudflare, Firebase Security Rules for backend).

Commands:
- `npm run security:scan` — search repo for likely secrets (basic). The scanner ignores `.lighthouseci` artifacts and treats Firebase client API keys in `firebase-config.js` and `index.html` as public and safe to keep in source when necessary.
- `npm audit` / `npm audit fix` — dependency vulnerability scanning.

If you want, I can: add automatic secret scanning in CI, configure Sentry, or help migrate inline CSS to external files to tighten CSP. Let me know which you prefer.