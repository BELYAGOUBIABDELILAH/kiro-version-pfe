/**
 * Simple Development Server for CityHealth
 * Serves static files and handles SPA routing
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT_DIR = __dirname;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

// SPA routes that should return index.html
const spaRoutes = ['/', '/home', '/search', '/auth', '/emergency', '/profile', '/provider-dashboard', '/admin', '/favorites'];

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Parse URL and remove query string
  let requestPath = req.url.split('?')[0];
  
  // Security: Prevent directory traversal
  if (requestPath.includes('..')) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  // Get file extension
  const ext = path.extname(requestPath);
  
  // Determine if this is a SPA route or a file request
  const isSpaRoute = !ext && (
    spaRoutes.includes(requestPath) || 
    requestPath.startsWith('/profile/') ||
    requestPath === '/'
  );

  // For SPA routes, always serve index.html
  if (isSpaRoute) {
    const indexPath = path.join(ROOT_DIR, 'index.html');
    fs.readFile(indexPath, (err, content) => {
      if (err) {
        console.error('Error loading index.html:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      } else {
        res.writeHead(200, { 
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        });
        res.end(content, 'utf-8');
      }
    });
    return;
  }

  // For file requests, serve the actual file
  const filePath = path.join(ROOT_DIR, requestPath);
  
  // Security: Ensure file is within ROOT_DIR
  const normalizedPath = path.normalize(filePath);
  if (!normalizedPath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // File not found
      console.warn(`File not found: ${requestPath}`);
      
      // If it looks like a page route, serve index.html
      if (!ext || requestPath.startsWith('/pages/') || requestPath.startsWith('/components/')) {
        const indexPath = path.join(ROOT_DIR, 'index.html');
        fs.readFile(indexPath, (err, content) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('500 Internal Server Error');
          } else {
            res.writeHead(200, { 
              'Content-Type': 'text/html',
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            });
            res.end(content, 'utf-8');
          }
        });
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      }
      return;
    }

    // File exists, read and serve it
    fs.readFile(filePath, (err, content) => {
      if (err) {
        console.error('Error reading file:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      } else {
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        
        // Set appropriate cache headers
        const cacheControl = ext === '.html' 
          ? 'no-cache, no-store, must-revalidate'
          : 'public, max-age=31536000';
        
        res.writeHead(200, { 
          'Content-Type': contentType,
          'Cache-Control': cacheControl
        });
        res.end(content, ext === '.svg' || ext === '.html' || ext === '.js' || ext === '.css' ? 'utf-8' : undefined);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 CityHealth Development Server`);
  console.log(`📡 Server running at http://localhost:${PORT}/`);
  console.log(`📂 Serving files from: ${ROOT_DIR}`);
  console.log(`\n🔒 Security: Directory traversal blocked`);
  console.log(`🔄 SPA routing: Enabled for ${spaRoutes.length} routes`);
  console.log(`\n✨ Ready to test!\n`);
});
