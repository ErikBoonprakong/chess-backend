import { DB } from "https://deno.land/x/sqlite/mod.ts";

try {
  await Deno.remove("chess.db");
} catch {
  const db = new DB("./chess.db");
  await db.query(
    `CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_encrypted TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
  )`
  );

  await db.query(`CREATE TABLE leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    games_won INTEGER NOT NULL,
    games_lost INTEGER NOT NULL, 
    games_stalemate INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) 
  )`);

  await db.query(`CREATE TABLE sessions (
    uuid TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    logged_in INTEGER NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
}
