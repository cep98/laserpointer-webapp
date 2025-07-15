// server.js
const express = require("express");
const app     = express();
const http    = require("http").createServer(app);
const io      = require("socket.io")(http);

// Statische Dateien (control.html, display.html, game.html, admin.html etc.)
app.use(express.static("public"));

// Aktive Clients: socket.id → { role, deviceId, ip, active }
const clients = {};

function broadcastClientList() {
  const list = Object.values(clients).map(c => ({
    type:       c.role,      // "control" oder "display" oder "admin"
    deviceId:   c.deviceId,
    ip:         c.ip,
    active:     c.active
  }));
  // An alle Admin‑Sockets schicken
  for (let sid in clients) {
    if (clients[sid].role === "admin") {
      io.to(sid).emit("client-list", list);
    }
  }
}

io.on("connection", socket => {
  // merk' Dir IP
  const ip = socket.handshake.address;

  // Default‑Eintrag
  clients[socket.id] = {
    role:     null,
    deviceId: null,
    ip,
    active:   true
  };

  // Ein Client identifiziert sich
  socket.on("identify", ({ role, deviceId }) => {
    clients[socket.id].role     = role;       // "control", "display" (oder "game"), "admin"
    clients[socket.id].deviceId = deviceId;   // null oder String
    broadcastClientList();
  });

  // Ein Control‑Client zeichnet
  socket.on("draw", data => {
    // data: { x, y, color?, isStart?, deviceId? }
    // broadcast an alle Displays und Games
    socket.broadcast.emit("draw", data);
  });

  // Admin löscht Canvas
  socket.on("clear", () => {
    io.emit("clear");
  });

  // Admin kickt ein Control‑Gerät
  socket.on("kick", ({ deviceId }) => {
    // Finde den Socket mit dieser deviceId
    for (let sid in clients) {
      if (clients[sid].deviceId === deviceId && clients[sid].role === "control") {
        io.sockets.sockets.get(sid)?.disconnect(true);
        break;
      }
    }
    broadcastClientList();
  });

  socket.on("disconnect", () => {
    delete clients[socket.id];
    broadcastClientList();
  });
});

// 3000 oder PORT‐Env
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
