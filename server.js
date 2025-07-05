const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

io.on("connection", socket => {
  socket.on("draw", data => {
    socket.broadcast.emit("draw", data);
  });

  socket.on("clear", () => {
    io.emit("clear");
  });

  // 🔧 NEU: Kalibrierung von admin an control
  socket.on("calibration", data => {
    io.emit("calibration", data);
  });
});

http.listen(process.env.PORT || 3000, () => {
  console.log("Server läuft");
});

socket.on("sensorDump", data => {
  io.emit("sensorDump", data); // leitet alles an alle weiter
});
