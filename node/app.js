require("dotenv").config();
require("./config/database").connect();
const express = require("express");

const app = express();

app.use(express.json());

// Logic goes here


// importing routes files
const routes = require('./routes/routes');
const otpRoute = require('./routes/otp');
const auth = require('./middleware/auth');
const caisRoute = require('./routes/cais');
const risRoute = require('./routes/ris');

app.use('/', routes);
app.use('/otp', otpRoute);
app.use('/cais', caisRoute);
app.use('/ris', risRoute);

app.get("/",  (req, res) => {
  res.status(200).send("Cooperative System: Client API Backend is now running. . .");
});

//import middleware
app.post("/welcome", auth, (req, res) => {
    res.status(200).send("Welcome 🙌 ");
  });

module.exports = app;