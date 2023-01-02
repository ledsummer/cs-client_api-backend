const express = require('express');
const Sentry = require('../../config/logs');
var moment = require('moment');
const format = require('../../config/global');
const objectFormat = require('../../config/objects');


//logs Sentry.infoLogMsg('Account Login fail', email);
const router = express.Router()

module.exports = router;

//call cais model
var { Afs5 } = require("../../model/cais_sched");

// importing authentication
const auth = require("../../middleware/auth");


// ============================ START OF SCHEDULE SCRIPTS ============================

// CHECK SCHEDULE ARRAY FOR NULL VALUE -- START
const checkSchedule = (reg_no, report_year, schedule_name, schedule, res, req) => {
  const modifiedScheduleName = format.removeSymbols(schedule_name);
  Afs5.findOne({
    reg_no,
    report_year,
    [schedule_name]: { $exists: true }
  },  async (err, doc) => {
    if (err) {
      // handle error
    } else if (doc && doc[schedule_name] !== null && Object.values(doc[schedule_name]).includes(null)) {
      console.log(`The ${schedule_name} object has null values`);
      Afs5.findOneAndUpdate({ reg_no, report_year }, { $set: { [schedule_name]: schedule } }, { new: true }, (err, doc1) => {
        if (err) {
          console.log(err);
        } else {
          console.log(`The ${schedule_name} successfully created`);
          res.status(201).json(format.apiResponse("success", `App - CAFS ${modifiedScheduleName} save`, doc1));
          Sentry.infoLogMsg(`CAFS Create Schedule - ${schedule_name}:` + reg_no + ' year:' + report_year, format.getIp(req));
        }
      });
    } else if (doc && doc[schedule_name] !== null) {
      console.log(`Updating the ${schedule_name} object`);
      try {
        // check if submit_status is false
        const currentStatus = await Afs5.findOne({ reg_no, report_year }, { submit_status: 1 });
        if (currentStatus.submit_status === false) {
          // update the data in the database
          await Afs5.updateOne({ reg_no, report_year }, { $set: { [schedule_name]: schedule } });
      
          console.log(`The ${schedule_name} was successfully updated`);
          res.status(200).json(format.apiResponse("success", `CAFS: ${modifiedScheduleName} updated`, { [schedule_name]: schedule }));
          Sentry.infoLogMsg(`CAFS Update Schedule - ${schedule_name}:` + reg_no + ' year:' + report_year, format.getIp(req));
        } else {
          console.log('cannot update any schedule data.');
          res.status(400).json(format.apiResponse("error", "Cannot update schedule. CAFS already generated"));
        }
      } catch (error) {
        console.error(error);
        res.status(500).json(format.errorResponse(error));
      }
    } else {
      console.log('None of the schedules are not null');
      const obj = "Please submit schedule 20 to proceed";
      res.status(200).json(format.apiResponse("error", `Error in creating ${modifiedScheduleName}.`, obj));
    }
  });
}

// CHECK SCHEDULE ARRAY FOR NULL VALUE -- END


//-- SUBMIT SCHEDULE 20 START--
router.post("/sched/20", async (req, res) => {
  // Our submit capr logic starts here
  // Get capr input data
  const { reg_no, report_year, authorized_share_common_value, par_value_per_share_value, subscribed_common_value, paid_up_common_value, treasury_common_value } = req.body;

  try {
    // Validate capr input
    if (!reg_no || !report_year || report_year < 2021) {
      const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
      res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
    } else {

      // create a new object with the safe numbers from the request body
      authorized_share_common = format.zeroHandler(authorized_share_common_value);
      par_value_per_share = format.zeroHandler(par_value_per_share_value);
      subscribed_common = format.zeroHandler(subscribed_common_value);
      paid_up_common = format.zeroHandler(paid_up_common_value);
      treasury_common = format.zeroHandler(treasury_common_value);

      const total_paid_up_common = paid_up_common - treasury_common;

      // convert the array of key-value pairs to an object with a nested structure
      const schedule_20 = {
        authorized_share_common,
        par_value_per_share,
        subscribed_common,
        paid_up_common,
        treasury_common,
        total_paid_up_common: Number(total_paid_up_common.toFixed(2))
      }

      // check if schedule 17 already exist
      const schedule20 = await Afs5.exists({ reg_no: reg_no, report_year: report_year });

      if (schedule20) {

        const submitStatus = await Afs5.findOne({ reg_no, report_year }, { submit_status: 1 });

        if(submitStatus.submit_status === false) { //true
              // update the schedule in the database
              await Afs5.updateOne({ reg_no, report_year }, { $set: { schedule_20 }, date_submitted: new Date() });

              console.log('Schedule 20 exist, updating data.');

              res.status(200).json(format.apiResponse("success", "schedule 20 updated.", { schedule_20: schedule_20 } ));

              Sentry.infoLogMsg('CAFS Update Schedule - 20:' + reg_no + ' year:' + report_year, format.getIp(req));

        } else {
          console.log('cannot update any schedule data.');

          res.status(200).json(format.apiResponse("error", "CAFS report already submitted.", 'You cannot update any schedule data.' ));
        }

      } else {

        // save schedule in our database
        const schedule20 = await Afs5.create({ reg_no, report_year, schedule_20, date_submitted: new Date()  });

        // return new account details 
        res.status(201).json(format.apiResponse("success", "App - CAFS Schedule 20 save", schedule20));
        //send transaction logs success
        Sentry.infoLogMsg('CAFS Create Schedule - 20:' + reg_no + ' year:' + report_year, format.getIp(req));

        console.log('Schedule 20 created.');
      }

    }

  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
  }
  // Our logic ends here
});
//-- SUBMIT SCHEDULE 20 END--

//-- SUBMIT SCHEDULE 21 START--
router.post("/sched/21", async (req, res) => {
  // Our submit capr logic starts here
  // Get capr input data
  const { reg_no, report_year, authorized_share_pref_value, par_value_per_pref_value, subscribed_pref_value, paid_up_pref_value, treasury_pref_value } = req.body;

  try {
    // Validate capr input
    if (!reg_no || !report_year || report_year < 2021) {
      const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
      res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
    } else {

      // create a new object with the safe numbers from the request body
      authorized_share_pref = format.zeroHandler(authorized_share_pref_value);  
      par_value_per_pref = format.zeroHandler(par_value_per_pref_value);
      subscribed_pref = format.zeroHandler(subscribed_pref_value);
      paid_up_pref = format.zeroHandler(paid_up_pref_value);
      treasury_pref = format.zeroHandler(treasury_pref_value);

      const total_paid_up_pref = paid_up_pref - treasury_pref;

      // convert the array of key-value pairs to an object with a nested structure
      const schedule_21 = {
        authorized_share_pref,
        par_value_per_pref,
        subscribed_pref,
        paid_up_pref,
        treasury_pref,
        total_paid_up_pref: Number(total_paid_up_pref.toFixed(2))
      }

      // Validate if schedule exist in our database and update data
      checkSchedule(reg_no, report_year, 'schedule_21', schedule_21, res, req);

    }

  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
  }
  // Our logic ends here
});
//-- SUBMIT SCHEDULE 21 END--

//-- SUBMIT SCHEDULE 22 START--
router.post("/sched/22", async (req, res) => {
  // Our submit capr logic starts here
  // Get capr input data
  const { reg_no, report_year, reserve_fund_value, coop_educ_train_fund_value, commun_dev_fund_value, optional_fund_value } = req.body;

  try {
    // Validate capr input
    if (!reg_no || !report_year || report_year < 2021) {
      const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
      res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
    } else {

      const reserve_fund = objectFormat.calculateSched22(reserve_fund_value);
      const coop_educ_train_fund = objectFormat.calculateSched22(coop_educ_train_fund_value);
      const commun_dev_fund = objectFormat.calculateSched22(commun_dev_fund_value);
      const optional_fund = objectFormat.calculateSched22(optional_fund_value);

      const valueVariables = [ reserve_fund, coop_educ_train_fund, commun_dev_fund, optional_fund ];

      const total_statutory_fund = {
        balance_beg: 0,
        current_year_alloc: 0,
        total: 0,
        current_year_util: 0,
        balance_end: 0,
      };

      for (const value of valueVariables) {
        total_statutory_fund.balance_beg += value.balance_beg;
        total_statutory_fund.current_year_alloc += value.current_year_alloc;
        total_statutory_fund.total += value.total;
        total_statutory_fund.current_year_util += value.current_year_util;
        total_statutory_fund.balance_end += value.balance_end;
      }
      
      const schedule_22 = {
        reserve_fund, coop_educ_train_fund, commun_dev_fund, optional_fund, total_statutory_fund 
      };

      // Validate if schedule exist in our database
      checkSchedule(reg_no, report_year, 'schedule_22', schedule_22, res, req);

    }

  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
  }
  // Our logic ends here
});
//-- SUBMIT SCHEDULE 22 END--

  // ============================ END OF SCHEDULE SCRIPTS ============================
