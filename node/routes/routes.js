const express = require('express');
const Sentry = require('../config/logs');
const axios = require('axios'); // for api calls
var moment = require('moment');


const router = express.Router()

module.exports = router;

//call user model
const User  = require("../model/user");

// importing dependencies
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
const format = require('../config/global');

// Register
router.post("/register", async (req, res) => {

    // Our register logic starts here
    try {

      // Get user input
      const { first_name, last_name, email, mobile, password } = req.body;
  
      // Validate user input
      if (!(email && password && first_name && last_name && mobile)) {
        const obj = { email: false, password: false, first_name: false, last_name: false } //response object
        res.status(201).json(format.apiResponse('error', 'Invalid input', obj))
      } else {
        // check if user already exist
        // Validate if user exist in our database
        const oldUserEmail = await User.findOne({ email });
        const oldUserMobile = await User.findOne({ mobile });
    
        if (oldUserEmail || oldUserMobile) {
          res.status(200).json(format.apiResponse("error", 'Account already exist', obj));
        } else {

          //Encrypt user password
          encryptedPassword = await bcrypt.hash(password, 10);
          // which stores all digits
          const otpDigits  = await format.otpGenerator(4);
          const min = +process.env.OTP_MIN * 60; //get mins in the .env 
          const CurrentTime = moment().unix(); // get current time in unix format
      
          // Create user in our database
          const user = await User.create({
            first_name: await format.formatName(first_name), // sanitize: format first name
            last_name: await format.formatName(last_name), // sanitize: format last name
            email: email.toLowerCase(), // sanitize: convert email to lowercase
            mobile,
            password: encryptedPassword,
            otp: Number(otpDigits), // generate otp
            otpExpire: CurrentTime+min, // add min to current timestamp
            userVerified: false, 
          });
      
          // Create token
          const token = jwt.sign(
            { user_id: user._id, email },
            process.env.TOKEN_KEY,
            {
              expiresIn: process.env.EXPIRES_IN,
            }
          );
          // save user token
          user.token = token;

          //send transaction logs
          Sentry.infoLogMsg('Account Registration', email);
      
          // return new user
          res.status(201).json(user);
        }
    
       
      }
  
      
    } catch (err) {
      console.log(err);
      Sentry.captureException(err);
    }
    // Our register logic ends here
  });

// Register - onboard flutter app
router.post("/onboard", async (req, res) => {

  // Our register logic starts here
  try {

    // Get user input
    const { mobile } = req.body;

    // Validate user input
    if (!(mobile)) {
      const obj = { mobile: 'Must be a number and not must be greater or less than 10' } //response object
      res.status(201).json(format.apiResponse('error', 'Invalid input', obj))
    } else {
      // check if user already exist
      // Validate if user exist in our database
      const oldUserMobile = await User.findOne({ mobile:mobile });
  
      if (oldUserMobile) {
        const obj = { mobile: mobile } //response object
        res.status(200).json(format.apiResponse("error", 'Account already exist. Login now', obj));
      } else {
        //Encrypt user password
        const password = format.passwordGenerator(5);
        encryptedPassword = await bcrypt.hash(password, 10);
        // which stores all digits
        const otpDigits  = await format.otpGenerator(4);
        const min = +process.env.OTP_MIN * 60; //get mins in the .env 
        const CurrentTime = moment().unix(); // get current time in unix format
    
        // Create user in our database
        const user = await User.create({
          mobile,
          password: encryptedPassword,
          otp: Number(otpDigits), // generate otp
          otpExpire: CurrentTime+min, // add min to current timestamp
          userVerified: false, 
        });
    
        // Create token
        const token = jwt.sign(
          { user_id: user._id, mobile },
          process.env.TOKEN_KEY,
          {
            expiresIn: process.env.EXPIRES_IN,
          }
        );
        // save user token
        user.token = token;

        //send email
        format.emailSender('lloyds1935ups@gmail.com', 'from nodejs app - onboarding', 'Use this otp: ' + otpDigits + '\npassword: ' + password + '\nmobile number: ' + mobile);
        // return new user
        res.status(200).json(format.apiResponse("success", 'On boarding successfull', user));

         //send transaction logs
         Sentry.infoLogMsg('On Boarding Successfull: ', mobile);
      }

  
     
    }

    
  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
  }
  // Register - onboard flutter app
});  

  // Login
router.post("/login", async (req, res) => {

    // Our login logic starts here
    try {
      // Get user input
      const { mobile, password } = req.body;

      // Validate user input
      if (!(mobile && password)) {
        const obj = { mobile: 'empty', password: 'empty' };
        res.status(200).json(format.apiResponse("error", 'All input required', obj));
      } else {
          // Validate if user exist in our database
          const user = await User.findOne({ mobile });
          
          if (user) {
            //Validate if password exist
            const pass = await bcrypt.compare(password, user.password);
            if (pass) {
              
              if (user.userVerified == false) {
                const obj = { mobile: mobile, password: true, userVerified: false }
                res.status(201).json(format.apiResponse('error', 'Redirect to verify OTP', obj))
              } else {
                // Create token
                const token = jwt.sign(
                  { user_id: user._id, mobile },
                  process.env.TOKEN_KEY,
                  {
                    expiresIn: process.env.EXPIRES_IN,
                  }
                );
          
                // save user token
                user.token = token;
          
                // user
                res.status(200).json(format.apiResponse('success', 'Login Successful', user));

                //send transaction logs success
                Sentry.infoLogMsg('Account Login Success:', mobile);
              }
              
            }else{
              const obj = { mobile: true, password: false }
              res.status(201).json(format.apiResponse('error', 'Incorrect Credentials', obj))
            } 

          } else {
            Sentry.infoLogMsg('Account Login fail', mobile);
            const obj = { mobile: false, password: false }
            res.status(202).json(format.apiResponse('error', 'Incorrect Credentials', obj))
          }
      }
   
    } catch (err) {
      console.log(err);
      Sentry.captureException(err);
    }
    // Our register logic ends here
  });


  //testing part

  router.get("/test", async (req, res) => {

      try {
       const pass = format.passwordGenerator(5);
       res.status(202).json(format.apiResponse('error', 'Incorrect Credentials', pass))
      } catch (err) {
        console.log(err);
      }
  });
