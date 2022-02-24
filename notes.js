// function to get user id

import { DB } from "https://deno.land/x/sqlite/mod.ts";

const db = new DB("./chess.db");

// function to retrieve user id from local server
async function getUserId(username) {
  const idArray = db.query(`SELECT * FROM users WHERE username = ?`, [
    username,
  ]);

  let userId = idArray[0][0];
  return userId;
}

console.log(await getUserId("Erik"));
