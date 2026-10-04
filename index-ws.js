const express = require('express');
const http = require('http');
const server = http.createServer();
const app = express();

app.use(express.static(__dirname));   

app.get('/', function (req, res) {
    res.sendFile('index.html', { root: __dirname });
});

server.on('request', app);
server.listen(3000, function () { console.log('server started on port 3000'); });


/** begin websocket */


const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer({ server: server });

wss.broadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === client.OPEN) {
            client.send(data);
        }
    });
};

wss.on('connection', function connection(ws) {
    const numClients = wss.clients.size;
    console.log('Clients connected', numClients);
    wss.broadcast(`current visitors: ${numClients}`);

    ws.send('welcome to my web page');

    ws.on('close', function close() {
        console.log('disconnected');
        wss.broadcast(`current visitors: ${wss.clients.size}`);
    });
});