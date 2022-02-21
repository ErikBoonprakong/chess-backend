import { DB } from "https://deno.land/x/sqlite/mod.ts";

const client = new Client(
  "postgres://tttobjma:pKaSKSQHgw7OFMfc_BdLPl0YquGRns8d@kesavan.db.elephantsql.com/tttobjma"
);
await client.connect();

await client.queryArray(`DROP TABLE IF EXISTS users CASCADE`);
await client.queryArray(`DROP TABLE IF EXISTS sessions CASCADE`);
await client.queryArray(`DROP TABLE IF EXISTS searches CASCADE`);

try {
  await Deno.remove("chess.db");
} catch {
  const db = new DB("./chess.db");
  await db.queryArray(
    `CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_encrypted TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
  )`
  );

  await db.queryArray(`CREATE TABLE leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    games_won INTEGER NOT NULL,
    games_lost INTEGER NOT NULL, 
    games_stalemate INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) 
  )`);

  await db.queryArray(`CREATE TABLE sessions (
    uuid TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    logged_in INTEGER NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
}
