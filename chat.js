const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
//const socket = require("socket.io");
//const io = socket(server);
const io = require("socket.io")(server, {
  cors: { origin: "http://localhost:3000" },
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
