const express = require('express');
const Sentry = require('../config/logs');
var moment = require('moment');


const router = express.Router()

module.exports = router;

//call user model
const User = require("../model/user");
const { Otp, Account } = require("../model/flutter");

// importing dependencies
var jwt = require('jsonwebtoken');
const auth = require("../middleware/auth");
const format = require('../config/global');


//-- VERIFY OTP_GET --
router.post("/verify", async (req, res) => {
    try {
        // Get account input
        const { mobile, otpNumber  } = req.body;

        if (!(mobile, otpNumber)) {
          const obj = { mobile: 'empty or null', otpNumber: 'empty or null' };
          res.status(200).json(format.apiResponse('error', 'Please provide your mobile number and otp', obj));
        } else{

          const account = await User.findOne( { mobile }, {__v: 0, first_name: 0, last_name: 0, password: 0} );

          if(account && otpNumber == account.otp) {

            if( account.userVerified == true ){ //check if account already verified
                const obj = { host_id: '', token: '' };
                res.status(200).json(format.apiResponse("error","Account is already verified. You can start using the app.", obj));

            }else{

                var currentTimestamp =  await moment().unix(); //get current timestamp unix format
                var expireTimestamp = account.otpExpire; //get the timestamp unix format of the account
            
              if (currentTimestamp > expireTimestamp) { //compare, if the current timestamp is greater than the expire timestamp = to expire
                
                const obj = { host_id: '', token: '', url: "otp/resend/mobile/{ mobile }" }; //create json response with multiple objects
                res.status(200).json(format.apiResponse("error", "OTP Number already expire. Please request for new OTP.", obj));

              } else {
                
                // Create token
                const token = jwt.sign(
                  { user_id: account._id, mobile },
                  process.env.TOKEN_KEY,
                  {
                    expiresIn: process.env.EXPIRES_IN,
                  }
                );

                account.token = token;
                account.userVerified = true; //update the userVerified col to true
                await account.save(); //update user details
                const obj = { host_id: account._id, token: token };
                res.status(200).json(format.apiResponse("success", "Account is now verified. Continue to dashboard.", obj));
              }
              
            }
  
          }else {
            // return a 404 status code and a response
            const obj = { host_id: '', token: '' };
            res.status(200).json(format.apiResponse("error", "OTP Number Cannot be found.", obj));
          }

        }

      } catch (err) {
        console.log(err);
        Sentry.captureException(err);
      }
      // Our logic ends here
  });
  //-- VERIFY OTP_GET --


  //-- RESEND OTP_GET mobile --
router.get("/resend/mobile/:mobile", async (req, res) => {
    try {
        // Get account input
        const  mobile = req.params.mobile;

        if (!( mobile )) {
          res.status(200).json(format.apiResponse("error", "Please provide your mobile number."));
          
        } else{

          const account = await User.findOne( { mobile }, {__v: 0, first_name: 0, last_name: 0, email: 0, password: 0} );

          if( account && account.userVerified == false ) {

            const otpDigits  = await format.otpGenerator(4);
            const min = process.env.OTP_MIN * 60; //get mins in the .env 
            const CurrentTime = moment().unix(); // get current time in unix format

            account.otp = Number(otpDigits);
            account.otpExpire = CurrentTime+min;
            await account.save(); //update user details

            const obj = { otp: otpDigits, expireAt: CurrentTime+min, mode: 'mobile' }; //create json response with multiple objects
            res.status(201).json(format.apiResponse("success", "We send new OTP", obj));
  
          }else {
            // return a 404 status code and a response
            res.status(200).json(format.apiResponse("error", "We cannot send a new OTP. Mobile number does not exist."));
          }

        }

      } catch (err) {
        console.log(err);
        Sentry.captureException(err);
      }
      // Our logic ends here
  });
  //-- RESEND OTP_GET mobile --

  //-- RESEND OTP_GET email --
  router.get("/generate/email/:emailAdd", auth, async (req, res) => {
   try {
        // Get account input
        const  email = req.params.emailAdd;

        if (!( email )) {
          res.status(200).json(format.apiResponse("error", "Please provide your email address."));
          
        } else{
          // search for email in the user document
          const user = await User.findOne( { email: email }, {__v: 0, first_name: 0, last_name: 0, password: 0} );

          if( user ) {

            // get the user host based on the email found
            const host = user._id
            const account = await Account.findOne(host); //search for account with corresponding host

              if ( account ) {
                //if account exist check if it has a otp request for the email 
                const otpExist = await Otp.findOne(host); //search for account with corresponding host

                if (!(otpExist)) {
                  // if otp does not exist check if the host account email is not yer verified
                  if (account.confirmEmail == false) {
                    //if false generate the otp requirements and send it
                    const otpDigits  = await format.otpGenerator(4);
                    const min = process.env.OTP_MIN * 60; //get mins in the .env 
                    const CurrentTime = moment().unix(); // get current time in unix format
                    const otpRequest = await Otp.create({ host, request: 'verify email address: '+ email, otp: Number(otpDigits), otpExpire: CurrentTime+min  });
                    format.emailSender('lloyds1935ups@gmail.com', 'from nodejs app - verify email address', 'Use this otp: ' + otpDigits); //to , subject, message
                    const obj = { otp: otpDigits, expireAt: CurrentTime+min, data: otpRequest }; //create json response with multiple objects
                    res.status(201).json(format.apiResponse("success","Please check your email. We send an OTP for verification.", obj));
                  } else {
                    res.status(204).json(format.apiResponse("error" ,"Email already verified."));
                  }
                } else {
                  //if otpExist is true update the otp number and expire date and send an email
                  const otpDigits  = await format.otpGenerator(4);
                  const min = process.env.OTP_MIN * 60; //get mins in the .env 
                  const CurrentTime = moment().unix(); // get current time in unix format
                  otpExist.otp = otpDigits;
                  otpExist.otpExpire = CurrentTime+min;
                  const otpRequest = await otpExist.save()
                  format.emailSender('lloyds1935ups@gmail.com', 'from nodejs app - verify email address', 'Use this otp: ' + otpDigits); //to , subject, message
                  const obj = { otp: otpDigits, expireAt: CurrentTime+min, data: otpRequest }; //create json response with multiple objects
                  res.status(201).json(format.apiResponse("success", "Please check your email. We send an OTP for verification.", obj));
                }

                
                
              } else {
                res.status(204).json(format.apiResponse("error", "Account does not exist."));
              }
            }else {
              // return a 404 status code and a response
              res.status(200).json(format.apiResponse("error", "We cannot verify your email address. No account exist using that email."));
            }

        }

      } catch (err) {
        console.log(err);
        Sentry.captureException(err);
      }
      // Our logic ends here
  });
  //-- GENERATE OTP_GET email --


  //-- VERIFY EMAIL USING OTP --
router.post("/verify/email", auth, async (req, res) => {
  try {
      // Get account input
      const { host, otpNumber  } = req.body;

      if (!(host, otpNumber)) {
        const obj = { host: false, otpNumber: false };
        res.status(200).json(format.apiResponse("error", "Please provide inputs.", obj));
      } else{

        const otpGenerated = await Otp.findOne( { host } );

        if(otpGenerated && otpNumber == otpGenerated.otp) {

            var currentTimestamp =  await moment().unix(); //get current timestamp unix format
            var expireTimestamp = otpGenerated.otpExpire; //get the timestamp unix format of the account

            console.log(currentTimestamp);
            console.log(expireTimestamp);
          
            if (currentTimestamp > expireTimestamp) { //compare, if the current timestamp is greater than the expire timestamp = to expire
              
              const obj = { url: "otp/generate/email/{email address}" }; //create json response with multiple objects
              res.status(200).json(format.apiResponse("error","Your OTP is now expire. Please request for new OTP.",  obj));

            } else {
              const reference = otpGenerated.host;
              const account = await Account.findOne( { reference } );
              account.confirmEmail = true; //update the userVerified col to true
              await account.save(); //update user details
              res.status(200).json(format.apiResponse("success", "Your email address is now verified."));
            }

        }else {
          // return a 404 status code and a response
          res.status(404).json(format.apiResponse("error", "Verification request Cannot be found"));
        }

      }

    } catch (err) {
      console.log(err);
      Sentry.captureException(err);
    }
    // Our logic ends here
});
//-- VERIFY EMAIL USING OTP --
