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
const clients = [];
io.on("connection", (socket) => {
  socket.on("new message", (msg) => {
    console.log(msg);
    io.emit("new message", msg);
  });
  socket.on("new move", (move) => {
    io.emit("new move", move);
  });
  socket.on("join room", (name) => {
    if (!clients.includes(name)) {
      clients.push(name);
    }
    io.emit("player list", clients);
    if (clients.length === 2) {
      io.emit("new message", `${clients[0]} vs ${clients[1]}`);
    }
  });
  socket.on("leave room", (name) => {
    clients.splice(clients.indexOf(name), 1);
    io.emit("player list", clients);
  });
});

server.listen(port, () => console.log("server is listening on port: " + port));

// onDrop(sourceSquare, targetSquare) {
//     console.log(this.state.game);
//     const newGame = new Chess(this.state.game);
//     const gameCopy = { ...newGame };
//     const move = gameCopy.move({
//       from: sourceSquare,
//       to: targetSquare,
//       promotion: "q", // always promote to a queen for example simplicity
//     });
//     if (move === null) return false;
//     const newGameFen = gameCopy.fen();
//     this.socket.emit("new move", { move: move, game: newGameFen });
//     this.setState({ game: "" });

//     return move;
//   }
