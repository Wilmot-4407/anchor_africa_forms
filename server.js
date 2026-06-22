const express = require('express');
const path = require('path');

const app = express();
const DIST = path.join(__dirname, 'dist');

// Remove Express fingerprinting header
app.disable('x-powered-by');

// Security headers on every response
app.use((_req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.anchorafrica.org",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );
  next();
});

// Serve built static assets (dotfiles denied by default)
app.use(express.static(DIST, {
  dotfiles: 'deny',
  index: false,
}));

// SPA fallback — send index.html for every route so React Router handles /f/:slug
app.get('*', (_req, res) => {
  res.sendFile(path.join(DIST, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`forms.anchorafrica.org running on port ${PORT}`)
);
