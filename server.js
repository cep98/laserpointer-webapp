const express = require("express");
const app     = express();
const http    = require("http").createServer(app);
const io      = require("socket.io")(http);

// öffentliche Dateien
app.use(express.static("public"));

// Client-Tracking
const clients = {};
const INACTIVITY_TIMEOUT = 5000;

// Liste regelmäßig an alle Admins senden
function broadcastClients() {
  const now = Date.now();
  const list = Object.entries(clients).map(([id, info]) => ({
    socketId: id,
    ip:       info.ip,
    deviceId: info.deviceId,
    type:     info.type,
    active:   info.type === "control" && (now - info.lastMotion) < INACTIVITY_TIMEOUT
  }));
  io.emit("client-list", list);
}

io.on("connection", socket => {
  clients[socket.id] = {
    ip:         socket.handshake.address,
    type:       null,
    deviceId:   null,
    lastMotion: Date.now()
  };

  socket.on("identify", ({ role, deviceId }) => {
    if (["control","display","admin"].includes(role)) {
      clients[socket.id].type     = role;
      clients[socket.id].deviceId = deviceId || null;
      broadcastClients();
    }
  });

  socket.on("motion", data => {
    // data: { alpha, beta, color, isDrawing, brush }
    if (clients[socket.id]) {
      clients[socket.id].lastMotion = Date.now();
      const deviceId = clients[socket.id].deviceId;
      // broadcastet nun auch brush und deviceId
      io.emit("motion", { ...data, deviceId });
    }
  });

  socket.on("updateSettings", s => io.emit("updateSettings", s));
  socket.on("clear", () => io.emit("clear"));

  socket.on("disconnect", () => {
    delete clients[socket.id];
    broadcastClients();
  });
});

// alle 1 s Liste aktualisieren
setInterval(broadcastClients,1000);

const PORT = process.env.PORT||3000;
http.listen(PORT,()=>console.log(`Server läuft auf ${PORT}`));
