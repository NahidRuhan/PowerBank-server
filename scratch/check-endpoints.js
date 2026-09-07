const fs = require('fs');
const path = require('path');

const routeMounts = {
  'auth': '/api/v1/auth',
  'user': '/api/v1/users',
  'zone': '/api/v1/zones',
  'substation': '/api/v1/substations',
  'feeder': '/api/v1/feeders',
  'area': '/api/v1/areas',
  'quota': '/api/v1/quotas',
  'schedule': '/api/v1/schedules',
  'incident': '/api/v1/incidents',
  'bill': '/api/v1/bills',
  'payment': '/api/v1/payments',
  'admin': '/api/v1/admin',
  'meter': '/api/v1/meters',
};

const extractedEndpoints = [];

function parseRoutes(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      parseRoutes(fullPath);
    } else if (fullPath.endsWith('.routes.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const moduleName = path.basename(fullPath).split('.')[0];
      const basePath = routeMounts[moduleName] || ('/api/v1/' + moduleName);
      
      const regex = /router\.(get|post|put|patch|delete)\(\s*['"]([^'"]+)['"]/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const method = match[1].toUpperCase();
        let p = match[2];
        if (p === '/') p = '';
        const fullRoute = method + ' ' + basePath + p;
        extractedEndpoints.push(fullRoute.replace(/\/+/g, '/')); // normalize slashes
      }
    }
  }
}

parseRoutes(path.join(__dirname, 'src/modules'));

const collection = JSON.parse(fs.readFileSync('powerbank_collection.json', 'utf8'));
const postmanEndpoints = [];

function extractPostmanEndpoints(items) {
  for (const item of items) {
    if (item.item) {
      extractPostmanEndpoints(item.item);
    } else if (item.request) {
      const method = item.request.method.toUpperCase();
      let urlObj = item.request.url;
      let rawUrl = '';
      if (typeof urlObj === 'string') rawUrl = urlObj;
      else rawUrl = urlObj.raw;
      
      // Postman URL usually starts with {{baseUrl}}
      // {{baseUrl}} = http://localhost:5000/api/v1
      rawUrl = rawUrl.replace('{{baseUrl}}', '/api/v1');
      rawUrl = rawUrl.split('?')[0]; // strip query params
      
      // We also need to generalize path variables (e.g. /users/:id vs /users/REPLACE_WITH_USER_ID)
      // Standardize both to format /users/:id to compare
      // Or just convert extracted :id to Postman's format or vice versa.
      // Let's just strip parameter names and replace with generic placeholder {}
      
      postmanEndpoints.push(method + ' ' + rawUrl.replace(/\/+/g, '/'));
    }
  }
}

extractPostmanEndpoints(collection.item);

function normalizeParams(url) {
  // convert /users/:id to /users/{}
  // convert /users/REPLACE_WITH_USER_ID to /users/{}
  let u = url.replace(/:[a-zA-Z0-9_]+/g, '{}');
  u = u.replace(/REPLACE_WITH_[a-zA-Z0-9_]+/g, '{}');
  return u;
}

const normalizedExtracted = extractedEndpoints.map(e => ({ orig: e, norm: normalizeParams(e) }));
const normalizedPostman = postmanEndpoints.map(e => normalizeParams(e));

const missing = [];
for (const { orig, norm } of normalizedExtracted) {
  if (!normalizedPostman.includes(norm)) {
    missing.push(orig);
  }
}

console.log('--- Missing Endpoints in Postman ---');
if (missing.length === 0) {
  console.log('None! All endpoints are documented.');
} else {
  missing.forEach(m => console.log(m));
}

