const express = require("express");
const app     = express();
const http    = require("http").createServer(app);
const io      = require("socket.io")(http);

app.use(express.static("public"));

// merken, ob gerade eine Display-Instanz verbunden ist
let displayConnected = false;

io.on("connection", socket => {
  console.log("Client verbunden:", socket.id);

  // Identify-Event von Control, Display oder Admin
  socket.on("identify", info => {
    if (info.role === "display") {
      displayConnected = true;
      // allen Admins Bescheid sagen
      io.emit("display-status", { connected: true });
      console.log("Display connected");
    }
    if (info.role === "admin") {
      // direkt den aktuellen Status an den neuen Admin schicken
      socket.emit("display-status", { connected: displayConnected });
      console.log("Admin joined, display status sent =", displayConnected);
    }
  });

  // Bewegungsdaten von Control weiterreichen
  socket.on("motion", data => {
    socket.broadcast.emit("motion", data);
  });

  // Canvas clear
  socket.on("clear", () => {
    io.emit("clear");
  });

  // Admin-Settings verteilen
  socket.on("admin-settings", settings => {
    io.emit("updateSettings", settings);
  });

  socket.on("disconnect", () => {
    console.log("Client getrennt:", socket.id);
    // Wenn das Display die Verbindung verliert, Status zurücksetzen
    // (ganz einfach: wir gehen davon aus, dass nur EINE Display-Instanz läuft)
    displayConnected = false;
    io.emit("display-status", { connected: false });
    console.log("Display disconnected");
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
