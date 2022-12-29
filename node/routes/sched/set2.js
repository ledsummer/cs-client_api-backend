const express = require('express');
const Sentry = require('../../config/logs');
var moment = require('moment');
const format = require('../../config/global');
const objectFormat = require('../../config/objects');


//logs Sentry.infoLogMsg('Account Login fail', email);
const router = express.Router()

module.exports = router;

//call cais model
var { Afs2 } = require("../../model/cais_sched");

// importing authentication
const auth = require("../../middleware/auth");


// ============================ START OF SCHEDULE SCRIPTS ============================

// CHECK SCHEDULE ARRAY FOR NULL VALUE -- START
const checkSchedule = (reg_no, report_year, schedule_name, schedule, res, req) => {
  const modifiedScheduleName = format.removeSymbols(schedule_name);
  Afs2.findOne({
    reg_no,
    report_year,
    [schedule_name]: { $exists: true }
  },  async (err, doc) => {
    if (err) {
      // handle error
    } else if (doc && doc[schedule_name] !== null && Object.values(doc[schedule_name]).includes(null)) {
      console.log(`The ${schedule_name} object has null values`);
      Afs2.findOneAndUpdate({ reg_no, report_year }, { $set: { [schedule_name]: schedule } }, { new: true }, (err, doc1) => {
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
        const currentStatus = await Afs2.findOne({ reg_no, report_year }, { submit_status: 1 });
        if (currentStatus.submit_status === false) {
          // update the data in the database
          await Afs2.updateOne({ reg_no, report_year }, { $set: { [schedule_name]: schedule } });
      
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
      const obj = "Please submit schedule 7 to proceed";
      res.status(200).json(format.apiResponse("error", `Error in creating ${modifiedScheduleName}.`, obj));
    }
  });
}

// CHECK SCHEDULE ARRAY FOR NULL VALUE -- END


//-- SUBMIT SCHEDULE 1 START--
router.post("/sched/7", async (req, res) => {
  // Our submit capr logic starts here
  // Get capr input data
  const { reg_no, report_year, financial_asset_cost, less_allowancoe_impairement, financial_asset_amortized_cost, less_allowance_impairment_amortized } = req.body;

  try {
    // Validate capr input
    if (!reg_no || !report_year || report_year < 2021) {
      const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
      res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
    } else {

      // create a new object with the safe numbers from the request body
      const safeNumbers = {
        financial_asset_cost: format.zeroHandler(financial_asset_cost),
        less_allowancoe_impairement: format.zeroHandler(less_allowancoe_impairement),
        financial_asset_amortized_cost: format.zeroHandler(financial_asset_amortized_cost),
        less_allowance_impairment_amortized: format.zeroHandler(less_allowance_impairment_amortized),
      };

      const long_term_net = await safeNumbers.financial_asset_cost - safeNumbers.less_allowancoe_impairement;
      const amortized_net = await safeNumbers.financial_asset_amortized_cost - safeNumbers.less_allowance_impairment_amortized;
      const total_financial_instru = await long_term_net + amortized_net;

        // convert the array of key-value pairs to an object with a nested structure
        const schedule_7 = {
          financial_asset_cost: safeNumbers.financial_asset_cost,
          less_allowancoe_impairement: safeNumbers.less_allowancoe_impairement,
          long_term_net: Number(long_term_net.toFixed(2)),
          financial_asset_amortized_cost: safeNumbers.financial_asset_amortized_cost,
          less_allowance_impairment_amortized: safeNumbers.less_allowance_impairment_amortized,
          amortized_net: Number(amortized_net.toFixed(2)),
          total_financial_instru: Number(total_financial_instru.toFixed(2))
        }

      // check if schedule 1 already exist
      const schedule7 = await Afs2.exists({ reg_no: reg_no, report_year: report_year });

      if (schedule7) {

        const submitStatus = await Afs2.findOne({ reg_no, report_year }, { submit_status: 1 });

        if(submitStatus.submit_status === false) { //true
              // update the schedule in the database
              await Afs2.updateOne({ reg_no, report_year }, { $set: { schedule_7 } });

              console.log('Schedule 7 exist, updating data.');

              res.status(200).json(format.apiResponse("success", "schedule 7 updated.", { schedule_7: schedule_7 } ));

              Sentry.infoLogMsg('CAFS Update Schedule - 7:' + reg_no + ' year:' + report_year, format.getIp(req));

        } else {
          console.log('cannot update any schedule data.');

          res.status(200).json(format.apiResponse("error", "CAFS report already submitted.", 'You cannot update any schedule data.' ));
        }

      } else {

        // save schedule in our database
        const schedule7 = await Afs2.create({ reg_no, report_year, schedule_7 });

        // return new account details 
        res.status(201).json(format.apiResponse("success", "App - CAFS Schedule 1 save", schedule7));
        //send transaction logs success
        Sentry.infoLogMsg('CAFS Create Schedule - 7:' + reg_no + ' year:' + report_year, format.getIp(req));

        console.log('Schedule 7 created.');
      }
    }

  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
  }
  // Our logic ends here
});
//-- SUBMIT SCHEDULE 1 END--

//-- SUBMIT SCHEDULE 2 START--
router.post("/sched/8", async (req, res) => {
  // Our submit capr logic starts here
  // Get capr input data
  const { reg_no, report_year, 
  land_balance_beg,
  land_additions,
  land_disposal,
  land_impairment_loss,
  land_accumulated_depreciation,
  bldg_balance_beg,
  bldg_additions,
  bldg_disposal,
  bldg_impairment_loss,
  bldg_accumulated_depreciation,
  ropa_balance_beg,
  ropa_additions,
  ropa_disposal,
  ropa_impairment_loss,
  ropa_accumulated_depreciation } = req.body;

  try {
    // Validate capr input
    if (!reg_no || !report_year || report_year < 2021) {
      const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
      res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
    } else {

      // create a new object with the safe numbers from the request body
      const safeNumbers = {
        land_balance_beg: format.zeroHandler(land_balance_beg),
        land_additions: format.zeroHandler(land_additions),
        land_disposal: format.zeroHandler(land_disposal),
        land_impairment_loss: format.zeroHandler(land_impairment_loss),
        land_accumulated_depreciation: format.zeroHandler(land_accumulated_depreciation),
        bldg_balance_beg: format.zeroHandler(bldg_balance_beg),
        bldg_additions: format.zeroHandler(bldg_additions),
        bldg_disposal: format.zeroHandler(bldg_disposal),
        bldg_impairment_loss: format.zeroHandler(bldg_impairment_loss),
        bldg_accumulated_depreciation: format.zeroHandler(bldg_accumulated_depreciation),
        ropa_balance_beg: format.zeroHandler(ropa_balance_beg),
        ropa_additions: format.zeroHandler(ropa_additions),
        ropa_disposal: format.zeroHandler(ropa_disposal),
        ropa_impairment_loss: format.zeroHandler(ropa_impairment_loss),
        ropa_accumulated_depreciation : format.zeroHandler(ropa_accumulated_depreciation)
      };

      const land_total = format.addAnything(safeNumbers.land_balance_beg, safeNumbers.land_additions) - safeNumbers.land_disposal;
      const land_balance_end = land_total - safeNumbers.land_impairment_loss - safeNumbers.land_accumulated_depreciation;

      const bldg_total = format.addAnything(safeNumbers.bldg_balance_beg, safeNumbers.bldg_additions) - safeNumbers.bldg_disposal;
      const bldg_balance_end = bldg_total - safeNumbers.bldg_impairment_loss - safeNumbers.bldg_accumulated_depreciation;

      const ropa_total = format.addAnything(safeNumbers.ropa_balance_beg, safeNumbers.ropa_additions) - safeNumbers.ropa_disposal;
      const ropa_balance_end = ropa_total - safeNumbers.ropa_impairment_loss - safeNumbers.ropa_accumulated_depreciation;

      const total_beg = format.addAnything(safeNumbers.land_balance_beg, safeNumbers.bldg_balance_beg, safeNumbers.ropa_balance_beg);
      const total_add = format.addAnything(safeNumbers.land_additions, safeNumbers.bldg_additions, safeNumbers.ropa_additions);
      const total_disposal = format.addAnything(safeNumbers.land_disposal, safeNumbers.bldg_disposal, safeNumbers.ropa_disposal);
      const total_total = format.addAnything(land_total, bldg_total, ropa_total);
      const total_impairment = format.addAnything(safeNumbers.land_impairment_loss, safeNumbers.bldg_impairment_loss, safeNumbers.ropa_impairment_loss);
      const total_accu = format.addAnything(safeNumbers.land_accumulated_depreciation, safeNumbers.bldg_accumulated_depreciation, safeNumbers.ropa_accumulated_depreciation);
      const total_end = format.addAnything(land_balance_end, bldg_balance_end, ropa_balance_end);



      // convert the array of key-value pairs to an object with a nested structure
      const schedule_8 = await {
        invest_land: {
          balance_beg: safeNumbers.land_balance_beg,
          additions: safeNumbers.land_additions,
          disposal: safeNumbers.land_disposal,
          total: Number(land_total.toFixed(2)),
          impairment_loss: safeNumbers.land_impairment_loss,
          accumulated_depreciation: safeNumbers.land_accumulated_depreciation,
          balance_end: Number(land_balance_end.toFixed(2))
        },
        invest_building: {
          balance_beg: safeNumbers.bldg_balance_beg,
          additions: safeNumbers.bldg_additions,
          disposal: safeNumbers.bldg_disposal,
          total: Number(bldg_total.toFixed(2)),
          impairment_loss: safeNumbers.bldg_impairment_loss,
          accumulated_depreciation: safeNumbers.bldg_accumulated_depreciation,
          balance_end: Number(bldg_balance_end.toFixed(2))
        },
        ropa: {
          balance_beg: safeNumbers.ropa_balance_beg,
          additions: safeNumbers.ropa_additions,
          disposal: safeNumbers.ropa_disposal,
          total: Number(ropa_total.toFixed(2)),
          impairment_loss: safeNumbers.ropa_impairment_loss,
          accumulated_depreciation: safeNumbers.ropa_accumulated_depreciation,
          balance_end: Number(ropa_balance_end.toFixed(2))
        },
        total_invest_property: {
          balance_beg: Number(total_beg.toFixed(2)),
          additions: Number(total_add.toFixed(2)),
          disposal: Number(total_disposal.toFixed(2)),
          total: Number(total_total.toFixed(2)),
          impairment_loss: Number(total_impairment.toFixed(2)),
          accumulated_depreciation: Number(total_accu.toFixed(2)),
          balance_end: Number(total_end.toFixed(2))
        }
      }

      // Validate if schedule exist in our database and update data
      checkSchedule(reg_no, report_year, 'schedule_8', schedule_8, res, req);

    }

  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
  }
  // Our logic ends here
});
//-- SUBMIT SCHEDULE 2 END--

//-- SUBMIT SCHEDULE 3 START--
router.post("/sched/3", async (req, res) => {
  // Our submit capr logic starts here
  // Get capr input data
  const { reg_no, report_year, financial_alue_profit_loss, financial_asset_cost } = req.body;

  try {
    // Validate capr input
    if (!reg_no || !report_year || report_year < 2021) {
      const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
      res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
    } else {

      // create a new object with the safe numbers from the request body
      const safeNumbers = {
        financial_alue_profit_loss: format.zeroHandler(financial_alue_profit_loss),
        financial_asset_cost: format.zeroHandler(financial_asset_cost),
      };

      const total_financial_assets = format.addAnything(safeNumbers.financial_alue_profit_loss, safeNumbers.financial_asset_cost);

      // convert the array of key-value pairs to an object with a nested structure
      const schedule_3 = await {
        financial_asset_fair_value_profit_loss: safeNumbers.financial_alue_profit_loss,
        financial_asset_cost: safeNumbers.financial_asset_cost,
        total_financial_assets: total_financial_assets.toFixed(2)
      }

      // Validate if schedule exist in our database
      checkSchedule(reg_no, report_year, 'schedule_3', schedule_3, res, req);

    }

  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
  }
  // Our logic ends here
});
//-- SUBMIT SCHEDULE 3 END--

//-- SUBMIT SCHEDULE 4 START--
router.post("/sched/4", async (req, res) => {
  // Our submit capr logic starts here
  // Get capr input data
  const { reg_no, report_year, merchandise_inven, repossessed_inven, spare_parts_other_goods_inven, raw_materials_inven, work_process_inven, finished_goods_inven, agri_produce, equipment_lease_inven, less_allowance_impairment } = req.body;

  try {
    // Validate capr input
    if (!reg_no || !report_year || report_year < 2021) {
      const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
      res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
    } else {

      // create a new object with the safe numbers from the request body
      const safeNumbers = {
        merchandise_inven: format.zeroHandler(merchandise_inven),
        repossessed_inven: format.zeroHandler(repossessed_inven),
        spare_parts_other_goods_inven: format.zeroHandler(spare_parts_other_goods_inven),
        raw_materials_inven: format.zeroHandler(raw_materials_inven),
        work_process_inven: format.zeroHandler(work_process_inven),
        finished_goods_inven: format.zeroHandler(finished_goods_inven),
        agri_produce: format.zeroHandler(agri_produce),
        equipment_lease_inven: format.zeroHandler(equipment_lease_inven),
        less_allowance_impairment: format.zeroHandler(less_allowance_impairment)
      };

      const total_inventories = format.addAnything(safeNumbers.merchandise_inven, safeNumbers.repossessed_inven, safeNumbers.spare_parts_other_goods_inven, safeNumbers.raw_materials_inven, safeNumbers.work_process_inven, safeNumbers.finished_goods_inven, safeNumbers.agri_produce, safeNumbers.equipment_lease_inven) - safeNumbers.less_allowance_impairment;

      // convert the array of key-value pairs to an object with a nested structure
      const schedule_4 = await {
        merchandise_inven: safeNumbers.merchandise_inven,
        repossessed_inven: safeNumbers.repossessed_inven,
        spare_parts_other_goods_inven: safeNumbers.spare_parts_other_goods_inven,
        raw_materials_inven: safeNumbers.raw_materials_inven,
        work_process_inven: safeNumbers.work_process_inven,
        finished_goods_inven: safeNumbers.finished_goods_inven,
        agri_produce: safeNumbers.agri_produce,
        equipment_lease_inven: safeNumbers.equipment_lease_inven,
        less_allowance_impairment: safeNumbers.less_allowance_impairment,
        total_inventories: total_inventories.toFixed(2)
      }

      // Validate if schedule exist in our database and update data
      checkSchedule(reg_no, report_year, 'schedule_4', schedule_4, res, req);

    }

  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
  }
  // Our logic ends here
});
//-- SUBMIT SCHEDULE 4 END--

//-- SUBMIT SCHEDULE 5 START--
router.post("/sched/5", async (req, res) => {
  // Our submit capr logic starts here
  // Get capr input data
  const { reg_no, report_year, plants_bio, animals_bio } = req.body;

  try {
    // Validate capr input
    if (!reg_no || !report_year || report_year < 2021) {
      const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
      res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
    } else {

      // create a new object with the safe numbers from the request body
      const safeNumbers = {
        plants_bio: format.zeroHandler(plants_bio),
        animals_bio: format.zeroHandler(animals_bio),
      };

      const total_bio = format.addAnything(safeNumbers.plants_bio, safeNumbers.animals_bio);

      // convert the array of key-value pairs to an object with a nested structure
      const schedule_5 = await {
        plants_bio: safeNumbers.plants_bio,
        animals_bio: safeNumbers.animals_bio,
        total_bio: total_bio.toFixed(2)
      }

      // Validate if schedule exist in our database and update data
      checkSchedule(reg_no, report_year, 'schedule_5', schedule_5, res, req);

    }

  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
  }
  // Our logic ends here
});
//-- SUBMIT SCHEDULE 5 END--



//-- SUBMIT SCHEDULE 6 START--
router.post("/sched/6", async (req, res) => {
  // Our submit capr logic starts here
  // Get capr input data
  const { reg_no, report_year, input_tax, creditable_vat, creditable_witholding, deposit_suppliers, unused_supplies, asset_acqui_settl_loans_acc, less_accu_depreciation_impairment, prepared_expenses, other_current_assets } = req.body;

  try {
    // Validate capr input
    if (!reg_no || !report_year || report_year < 2021) {
      const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
      res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
    } else {

      // create a new object with the safe numbers from the request body
      const safeNumbers = {
        input_tax: format.zeroHandler(input_tax),
        creditable_vat: format.zeroHandler(creditable_vat),
        creditable_witholding: format.zeroHandler(creditable_witholding),
        deposit_suppliers: format.zeroHandler(deposit_suppliers),
        unused_supplies: format.zeroHandler(unused_supplies),
        asset_acqui_settl_loans_acc: format.zeroHandler(asset_acqui_settl_loans_acc),
        less_accu_depreciation_impairment: format.zeroHandler(less_accu_depreciation_impairment),
        prepared_expenses: format.zeroHandler(prepared_expenses),
        other_current_assets: format.zeroHandler(other_current_assets)
      };

      const total_other_current = format.addAnything(safeNumbers.input_tax, safeNumbers.creditable_vat, safeNumbers.creditable_witholding, safeNumbers.deposit_suppliers, safeNumbers.unused_supplies, safeNumbers.asset_acqui_settl_loans_acc) - safeNumbers.less_accu_depreciation_impairment + safeNumbers.prepared_expenses + safeNumbers.other_current_assets;

      // convert the array of key-value pairs to an object with a nested structure
      const schedule_6 = await {
        input_tax: safeNumbers.input_tax,
        creditable_vat: safeNumbers.creditable_vat,
        creditable_witholding: safeNumbers.creditable_witholding,
        deposit_suppliers: safeNumbers.deposit_suppliers,
        unused_supplies: safeNumbers.unused_supplies,
        asset_acqui_settl_loans_acc: safeNumbers.asset_acqui_settl_loans_acc,
        less_accu_depreciation_impairment: safeNumbers.less_accu_depreciation_impairment,
        prepared_expenses: safeNumbers.prepared_expenses,
        other_current_assets: safeNumbers.other_current_assets,
        total_other_current: total_other_current.toFixed(2)
      }

      // Validate if schedule exist in our database and update data
      checkSchedule(reg_no, report_year, 'schedule_6', schedule_6, res, req);

    }

  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
  }
  // Our logic ends here
});
//-- SUBMIT SCHEDULE 6 END--


  // ============================ END OF SCHEDULE SCRIPTS ============================
