const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

io.on("connection", socket => {
  // Zeichnen
  socket.on("draw", data => {
    socket.broadcast.emit("draw", data);
  });

  // Alles löschen
  socket.on("clear", () => {
    io.emit("clear");
  });

  // Sensor-Daten weiterleiten (z. B. für debug.html)
  socket.on("sensorDump", data => {
    io.emit("sensorDump", data);
  });
});

http.listen(process.env.PORT || 3000, () => {
  console.log("Server läuft");
});
