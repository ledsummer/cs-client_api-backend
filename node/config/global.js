const axios = require('axios'); // for api calls
const nodemailer = require('nodemailer');


//format name to standard
module.exports.formatName =  function capitalizeName(name) {
   return name.replace(/\b(\w)/g, s => s.toUpperCase());
 }


//format currency to standard
module.exports.formatToCurrencyPHP =  function formatCurrency(amount) {
   const formatted = amount.toFixed(2).replace(/(\d)(?=(\d{3})+\b)/g, '$1,');
   return 'PHP '+formatted;
 }

 //convert peso currency to dollar
module.exports.formatToCurrencyUSD =  function ConvertCurrency(amount) {
   
      return axios({
         method: 'get',
         url: 'https://api.exchangerate.host/convert?from=PHP&to=USD',
         responseType: 'json'
       })
         .then(function (response) {
            const obj = response.data.info;
            const rate = Object.values(obj);
            const usd = rate*amount;
            console.log('conversion rate: '+rate);
            console.log('converted amount: '+usd);
            const formatted = usd.toFixed(2).replace(/(\d)(?=(\d{3})+\b)/g, '$1,');
            return 'USD '+formatted;

         });

 }


 // generate OTP
 module.exports.otpGenerator = function generateOTP(n) {
   // Declare a digits variable 
   const digits = '0123456789';
   let OTP = '';
   for (let i = 0; i < n; i++ ) {
       OTP += digits[Math.floor(Math.random() * 10)];
   }
   return OTP;
 }

 module.exports.passwordGenerator = function password(n) {
    return Math.random().toString(36).substr(2, n); //;
 }


 //create a json response
 module.exports.apiResponse = function response(status, msg, obj) {
  const response = []; //error, success
  response.push( { status: status, message:msg, data: obj } );
  return response[0];
 }

 module.exports.emailSender = function email(to, sub, msg) {
  let mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'crisrendoque@gmail.com',
        pass: 'aduhyrlbvtrnlfwm'
    }
  });

  let mailDetails = {
    from: 'crisrendoque@gmail.com',
    to: to,
    subject: sub,
    text: msg
  };
  
  mailTransporter.sendMail(mailDetails, function(err, data) {
      if(err) {
          console.log('error' + err);
      } else {
          console.log('Email sent successfully');
      }
  });
 }
