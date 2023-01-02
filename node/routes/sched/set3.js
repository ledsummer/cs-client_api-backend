const express = require('express');
const Sentry = require('../../config/logs');
var moment = require('moment');
const format = require('../../config/global');
const objectFormat = require('../../config/objects');


//logs Sentry.infoLogMsg('Account Login fail', email);
const router = express.Router()

module.exports = router;

//call cais model
var { Afs3 } = require("../../model/cais_sched");

// importing authentication
const auth = require("../../middleware/auth");


// ============================ START OF SCHEDULE SCRIPTS ============================

// CHECK SCHEDULE ARRAY FOR NULL VALUE -- START
const checkSchedule = (reg_no, report_year, schedule_name, schedule, res, req) => {
  const modifiedScheduleName = format.removeSymbols(schedule_name);
  Afs3.findOne({
    reg_no,
    report_year,
    [schedule_name]: { $exists: true }
  },  async (err, doc) => {
    if (err) {
      // handle error
    } else if (doc && doc[schedule_name] !== null && Object.values(doc[schedule_name]).includes(null)) {
      console.log(`The ${schedule_name} object has null values`);
      Afs3.findOneAndUpdate({ reg_no, report_year }, { $set: { [schedule_name]: schedule } }, { new: true }, (err, doc1) => {
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
        const currentStatus = await Afs3.findOne({ reg_no, report_year }, { submit_status: 1 });
        if (currentStatus.submit_status === false) {
          // update the data in the database
          await Afs3.updateOne({ reg_no, report_year }, { $set: { [schedule_name]: schedule } });
      
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
      const obj = "Please submit schedule 13 to proceed";
      res.status(200).json(format.apiResponse("error", `Error in creating ${modifiedScheduleName}.`, obj));
    }
  });
}

// CHECK SCHEDULE ARRAY FOR NULL VALUE -- END


//-- SUBMIT SCHEDULE 6 START--
router.post("/sched/13", async (req, res) => {
  // Our submit capr logic starts here
  // Get capr input data
  const { reg_no, report_year, saving_depost, time_depost } = req.body;

  try {
    // Validate capr input
    if (!reg_no || !report_year || report_year < 2021) {
      const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
      res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
    } else {

      // create a new object with the safe numbers from the request body
      const safeNumbers = {
        saving_depost: format.zeroHandler(saving_depost),
        time_depost: format.zeroHandler(time_depost),
      };

      const total_deposit_liab = format.addAnything(safeNumbers.saving_depost, safeNumbers.time_depost);

      // convert the array of key-value pairs to an object with a nested structure
      const schedule_13 = {
        saving_depost: safeNumbers.saving_depost,
        time_depost: safeNumbers.time_depost,
        total_deposit_liab: Number(total_deposit_liab.toFixed(2))
      }

      // check if schedule 13 already exist
      const schedule13 = await Afs3.exists({ reg_no: reg_no, report_year: report_year });

      if (schedule13) {

        const submitStatus = await Afs3.findOne({ reg_no, report_year }, { submit_status: 1 });

        if(submitStatus.submit_status === false) { //true
              // update the schedule in the database
              await Afs3.updateOne({ reg_no, report_year }, { $set: { schedule_13 }, date_submitted: new Date() });

              console.log('Schedule 13 exist, updating data.');

              res.status(200).json(format.apiResponse("success", "schedule 1 updated.", { schedule_13: schedule_13 } ));

              Sentry.infoLogMsg('CAFS Update Schedule - 13:' + reg_no + ' year:' + report_year, format.getIp(req));

        } else {
          console.log('cannot update any schedule data.');

          res.status(200).json(format.apiResponse("error", "CAFS report already submitted.", 'You cannot update any schedule data.' ));
        }

      } else {

        // save schedule in our database
        const schedule13 = await Afs3.create({ reg_no, report_year, schedule_13, date_submitted: new Date()  });

        // return new account details 
        res.status(201).json(format.apiResponse("success", "App - CAFS Schedule 13 save", schedule13));
        //send transaction logs success
        Sentry.infoLogMsg('CAFS Create Schedule - 13:' + reg_no + ' year:' + report_year, format.getIp(req));

        console.log('Schedule 13 created.');
      }

    }

  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
  }
  // Our logic ends here
});
//-- SUBMIT SCHEDULE 13 END--

//-- SUBMIT SCHEDULE 14 START--
router.post("/sched/14", async (req, res) => {
  // Our submit capr logic starts here
  // Get capr input data
  const { reg_no, report_year, accounts_trade, accounts_non_trade, loans_pay_current, finance_lease_pay_current, due_deploy_members, cash_bond_payable, other_payable } = req.body;

  try {
    // Validate capr input
    if (!reg_no || !report_year || report_year < 2021) {
      const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
      res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
    } else {

      // create a new object with the safe numbers from the request body
      const safeNumbers = {
        accounts_trade: format.zeroHandler(accounts_trade),
        accounts_non_trade: format.zeroHandler(accounts_non_trade),
        loans_pay_current: format.zeroHandler(loans_pay_current),
        finance_lease_pay_current: format.zeroHandler(finance_lease_pay_current),
        due_deploy_members: format.zeroHandler(due_deploy_members),
        cash_bond_payable: format.zeroHandler(cash_bond_payable),
        other_payable: format.zeroHandler(other_payable),
      };

      const total_account_other_payables = format.addAnything(safeNumbers.accounts_trade, safeNumbers.accounts_non_trade, safeNumbers.loans_pay_current, safeNumbers.finance_lease_pay_current, safeNumbers.due_deploy_members, safeNumbers.cash_bond_payable, safeNumbers.other_payable);

      // convert the array of key-value pairs to an object with a nested structure
      const schedule_14 = {
        accounts_trade: safeNumbers.accounts_trade,
        accounts_non_trade: safeNumbers.accounts_non_trade,
        loans_pay_current:  safeNumbers.loans_pay_current,
        finance_lease_pay_current: safeNumbers.finance_lease_pay_current,
        due_deploy_members: safeNumbers.due_deploy_members,
        cash_bond_payable:  safeNumbers.cash_bond_payable,
        other_payable:  safeNumbers.other_payable,
        total_account_other_payables: Number(total_account_other_payables.toFixed(2))
      }

      // Validate if schedule exist in our database and update data
      checkSchedule(reg_no, report_year, 'schedule_14', schedule_14, res, req);

    }

  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
  }
  // Our logic ends here
});
//-- SUBMIT SCHEDULE 14 END--

//-- SUBMIT SCHEDULE 15 START--
router.post("/sched/15", async (req, res) => {
  // Our submit capr logic starts here
  // Get capr input data
  const { reg_no, report_year, due_regulatory_agency,
    ss_ecc_phil_pagibig_contri, 
    sss_pagibig_loans_pay, 
    withholding_tax_pay, 
    output_tax, 
    vat_pay, 
    income_tax_pay, 
    other_accrued_expenses
  } = req.body;

  try {
    // Validate capr input
    if (!reg_no || !report_year || report_year < 2021) {
      const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
      res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
    } else {

      // create a new object with the safe numbers from the request body
      const safeNumbers = {
        due_regulatory_agency: format.zeroHandler(due_regulatory_agency),
        ss_ecc_phil_pagibig_contri: format.zeroHandler(ss_ecc_phil_pagibig_contri), 
        sss_pagibig_loans_pay: format.zeroHandler(sss_pagibig_loans_pay), 
        withholding_tax_pay: format.zeroHandler(withholding_tax_pay), 
        output_tax: format.zeroHandler(output_tax), 
        vat_pay: format.zeroHandler(vat_pay), 
        income_tax_pay: format.zeroHandler(income_tax_pay), 
        other_accrued_expenses: format.zeroHandler(other_accrued_expenses)
      };

      const total_accrued_expenses = format.addAnything(safeNumbers.due_regulatory_agency, safeNumbers.ss_ecc_phil_pagibig_contri, safeNumbers.sss_pagibig_loans_pay, safeNumbers.withholding_tax_pay, safeNumbers.output_tax, safeNumbers.vat_pay, safeNumbers.income_tax_pay, safeNumbers.other_accrued_expenses);

      // convert the array of key-value pairs to an object with a nested structure
      const schedule_15 = {
        due_regulatory_agency: safeNumbers.due_regulatory_agency,
        ss_ecc_phil_pagibig_contri: safeNumbers.ss_ecc_phil_pagibig_contri, 
        sss_pagibig_loans_pay: safeNumbers.sss_pagibig_loans_pay, 
        withholding_tax_pay: safeNumbers.withholding_tax_pay, 
        output_tax: safeNumbers.output_tax, 
        vat_pay: safeNumbers.vat_pay, 
        income_tax_pay: safeNumbers.income_tax_pay, 
        other_accrued_expenses: safeNumbers.other_accrued_expenses,
        total_accrued_expenses: Number(total_accrued_expenses.toFixed(2))
      }

      // Validate if schedule exist in our database and update data
      checkSchedule(reg_no, report_year, 'schedule_15', schedule_15, res, req);

    }

  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
  }
  // Our logic ends here
});
//-- SUBMIT SCHEDULE 15 END--



//-- SUBMIT SCHEDULE 16 START--
router.post("/sched/16", async (req, res) => {
  // Our submit capr logic starts here
  // Get capr input data
  const { reg_no, report_year, 
    deposit_customer_value,
    advances_customer_value, 
    school_program_support_fund_pay_value, 
    intereset_share_capital_pay_value, 
    patronage_refund_payable_value,
    due_union_fed_cetf_value, 
    other_current_liab_value
  } = req.body;

  try {
    // Validate capr input
    if (!reg_no || !report_year || report_year < 2021) {
      const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
      res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
    } else {

      // create a new object with the safe numbers from the request body
        deposit_customer = format.zeroHandler(deposit_customer_value);
        advances_customer = format.zeroHandler(advances_customer_value);
        school_program_support_fund_pay = format.zeroHandler(school_program_support_fund_pay_value);
        intereset_share_capital_pay = format.zeroHandler(intereset_share_capital_pay_value);
        patronage_refund_payable = format.zeroHandler(patronage_refund_payable_value);
        due_union_fed_cetf = format.zeroHandler(due_union_fed_cetf_value);
        other_current_liab = format.zeroHandler(other_current_liab_value);

      const total_other_current_liab = format.addAnything(deposit_customer,advances_customer,school_program_support_fund_pay, patronage_refund_payable,intereset_share_capital_pay,due_union_fed_cetf,other_current_liab);

      // convert the array of key-value pairs to an object with a nested structure
      const schedule_16 = {
        deposit_customer,
        advances_customer, 
        school_program_support_fund_pay, 
        intereset_share_capital_pay,
        patronage_refund_payable, 
        due_union_fed_cetf, 
        other_current_liab,
        total_other_current_liab: Number(total_other_current_liab.toFixed(2))
      }

      // Validate if schedule exist in our database and update data
      checkSchedule(reg_no, report_year, 'schedule_16', schedule_16, res, req);

    }

  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
  }
  // Our logic ends here
});
//-- SUBMIT SCHEDULE 16 END--

  // ============================ END OF SCHEDULE SCRIPTS ============================
