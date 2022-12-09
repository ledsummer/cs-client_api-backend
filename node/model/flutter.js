const { Decimal128 } = require("mongodb");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const moment = require('moment');

const flutterAccountSchema = new mongoose.Schema({
    host: String,
    accountCode: String,
    first_name: { type: String, default: null },
    last_name: { type: String, default: null },
    email: { type: String, unique: true },
    confirmEmail: Boolean, 
    transaction:  {
        type: Schema.Types.ObjectId,
        ref: "transaction"
      }
});
const account = mongoose.model("account", flutterAccountSchema);

const flutterTransactionSchema = new mongoose.Schema({
    accountCode: String,
    product: String,
    purchaseAmount: Number,
    datePurchase: { type: Date, default: () => moment().toDate() }, 
    branch: String,  
    pointsEarned: Number, 
});
const transaction = mongoose.model("transaction", flutterTransactionSchema);

const otpTransactionSchema = new mongoose.Schema({
    host: String,
    request: String,
    otp: Number,
    otpExpire: Number, 
    dateRequest: { type: Date, default: () => moment().toDate() }, 
});
const otp = mongoose.model("otpRequest", otpTransactionSchema);

module.exports = { Account: account, Transaction: transaction, Otp: otp  }