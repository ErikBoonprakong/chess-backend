const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://hardcore-kepler-5bee6e.netlify.app",
    ],
  },
});
const port = 4000;
const cors = require("cors");

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("new message", (msg) => {
    console.log(msg);
    io.emit("new message", msg);
  });
});

server.listen(port, () => console.log("server is listening on port: " + port));
