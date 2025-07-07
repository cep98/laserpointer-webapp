const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

// Statische Dateien aus dem Ordner "public" bereitstellen
app.use(express.static("public"));

io.on("connection", socket => {
  console.log(`Client connected: ${socket.id}`);

  // Gyro-Daten weiterleiten
  socket.on("motion", data => {
    io.emit("motion", data);
  });

  // Optional: Canvas löschen (z.B. via Admin)
  socket.on("clear", () => {
    io.emit("clear");
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
