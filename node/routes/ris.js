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

//-- CREATE ACCOUNT FOR FIRST LOGIN --
router.post("/new", auth, async (req, res) => {
    // Our addcoop logic starts here
    try {
        // Get account input
        const { host } = req.body;
        
        // Validate user input
        if (!(host)) {
          const obj = { host: false };
            res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
        } else {
           // check if user already exist
           // Validate if user exist in our database
           const oldAccount = await Account.findOne({ host });

           if (oldAccount) {
               // If the output is a JSON array you need to stringify it first, but if already a string remove stringify
               var obj = JSON.parse(JSON.stringify(oldAccount));

               //validate if the account already confirmed the email
               if ( obj.confirmEmail == false ) {
                    const obj = {  email: "unverified", url: "otp/generate/email/ {email}" };
                   return res.status(200).json(format.apiResponse("error", "App - Account exist. Email is not verified.", obj));
               } else {
                    //send transaction logs success
                    Sentry.infoLogMsg('Email was validated Success', host);
                    const obj = {  email: "verified" };
                    return res.status(200).json(format.apiResponse("error", "App - Account exist. Email is verified.", obj));
               }

           } else{
               
                // Create new account in our database
                const newAccount = await Account.create({ host, accountCode: moment().unix(), confirmEmail: false });
           
                 // return new account details
                res.status(201).json(format.apiResponse("success", "App - Account created", newAccount));
                //send transaction logs success
                Sentry.infoLogMsg('Account Created Success', host);
           }
        }
    
      } catch (err) {
        console.log(err);
        Sentry.captureException(err);
      }
      // Our logic ends here
  });