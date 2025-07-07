const express = require("express");
const app     = express();
const http    = require("http").createServer(app);
const io      = require("socket.io")(http);

// Statische Dateien aus "public" bereitstellen
app.use(express.static("public"));

// State-Tracking
const roles            = new Map();  // socket.id → "control"|"display"|"admin"
const controls         = new Map();  // socket.id → deviceId
let displayConnected   = false;

io.on("connection", socket => {
  console.log("Client verbunden:", socket.id);

  // Identify-Event von Control / Display / Admin
  socket.on("identify", info => {
    const role = info.role;
    roles.set(socket.id, role);

    if (role === "display") {
      // Display hat sich angemeldet
      displayConnected = true;
      io.emit("display-status", { connected: true });
      console.log("Display verbunden");
    }

    if (role === "admin") {
      // Neuer Admin will Status wissen
      socket.emit("display-status", { connected: displayConnected });
      // Und Liste der aktuell verbundenen Controls
      socket.emit("controls-status", Array.from(controls.values()));
      console.log("Admin angemeldet, Status gesendet");
    }

    if (role === "control") {
      // Control schickt seine deviceId mit
      const deviceId = info.deviceId || socket.id;
      controls.set(socket.id, deviceId);
      io.emit("controls-status", Array.from(controls.values()));
      console.log("Control angemeldet, ID:", deviceId);
    }
  });

  // Bewegungsdaten von Control → alle Displays
  socket.on("motion", data => {
    socket.broadcast.emit("motion", data);
  });

  // Canvas löschen (von Admin oder Control)
  socket.on("clear", () => {
    io.emit("clear");
  });

  // Admin-Einstellungen verbreiten
  socket.on("admin-settings", settings => {
    io.emit("updateSettings", settings);
  });

  socket.on("disconnect", () => {
    console.log("Client getrennt:", socket.id);
    const role = roles.get(socket.id);
    roles.delete(socket.id);

    if (role === "display") {
      // Display ist weg
      displayConnected = false;
      io.emit("display-status", { connected: false });
      console.log("Display getrennt");
    }

    if (role === "control") {
      // Control ist weg
      controls.delete(socket.id);
      io.emit("controls-status", Array.from(controls.values()));
      console.log("Control getrennt");
    }
  });
});

// Server starten
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
