const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

io.on("connection", socket => {
  console.log("Client verbunden");

  socket.on("identify", info => {
    // Hier könnten wir Rolle / deviceId speichern, wenn gewünscht
  });

  // Bewegungs-Events vom Control an alle Displays
  socket.on("motion", data => {
    socket.broadcast.emit("motion", data);
  });

  // Canvas löschen
  socket.on("clear", () => {
    io.emit("clear");
  });

  // Admin-Settings verteilen
  socket.on("admin-settings", settings => {
    io.emit("updateSettings", settings);
  });

  socket.on("disconnect", () => {
    console.log("Client getrennt");
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
