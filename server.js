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

  socket.on("edgeHit", (data) => {
    socket.broadcast.emit("edgeHit", data); // send to all others, including control
  });
});

http.listen(process.env.PORT || 3000, () => {
  console.log("Server läuft");
});
