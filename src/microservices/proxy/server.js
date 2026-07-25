const http = require('http');
const httpProxy = require('http-proxy');

const MONOLITH_URL = process.env.MONOLITH_URL || 'http://mothlith:9999';
const MOVIES_URL = process.env.MOVIES_SERVICE_URL || 'http://movies-service:9999';
const EVENTS_URL = process.env.EVENTS_SERVICE_URL || 'http://events-service:9999';
const GRADUAL = process.env.GRADUAL_MIGRATION === 'true';
const PERCENT = Number(process.env.MOVIES_MIGRATION_PERCENT ?? 0);
const PORT = Number(process.env.PORT ?? 8000);

const MOVIES_PATH = '/api/movies';
const EVENTS_PATH = '/api/events';

function chooseTarget(path) {
  if (GRADUAL && path.startsWith(MOVIES_PATH) && Math.random() * 100  < PERCENT) {
    return MOVIES_URL;
  }
  if (path.startsWith(EVENTS_PATH)) return EVENTS_URL;
  return MONOLITH_URL;
}

const proxy = httpProxy.createProxyServer({});
const server = http.createServer((req, res) => {
  console.log('req url = ', req.url)
  if (req.url === '/health') { res.writeHead(200); res.end('Strangler Fig Proxy is healthy'); return; }

  const target = chooseTarget(req.url ?? '');
  console.log('target', target)

  proxy.web(req, res, { target }, (err) => { res.writeHead(502); res.end('proxy error'); });
});

server.listen(PORT);

console.log(`Server is running at http://localhost:${PORT}`);