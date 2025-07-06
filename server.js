const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

// Statische Dateien aus dem Ordner "public" bereitstellen
app.use(express.static("public"));

io.on("connection", socket => {
  console.log("Ein Benutzer ist verbunden.");

  socket.on("draw", data => {
    socket.broadcast.emit("draw", data);
  });

  socket.on("drawEnd", () => {
    socket.broadcast.emit("drawEnd");
  });

  socket.on("clear", () => {
    io.emit("clear");
  });

  socket.on("disconnect", () => {
    console.log("Ein Benutzer hat die Verbindung getrennt.");
  });
});

// Starte Server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
