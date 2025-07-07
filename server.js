const express = require("express");
const app     = express();
const http    = require("http").createServer(app);
const io      = require("socket.io")(http);

// Statische Dateien ausliefern
app.use(express.static("public"));

// Inaktivitäts-Timeout in Millisekunden (5 Sekunden)
const INACTIVITY_TIMEOUT = 5 * 1000;

// clients: socketId → { ip, type, deviceId, lastMotion }
const clients = {};

// Funktion zum Broadcasten der aktuellen Client-Liste
function broadcastClients() {
  const now = Date.now();
  const list = Object.entries(clients).map(([socketId, info]) => ({
    socketId,
    ip:       info.ip,
    deviceId: info.deviceId,
    type:     info.type,
    // active nur, wenn Control und zuletzt motion innerhalb Timeout
    active:   info.type === "control" && (now - info.lastMotion) < INACTIVITY_TIMEOUT
  }));
  io.emit("client-list", list);
}

io.on("connection", socket => {
  const ip = socket.handshake.address;
  clients[socket.id] = {
    ip,
    type:       null,
    deviceId:   null,
    lastMotion: Date.now()
  };

  // Rollen- und Gerätekennung
  socket.on("identify", ({ role, deviceId }) => {
    if (["control", "display", "admin"].includes(role)) {
      clients[socket.id].type     = role;
      clients[socket.id].deviceId = deviceId || null;
      broadcastClients();
    }
  });

  // Motion-Event: Timestamp aktualisieren und weiterleiten
  socket.on("motion", data => {
    if (clients[socket.id]) {
      clients[socket.id].lastMotion = Date.now();
    }
    io.emit("motion", data);
    // kein weiterer broadcastClients() hier nötig
  });

  // Admin-Settings weiterleiten
  socket.on("updateSettings", settings => {
    io.emit("updateSettings", settings);
  });

  // Canvas löschen
  socket.on("clear", () => {
    io.emit("clear");
  });

  // Trennung: Client entfernen
  socket.on("disconnect", () => {
    delete clients[socket.id];
    broadcastClients();
  });
});

// Periodisch (jede Sekunde) die Liste an alle Admins senden
setInterval(broadcastClients, 1000);

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
