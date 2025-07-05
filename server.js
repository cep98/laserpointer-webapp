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

  socket.on("sensorDump", data => {
  console.log("SensorDump empfangen:", data);  // NEU!
  io.emit("sensorDump", data);
});

});

http.listen(process.env.PORT || 3000, () => {
  console.log("Server läuft");
});
