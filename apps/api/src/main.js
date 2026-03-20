import http from 'node:http';

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, service: 'api' }));
  }
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ service: 'agentcred-api', status: 'up' }));
});

server.listen(3001, () => console.log('API listening on :3001'));
