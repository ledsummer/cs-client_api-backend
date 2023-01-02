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
const risRoute = require('./routes/ris');

app.use('/', routes);
app.use('/otp', otpRoute);
app.use('/v1/cais/capr', caprRoute);
app.use('/v1/cais/cafs', cafsRoute);
for (let i = 1; i <= 8; i++) {
  app.use(`/v1/cais/afs/`, require(`./routes/sched/set${i}`));
}
app.use('/ris', risRoute);

app.get("/",  (req, res) => {
  res.status(200).send("Cooperative System: Client API Backend is now up and running. . .");
});

//import middleware
app.post("/welcome", auth, (req, res) => {
    res.status(200).send("Welcome 🙌 ");
  });

module.exports = app;