import { Application } from "https://deno.land/x/abc/mod.ts";
import { DB } from "https://deno.land/x/sqlite@v2.5.0/mod.ts";
import { abcCors } from "https://deno.land/x/cors/mod.ts";
import * as bcrypt from "https://deno.land/x/bcrypt/mod.ts";
import { v4 } from "https://deno.land/std/uuid/mod.ts";
import { Client } from "https://deno.land/x/postgres@v0.11.3/mod.ts";
import { config } from "https://deno.land/x/dotenv/mod.ts";

//============================================================

// const httpServer = require("http").createServer();
// const io = require("socket.io")(httpServer, {
//   cors: { origin: "http://localhost:3000" },
// });
// io.on("connection", (socket) => {
//   console.log("a user connected");
// });
//=============================================================

const DENO_ENV = Deno.env.get("DENO_ENV") ?? "development";

// config({ path: `./.env.${DENO_ENV}`, export: true });

const db = new DB("./chess.db");
///
// const PG_URL = Deno.env.get("PG_URL");
// const client = new Client(PG_URL);
// await client.connect();

const app = new Application();
// const PORT = parseInt(Deno.env.get("PORT")) || 80;
const PORT = 8080;
///please work
const corsConfig = abcCors({
  origin: true,
  allowedHeaders: [
    "Authorization",
    "Content-Type",
    "Accept",
    "Origin",
    "User-Agent",
  ],
  credentials: true,
});

app
  .use(corsConfig)
  .get("/random", async (server) => {
    server.json({ message: "random message" }, 200);
  })
  .get("/results", async (server) => {
    const results = await client.queryArray({ text: `SELECT * FROM users` });
    server.json(results.rows);
  })
  .get("/sessions", async (server) => {
    const results = await client.queryArray({ text: `SELECT * FROM sessions` });
    server.json(results.rows);
  })
  .get("/savedgames/:user_id", getSavedGamesById)
  .get("/scores", getScores)
  .post("/sessions", postLogIn)
  .post("/users", postAccount)
  .post("/savegames", postSavedGame)
  .post("/leaderboard", postResult)
  .delete("/sessions", logOut)
  .start({ port: PORT });

async function postLogIn(server) {
  const { username, password } = await server.body;
  console.log(username, password);
  const validated = await validateLogIn(username, password);
  console.log(validated);

  if (validated.result) {
    const sessionId = v4.generate();
    await db.query(
      `INSERT INTO sessions (uuid, user_id, created_at) 
                   VALUES (?, ?, datetime('now'))`,
      [sessionId, validated.user[0].id]
    );
    server.setCookie({
      name: "sessionId",
      value: sessionId,
    });
    server.setCookie({
      name: "user",
      value: username,
    });
    server.setCookie({
      name: "user_id",
      value: validated.user[0].id,
    });
    server.json(
      {
        message: validated.message,
        sessionId: sessionId,
        user: username,
        user_id: validated.user[0].id,
      },
      200
    );
  } else {
    server.json({ message: validated.message });
  }
}

async function postAccount(server) {
  // const { username, password, confirmation } = await server.body;
  // server.json({ details: username, password, confirmation }, 200);
  const { username, password, confirmation } = await server.body;
  const authenticated = await validateAccount(
    username,
    password,
    confirmation,
    server
  );
  if (authenticated.result) {
    // server.json({ details: username, password, confirmation }, 200);
    const passwordEncrypted = await createHash(password);
    await db.query(
      `INSERT INTO users(username, password_encrypted, created_at, updated_at)
                   VALUES (?, ?, datetime('now'), datetime('now'));`,
      [username, passwordEncrypted]
    );
    // await postLogIn(server);
  } else {
    server.json({ message: authenticated.message }, 400);
  }
}

async function validateLogIn(username, password) {
  let result = false;
  let message = "";
  const user = [
    ...(await db
      .query(`SELECT * FROM users WHERE username = ?`, [username])
      .asObjects()),
  ];
  if (user[0]) {
    const match = await bcrypt.compare(password, user[0].password_encrypted);
    if (match) {
      result = true;
      message = "Success";
    } else {
      message = "Incorrect password.";
    }
  } else {
    message = `User ${username} does not exist`;
  }

  return { result, user, message };
}

async function validateAccount(username, password, confirmation, server) {
  server.json({ details: username, password, confirmation }, 200);
  const [userExists] = (
    await db.query(`SELECT COUNT(*) FROM users WHERE username = ?`, [username])
  ).asObjects();

  const invalidChars = [
    "'",
    ",",
    ".",
    "/",
    ";",
    ":",
    "[",
    "]",
    "{",
    "}",
    '"',
    "|",
    "<",
    ">",
  ];

  const exists = {
    value: userExists[0],
    error: `An account already exists with the e-mail ${username}. `,
  };

  const badChars = {
    value: username.split("").some((i) => invalidChars.includes(i)),
    error: `Invalid characters in username.`,
  };

  const match = {
    value: password !== confirmation,
    error: "Passwords do not match. ",
  };

  const tooShort = {
    value: password.length < 8,
    error: "Password must be at least 8 characters. ",
  };
  const authentication = { exists, match, tooShort, badChars };
  let errorMsg = "";
  for (const props of Object.values(authentication)) {
    if (props.value) {
      errorMsg += props.error;
    }
  }

  return errorMsg
    ? { result: false, message: errorMsg }
    : { result: true, message: "Success" };
}

async function createHash(password) {
  const salt = await bcrypt.genSalt(8);
  const passwordEncrypted = await bcrypt.hash(password, salt);
  return passwordEncrypted;
}

async function logOut(server) {
  console.log("logging out...");
  const { sessionId } = server.cookies;
  await db.query(`DELETE FROM sessions WHERE uuid = ?`, [sessionId]);

  await server.setCookie({
    name: "sessionId",
    value: "",
  });

  await server.setCookie({
    name: "user_id",
    value: "",
  });

  await server.setCookie({
    name: "user",
    value: "",
  });

  server.json({ response: "Logged out" }, 200);
}

async function postSavedGame(server) {
  const {
    user_id,
    reset,
    undo,
    optimalMove,
    difficulty,
    userColour,
    game_fen,
  } = await server.body;
  console.log(user_id);
  await db.query(
    `INSERT INTO savedgames ( created_at, user_id, reset, undo,  optimal_move, difficulty,userColour, game_fen) VALUES ( datetime('now'), ?,? ,?,?,?,?,?)`,
    [user_id, reset, undo, optimalMove, difficulty, userColour, game_fen]
  );
  server.json({ response: "Game saved, find it in saved games." }, 200);
}

async function getSavedGamesById(server) {
  const { user_id } = await server.params;

  const response = [
    ...db
      .query(`SELECT * FROM savedgames WHERE user_id = ?`, [user_id])
      .asObjects(),
  ];
  server.json(response, 200);
}

async function postResult(server) {
  const { username, won, lost, draw } = await server.body;
  let finalScore = await calculateScore(won, lost, draw);
  let user_id = [
    ...db
      .query(`SELECT id FROM users WHERE username = ?`, [username])
      .asObjects(),
  ][0].id;
  console.log(user_id);
  await db.query(
    `INSERT INTO leaderboard ( user_id, username, won, lost, draw, score) VALUES ( ?, ?, ?, ?, ?, ?)`,
    [user_id, username, won, lost, draw, finalScore]
  );
  server.json({ response: "Result saved and added to leaderboard." }, 200);
}

async function calculateScore(win, lost, draw) {
  let score = 0;
  if (win) {
    score += 3;
  } else if (draw) {
    score += 2;
  } else if (lost) {
    score += 1;
  }
  return score;
}

async function getScores(server) {
  const scores = [
    ...db
      .query(
        `SELECT username, SUM(won) as won, SUM(lost) as lost, SUM(draw) as draw, SUM(SCORE) as score FROM leaderboard  GROUP BY user_id ORDER BY score DESC`
      )
      .asObjects(),
  ];
  return server.json({ leaderboard: scores }, 200);
}

console.log(`Server running on http://localhost:${PORT}`);
