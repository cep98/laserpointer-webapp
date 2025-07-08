// server.js
const express = require("express");
const app     = express();
const http    = require("http").createServer(app);
const io      = require("socket.io")(http);

app.use(express.static("public"));

// State-Tracking
const roles          = new Map();   // socket.id → role
const controls       = new Map();   // socket.id → deviceId
let   displayOnline  = false;

io.on("connection", socket => {
  console.log("↗ Client verbunden:", socket.id);

  // identify von Control / Display / Admin
  socket.on("identify", info => {
    roles.set(socket.id, info.role);

    if (info.role === "control") {
      const devId = info.deviceId || socket.id;
      controls.set(socket.id, devId);
      io.emit("controls-status", Array.from(controls.values()));
      console.log("✔ Control angemeldet:", devId);
    }

    if (info.role === "display") {
      displayOnline = true;
      io.emit("display-status", { connected: true });
      console.log("✔ Display angemeldet");
    }

    if (info.role === "admin") {
      // direkt Status an neuen Admin
      socket.emit("display-status", { connected: displayOnline });
      socket.emit("controls-status", Array.from(controls.values()));
      console.log("✔ Admin angemeldet, Status gesendet");
    }
  });

  // Bewegungsdaten weiterreichen
  socket.on("motion", data => {
    socket.broadcast.emit("motion", data);
  });

  // Canvas clear
  socket.on("clear", () => {
    io.emit("clear");
  });

  // Admin-Einstellungen verteilen
  socket.on("admin-settings", cfg => {
    io.emit("updateSettings", cfg);
  });

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

const PORT = process.env.PORT||3000;
http.listen(PORT, () => console.log(`🚀 Server läuft auf Port ${PORT}`));
