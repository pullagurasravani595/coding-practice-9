const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const path = require("path");

const dbPath = path.join(__dirname, "userData.db");
const app = express();
app.use(express.json());

let dataBase = null;

const initializeDbAndServer = async () => {
  try {
    dataBase = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(`server run at http://localhost:3000`);
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
};

initializeDbAndServer();

app.post("/register", async (request, response) => {
  try {
    const { username, name, password, gender, location } = request.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const selectedUser = `
        SELECT * FROM user WHERE username = '${username}';`;
    const dbUser = await dataBase.get(selectedUser);
    if (password.length < 5) {
      response.status(400);
      response.send(`Password is too short`);
    } else if (dbUser === undefined) {
      const createUser = `
            INSERT INTO 
                user (username, name, password, gender, location)
            VALUES ('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}');`;
      await dataBase.run(createUser);
      response.status(200);
      response.send(`User created successfully`);
    } else {
      response.status(400);
      response.send(`User already exists`);
    }
  } catch (e) {
    console.log(`error: ${e.message}`);
  }
});

app.post("/login", async (request, response) => {
  try {
    const { username, password } = request.body;
    const selectUser = `
            SELECT * FROM user WHERE username = '${username}';`;
    const dbUser = await dataBase.get(selectUser);
    if (dbUser === undefined) {
      response.status(400);
      response.send(`Invalid user`);
    } else {
      const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
      if (isPasswordMatched === true) {
        response.status(200);
        response.send(`Login success!`);
      } else {
        response.status(400);
        response.send(`Invalid password`);
      }
    }
  } catch (e) {
    console.log(`error: ${e.message}`);
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const selectUser = `UPDATE user 
    SET
        password = '${hashedPassword}'
    WHERE username = '${username}';`;
  const dbUser = await dataBase.run(selectUser);
  if (newPassword.length < 5) {
    response.status(400);
    response.send(`Password is too short`);
  } else if (dbUser !== undefined) {
    const isPsdMatched = await bcrypt.compare(
      request.body.newPassword,
      dbUser.password
    );
    if (isPsdMatched === true) {
      response.status(200);
      response.send(`Password updated`);
    } else {
      response.status(400);
      response.send(`Invalid current password`);
    }
  }
});

module.exports = app;
