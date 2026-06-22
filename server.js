const express = require('express');
const path = require('path');

const app = express();
const DIST = path.join(__dirname, 'dist');

// Serve built static assets
app.use(express.static(DIST));

// SPA fallback — send index.html for every route so React Router handles /f/:slug
app.get('*', (_req, res) => {
  res.sendFile(path.join(DIST, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`forms.anchorafrica.org running on port ${PORT}`)
);
