const express = require("express");
const app     = express();
const http    = require("http").createServer(app);
const io      = require("socket.io")(http);

// Statisch ausliefern
app.use(express.static("public"));

// Timeout für Inaktivität (in ms)
const TIMEOUT = 15000;

// Clients: socketId → { ip, type, deviceId, lastMotion }
const clients = {};

io.on("connection", socket => {
  const ip = socket.handshake.address;
  clients[socket.id] = { ip, type: null, deviceId: null, lastMotion: 0 };

  // Rollen- und Geräte-ID setzen
  socket.on("identify", ({ role, deviceId }) => {
    if (["control","display","admin"].includes(role)) {
      clients[socket.id].type     = role;
      clients[socket.id].deviceId = deviceId || null;
      broadcastClients();
    }
  });

  // Motion-Ereignis: timestamp aktualisieren und weiterleiten
  socket.on("motion", data => {
    if (clients[socket.id]) {
      clients[socket.id].lastMotion = Date.now();
    }
    io.emit("motion", data);
    broadcastClients();
  });

  // Settings aus Admin verteilen
  socket.on("updateSettings", s => {
    io.emit("updateSettings", s);
  });

  // Clear
  socket.on("clear", () => {
    io.emit("clear");
  });

  // Cleanup bei Trennung
  socket.on("disconnect", () => {
    delete clients[socket.id];
    broadcastClients();
  });

  // Sende die Liste aller Clients mit Active-Flag
  function broadcastClients() {
    const now = Date.now();
    const list = Object.entries(clients).map(([id, info]) => ({
      socketId:    id,
      ip:          info.ip,
      deviceId:    info.deviceId,
      type:        info.type,
      active:      info.type === "control" && (now - info.lastMotion) < TIMEOUT
    }));
    io.emit("client-list", list);
  }
});

const PORT = process.env.PORT||3000;
http.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
