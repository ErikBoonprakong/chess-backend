const http = require("http");
const websocketServer = require("websocket").server;
const app = require("express")();
httpServer.listen(9090, () => console.log("listening on 9090"));

const wsServer = new websocketServer({
  //prettier-ignore
  "httpServer": httpServer,
});

wsServer.on("request", (request) => {
  // attempt to connect
  const connection = request.accept(null, request.origin);
  connection.on("open", () => console.log("opened!"));
  connection.on("close", () => console.log("closed!"));
  connection.on("message", (message) => {
    // received message from client
  });
  const clientId = guid();
  clients[clientId] = {
    //prettier-ignore
    "connection": connection,
  };
  const payLoad = {
    //prettier-ignore
    "method": "connect",
    //prettier-ignore
    "clientId": clientId,
  };
});

function S4() {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

// then to call it, plus stitch in '4' in the third group
const guid = () =>
  (
    S4() +
    S4() +
    "-" +
    S4() +
    "-4" +
    S4().substr(0, 3) +
    "-" +
    S4() +
    "-" +
    S4() +
    S4() +
    S4()
  ).toLowerCase();
