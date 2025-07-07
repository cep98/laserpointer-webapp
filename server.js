const express = require("express");
const app     = express();
const http    = require("http").createServer(app);
const io      = require("socket.io")(http);

// Statische Dateien aus public
app.use(express.static("public"));

// Aktive Clients: socket.id → { ip, type }
const clients = {};

io.on("connection", socket => {
  const ip = socket.handshake.address;
  clients[socket.id] = { ip, type: null };

  // Rollen-Identifikation
  socket.on("identify", role => {
    if (["control","display","admin"].includes(role)) {
      clients[socket.id].type = role;
      broadcastClients();
    }
  });

  // Gyro-/Motion-Daten weiterleiten
  socket.on("motion", data => {
    io.emit("motion", data);
  });

  // Admin-Einstellungen weiterleiten
  socket.on("updateSettings", settings => {
    io.emit("updateSettings", settings);
  });

  // Canvas löschen
  socket.on("clear", () => {
    io.emit("clear");
  });

  // Bei Trennung entfernen
  socket.on("disconnect", () => {
    delete clients[socket.id];
    broadcastClients();
  });

  // Liste aller Clients senden
  function broadcastClients() {
    const list = Object.entries(clients).map(([id, info]) => ({
      id, ip: info.ip, type: info.type
    }));
    io.emit("client-list", list);
  }
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
