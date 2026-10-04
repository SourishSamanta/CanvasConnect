require('dotenv').config();
const express        = require('express');
const http           = require('http');
const cors           = require('cors');
const WebSocket      = require('ws');
const connectDB      = require('./config/db');
const roomRoutes     = require('./routes/rooms');
const authRoutes     = require('./routes/auth');
const setupYjsWebSocket = require('./ws/yjsHandler');

const app    = express();
const server = http.createServer(app); // shared HTTP + WS server

// Middleware
app.use(cors());
app.use(express.json());

// REST routes
app.use('/api/rooms', roomRoutes);
app.use('/api/auth', authRoutes);

// Health check
app.get('/', (req, res) => res.send('Whiteboard server running'));

// Yjs WebSocket — mounted on /ws path
// Frontend connects: new WebsocketProvider('ws://server/ws', roomId, doc)
const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  console.log('WebSocket upgrade request:', request.url);
  
  if (request.url.startsWith('/ws')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});
setupYjsWebSocket(wss);

// Connect DB then start server
connectDB().then(() => {
  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => console.log(`Server on port ${PORT}`));
});