const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cors());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
  console.log("Express server running");
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

// Variables to store user data and exercise logs
const users = new Map();
let userIdCounter = 0;

// Create a new username
app.post("/api/users", (req, res) => {
  const userName = req.body.username;
  if (users.has(userName)) {
    const user = users.get(userName);
    res.json({
      username: userName,
      _id: user._id,
    });
  } else {
    const userId = ++userIdCounter;
    const newUser = {
      _id: userId,
      username: userName,
      log: [],
      count: 0,
    };
    users.set(userName, newUser);
    res.json({
      username: userName,
      _id: userId,
    });
  }
});

app.get("/api/users", (req, res) => {
  const usersData = Array.from(users.values()).map((user) => ({
    _id: user._id,
    username: user.username,
  }));
  res.json(usersData);
});

app.post("/api/users/:_id/exercises", (req, res) => {
  const userId = req.params._id;
  const description = req.body.description;
  const duration = parseInt(req.body.duration);
  let date = new Date(req.body.date);

  if (isNaN(date.getTime())) {
    date = new Date();
  }

  const user = users.get(userId);
  const exercise = {
    description: description,
    duration: duration,
    date: date.toDateString(),
  };
  user.log.push(exercise);
  user.count++;
  res.json({
    _id: userId,
    username: user.username,
    date: exercise.date,
    duration: exercise.duration,
    description: exercise.description,
  });
});

app.get("/api/users/:_id/logs", (req, res) => {
  const userId = req.params._id;
  const user = users.get(userId);

  let log = user.log;

  if (req.query.from || req.query.to) {
    let fromDate = new Date(0);
    let toDate = new Date();

    if (req.query.from) {
      fromDate = new Date(req.query.from);
    }

    if (req.query.to) {
      toDate = new Date(req.query.to);
    }

    fromDate = fromDate.getTime();
    toDate = toDate.getTime();

    log = log.filter((session) => {
      let sessionDate = new Date(session.date).getTime();
      return sessionDate >= fromDate && sessionDate <= toDate;
    });
  }

  if (req.query.limit) {
    log = log.slice(0, req.query.limit);
  }

  const responseData = {
    _id: userId,
    username: user.username,
    count: user.count,
    log: log,
  };

  res.json(responseData);
});
