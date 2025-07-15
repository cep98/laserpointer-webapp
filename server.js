const express = require("express");
const app     = express();
const http    = require("http").createServer(app);
const io      = require("socket.io")(http);

// Statische Dateien ausliefern
app.use(express.static("public"));

// Inaktivitäts-Timeout (5 Sekunden)
const INACTIVITY_TIMEOUT = 5 * 1000;

// clients: socketId → { ip, type, deviceId, lastMotion }
const clients = {};

// Funktion zum Senden der aktuellen Client-Liste an alle Admins
function broadcastClients() {
  const now = Date.now();
  const list = Object.entries(clients).map(([socketId, info]) => ({
    socketId,
    ip:       info.ip,
    deviceId: info.deviceId,
    type:     info.type,
    // active nur für Control-Clients, die innerhalb des Timeouts zuletzt motion gesendet haben
    active:   info.type === "control" && (now - info.lastMotion) < INACTIVITY_TIMEOUT
  }));
  io.emit("client-list", list);
}

io.on("connection", socket => {
  // Client initial registrieren
  const ip = socket.handshake.address;
  clients[socket.id] = {
    ip,
    type:       null,
    deviceId:   null,
    lastMotion: Date.now()
  };

  // Rolle und Geräte-ID setzen
  socket.on("identify", ({ role, deviceId }) => {
    if (["control","display","admin"].includes(role)) {
      clients[socket.id].type     = role;
      clients[socket.id].deviceId = deviceId || null;
      broadcastClients();
    }
  });

  // Motion-Event: Zeitstempel aktualisieren und mitsenden
  socket.on("motion", data => {
    if (clients[socket.id]) {
      clients[socket.id].lastMotion = Date.now();
      const deviceId = clients[socket.id].deviceId;
      io.emit("motion", { ...data, deviceId });
    }
  });

  // Admin-Einstellungen weiterleiten
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

// Periodisch jede Sekunde die Client-Liste senden
setInterval(broadcastClients, 1000);

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
io.on("connection", socket => {
  // bestehende Handler…

  // Ein Control‐Client meldet Kick an
  socket.on("kick", ({ deviceId }) => {
    // finde das Socket-Objekt mit dieser deviceId
    for (let [id, s] of io.of("/").sockets) {
      if (s.deviceId === deviceId) {
        s.disconnect(true);
        break;
      }
    }
    // und aktualisiere die Client-Liste
    broadcastClientList();
  });
});
