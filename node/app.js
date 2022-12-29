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
const caprRoute = require('./routes/capr');
const cafsRoute = require('./routes/cafs');
const set1Route = require('./routes/sched/set1');
const set2Route = require('./routes/sched/set2');
const risRoute = require('./routes/ris');

app.use('/', routes);
app.use('/otp', otpRoute);
app.use('/v1/cais/capr', caprRoute);
app.use('/v1/cais/cafs', cafsRoute);
app.use('/v1/cais/afs/', set1Route);
app.use('/v1/cais/afs/', set2Route);
app.use('/ris', risRoute);

app.get("/",  (req, res) => {
  res.status(200).send("Cooperative System: Client API Backend is now up and running. . .");
});

//import middleware
app.post("/welcome", auth, (req, res) => {
    res.status(200).send("Welcome 🙌 ");
  });

module.exports = app;