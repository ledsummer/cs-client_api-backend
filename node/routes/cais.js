const express = require('express');
const Sentry = require('../config/logs');
var moment = require('moment');
const format = require('../config/global');


//logs Sentry.infoLogMsg('Account Login fail', email);

const router = express.Router()

module.exports = router;

//call user model
var { Account } = require("../model/flutter");
var { Otp } = require("../model/flutter");

// importing dependencies
const auth = require("../middleware/auth");