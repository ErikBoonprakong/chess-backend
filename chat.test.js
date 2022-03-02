const { createServer } = require("http");
const { Server } = require("socket.io");
const Client = require("socket.io-client");

// "https://chessyem-websocket.herokuapp.com"

describe("Chess project", () => {
  let io, serverSocket, clientSocket;

  beforeAll((done) => {
    const httpServer = createServer();
    io = new Server(httpServer);
    httpServer.listen(() => {
      const port = httpServer.address().port;
      console.log(port);
      clientSocket = new Client(`http://localhost:${port}`);
      io.on("connection", (socket) => {
        serverSocket = socket;
      });
      clientSocket.on("connect", done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
  });

  test("Sending information about game winner", (done) => {
    clientSocket.on("You Win!", (arg) => {
      expect(arg).toBe("White wins.");
      done();
    });
    serverSocket.emit("You Win!", "White wins.");
  });

  test("should work (with ack)", (done) => {
    serverSocket.on("It is not your turn.", (cb) => {
      cb("Your turn.");
    });
    clientSocket.emit("It is not your turn.", (arg) => {
      expect(arg).toBe("Your turn.");
      done();
    });
  });
});
