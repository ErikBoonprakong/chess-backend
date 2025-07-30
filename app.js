const http = require('http')
const { Client } = require("pg");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const shortid = require("shortid");

const port = 8080

    const app = express();
    app.use(bodyParser.json());
    app.use(
      bodyParser.urlencoded({
        extended: true,
      })
    );
   

    const corsConfig = cors({
      sameSite: "None",
      // origin: process.env.REACT_APP_API_URL,
      // origin: "*",
      origin: [
        "https://621ca44843a9d90007891a54--hardcore-kepler-5bee6e.netlify.app",
        "https://hardcore-kepler-5bee6e.netlify.app",
        "http://localhost:3000",
        "http://localhost:3001",
        "https://chessyem.netlify.app"
      ],
    
      allowedHeaders: [
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "User-Agent",
        // "Access-Control-Allow-Origin",
        // "Access-Control-Allow-Headers",
        // "Access-Control-Allow-Credentials",
      ],
      credentials: true,
    });
    app.use(corsConfig)


    const client = new Client({
      connectionString:
        "postgres://ublctmmglou7hi:p31c8ddbd29c68038ec7f6280d007c005f469b1479e02b9d07e77054a2db7bcab@cepejvghn9noue.cluster-czz5s0kz4scl.eu-west-1.rds.amazonaws.com:5432/ddtcrljun8vv5d",
      ssl: { rejectUnauthorized: false },
    });

    client.connect();

    const getUsers = (request, response) => {
      client.query("SELECT * FROM users", (error, results) => {
        if (error) {
          throw error;
        }
        response.status(200).json(results.rows);
      });
    };

    const getSaves = (request, response) => {
        client.query(
          "SELECT username, SUM(won) as won, SUM(lost) as lost, SUM(draw) as draw, SUM(score) as score FROM leaderboard GROUP BY username ORDER BY score DESC",
          (error, results) => {
            if (error) {
              throw error;
            }
            console.log(results.rows);
            response.status(200).json(results.rows);
          }
        );
    }

    const getSessions = (request, response) => {
        client.query(
          `SELECT * FROM sessions`,
          (error, results) => {
            if (error) {
              throw error;
            }
            response.status(200).json(results.rows);
          }
        );
    }

    const createAccount = async (request, response) => {
      const { username, password, confirmation } = await request.body;
      const authenticated = await validateAccount(
        username,
        password,
        confirmation,
        request
      );
      if (authenticated.result) {
        const passwordEncrypted = await createHash(password);
        const query = `INSERT INTO users(username, password_encrypted, created_at, updated_at)
                   VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE);`;
        await client.query({
          text: query,
          values: [username, passwordEncrypted],
        });
        response.json({message: "Account created successfully!"})
        // await postLogIn(server);
      } else {
        response.json({ message: authenticated.message }, 400);
      }
    }

    async function validateAccount(username, password, confirmation, server) {
      // server.json({ details: username, password, confirmation }, 200);
      const [userExists] = (
        await client.query({
          text: `SELECT COUNT(*) FROM users WHERE username = $1`,
          values: [username],
        })
      ).rows;
      const invalidChars = [
        "'",
        ",",
        ".",
        "/",
        ";",
        ":",
        "[",
        "]",
        "{",
        "}",
        '"',
        "|",
        "<",
        ">",
        "*"
      ];

      const exists = {
        value: parseInt(userExists.count),
        error: `An account already exists with the name ${username}. `,
      };

      const badChars = {
        value: username.split("").some((i) => invalidChars.includes(i)),
        error: `Invalid characters in username.`,
      };

      const match = {
        value: password !== confirmation,
        error: "Passwords do not match. ",
      };

      const tooShort = {
        value: password.length < 8,
        error: "Password must be at least 8 characters. ",
      };
      const authentication = { exists, match, tooShort, badChars };
      let errorMsg = "";
      for (const props of Object.values(authentication)) {
        if (props.value) {
          errorMsg += props.error;
        }
      }

      return errorMsg
        ? { result: false, message: errorMsg }
        : { result: true, message: "Success" };
    }

    async function createHash(password) {
      const salt = await bcrypt.genSalt(8);
      const passwordEncrypted = await bcrypt.hash(password, salt);
      return passwordEncrypted;
    }

    const logIn = async (request, response) => {
      const { username, password } = await request.body;
      const authenticated = await validateLogIn(username, password);
      if (authenticated.result) {
        const sessionId = shortid.generate();
        const query = `INSERT INTO sessions (uuid, user_id, created_at)
                       VALUES ($1, $2, CURRENT_DATE)`;
    
        await client.query({
          text: query,
          values: [sessionId, authenticated.user[0].id],
        });
        response.json(
          {
            message: authenticated.message,
            sessionId: sessionId,
            user: username,
            user_id: authenticated.user[0].id,
          },
          200
        );
      } else {
        response.json({ message: authenticated.message }, 400);
      }
    }

    async function validateLogIn(username, password) {
      let result = false;
      let message = "";
      const user = (
        await client.query({
          text: `SELECT * FROM users WHERE username = $1`,
          values: [username],
        })
      ).rows;
      if (user[0]) {
        const match = await bcrypt.compare(password, user[0].password_encrypted);
        if (match) {
          result = true;
          message = "Success";
        } else {
          message = "Incorrect password.";
        }
      } else {
        message = `User ${username} does not exist`;
      }
    
      return { result, user, message };
    }

    const logOut = async (request, response) => {
      const { sessionId } = request.body;
      const query = `DELETE FROM sessions WHERE uuid = $1`;
      await client.query({
        text: query,
        values: [sessionId],
      });
      response.json({ response: "Log out successful" }, 200);
    }

    const postResult = async (request, response) => {
      const { username, won, lost, draw } = await request.body;
      let finalScore = await calculateScore(won, lost, draw);
      console.log("before user_id....");
      let user_id = await client.query({
        text: `SELECT id FROM users WHERE username = $1`,
        values: [username],
      });
      console.log("USER ID = " + user_id.rows[0].id);
      user_id = user_id.rows[0].id;
      await client.query({
        text: `INSERT INTO leaderboard ( user_id, username, won, lost, draw, score) VALUES ( $1,$2,$3,$4,$5,$6)`,
        values: [user_id, username, won, lost, draw, finalScore],
      });
      response.json({ response: "Result saved and added to leaderboard." }, 200);
    }

    const calculateScore = (win, lost, draw) => {
      let score = 0;
      if (win) {
        score += 3;
      } else if (draw) {
        score += 2;
      } else if (lost) {
        score += 1;
      }
      return score;
    }

    const postSavedGame = async (request, response) => {
      const {
        user_id,
        reset,
        undo,
        optimalMove,
        difficulty,
        userColour,
        game_fen,
      } = await request.body;
      await client.query({
        text: `INSERT INTO savedgames ( created_at, user_id, reset, undo,  optimal_move, difficulty, userColour, game_fen) VALUES ( CURRENT_DATE, $1,$2,$3,$4,$5,$6,$7)`,
        values: [
          user_id,
          reset,
          undo,
          optimalMove,
          difficulty,
          userColour,
          game_fen,
        ],
      });
      response.json({ response: "Game saved, find it in saved games." }, 200);
    }

    const getSavedGamesById = async (request, response) => {
      const { user_id } = await request.params;
      const results = await client.query({
        text: `SELECT * FROM savedgames WHERE user_id = $1`,
        values: [user_id],
      });
      response.json(results.rows, 200);
    }

    const getScores = async (request, response) => {
      const results = await client.query({
        text: `SELECT username, SUM(won) as won, SUM(lost) as lost, SUM(draw) as draw, SUM(score) as score FROM leaderboard GROUP BY username ORDER BY score DESC`,
      });
      return response.json({ leaderboard: results.rows }, 200);
    }

    app.get("/results", getUsers)
    app.get("/saves", getSaves)
    app.get("/sessions", getSessions)
    app.get("/savedgames/:user_id", getSavedGamesById);
    app.get("/scores", getScores);
    app.post("/users", createAccount)
    app.post("/sessions", logIn)
    app.post("/leaderboard", postResult);
    app.post("/savegames", postSavedGame)
    app.delete("/sessions", logOut)

app.listen(port, async (error) => {
    if (error){
        console.log('something went wrong')
    } else {
        console.log('server is running on port: ' + port)
    }
})

