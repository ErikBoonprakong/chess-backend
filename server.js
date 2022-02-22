import { Application } from "https://deno.land/x/abc/mod.ts";
import { DB } from "https://deno.land/x/sqlite@v2.5.0/mod.ts";
import { abcCors } from "https://deno.land/x/cors/mod.ts";
import * as bcrypt from "https://deno.land/x/bcrypt/mod.ts";
import { v4 } from "https://deno.land/std/uuid/mod.ts";
import { Client } from "https://deno.land/x/postgres@v0.11.3/mod.ts";
import { config } from "https://deno.land/x/dotenv/mod.ts";

const DENO_ENV = Deno.env.get("DENO_ENV") ?? "development";

config({ path: `./.env.${DENO_ENV}`, export: true });

const db = new DB("./chess.db");
///
const PG_URL = Deno.env.get("PG_URL");
const client = new Client(PG_URL);
await client.connect();

const app = new Application();
const PORT = parseInt(Deno.env.get("PORT")) || 80;
///please work
const corsConfig = abcCors({
  origin: true,
  allowedHeaders: [
    "Authorization",
    "Content-Type",
    "Accept",
    "Origin",
    "User-Agent",
    "Access-Control-Allow-Credentials",
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
  .post("/sessions", postLogIn)
  .post("/users", postAccount)
  .delete("/sessions", logOut)
  .start({ port: PORT });

async function postLogIn(server) {
  const { username, password } = await server.body;
  const authenticated = await validateLogIn(username, password);
  if (authenticated.result) {
    const sessionId = v4.generate();
    const query = `INSERT INTO sessions (uuid, user_id, created_at) 
                   VALUES ($1, $2, CURRENT_DATE)`;

    await client.queryArray({
      text: query,
      args: [sessionId, authenticated.user[0].id],
    });
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
      value: authenticated.user[0].id,
    });
    server.json({ message: authenticated.message }, 200);
  } else {
    server.json({ message: authenticated.message }, 400);
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
    const passwordEncrypted = await createHash(password);
    const query = `INSERT INTO users(username, password_encrypted, created_at, updated_at)
                   VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE);`;
    await client.queryArray({
      text: query,
      args: [username, passwordEncrypted],
    });
    await postLogIn(server);
  } else {
    server.json({ message: authenticated.message }, 400);
  }
}

async function validateLogIn(username, password) {
  let result = false;
  let message = "";
  const user = (
    await client.queryObject({
      text: `SELECT * FROM users WHERE username = $1`,
      args: [username],
    })
  ).rows;
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
    await client.queryArray({
      text: `SELECT COUNT(*) FROM users WHERE username = $1`,
      args: [username],
    })
  ).rows;

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
  const { sessionId } = server.cookies;
  const query = `DELETE FROM sessions WHERE uuid = $1`;
  await client.queryArray({
    text: query,
    args: [sessionId],
  });

  await server.setCookie({
    name: "sessionId",
    value: "",
  });

  await server.setCookie({
    name: "user",
    value: "",
  });

  await server.setCookie({
    name: "user_id",
    value: "",
  });

  server.json({ response: "Log out successful" }, 200);
}

console.log(`Server running on http://localhost:${PORT}`);
