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
    draw INTEGER NOT NULL,
    score INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
    
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

  await db.query(
    `INSERT INTO users (username, password_encrypted, created_at, updated_at) VALUES 
    ('chessyemErik', 'chickens_encrypted', datetime('now'), datetime('now')),
    ('chessyemMeg', 'chickens_encrypted', datetime('now'), datetime('now')),
    ('chessyemYassin', 'chickens_encrypted', datetime('now'), datetime('now')),
    ('chessyemPersonOne', 'chickens_encrypted', datetime('now'), datetime('now')),
    ('chessyemPersonTwo', 'chickens_encrypted', datetime('now'), datetime('now'))`
  );

  await db.query(
    `INSERT INTO leaderboard (user_id, username, won, lost, draw, score) VALUES 
    (1, 'chessyemErik', 10, 0, 0, 30), 
    (2, 'chessyemMeg', 5, 25, 5, 50), 
    (3, 'chessyemYassin', 1, 1, 30, 64), 
    (4, 'chessyemPersonOne', 1, 1, 1, 6), 
    (5, 'chessyemPersonTwo', 3, 0, 0, 9)`
  );
}
