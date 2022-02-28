import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { DB } from "https://deno.land/x/sqlite@v2.5.0/mod.ts";
import { existsSync } from "https://deno.land/std/fs/mod.ts";
import { test, TestSuite } from "https://deno.land/x/test_suite@0.9.5/mod.ts";
import { sleep } from "https://deno.land/x/sleep/mod.ts";

const dbName = "chess.db";
let db = undefined;
let server = undefined;

// deno test --allow-net --allow-read --allow-write --allow-env --allow-run serverLocal.test.js

const path =
  import.meta.url
    .replace("file://" + Deno.cwd() + "/", "")
    .replace("serverLocal.test.js", "") + "schemaLocal.js";

async function setupServer() {
  const server = await Deno.run({
    cmd: [
      "deno",
      "run",
      "--unstable",
      "--allow-all",
      "--allow-net",
      "--allow-read",
      "--allow-write",
      "--quiet",
      path,
      "--quiet",
    ],
  });
  await sleep(1.5);
  return server;
}

const suite = new TestSuite({
  name: "Test on users db",
  async beforeEach(context) {
    server = await setupServer();
    db = new DB(dbName);
  },
  async afterEach() {
    if (db) {
      await db.close();
      db = undefined;
    }

    if (server) {
      await server.close();
      server = undefined;
    }

    if (existsSync(dbName)) {
      await Deno.remove(dbName);
    }
  },
});

test(suite, "Sessions table was created", async (context) => {
  const tables = [
    ...db
      .query("SELECT name FROM sqlite_master WHERE type='table'")
      .asObjects(),
  ];
  assertEquals(tables[3].name, "sessions");
});

test(suite, "Users table was created", async (context) => {
  const tables = [
    ...db
      .query("SELECT name FROM sqlite_master WHERE type='table'")
      .asObjects(),
  ];

  assertEquals(tables[0].name, "users");
});

test(suite, "Leaderboard table was created", async (context) => {
  const tables = [
    ...db
      .query("SELECT name FROM sqlite_master WHERE type='table'")
      .asObjects(),
  ];
  assertEquals(tables[2].name, "leaderboard");
});

test(suite, "Saved games table was created", async (context) => {
  const tables = [
    ...db
      .query("SELECT name FROM sqlite_master WHERE type='table'")
      .asObjects(),
  ];
  assertEquals(tables[4].name, "savedgames");
});

test(
  suite,
  "leaderboard table has been created with correct columns",
  async (context) => {
    let correctColumnCount = 0;
    const correctColumns = [
      { name: "id", type: "INTEGER", notnull: 0 },
      { name: "user_id", type: "INTEGER", notnull: 1 },
      { name: "username", type: "TEXT", notnull: 1 },
      { name: "won", type: "INTEGER", notnull: 1 },
      { name: "lost", type: "INTEGER", notnull: 1 },
      { name: "draw", type: "INTEGER", notnull: 1 },
      { name: "score", type: "INTEGER", notnull: 1 },
    ];

    const result = [...db.query("PRAGMA table_info(leaderboard);").asObjects()];
    result.forEach((column) => {
      correctColumns.forEach((correctColumn) => {
        if (column.name === correctColumn.name) {
          correctColumnCount++;
          assertEquals(column.type, correctColumn.type);
          assertEquals(column.notnull, correctColumn.notnull);
        }
      });
    });
    assertEquals(correctColumnCount, correctColumns.length);
  }
);

test(
  suite,
  "Saved games table has been created with correct columns",
  async (context) => {
    let correctColumnCount = 0;
    const correctColumns = [
      { name: "id", type: "INTEGER", notnull: 0 },
      { name: "created_at", type: "DATE", notnull: 1 },
      { name: "user_id", type: "INTEGER", notnull: 1 },
      { name: "reset", type: "INTEGER", notnull: 0 },
      { name: "undo", type: "INTEGER", notnull: 0 },
      { name: "in_check", type: "INTEGER", notnull: 0 },
      { name: "optimal_move", type: "INTEGER", notnull: 0 },
      { name: "difficulty", type: "INTEGER", notnull: 0 },
      { name: "game_fen", type: "TEXT", notnull: 1 },
    ];

    const result = [...db.query("PRAGMA table_info(savedgames);").asObjects()];
    result.forEach((column) => {
      correctColumns.forEach((correctColumn) => {
        if (column.name === correctColumn.name) {
          correctColumnCount++;
          assertEquals(column.type, correctColumn.type);
          assertEquals(column.notnull, correctColumn.notnull);
        }
      });
    });
    assertEquals(correctColumnCount, correctColumns.length);
  }
);

test(
  suite,
  "Sessions table has been created with correct columns",
  async (context) => {
    let correctColumnCount = 0;
    const correctColumns = [
      { name: "uuid", type: "TEXT", notnull: 0 },
      { name: "created_at", type: "DATE", notnull: 1 },
      { name: "user_id", type: "INTEGER", notnull: 0 },
    ];

    const result = [...db.query("PRAGMA table_info(sessions);").asObjects()];
    result.forEach((column) => {
      correctColumns.forEach((correctColumn) => {
        if (column.name === correctColumn.name) {
          correctColumnCount++;
          assertEquals(column.type, correctColumn.type);
          assertEquals(column.notnull, correctColumn.notnull);
        }
      });
    });
    assertEquals(correctColumnCount, correctColumns.length);
  }
);
