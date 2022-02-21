import { DB } from "https://deno.land/x/sqlite/mod.ts";
import { Client } from "https://deno.land/x/postgres@v0.11.3/mod.ts";

const client = new Client(
  "postgres://tttobjma:pKaSKSQHgw7OFMfc_BdLPl0YquGRns8d@kesavan.db.elephantsql.com/tttobjma"
);
await client.connect();

await client.queryArray(`DROP TABLE IF EXISTS users CASCADE`);
await client.queryArray(`DROP TABLE IF EXISTS sessions CASCADE`);
await client.queryArray(`DROP TABLE IF EXISTS leaderboard CASCADE`);

// try {
//   await Deno.remove("chess.db");
// } catch {
// const db = new DB("./chess.db");
await client.queryArray(
  `CREATE TABLE users (
    id SERIAL UNIQUE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_encrypted TEXT NOT NULL,
    created_at DATE NOT NULL,
    updated_at DATE NOT NULL
  )`
);

await client.queryArray(`CREATE TABLE leaderboard (
    id SERIAL UNIQUE PRIMARY KEY,
    user_id INTEGER NOT NULL,
    games_won INTEGER NOT NULL,
    games_lost INTEGER NOT NULL,
    games_stalemate INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

await client.queryArray(`CREATE TABLE sessions (
    uuid TEXT PRIMARY KEY UNIQUE,
    user_id INTEGER NOT NULL,
    created_at DATE NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
// }
