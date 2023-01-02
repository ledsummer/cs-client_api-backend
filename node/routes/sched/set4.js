const express = require('express');
const Sentry = require('../../config/logs');
var moment = require('moment');
const format = require('../../config/global');
const objectFormat = require('../../config/objects');


//logs Sentry.infoLogMsg('Account Login fail', email);
const router = express.Router()

module.exports = router;

//call cais model
var { Afs4 } = require("../../model/cais_sched");

// importing authentication
const auth = require("../../middleware/auth");


// ============================ START OF SCHEDULE SCRIPTS ============================

// CHECK SCHEDULE ARRAY FOR NULL VALUE -- START
const checkSchedule = (reg_no, report_year, schedule_name, schedule, res, req) => {
  const modifiedScheduleName = format.removeSymbols(schedule_name);
  Afs4.findOne({
    reg_no,
    report_year,
    [schedule_name]: { $exists: true }
  },  async (err, doc) => {
    if (err) {
      // handle error
    } else if (doc && doc[schedule_name] !== null && Object.values(doc[schedule_name]).includes(null)) {
      console.log(`The ${schedule_name} object has null values`);
      Afs4.findOneAndUpdate({ reg_no, report_year }, { $set: { [schedule_name]: schedule } }, { new: true }, (err, doc1) => {
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
        const currentStatus = await Afs4.findOne({ reg_no, report_year }, { submit_status: 1 });
        if (currentStatus.submit_status === false) {
          // update the data in the database
          await Afs4.updateOne({ reg_no, report_year }, { $set: { [schedule_name]: schedule } });
      
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
      const obj = "Please submit schedule 17 to proceed";
      res.status(200).json(format.apiResponse("error", `Error in creating ${modifiedScheduleName}.`, obj));
    }
  });
}

// CHECK SCHEDULE ARRAY FOR NULL VALUE -- END


//-- SUBMIT SCHEDULE 17 START--
router.post("/sched/17", async (req, res) => {
  // Our submit capr logic starts here
  // Get capr input data
  const { reg_no, report_year, loan_pay_value, less_discount_loans_pay_value } = req.body;

  try {
    // Validate capr input
    if (!reg_no || !report_year || report_year < 2021) {
      const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
      res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
    } else {

      // create a new object with the safe numbers from the request body
      loan_pay = format.zeroHandler(loan_pay_value);
      less_discount_loans_pay = format.zeroHandler(less_discount_loans_pay_value);

      const loans_pay_net = loan_pay - less_discount_loans_pay;

      // convert the array of key-value pairs to an object with a nested structure
      const schedule_17 = {
        loan_pay,
        less_discount_loans_pay,
        loans_pay_net: Number(loans_pay_net.toFixed(2))
      }

      // check if schedule 17 already exist
      const schedule17 = await Afs4.exists({ reg_no: reg_no, report_year: report_year });

      if (schedule17) {

        const submitStatus = await Afs4.findOne({ reg_no, report_year }, { submit_status: 1 });

        if(submitStatus.submit_status === false) { //true
              // update the schedule in the database
              await Afs4.updateOne({ reg_no, report_year }, { $set: { schedule_17 }, date_submitted: new Date() });

              console.log('Schedule 17 exist, updating data.');

              res.status(200).json(format.apiResponse("success", "schedule 17 updated.", { schedule_17: schedule_17 } ));

              Sentry.infoLogMsg('CAFS Update Schedule - 17:' + reg_no + ' year:' + report_year, format.getIp(req));

        } else {
          console.log('cannot update any schedule data.');

          res.status(200).json(format.apiResponse("error", "CAFS report already submitted.", 'You cannot update any schedule data.' ));
        }

      } else {

        // save schedule in our database
        const schedule17 = await Afs4.create({ reg_no, report_year, schedule_17, date_submitted: new Date()  });

        // return new account details 
        res.status(201).json(format.apiResponse("success", "App - CAFS Schedule 17 save", schedule17));
        //send transaction logs success
        Sentry.infoLogMsg('CAFS Create Schedule - 17:' + reg_no + ' year:' + report_year, format.getIp(req));

        console.log('Schedule 17 created.');
      }

    }

  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
  }
  // Our logic ends here
});
//-- SUBMIT SCHEDULE 17 END--

//-- SUBMIT SCHEDULE 18 START--
router.post("/sched/18", async (req, res) => {
  // Our submit capr logic starts here
  // Get capr input data
  const { reg_no, report_year, bonds_pay_value, add_bond_prem_value, less_unamortized_bond_discount_value } = req.body;

  try {
    // Validate capr input
    if (!reg_no || !report_year || report_year < 2021) {
      const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
      res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
    } else {

      // create a new object with the safe numbers from the request body
      bonds_pay = format.zeroHandler(bonds_pay_value);
      add_bond_prem= format.zeroHandler(add_bond_prem_value);
      less_unamortized_bond_discount = format.zeroHandler(less_unamortized_bond_discount_value);

      const bonds_payable_net = bonds_pay + add_bond_prem - less_unamortized_bond_discount;

      // convert the array of key-value pairs to an object with a nested structure
      const schedule_18 = {
        bonds_pay,
        add_bond_prem,
        less_unamortized_bond_discount,
        bonds_payable_net: Number(bonds_payable_net.toFixed(2))
      }

      // Validate if schedule exist in our database and update data
      checkSchedule(reg_no, report_year, 'schedule_18', schedule_18, res, req);

    }

  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
  }
  // Our logic ends here
});
//-- SUBMIT SCHEDULE 18 END--

//-- SUBMIT SCHEDULE 19 START--
router.post("/sched/19", async (req, res) => {
  // Our submit capr logic starts here
  // Get capr input data
  const { reg_no, report_year, project_subsid_fund_value, member_benefit_other_fund_pay_value, due_head_office_branch_value, other_non_curr_liab_value} = req.body;

  try {
    // Validate capr input
    if (!reg_no || !report_year || report_year < 2021) {
      const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
      res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
    } else {

      // create a new object with the safe numbers from the request body
      project_subsid_fund = format.zeroHandler(project_subsid_fund_value) 
      member_benefit_other_fund_pay = format.zeroHandler(member_benefit_other_fund_pay_value); 
      due_head_office_branch = format.zeroHandler(due_head_office_branch_value) 
      other_non_curr_liab  = format.zeroHandler(other_non_curr_liab_value);

      const total_other_non_curr_liab = format.addAnything(project_subsid_fund,member_benefit_other_fund_pay,due_head_office_branch,other_non_curr_liab);

      // convert the array of key-value pairs to an object with a nested structure
      const schedule_19 = {
        project_subsid_fund, 
        member_benefit_other_fund_pay, 
        due_head_office_branch, 
        other_non_curr_liab,
        total_other_non_curr_liab: Number(total_other_non_curr_liab.toFixed(2))
      }

      // Validate if schedule exist in our database and update data
      checkSchedule(reg_no, report_year, 'schedule_19', schedule_19, res, req);

    }

  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
  }
  // Our logic ends here
});
//-- SUBMIT SCHEDULE 19 END--


  // ============================ END OF SCHEDULE SCRIPTS ============================
