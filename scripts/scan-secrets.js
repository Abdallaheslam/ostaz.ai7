const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const patterns = [
  /-----BEGIN PRIVATE KEY-----/i,
  /AIza[0-9A-Za-z-_]{35}/, // Google API key pattern (Firebase apiKey is public okay but warn)
  /-----BEGIN RSA PRIVATE KEY-----/i,
  /ssh-rsa AAAA[0-9A-Za-z+/]+[=]{0,2}/,
  /AKIA[0-9A-Z]{16}/, // AWS Access Key
  /(?:password|passwd|secret|token|key)\s*[:=]\s*["']?[0-9A-Za-z-_.]{8,}["']?/i
];

function walk(dir, cb) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      // Skip common generated or CI artifact folders
      if (['.git', 'node_modules', 'dist', '.lighthouseci'].includes(f)) return;
      walk(p, cb);
    } else {
      // Don't scan this script file (contains regex literals that would match themselves)
      if (p.endsWith(path.join('scripts','scan-secrets.js'))) return;
      cb(p);
    }
  });
}

let findings = [];
walk(repoRoot, file => {
  try {
    const text = fs.readFileSync(file, 'utf8');
    patterns.forEach(p => {
      if (p.test(text)) {
        // Whitelist: firebase client API key is public and may appear in firebase-config.js or index.html
        if (p.toString().includes('AIza')) {
          if (file.endsWith('firebase-config.js') || file.endsWith('index.html') || file.includes('.lighthouseci')) return;
        }
        // Whitelist generic 'key' or 'token' matches that come from Lighthouse/CI artifacts or known public firebase files
        if (p.toString().includes('key') || p.toString().includes('token')) {
          if (file.includes('.lighthouseci') || file.endsWith('firebase-config.js') || file.endsWith('index.html')) return;
        }
        findings.push({ file, pattern: p.toString() });
      }
    });
  } catch (e) {
    // ignore binary files
  }
});

if (findings.length) {
  console.warn('\nSecurity scan WARNING: potential secrets found:');
  findings.forEach(f => console.warn(' -', f.file, 'matches', f.pattern));
  console.warn('\nPlease verify these are intended (e.g. public firebase apiKey vs private keys) and move secrets to environment variables or GitHub Secrets.');
  process.exit(1);
} else {
  console.log('Security scan passed: no obvious secrets in source files.');
}
