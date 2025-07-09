// server.js
const express = require("express");
const app     = express();
const http    = require("http").createServer(app);
const io      = require("socket.io")(http);

app.use(express.static("public"));

io.on("connection", socket => {
  console.log("🔌 Client verbunden:", socket.id);

  socket.on("identify", info => {
    socket.data.role = info.role;       // "control" | "display" | "admin"
    socket.data.deviceId = info.deviceId || null;
    // ggf. client-list aktualisieren …
    io.emit("client-list", /* … Bau hier Eure Liste … */);
  });

  socket.on("motion", data => {
    // data: {alpha, beta, color, isDrawing, deviceId}
    socket.broadcast.emit("motion", data);
  });

  socket.on("clear", () => {
    io.emit("clear");
  });

  socket.on("updateSettings", cfg => {
    // cfg enthält jetzt auch minW und maxW
    io.emit("updateSettings", cfg);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client getrennt:", socket.id);
    io.emit("client-list", /* … aktualisierte Liste … */);
  });
});

const PORT = process.env.PORT||3000;
http.listen(PORT, () => console.log(`🚀 Server läuft auf Port ${PORT}`));
