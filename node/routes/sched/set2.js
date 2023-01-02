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


//-- SUBMIT SCHEDULE 7 START--
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
//-- SUBMIT SCHEDULE 7 END--

//-- SUBMIT SCHEDULE 8 START--
router.post("/sched/8", async (req, res) => {

  // Get schedule input data
  const { reg_no, report_year, invest_land_value, invest_building_value, ropa_value, } = req.body;

  try {
    // Validate capr input
    if (!reg_no || !report_year || report_year < 2021) {
      const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
      res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
    } else {

      const invest_land = objectFormat.calculateObj(invest_land_value);
      const invest_building = objectFormat.calculateObj(invest_building_value);
      const ropa = objectFormat.calculateObj(ropa_value);

      const valueVariables = [ invest_land, invest_building, ropa ];

      const total_invest_property = {
        balance_beg: 0,
        additions: 0,
        disposal: 0,
        total: 0,
        impairment_loss: 0,
        accumulated_depreciation: 0,
        balance_end: 0,
      };


      for (const value of valueVariables) {
        total_invest_property.balance_beg += value.balance_beg;
        total_invest_property.additions += value.additions;
        total_invest_property.disposal += value.disposal;
        total_invest_property.total += value.total;
        total_invest_property.impairment_loss += value.impairment_loss;
        total_invest_property.accumulated_depreciation += value.accumulated_depreciation;
        total_invest_property.balance_end += value.balance_end;
      }

      const schedule_8 = { invest_land, invest_building, ropa, total_invest_property };

      // Validate if schedule exist in our database and update data
      checkSchedule(reg_no, report_year, 'schedule_8', schedule_8, res, req);

    }

  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
  }
  // Our logic ends here
});
//-- SUBMIT SCHEDULE 8 END--

//-- SUBMIT SCHEDULE 9 START--
router.post("/sched/9", async (req, res) => {
  // Our submit capr logic starts here
  // Get capr input data
  const { reg_no, report_year, land_value,  land_improvements_value, building_improvements_value, building_leased_land_value, utility_plant_value, prop_plant_equip_under_finance_value, ffe_value, mte_value, kitchen_canteen_catering_equip_value, transpo_equip_value, linens_uniforms_value, nursery_greenhouse_value, leashold_rights_improvements_value, construction_progress_value, other_property_plant_equip_value } = req.body;

  try {
    // Validate capr input
    if (!reg_no || !report_year || report_year < 2021) {
      const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
      res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
    } else {

      const land_improvements = objectFormat.calculateObj(land_improvements_value);
      const land = objectFormat.calculateObj(land_value);
      const building_improvements = objectFormat.calculateObj(building_improvements_value);
      const building_leased_land = objectFormat.calculateObj(building_leased_land_value);
      const utility_plant = objectFormat.calculateObj(utility_plant_value);
      const prop_plant_equip_under_finance = objectFormat.calculateObj(prop_plant_equip_under_finance_value);
      const ffe = objectFormat.calculateObj(ffe_value);
      const mte = objectFormat.calculateObj(mte_value);
      const kitchen_canteen_catering_equip = objectFormat.calculateObj(kitchen_canteen_catering_equip_value);
      const transpo_equip = objectFormat.calculateObj(transpo_equip_value);
      const linens_uniforms = objectFormat.calculateObj(linens_uniforms_value);
      const nursery_greenhouse = objectFormat.calculateObj(nursery_greenhouse_value);
      const leashold_rights_improvements = objectFormat.calculateObj(leashold_rights_improvements_value);
      const construction_progress = objectFormat.calculateObj(construction_progress_value);
      const other_property_plant_equip = objectFormat.calculateObj(other_property_plant_equip_value);

      const valueVariables = [  land_improvements,  land,  building_improvements,  building_leased_land,  utility_plant,  prop_plant_equip_under_finance,  ffe,  mte,  kitchen_canteen_catering_equip,  transpo_equip,  linens_uniforms,  nursery_greenhouse,  leashold_rights_improvements,  construction_progress,  other_property_plant_equip ];

      const total_property_plant_equip = {
        balance_beg: 0,
        additions: 0,
        disposal: 0,
        total: 0,
        impairment_loss: 0,
        accumulated_depreciation: 0,
        balance_end: 0,
      };

      for (const value of valueVariables) {
        total_property_plant_equip.balance_beg += value.balance_beg;
        total_property_plant_equip.additions += value.additions;
        total_property_plant_equip.disposal += value.disposal;
        total_property_plant_equip.total += value.total;
        total_property_plant_equip.impairment_loss += value.impairment_loss;
        total_property_plant_equip.accumulated_depreciation += value.accumulated_depreciation;
        total_property_plant_equip.balance_end += value.balance_end;
      }
      
      const schedule_9 = {
        land_improvements,  land,  building_improvements,  building_leased_land,  utility_plant,  prop_plant_equip_under_finance,  ffe,  mte,  kitchen_canteen_catering_equip,  transpo_equip,  linens_uniforms,  nursery_greenhouse,  leashold_rights_improvements, construction_progress,  other_property_plant_equip, total_property_plant_equip
      };

      // Validate if schedule exist in our database
      checkSchedule(reg_no, report_year, 'schedule_9', schedule_9, res, req);

    }

  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
  }
  // Our logic ends here
});
//-- SUBMIT SCHEDULE 9 END--

//-- SUBMIT SCHEDULE 10 START--
router.post("/sched/10", async (req, res) => {
  // Our submit capr logic starts here
  // Get capr input data
  const { reg_no, report_year, animals_bio, less_accu_depre_animals, plants_bio, less_accu_depre_plants } = req.body;

  try {
    // Validate capr input
    if (!reg_no || !report_year || report_year < 2021) {
      const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
      res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
    } else {

      // create a new object with the safe numbers from the request body
      const safeNumbers = {
        animals_bio: format.zeroHandler(animals_bio),
        less_accu_depre_animals: format.zeroHandler(less_accu_depre_animals), 
        plants_bio: format.zeroHandler(plants_bio), 
        less_accu_depre_plants: format.zeroHandler(less_accu_depre_plants),
      };

      const animals_net = safeNumbers.animals_bio - safeNumbers.less_accu_depre_animals;
      const plants_net = safeNumbers.plants_bio - safeNumbers.less_accu_depre_plants;
      const total_bio = animals_net + plants_net;

      // convert the array of key-value pairs to an object with a nested structure
      const schedule_10 = {
        animals_bio: safeNumbers.animals_bio,
        less_accu_depre_animals: safeNumbers.less_accu_depre_animals,
        animals_net: animals_net,
        plants_bio: safeNumbers.plants_bio,
        less_accu_depre_plants: safeNumbers.less_accu_depre_plants,
        plants_net: plants_net,
        total_bio: Number(total_bio.toFixed(2))
      }

      // Validate if schedule exist in our database and update data
      checkSchedule(reg_no, report_year, 'schedule_10', schedule_10, res, req);

    }

  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
  }
  // Our logic ends here
});
//-- SUBMIT SCHEDULE 10 END--

//-- SUBMIT SCHEDULE 11 START--
router.post("/sched/11", async (req, res) => {
  // Our submit capr logic starts here
  // Get capr input data
  const { reg_no, report_year, franchise, franchise_cost, copyright, patent } = req.body;

  try {
    // Validate capr input
    if (!reg_no || !report_year || report_year < 2021) {
      const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
      res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
    } else {

      // create a new object with the safe numbers from the request body
      const safeNumbers = {
        franchise: format.zeroHandler(franchise),
        franchise_cost: format.zeroHandler(franchise_cost),
        copyright: format.zeroHandler(copyright),
        patent: format.zeroHandler(patent),
      };

      const total_intagible = format.addAnything(safeNumbers.franchise, safeNumbers.franchise_cost, safeNumbers.copyright, safeNumbers.patent);

      // convert the array of key-value pairs to an object with a nested structure
      const schedule_11 = await {
        franchise: safeNumbers.franchise,
        franchise_cost: safeNumbers.franchise_cost,
        copyright: safeNumbers.copyright,
        patent: safeNumbers.patent,
        total_intagible: Number(total_intagible.toFixed(2))
      }

      // Validate if schedule exist in our database and update data
      checkSchedule(reg_no, report_year, 'schedule_11', schedule_11, res, req);

    }

  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
  }
  // Our logic ends here
});
//-- SUBMIT SCHEDULE 11 END--



//-- SUBMIT SCHEDULE 12 START--
router.post("/sched/12", async (req, res) => {
  // Our submit capr logic starts here
  // Get capr input data
  const { reg_no, report_year, comput_cost_net, other_fund_depo, finance_lease_receiv, due_from_head_office, deposit_on_returnable_container, misscell_assets } = req.body;

  try {
    // Validate capr input
    if (!reg_no || !report_year || report_year < 2021) {
      const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
      res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
    } else {

      // create a new object with the safe numbers from the request body
      const safeNumbers = {
        comput_cost_net: format.zeroHandler(comput_cost_net),
        other_fund_depo: format.zeroHandler(other_fund_depo),
        finance_lease_receiv: format.zeroHandler(finance_lease_receiv),
        due_from_head_office: format.zeroHandler(due_from_head_office),
        deposit_on_returnable_container: format.zeroHandler(deposit_on_returnable_container),
        misscell_assets: format.zeroHandler(misscell_assets),
      };

      const total_other_non_cur_asset = format.addAnything(safeNumbers.comput_cost_net, safeNumbers.other_fund_depo, safeNumbers.finance_lease_receiv, safeNumbers.due_from_head_office, safeNumbers.deposit_on_returnable_container, safeNumbers.misscell_assets);

      // convert the array of key-value pairs to an object with a nested structure
      const schedule_12 = await {
        comput_cost_net: safeNumbers.comput_cost_net,
        other_fund_depo: safeNumbers.other_fund_depo,
        finance_lease_receiv: safeNumbers.finance_lease_receiv,
        due_from_head_office: safeNumbers.due_from_head_office,
        deposit_on_returnable_container: safeNumbers.deposit_on_returnable_container,
        misscell_assets: safeNumbers.misscell_assets,
        total_other_non_cur_asset: Number(total_other_non_cur_asset.toFixed(2))
      }

      // Validate if schedule exist in our database and update data
      checkSchedule(reg_no, report_year, 'schedule_12', schedule_12, res, req);

    }

  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
  }
  // Our logic ends here
});
//-- SUBMIT SCHEDULE 12 END--


  // ============================ END OF SCHEDULE SCRIPTS ============================
