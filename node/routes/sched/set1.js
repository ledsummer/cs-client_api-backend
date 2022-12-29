const express = require('express');
const Sentry = require('../../config/logs');
var moment = require('moment');
const format = require('../../config/global');
const objectFormat = require('../../config/objects');


//logs Sentry.infoLogMsg('Account Login fail', email);
const router = express.Router()

module.exports = router;

//call cais model
var { Afs1 } = require("../../model/cais_sched");

// importing authentication
const auth = require("../../middleware/auth");


// ============================ START OF SCHEDULE SCRIPTS ============================

// CHECK SCHEDULE ARRAY FOR NULL VALUE -- START
const checkSchedule = (reg_no, report_year, schedule_name, schedule, res, req) => {
  const modifiedScheduleName = format.removeSymbols(schedule_name);
  Afs1.findOne({
    reg_no,
    report_year,
    [schedule_name]: { $exists: true }
  }, async (err, doc) => {
    if (err) {
      // handle error
    } else if (doc && doc[schedule_name] !== null && Object.values(doc[schedule_name]).includes(null)) {
      console.log(`The ${schedule_name} object has null values`);
      Afs1.findOneAndUpdate({ reg_no, report_year }, { $set: { [schedule_name]: schedule }, date_submitted: new Date() }, { new: true }, (err, doc1) => {
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
        const currentStatus = await Afs1.findOne({ reg_no, report_year }, { submit_status: 1 });
        if (currentStatus.submit_status === false) {
          // update the data in the database
          await Afs1.updateOne({ reg_no, report_year }, { $set: { [schedule_name]: schedule }, date_submitted: new Date() });
      
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
      const obj = "Please submit schedule 1 to proceed";
      res.status(200).json(format.apiResponse("error", `Error in creating ${modifiedScheduleName}.`, obj));
    }
  });
}

// CHECK SCHEDULE ARRAY FOR NULL VALUE -- END


//-- SUBMIT SCHEDULE 1 START--
router.post("/sched/1", async (req, res) => {
  // Our submit capr logic starts here
  // Get capr input data
  const { reg_no, report_year, cash_on_hand, checks_other_cash_items, cash_in_bank, cash_in_cooperative_federations, petty_cash_fund, revolving_fund, change_fund, atm_fund } = req.body;

  try {
    // Validate capr input
    if (!reg_no || !report_year || report_year < 2021) {
      const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
      res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
    } else {

      // create a new object with the safe numbers from the request body
      const safeNumbers = {
        cash_on_hand: format.zeroHandler(cash_on_hand),
        checks_other_cash_items: format.zeroHandler(checks_other_cash_items),
        cash_in_bank: format.zeroHandler(cash_in_bank),
        cash_in_cooperative_federations: format.zeroHandler(cash_in_cooperative_federations),
        petty_cash_fund: format.zeroHandler(petty_cash_fund),
        revolving_fund: format.zeroHandler(revolving_fund),
        change_fund: format.zeroHandler(change_fund),
        atm_fund: format.zeroHandler(atm_fund),
      };

      const total_cash_cash_equivalents = await safeNumbers.cash_on_hand + safeNumbers.checks_other_cash_items + safeNumbers.cash_in_bank + safeNumbers.cash_in_cooperative_federations + safeNumbers.petty_cash_fund + safeNumbers.revolving_fund + safeNumbers.change_fund + safeNumbers.atm_fund;

        // convert the array of key-value pairs to an object with a nested structure
        const schedule_1 = {
          cash_on_hand: safeNumbers.cash_on_hand,
          checks_other_cash_items: safeNumbers.checks_other_cash_items,
          cash_in_bank: safeNumbers.cash_in_bank,
          cash_in_cooperative_federations: safeNumbers.cash_in_cooperative_federations,
          petty_cash_fund: safeNumbers.petty_cash_fund,
          revolving_fund: safeNumbers.revolving_fund,
          change_fund: safeNumbers.change_fund,
          atm_fund: safeNumbers.atm_fund,
          total_cash_cash_equivalents: Number(total_cash_cash_equivalents.toFixed(2))
        }

      // check if schedule 1 already exist
      const schedule1 = await Afs1.exists({ reg_no: reg_no, report_year: report_year });

      if (schedule1) {

        const submitStatus = await Afs1.findOne({ reg_no, report_year }, { submit_status: 1 });

        if(submitStatus.submit_status === false) { //true
              // update the schedule in the database
              await Afs1.updateOne({ reg_no, report_year }, { $set: { schedule_1 }, date_submitted: new Date() });

              console.log('Schedule 1 exist, updating data.');

              res.status(200).json(format.apiResponse("success", "schedule 1 updated.", { schedule_1: schedule_1 } ));

              Sentry.infoLogMsg('CAFS Update Schedule - 1:' + reg_no + ' year:' + report_year, format.getIp(req));

        } else {
          console.log('cannot update any schedule data.');

          res.status(200).json(format.apiResponse("error", "CAFS report already submitted.", 'You cannot update any schedule data.' ));
        }

      } else {

        // save schedule in our database
        const schedule1 = await Afs1.create({ reg_no, report_year, schedule_1, date_submitted: new Date()  });

        // return new account details 
        res.status(201).json(format.apiResponse("success", "App - CAFS Schedule 1 save", schedule1));
        //send transaction logs success
        Sentry.infoLogMsg('CAFS Create Schedule - 1:' + reg_no + ' year:' + report_year, format.getIp(req));

        console.log('Schedule 1 created.');
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
router.post("/sched/2", async (req, res) => {
  // Our submit capr logic starts here
  // Get capr input data
  const { reg_no, report_year, loans_current, loans_one_30_days, loans_thirty_one_360_days, loans_over_360_days, loans_restructure, loans_litigation, loans_less_unearned_interest_discounts, loans_less_allowance_for_probable_losses_on_loans, account_current, account_one_30_days, account_thirty_one_360_days, account_over_360_days, account_restructure, account_litigation, less_allowance_for_probable_losses_on_accounts_receivables, install_current, install_past_due, install_restructure, install_in_litigation, less_losses_installment, sale_contract, less_sale_contract, service_receivable, account_receivable_non_trade, advances_officers_emp_members, due_accountable_officers_emp, finance_less_receivable, less_impairment_finance, other_current_receive } = req.body;

  try {
    // Validate capr input
    if (!reg_no || !report_year || report_year < 2021) {
      const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
      res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
    } else {

      // create a new object with the safe numbers from the request body
      const safeNumbers = {
        loans_current: format.zeroHandler(loans_current),
        loans_one_30_days: format.zeroHandler(loans_one_30_days),
        loans_thirty_one_360_days: format.zeroHandler(loans_thirty_one_360_days),
        loans_over_360_days: format.zeroHandler(loans_over_360_days),
        loans_restructure: format.zeroHandler(loans_restructure),
        loans_litigation: format.zeroHandler(loans_litigation),
        loans_less_unearned_interest_discounts: format.zeroHandler(loans_less_unearned_interest_discounts),
        loans_less_allowance_for_probable_losses_on_loans: format.zeroHandler(loans_less_allowance_for_probable_losses_on_loans),
        account_current: format.zeroHandler(account_current),
        account_one_30_days: format.zeroHandler(account_one_30_days),
        account_thirty_one_360_days: format.zeroHandler(account_thirty_one_360_days),
        account_over_360_days: format.zeroHandler(account_over_360_days),
        account_restructure: format.zeroHandler(account_restructure),
        account_litigation: format.zeroHandler(account_litigation),
        less_allowance_for_probable_losses_on_accounts_receivables: format.zeroHandler(less_allowance_for_probable_losses_on_accounts_receivables),
        install_current: format.zeroHandler(install_current),
        install_past_due: format.zeroHandler(install_past_due),
        install_restructure: format.zeroHandler(install_restructure),
        install_in_litigation: format.zeroHandler(install_in_litigation),
        less_losses_installment: format.zeroHandler(less_losses_installment),
        sale_contract: format.zeroHandler(sale_contract),
        less_sale_contract: format.zeroHandler(less_sale_contract),
        service_receivable: format.zeroHandler(service_receivable),
        account_receivable_non_trade: format.zeroHandler(account_receivable_non_trade),
        advances_officers_emp_members: format.zeroHandler(advances_officers_emp_members),
        due_accountable_officers_emp: format.zeroHandler(due_accountable_officers_emp),
        finance_less_receivable: format.zeroHandler(finance_less_receivable),
        less_impairment_finance: format.zeroHandler(less_impairment_finance),
        other_current_receive: format.zeroHandler(other_current_receive)
      };

      const total_past_due_compute = format.addAnything(safeNumbers.loans_one_30_days, safeNumbers.loans_thirty_one_360_days, safeNumbers.loans_over_360_days);

      const account_total_past_due_compute = format.addAnything(safeNumbers.account_one_30_days, safeNumbers.account_thirty_one_360_days, safeNumbers.account_over_360_days);

      const net_loans_receivable_compute = await safeNumbers.loans_current + total_past_due_compute + safeNumbers.loans_restructure + safeNumbers.loans_litigation - safeNumbers.loans_less_unearned_interest_discounts - safeNumbers.loans_less_allowance_for_probable_losses_on_loans;

      const account_net_loans_receivable_compute = await safeNumbers.account_current + account_total_past_due_compute + safeNumbers.account_restructure + safeNumbers.account_litigation - safeNumbers.less_allowance_for_probable_losses_on_accounts_receivables;

      const unrealized_gross_margin_compute = format.addAnything(safeNumbers.install_current, safeNumbers.install_past_due, safeNumbers.install_in_litigation, safeNumbers.install_restructure) - less_losses_installment;

      const net_sale_contract_compute = safeNumbers.sale_contract - safeNumbers.less_sale_contract;

      const total_loans_recieve = safeNumbers.other_current_receive + safeNumbers.finance_less_receivable + safeNumbers.due_accountable_officers_emp + safeNumbers.advances_officers_emp_members + safeNumbers.account_receivable_non_trade + net_sale_contract_compute + unrealized_gross_margin_compute + account_net_loans_receivable_compute + net_loans_receivable_compute - safeNumbers.less_impairment_finance + safeNumbers.service_receivable;


      // convert the array of key-value pairs to an object with a nested structure
      const schedule_2 = await {
        loans_receivable: {
          current: safeNumbers.loans_current,
          past_due: {
            one_30_days: safeNumbers.loans_one_30_days,
            thirty_one_360_days: safeNumbers.loans_thirty_one_360_days,
            over_360_days: safeNumbers.loans_over_360_days,
            total_past_due_loans: total_past_due_compute,
          },
          restructure: safeNumbers.loans_restructure,
          loans_litigation: safeNumbers.loans_litigation,
          less_unearned_interest_discounts: safeNumbers.loans_less_unearned_interest_discounts,
          less_allowance_for_probable_losses_on_loans: safeNumbers.loans_less_allowance_for_probable_losses_on_loans,
          net_loans_receivable: net_loans_receivable_compute,
        },
        account_receivable: {
          current: safeNumbers.account_current,
          past_due: {
            one_30_days: safeNumbers.account_one_30_days,
            thirty_one_360_days: safeNumbers.account_thirty_one_360_days,
            over_360_days: safeNumbers.account_thirty_one_360_days,
            total_past_due_accounts_receivable: account_total_past_due_compute,
          },
          restructure: safeNumbers.account_restructure,
          in_litigation: safeNumbers.account_litigation,
          less_allowance_for_probable_losses_on_accounts_receivables: safeNumbers.less_allowance_for_probable_losses_on_accounts_receivables,
          net_accounts_receivable: account_net_loans_receivable_compute,
        },
        intallment_receivable: {
          current: safeNumbers.install_current,
          past_due: safeNumbers.install_past_due,
          restructure: safeNumbers.install_restructure,
          in_litigation: safeNumbers.install_in_litigation,
          less_allowance_for_probable_losses_on_installment: safeNumbers.less_losses_installment,
          unrealized_gross_margin: unrealized_gross_margin_compute,
        },
        sales_contract_receivable: {
          sale_contract: safeNumbers.sale_contract,
          less_allowance_for_probable_losses_sales_contract: safeNumbers.less_sale_contract,
          net_sales_contract_receivable: net_sale_contract_compute,
        },
        service_receivable: safeNumbers.service_receivable,
        account_receivable_non_trade: safeNumbers.account_receivable_non_trade,
        advances_officers_emp_members: safeNumbers.advances_officers_emp_members,
        due_accountable_officers_emp: safeNumbers.due_accountable_officers_emp,
        finance_less_receivable: safeNumbers.finance_less_receivable,
        less_allowance_for_impairment_finance_lease: safeNumbers.less_impairment_finance,
        other_current_receivables: safeNumbers.other_current_receive,
        total_loans_receivables: Number(total_loans_recieve.toFixed(2))
      }


      // Validate if schedule exist in our database and update data
      checkSchedule(reg_no, report_year, 'schedule_2', schedule_2, res, req);

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
        total_financial_assets: Number(total_financial_assets.toFixed(2))
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
        total_inventories: Number(total_inventories.toFixed(2))
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
        total_bio: Number(total_bio.toFixed(2))
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
        total_other_current: Number(total_other_current.toFixed(2))
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
