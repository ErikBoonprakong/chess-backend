import { DB } from "https://deno.land/x/sqlite/mod.ts";
// import { Client } from "https://deno.land/x/postgres@v0.11.3/mod.ts";

// const client = new Client(
//   "postgres://tttobjma:pKaSKSQHgw7OFMfc_BdLPl0YquGRns8d@kesavan.db.elephantsql.com/tttobjma"
// );
// await client.connect();

// await client.queryArray(`DROP TABLE IF EXISTS users CASCADE`);
// await client.queryArray(`DROP TABLE IF EXISTS sessions CASCADE`);
// await client.queryArray(`DROP TABLE IF EXISTS leaderboard CASCADE`);

try {
  await Deno.remove("chess.db");
} catch {
  const db = new DB("./chess.db");
  await db.query(
    `CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    password_encrypted TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
  )`
  );

  await db.query(`CREATE TABLE leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    won INTEGER NOT NULL,
    lost INTEGER NOT NULL,
    stalemate INTEGER NOT NULL,
    score INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
    FOREIGN KEY(username) REFERENCES users(username)
  )`);

  await db.query(
    `CREATE TABLE sessions (
  uuid TEXT PRIMARY KEY,
  created_at DATE NOT NULL,
  user_id INTEGER,
  FOREIGN KEY(user_id) REFERENCES users(id)
  )`
  );

  await db.query(
    `CREATE TABLE savedgames (
  id INTEGER PRIMARY KEY ,
  created_at DATE NOT NULL,
  user_id INTEGER NOT NULL,
  reset INTEGER,
  undo INTEGER
  in_check INTEGER ,
  optimal_move INTEGER ,
  difficulty INTEGER,
  game_fen TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
  )`
  );
}
