const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

// Statische Dateien aus dem "public"-Verzeichnis bereitstellen
app.use(express.static("public"));

io.on("connection", socket => {
  // Zeichnen (z. B. für control/display)
  socket.on("draw", data => {
    socket.broadcast.emit("draw", data);
  });

  // Löschen
  socket.on("clear", () => {
    io.emit("clear");
  });

  // Sensor-Daten für Debugging anzeigen
  socket.on("sensorDump", data => {
    io.emit("sensorDump", data);
  });
});

http.listen(process.env.PORT || 3000, () => {
  console.log("Server läuft");
});
