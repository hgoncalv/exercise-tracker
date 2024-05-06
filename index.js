const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cors());
app.use(express.static("public"));

// In-memory data store
let users = [];

// Generate unique ID function
function generateID() {
  return "_" + Math.random().toString(36).substr(2, 9);
}
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
  console.log("Express server running");
});
// Create a new username
app.post("/api/users", (req, res) => {
  const userName = req.body.username;
  const userExist = users.find((user) => user.username === userName);

  if (userExist) {
    res.json({
      username: userName,
      _id: userExist._id,
    });
  } else {
    const newUser = {
      username: userName,
      _id: generateID(),
      log: [],
    };
    users.push(newUser);
    res.json({
      username: newUser.username,
      _id: newUser._id,
    });
  }
});

// Get all users
app.get("/api/users", (req, res) => {
  res.json(users.map((user) => ({ username: user.username, _id: user._id })));
});

// Add exercise to a user
app.post("/api/users/:_id/exercises", (req, res) => {
  const id = req.params._id;
  const description = req.body.description;
  const duration = parseInt(req.body.duration);
  let date = new Date(req.body.date);

  if (isNaN(date.getTime())) {
    date = new Date();
  }

  const user = users.find((user) => user._id === id);

  if (user) {
    const exercise = {
      description: description,
      duration: duration,
      date: date.toDateString(),
    };

    user.log.push(exercise);

    res.json({
      _id: id,
      username: user.username,
      date: date.toDateString(),
      duration: duration,
      description: description,
    });
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

// Get user's exercise log
app.get("/api/users/:_id/logs", (req, res) => {
  const id = req.params._id;
  const user = users.find((user) => user._id === id);

  if (user) {
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

      log = log.filter((session) => {
        let sessionDate = new Date(session.date);
        return sessionDate >= fromDate && sessionDate <= toDate;
      });
    }

    if (req.query.limit) {
      log = log.slice(0, req.query.limit);
    }

    // Format date in the log array to the required format "Mon Jan 01 1990"
    log = log.map((session) => ({
      ...session,
      date: new Date(session.date).toDateString(),
    }));
    console.log(log);
    res.json({
      _id: id,
      username: user.username,
      count: log.length,
      log: log,
    });
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
