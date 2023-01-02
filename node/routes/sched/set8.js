const express = require('express');
const Sentry = require('../../config/logs');
var moment = require('moment');
const format = require('../../config/global');
const objectFormat = require('../../config/objects');


//logs Sentry.infoLogMsg('Account Login fail', email);
const router = express.Router()

module.exports = router;

//call cais model
var { Afs8 } = require("../../model/cais_sched");

// importing authentication
const auth = require("../../middleware/auth");


// ============================ START OF SCHEDULE SCRIPTS ============================

//-- SUBMIT SCHEDULE 32 START--
router.post("/sched/32", async (req, res) => {
  // Our submit capr logic starts here
  // Get capr input data
  const { reg_no, report_year,
    project_subsidy_value,
    donation_grand_subsidy_value,
    optional_fund_sb_value,
    gains_sale_proeprty_equipment_value,
    gains_investment_value,
    gains_sale_repossessed_item_value,
    gains_foreign_exchange_valuation_value,
    subsidized_project_expense_value,
    losses_sale_property_equip_value,
    losses_investment_value,
    losses_sale_repossessed_item_value,
    losses_foreign_exchange_valuation_value,
    prior_year_adjustment_value,
   } = req.body;

  try {
    // Validate capr input
    if (!reg_no || !report_year || report_year < 2021) {
      const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
      res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
    } else {

      // create a new object with the safe numbers from the request body
        project_subsidy = format.zeroHandler(project_subsidy_value);
        donation_grand_subsidy = format.zeroHandler(donation_grand_subsidy_value);
        optional_fund_sb = format.zeroHandler(optional_fund_sb_value);
        gains_sale_proeprty_equipment = format.zeroHandler(gains_sale_proeprty_equipment_value);
        gains_investment = format.zeroHandler(gains_investment_value);
        gains_sale_repossessed_item = format.zeroHandler(gains_sale_repossessed_item_value);
        gains_foreign_exchange_valuation = format.zeroHandler(gains_foreign_exchange_valuation_value);
        subsidized_project_expense = format.zeroHandler(subsidized_project_expense_value);
        losses_sale_property_equip = format.zeroHandler(losses_sale_property_equip_value);
        losses_investment = format.zeroHandler(losses_investment_value);
        losses_sale_repossessed_item = format.zeroHandler(losses_sale_repossessed_item_value);
        losses_foreign_exchange_valuation = format.zeroHandler(losses_foreign_exchange_valuation_value);
        prior_year_adjustment = format.zeroHandler(prior_year_adjustment_value);

      const sum1 = format.addAnything(project_subsidy, donation_grand_subsidy, optional_fund_sb, gains_sale_proeprty_equipment, gains_investment, gains_sale_repossessed_item, gains_foreign_exchange_valuation,)
      const sum2 = format.addAnything(subsidized_project_expense, losses_sale_property_equip,losses_investment,
        losses_sale_repossessed_item, losses_foreign_exchange_valuation,)

      const total_other_items = sum1 - sum2 + prior_year_adjustment;

      // convert the array of key-value pairs to an object with a nested structure
      const schedule_32 = {
        project_subsidy,
        donation_grand_subsidy,
        optional_fund_sb,
        gains_sale_proeprty_equipment,
        gains_investment,
        gains_sale_repossessed_item,
        gains_foreign_exchange_valuation,
        subsidized_project_expense,
        losses_sale_property_equip,
        losses_investment,
        losses_sale_repossessed_item,
        losses_foreign_exchange_valuation,
        prior_year_adjustment,
        total_other_items: Number(total_other_items.toFixed(2))
      }

      // check if schedule 17 already exist
      const schedule32 = await Afs8.exists({ reg_no: reg_no, report_year: report_year });

      if (schedule32) {

        const submitStatus = await Afs8.findOne({ reg_no, report_year }, { submit_status: 1 });

        if(submitStatus.submit_status === false) { //true
              // update the schedule in the database
              await Afs8.updateOne({ reg_no, report_year }, { $set: { schedule_32 }, date_submitted: new Date() });

              console.log('Schedule 32 exist, updating data.');

              res.status(200).json(format.apiResponse("success", "schedule 32 updated.", { schedule_32: schedule_32 } ));

              Sentry.infoLogMsg('CAFS Update Schedule - 32:' + reg_no + ' year:' + report_year, format.getIp(req));

        } else {
          console.log('cannot update any schedule data.');

          res.status(200).json(format.apiResponse("error", "CAFS report already submitted.", 'You cannot update any schedule data.' ));
        }

      } else {

        // save schedule in our database
        const schedule29 = await Afs8.create({ reg_no, report_year, schedule_32, date_submitted: new Date()  });

        // return new account details 
        res.status(201).json(format.apiResponse("success", "App - CAFS Schedule 32 save", schedule29));
        //send transaction logs success
        Sentry.infoLogMsg('CAFS Create Schedule - 32:' + reg_no + ' year:' + report_year, format.getIp(req));

        console.log('Schedule 32 created.');
      }

    }

  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
  }
  // Our logic ends here
});
//-- SUBMIT SCHEDULE 32 END--


  // ============================ END OF SCHEDULE SCRIPTS ============================
