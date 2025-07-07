const express = require("express");
const app     = express();
const http    = require("http").createServer(app);
const io      = require("socket.io")(http);

// Statische Dateien
app.use(express.static("public"));

// clients: socketId → { ip, type, deviceId }
const clients = {};

io.on("connection", socket => {
  const ip = socket.handshake.address;
  clients[socket.id] = { ip, type: null, deviceId: null };

  // Rollen- und Geräte-ID setzen
  socket.on("identify", data => {
    const { role, deviceId } = data;
    if (["control","display","admin"].includes(role)) {
      clients[socket.id].type     = role;
      clients[socket.id].deviceId = deviceId || null;
      broadcastClients();
    }
  });

  // Gyro-Daten weiterleiten
  socket.on("motion", d => io.emit("motion", d));

  // Settings aus Admin weiterleiten
  socket.on("updateSettings", s => io.emit("updateSettings", s));

  // Canvas löschen
  socket.on("clear", () => io.emit("clear"));

  socket.on("disconnect", () => {
    delete clients[socket.id];
    broadcastClients();
  });

  function broadcastClients() {
    // Liste aller Clients an alle schicken
    const list = Object.entries(clients).map(([id, info]) => ({
      socketId: id,
      ip:       info.ip,
      type:     info.type,
      deviceId: info.deviceId
    }));
    io.emit("client-list", list);
  }
});

const PORT = process.env.PORT||3000;
http.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
