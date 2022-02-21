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

const db = new Client(PG_URL);
await db.connect();

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
  ],
  credentials: true,
});

app
  .use(corsConfig)
  .post("/login", postLogin)

  .start({ port: PORT });

// console.log(`Server running on http://localhost:${PORT}`);

async function postLogin(server) {
  const { username, password } = await server.body;

  if (!username || !password) {
    return server.json(
      { success: false, message: "Need to include a username and password" },
      400
    );
  }

  const [response] = [
    ...(await db
      .query("SELECT id,  password_encrypted FROM users WHERE username = ?", [
        username,
      ])
      .asObjects()),
  ];

  const authenticated = await bcrypt.compare(
    password,
    response.password_encrypted
  );

  if (authenticated) {
    // generate a session token and add it to the sessions table and add a cookie.
    const sessionId = v4.generate();
    await db.query(
      "INSERT INTO sessions (uuid, user_id, logged_in, created_at, updated_at) VALUES (?, ?, TRUE, datetime('now'), datetime('now'))",
      [sessionId, response.id]
    );
    server.setCookie({
      name: "sessionId",
      value: sessionId,
    });
    return server.json({ success: true }, 200);
  } else {
    return server.json(
      { success: false, message: "Username and Password are incorrect" },
      400
    );
  }
}

console.log(
  `My favourite colour is ${Deno.env.get(
    "FAVE_COLOUR"
  )} and my favourite food is ${Deno.env.get("FAVE_FOOD")}`
);
