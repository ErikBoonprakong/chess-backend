const { Client } = require("pg");

const client = new Client({
  connectionString: "postgres://ublctmmglou7hi:p31c8ddbd29c68038ec7f6280d007c005f469b1479e02b9d07e77054a2db7bcab@cepejvghn9noue.cluster-czz5s0kz4scl.eu-west-1.rds.amazonaws.com:5432/ddtcrljun8vv5d",
    ssl: {rejectUnauthorized: false}
});

client.connect()

client.query(`DROP TABLE IF EXISTS users CASCADE`);
client.query(`DROP TABLE IF EXISTS sessions CASCADE`);
client.query(`DROP TABLE IF EXISTS leaderboard CASCADE`);
client.query(`DROP TABLE IF EXISTS savedgames CASCADE`);

client.query(
  `CREATE TABLE users (
    id SERIAL UNIQUE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_encrypted TEXT NOT NULL,
    created_at DATE NOT NULL,
    updated_at DATE NOT NULL
  )`,
  (err, res) => {
    if (err) throw err;
    for (let row of res.rows) {
      console.log(JSON.stringify(row));
    }
    // client.end();
  }
);

client.query(
  `CREATE TABLE leaderboard (
    id SERIAL UNIQUE PRIMARY KEY,
    user_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    won BIGINT NOT NULL,
    lost BIGINT NOT NULL,
    draw BIGINT NOT NULL,
    score BIGINT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`,
  (err, res) => {
    if (err) throw err;
    for (let row of res.rows) {
      console.log(JSON.stringify(row));
    }
    // client.end();
  }
);

client.query(
  `CREATE TABLE sessions (
  uuid TEXT PRIMARY KEY UNIQUE,
  created_at DATE NOT NULL,
  user_id INTEGER,
  FOREIGN KEY(user_id) REFERENCES users(id)
  )`,
  (err, res) => {
    if (err) throw err;
    for (let row of res.rows) {
      console.log(JSON.stringify(row));
    }
    // client.end();
  }
);

client.query(
  `CREATE TABLE savedgames (
  id SERIAL UNIQUE PRIMARY KEY ,
  created_at DATE NOT NULL,
  user_id INTEGER NOT NULL,
  reset INTEGER,
  undo INTEGER,
  in_check INTEGER ,
  optimal_move INTEGER ,
  difficulty INTEGER,
  userColour TEXT,
  game_fen TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
  )`,
  (err, res) => {
    if (err) throw err;
    for (let row of res.rows) {
      console.log(JSON.stringify(row));
    }
    // client.end();
  }
);

client.query(
  `INSERT INTO users (username, password_encrypted, created_at, updated_at) VALUES 
    ('chessyemErik', 'chickens_encrypted', CURRENT_DATE, CURRENT_DATE),
    ('chessyemMeg', 'chickens_encrypted', CURRENT_DATE, CURRENT_DATE),
    ('chessyemYassin', 'chickens_encrypted', CURRENT_DATE, CURRENT_DATE),
    ('chessyemPersonOne', 'chickens_encrypted', CURRENT_DATE, CURRENT_DATE),
    ('chessyemPersonTwo', 'chickens_encrypted', CURRENT_DATE, CURRENT_DATE)`,
  (err, res) => {
    if (err) throw err;
    for (let row of res.rows) {
      console.log(JSON.stringify(row));
    }
    // client.end();
  }
);

client.query(
  `INSERT INTO leaderboard (user_id, username, won, lost, draw, score) VALUES 
    (1, 'chessyemErik', '10', '0', '0', '30'), 
    (2, 'chessyemMeg', '5', '25', '5', '50'), 
    (3, 'chessyemYassin', '1', '1', '30', '64'), 
    (4, 'chessyemPersonOne', '1', '1', '1', '6'), 
    (5, 'chessyemPersonTwo', '3', '0', '0', '9')`,
  (err, res) => {
    if (err) throw err;
    for (let row of res.rows) {
      console.log(JSON.stringify(row));
    }
    client.end();
  }
);
  
