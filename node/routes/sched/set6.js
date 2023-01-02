const express = require('express');
const Sentry = require('../../config/logs');
var moment = require('moment');
const format = require('../../config/global');
const objectFormat = require('../../config/objects');


//logs Sentry.infoLogMsg('Account Login fail', email);
const router = express.Router()

module.exports = router;

//call cais model
var { Afs6 } = require("../../model/cais_sched");

// importing authentication
const auth = require("../../middleware/auth");


// ============================ START OF SCHEDULE SCRIPTS ============================

// CHECK SCHEDULE ARRAY FOR NULL VALUE -- START
const checkSchedule = (reg_no, report_year, schedule_name, schedule, res, req) => {
  const modifiedScheduleName = format.removeSymbols(schedule_name);
  Afs6.findOne({
    reg_no,
    report_year,
    [schedule_name]: { $exists: true }
  },  async (err, doc) => {
    if (err) {
      // handle error
    } else if (doc && doc[schedule_name] !== null && Object.values(doc[schedule_name]).includes(null)) {
      console.log(`The ${schedule_name} object has null values`);
      Afs6.findOneAndUpdate({ reg_no, report_year }, { $set: { [schedule_name]: schedule } }, { new: true }, (err, doc1) => {
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
        const currentStatus = await Afs6.findOne({ reg_no, report_year }, { submit_status: 1 });
        if (currentStatus.submit_status === false) {
          // update the data in the database
          await Afs6.updateOne({ reg_no, report_year }, { $set: { [schedule_name]: schedule } });
      
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
      const obj = "Please submit schedule 23 to proceed";
      res.status(200).json(format.apiResponse("error", `Error in creating ${modifiedScheduleName}.`, obj));
    }
  });
}

// CHECK SCHEDULE ARRAY FOR NULL VALUE -- END


//-- SUBMIT SCHEDULE 23 START--
router.post("/sched/23", async (req, res) => {
  // Our submit capr logic starts here
  // Get capr input data
  const { reg_no, report_year, interest_income_loans_value, services_fees_value, filling_fees_value, fines_penalties_surcharges_value } = req.body;

  try {
    // Validate capr input
    if (!reg_no || !report_year || report_year < 2021) {
      const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
      res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
    } else {

      // create a new object with the safe numbers from the request body
      interest_income_loans = format.zeroHandler(interest_income_loans_value);
      services_fees = format.zeroHandler(services_fees_value);
      filling_fees = format.zeroHandler(filling_fees_value);
      fines_penalties_surcharges = format.zeroHandler(fines_penalties_surcharges_value);

      const total_income_credit_op = format.addAnything(interest_income_loans, services_fees, filling_fees, fines_penalties_surcharges );

      // convert the array of key-value pairs to an object with a nested structure
      const schedule_23 = {
        interest_income_loans,
        services_fees,
        filling_fees,
        fines_penalties_surcharges,
        total_income_credit_op: Number(total_income_credit_op.toFixed(2))
      }

      // check if schedule 17 already exist
      const schedule23 = await Afs6.exists({ reg_no: reg_no, report_year: report_year });

      if (schedule23) {

        const submitStatus = await Afs6.findOne({ reg_no, report_year }, { submit_status: 1 });

        if(submitStatus.submit_status === false) { //true
              // update the schedule in the database
              await Afs6.updateOne({ reg_no, report_year }, { $set: { schedule_23 }, date_submitted: new Date() });

              console.log('Schedule 23 exist, updating data.');

              res.status(200).json(format.apiResponse("success", "schedule 23 updated.", { schedule_23: schedule_23 } ));

              Sentry.infoLogMsg('CAFS Update Schedule - 23:' + reg_no + ' year:' + report_year, format.getIp(req));

        } else {
          console.log('cannot update any schedule data.');

          res.status(200).json(format.apiResponse("error", "CAFS report already submitted.", 'You cannot update any schedule data.' ));
        }

      } else {

        // save schedule in our database
        const schedule23 = await Afs6.create({ reg_no, report_year, schedule_23, date_submitted: new Date()  });

        // return new account details 
        res.status(201).json(format.apiResponse("success", "App - CAFS Schedule 23 save", schedule23));
        //send transaction logs success
        Sentry.infoLogMsg('CAFS Create Schedule - 23:' + reg_no + ' year:' + report_year, format.getIp(req));

        console.log('Schedule 23 created.');
      }

    }

  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
  }
  // Our logic ends here
});
//-- SUBMIT SCHEDULE 23 END--

//-- SUBMIT SCHEDULE 24 START--
router.post("/sched/24", async (req, res) => {
  // Our submit capr logic starts here
  // Get capr input data
  const { reg_no, report_year, service_income_value, interest_income_lease_agree_value, less_cost_service_value, less_operating_expenses_value } = req.body;

  try {
    // Validate capr input
    if (!reg_no || !report_year || report_year < 2021) {
      const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
      res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
    } else {

      // create a new object with the safe numbers from the request body
      service_income = format.zeroHandler(service_income_value);  
      interest_income_lease_agree = format.zeroHandler(interest_income_lease_agree_value);
      less_cost_service = format.zeroHandler(less_cost_service_value);
      less_operating_expenses = format.zeroHandler(less_operating_expenses_value);

      const total_revenues = service_income + interest_income_lease_agree;
      const gross_rev_service_op = total_revenues - less_cost_service;
      const income_service_op = gross_rev_service_op - less_operating_expenses;

      // convert the array of key-value pairs to an object with a nested structure
      const schedule_24 = {
        service_income,
        interest_income_lease_agree,
        total_revenues,
        less_cost_service,
        gross_rev_service_op,
        less_operating_expenses,
        income_service_op: Number(income_service_op.toFixed(2))
      }

      // Validate if schedule exist in our database and update data
      checkSchedule(reg_no, report_year, 'schedule_24', schedule_24, res, req);

    }

  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
  }
  // Our logic ends here
});
//-- SUBMIT SCHEDULE 24 END--


//-- SUBMIT SCHEDULE 25 START--
router.post("/sched/25", async (req, res) => {
  // Our submit capr logic starts here
  // Get capr input data
  const { reg_no, report_year, sales_value, installment_sales_value, less_sales_return_allowances_value, less_sales_discounts_value, less_cost_good_sold_value, less_operating_expenses_value } = req.body;

  try {
    // Validate capr input
    if (!reg_no || !report_year || report_year < 2021) {
      const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
      res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
    } else {

      // create a new object with the safe numbers from the request body
      sales = format.zeroHandler(sales_value);  
      installment_sales = format.zeroHandler(installment_sales_value);
      less_sales_return_allowances = format.zeroHandler(less_sales_return_allowances_value);
      less_sales_discounts = format.zeroHandler(less_sales_discounts_value);
      less_cost_good_sold = format.zeroHandler(less_cost_good_sold_value);
      less_operating_expenses = format.zeroHandler(less_operating_expenses_value);

      const net_sales = sales - less_sales_return_allowances - less_sales_discounts + installment_sales;
      const less_gross_margin_market_op = net_sales - less_cost_good_sold;
      const less_income_marketing_op = less_gross_margin_market_op - less_operating_expenses;

      // convert the array of key-value pairs to an object with a nested structure
      const schedule_25 = {
        sales,
        installment_sales,
        less_sales_return_allowances,
        less_sales_discounts,
        net_sales,
        less_cost_good_sold,
        less_gross_margin_market_op,
        less_operating_expenses,
        less_income_marketing_op: Number(less_income_marketing_op.toFixed(2))
      }

      // Validate if schedule exist in our database and update data
      checkSchedule(reg_no, report_year, 'schedule_25', schedule_25, res, req);

    }

  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
  }
  // Our logic ends here
});
//-- SUBMIT SCHEDULE 25 END--


//-- SUBMIT SCHEDULE 26 START--
router.post("/sched/26", async (req, res) => {
  // Our submit capr logic starts here
  // Get capr input data
  const { reg_no, report_year, sales_value, less_sales_return_allowances_value, less_sales_discount_value, less_cost_good_sold_value, less_operating_expenses_value } = req.body;

  try {
    // Validate capr input
    if (!reg_no || !report_year || report_year < 2021) {
      const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
      res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
    } else {

      // create a new object with the safe numbers from the request body
      sales = format.zeroHandler(sales_value);
      less_sales_return_allowances = format.zeroHandler(less_sales_return_allowances_value);
      less_sales_discount = format.zeroHandler(less_sales_discount_value);
      less_cost_good_sold = format.zeroHandler(less_cost_good_sold_value);
      less_operating_expenses = format.zeroHandler(less_operating_expenses_value);

      const net_sales = sales - less_sales_return_allowances - less_sales_discount;
      const less_gross_margin_consum_catering_op = net_sales - less_cost_good_sold;
      const less_income_consum_catering_op = less_gross_margin_consum_catering_op - less_operating_expenses;

      // convert the array of key-value pairs to an object with a nested structure
      const schedule_26 = {
        sales,
        less_sales_return_allowances,
        less_sales_discount,
        net_sales,
        less_cost_good_sold,
        less_gross_margin_consum_catering_op,
        less_operating_expenses,
        less_income_consum_catering_op: Number(less_income_consum_catering_op.toFixed(2))
      }

      // Validate if schedule exist in our database and update data
      checkSchedule(reg_no, report_year, 'schedule_26', schedule_26, res, req);

    }

  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
  }
  // Our logic ends here
});
//-- SUBMIT SCHEDULE 26 END--

//-- SUBMIT SCHEDULE 27 START--
router.post("/sched/27", async (req, res) => {
  // Our submit capr logic starts here
  // Get capr input data
  const { reg_no, report_year, sales_value, less_sales_return_allowances_value, less_sales_discount_value, less_cost_good_sold_value, less_operating_expenses_value } = req.body;

  try {
    // Validate capr input
    if (!reg_no || !report_year || report_year < 2021) {
      const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
      res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
    } else {

      // create a new object with the safe numbers from the request body
      sales = format.zeroHandler(sales_value);
      less_sales_return_allowances = format.zeroHandler(less_sales_return_allowances_value);
      less_sales_discount = format.zeroHandler(less_sales_discount_value);
      less_cost_good_sold = format.zeroHandler(less_cost_good_sold_value);
      less_operating_expenses = format.zeroHandler(less_operating_expenses_value);

      const net_sales = sales - less_sales_return_allowances - less_sales_discount;
      const less_gross_margin_production_op = net_sales - less_cost_good_sold;
      const less_income_production_op = less_gross_margin_production_op - less_operating_expenses;

      // convert the array of key-value pairs to an object with a nested structure
      const schedule_27 = {
        sales,
        less_sales_return_allowances,
        less_sales_discount,
        net_sales,
        less_cost_good_sold,
        less_gross_margin_production_op,
        less_operating_expenses,
        less_income_production_op: Number(less_income_production_op.toFixed(2))
      }

      // Validate if schedule exist in our database and update data
      checkSchedule(reg_no, report_year, 'schedule_27', schedule_27, res, req);

    }

  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
  }
  // Our logic ends here
});
//-- SUBMIT SCHEDULE 27 END--

//-- SUBMIT SCHEDULE 28 START--
router.post("/sched/28", async (req, res) => {
  // Our submit capr logic starts here
  // Get capr input data
  const { reg_no, report_year, income_interest_invest_deposits_value,
    membership_fee_value,
    commission_income_value,
    realized_gross_margin_value,
    misc_income_value } = req.body;

  try {
    // Validate capr input
    if (!reg_no || !report_year || report_year < 2021) {
      const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
      res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
    } else {

      // create a new object with the safe numbers from the request body
      income_interest_invest_deposits = format.zeroHandler(income_interest_invest_deposits_value);
      membership_fee = format.zeroHandler(membership_fee_value);
      commission_income = format.zeroHandler(commission_income_value);
      realized_gross_margin = format.zeroHandler(realized_gross_margin_value);
      misc_income = format.zeroHandler(misc_income_value);

      const total_other_income = income_interest_invest_deposits + membership_fee + commission_income + realized_gross_margin + misc_income;
     
      // convert the array of key-value pairs to an object with a nested structure
      const schedule_28 = {
        income_interest_invest_deposits,
        membership_fee,
        commission_income,
        realized_gross_margin,
        misc_income,
        total_other_income: Number(total_other_income.toFixed(2))
      }

      // Validate if schedule exist in our database and update data
      checkSchedule(reg_no, report_year, 'schedule_28', schedule_28, res, req);

    }

  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
  }
  // Our logic ends here
});
//-- SUBMIT SCHEDULE 28 END--


  // ============================ END OF SCHEDULE SCRIPTS ============================
