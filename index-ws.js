const express = require('express');
const http = require('http');
const path = require('path');
const WebSocketServer = require('ws').Server;
const sqlite = require('sqlite3');

const PORT = process.env.PORT || 3000;

/** ---------- database ---------- */
const db = new sqlite.Database(':memory:');
db.serialize(() => {
  db.run('CREATE TABLE visitors (count INTEGER, time TEXT)');
});

function shutdownDB(done) {
  console.log('Shutting down db');
  db.each('SELECT * FROM visitors', (err, row) => {
    if (!err) console.log(row);
  }, () => db.close(done));
}

/** ---------- http ---------- */
const app = express();
// Only the "public" folder is reachable from the browser,
// so index-ws.js, package.json, etc. are never downloadable.
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);

/** ---------- websocket ---------- */
const wss = new WebSocketServer({ server, maxPayload: 1024 });

wss.broadcast = function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) client.send(data);
  });
};

function broadcastVisitors() {
  wss.broadcast(JSON.stringify({ visitors: wss.clients.size }));
}

wss.on('connection', (ws) => {
  const count = wss.clients.size;
  console.log('Clients connected', count);
  broadcastVisitors();

  db.run("INSERT INTO visitors (count, time) VALUES (?, datetime('now'))", [count], (err) => {
    if (err) console.error('db insert failed:', err.message);
  });

  ws.on('close', () => {
    console.log('A client has disconnected');
    broadcastVisitors();   // current size, not the stale count from connect time
  });
  ws.on('error', (err) => console.error('ws error:', err.message));
});

/** ---------- start / stop ---------- */
// 127.0.0.1: only nginx (same machine) can reach Node directly
server.listen(PORT, '127.0.0.1', () => console.log(`server started on port ${PORT}`));

function shutdown(signal) {
  console.log(signal);
  wss.clients.forEach((client) => client.close());
  server.close(() => shutdownDB(() => process.exit(0)));
  setTimeout(() => process.exit(1), 5000).unref();   // don't hang forever
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));