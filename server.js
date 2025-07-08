// server.js
const express = require("express");
const app     = express();
const http    = require("http").createServer(app);
const io      = require("socket.io")(http);

// statische Dateien aus /public
app.use(express.static("public"));

// State‐Tracking
const roles          = new Map();   // socket.id → role
const controls       = new Map();   // socket.id → deviceId
let   displayOnline  = false;

io.on("connection", socket => {
  console.log("↗ Client verbunden:", socket.id);

  // 1) Alle Identify‐Events
  socket.on("identify", info => {
    roles.set(socket.id, info.role);

    if (info.role === "control") {
      // neues Handy
      const dev = info.deviceId || socket.id;
      controls.set(socket.id, dev);
      io.emit("controls-status", Array.from(controls.values()));
      console.log("✔ Control angemeldet:", dev);
    }

    if (info.role === "display") {
      // Display ist da
      displayOnline = true;
      io.emit("display-status", { connected: true });
      console.log("✔ Display angemeldet");
    }

    if (info.role === "admin") {
      // Admin will Status
      socket.emit("display-status", { connected: displayOnline });
      socket.emit("controls-status", Array.from(controls.values()));
      console.log("✔ Admin angemeldet, Status gesendet");
    }
  });

  // 2) Bewegungs‐Events von Control → an alle Displays
  socket.on("motion", data => {
    socket.broadcast.emit("motion", data);
  });

  // 3) Canvas löschen
  socket.on("clear", () => {
    io.emit("clear");
  });

  // 4) Admin‐Einstellungen verteilen
  socket.on("admin-settings", cfg => {
    io.emit("updateSettings", cfg);
  });

  // 5) Aufräumen bei Disconnect
  socket.on("disconnect", () => {
    console.log("↘ Client getrennt:", socket.id);
    const role = roles.get(socket.id);
    roles.delete(socket.id);

    if (role === "control") {
      controls.delete(socket.id);
      io.emit("controls-status", Array.from(controls.values()));
      console.log("✖ Control getrennt");
    }
    if (role === "display") {
      displayOnline = false;
      io.emit("display-status", { connected: false });
      console.log("✖ Display getrennt");
    }
  });
});

// Server starten
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`🚀 Server läuft auf Port ${PORT}`);
});
