import { DB } from "https://deno.land/x/sqlite/mod.ts";
import { Client } from "https://deno.land/x/postgres@v0.11.3/mod.ts";

const client = new Client(
  "postgres://tttobjma:pKaSKSQHgw7OFMfc_BdLPl0YquGRns8d@kesavan.db.elephantsql.com/tttobjma"
);
await client.connect();

await client.queryArray(`DROP TABLE IF EXISTS users CASCADE`);
await client.queryArray(`DROP TABLE IF EXISTS sessions CASCADE`);
await client.queryArray(`DROP TABLE IF EXISTS leaderboard CASCADE`);
await client.queryArray(`DROP TABLE IF EXISTS savedgames CASCADE`);

// try {
//   await Deno.remove("chess.db");
// } catch {
//   const db = new DB("./chess.db");
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
    username TEXT NOT NULL,
    won BIGINT NOT NULL,
    lost BIGINT NOT NULL,
    draw BIGINT NOT NULL,
    score BIGINT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

await client.queryArray(
  `CREATE TABLE sessions (
  uuid TEXT PRIMARY KEY UNIQUE,
  created_at DATE NOT NULL,
  user_id INTEGER,
  FOREIGN KEY(user_id) REFERENCES users(id)
  )`
);

await client.queryArray(`CREATE TABLE savedgames (
  id SERIAL UNIQUE PRIMARY KEY ,
  created_at DATE NOT NULL,
  user_id INTEGER NOT NULL,
  reset INTEGER,
  undo INTEGER,
  in_check INTEGER ,
  optimal_move INTEGER ,
  difficulty INTEGER,
  game_fen TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

await client.queryArray(
  `INSERT INTO users (username, password_encrypted, created_at, updated_at) VALUES 
    ('chessyemErik', 'chickens_encrypted', CURRENT_DATE, CURRENT_DATE),
    ('chessyemMeg', 'chickens_encrypted', CURRENT_DATE, CURRENT_DATE),
    ('chessyemYassin', 'chickens_encrypted', CURRENT_DATE, CURRENT_DATE),
    ('chessyemPersonOne', 'chickens_encrypted', CURRENT_DATE, CURRENT_DATE),
    ('chessyemPersonTwo', 'chickens_encrypted', CURRENT_DATE, CURRENT_DATE)`
);

await client.queryArray(
  `INSERT INTO leaderboard (user_id, username, won, lost, draw, score) VALUES 
    (1, 'chessyemErik', '10', 0, 0, 30), 
    (2, 'chessyemMeg', '5', 25, 5, 50), 
    (3, 'chessyemYassin', '1', 1, 30, 64), 
    (4, 'chessyemPersonOne', '1', 1, 1, 6), 
    (5, 'chessyemPersonTwo', '3', 0, 0, 9)`
);
// }
