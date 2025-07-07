const express = require("express");
const app     = express();
const http    = require("http").createServer(app);
const io      = require("socket.io")(http);

// Statische Dateien aus "public"
app.use(express.static("public"));

// Mappe socket.id → Client-IP
const clients = {};

io.on("connection", socket => {
  // Client-IP ermitteln
  const ip = socket.handshake.address;
  clients[socket.id] = ip;

  // Sobald jemand connectet/disconnectet, sende die Liste an alle
  const broadcastClientList = () => {
    const list = Object.entries(clients).map(([id, ip]) => ({ id, ip }));
    io.emit("client-list", list);
  };
  broadcastClientList();

  // Motion-Events weiterleiten
  socket.on("motion", data => {
    io.emit("motion", data);
  });

  // Admin-Settings (maxH, maxV, smooth) weiterleiten
  socket.on("updateSettings", settings => {
    io.emit("updateSettings", settings);
  });

  // Clear-Event
  socket.on("clear", () => {
    io.emit("clear");
  });

  socket.on("disconnect", () => {
    delete clients[socket.id];
    broadcastClientList();
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
