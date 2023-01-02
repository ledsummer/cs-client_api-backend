const express = require('express');
const Sentry = require('../../config/logs');
var moment = require('moment');
const format = require('../../config/global');
const objectFormat = require('../../config/objects');


//logs Sentry.infoLogMsg('Account Login fail', email);
const router = express.Router()

module.exports = router;

//call cais model
var { Afs7 } = require("../../model/cais_sched");

// importing authentication
const auth = require("../../middleware/auth");


// ============================ START OF SCHEDULE SCRIPTS ============================

// CHECK SCHEDULE ARRAY FOR NULL VALUE -- START
const checkSchedule = (reg_no, report_year, schedule_name, schedule, res, req) => {
  const modifiedScheduleName = format.removeSymbols(schedule_name);
  Afs7.findOne({
    reg_no,
    report_year,
    [schedule_name]: { $exists: true }
  },  async (err, doc) => {
    if (err) {
      // handle error
    } else if (doc && doc[schedule_name] !== null && Object.values(doc[schedule_name]).includes(null)) {
      console.log(`The ${schedule_name} object has null values`);
      Afs7.findOneAndUpdate({ reg_no, report_year }, { $set: { [schedule_name]: schedule } }, { new: true }, (err, doc1) => {
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
        const currentStatus = await Afs7.findOne({ reg_no, report_year }, { submit_status: 1 });
        if (currentStatus.submit_status === false) {
          // update the data in the database
          await Afs7.updateOne({ reg_no, report_year }, { $set: { [schedule_name]: schedule } });
      
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
      const obj = "Please submit schedule 29 to proceed";
      res.status(200).json(format.apiResponse("error", `Error in creating ${modifiedScheduleName}.`, obj));
    }
  });
}

// CHECK SCHEDULE ARRAY FOR NULL VALUE -- END


//-- SUBMIT SCHEDULE 29 START--
router.post("/sched/29", async (req, res) => {
  // Our submit capr logic starts here
  // Get capr input data
  const { reg_no, report_year, interest_expense_borrow_value, interest_expense_deposits_value, other_finance_charges_value } = req.body;

  try {
    // Validate capr input
    if (!reg_no || !report_year || report_year < 2021) {
      const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
      res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
    } else {

      // create a new object with the safe numbers from the request body
      interest_expense_borrow = format.zeroHandler(interest_expense_borrow_value);
      interest_expense_deposits = format.zeroHandler(interest_expense_deposits_value);
      other_finance_charges = format.zeroHandler(other_finance_charges_value);

      const total_financing_costs = format.addAnything(interest_expense_borrow, interest_expense_deposits, other_finance_charges);

      // convert the array of key-value pairs to an object with a nested structure
      const schedule_29 = {
        interest_expense_borrow,
        interest_expense_deposits,
        other_finance_charges,
        total_financing_costs: Number(total_financing_costs.toFixed(2))
      }

      // check if schedule 17 already exist
      const schedule29 = await Afs7.exists({ reg_no: reg_no, report_year: report_year });

      if (schedule29) {

        const submitStatus = await Afs7.findOne({ reg_no, report_year }, { submit_status: 1 });

        if(submitStatus.submit_status === false) { //true
              // update the schedule in the database
              await Afs7.updateOne({ reg_no, report_year }, { $set: { schedule_29 }, date_submitted: new Date() });

              console.log('Schedule 29 exist, updating data.');

              res.status(200).json(format.apiResponse("success", "schedule 29 updated.", { schedule_29: schedule_29 } ));

              Sentry.infoLogMsg('CAFS Update Schedule - 29:' + reg_no + ' year:' + report_year, format.getIp(req));

        } else {
          console.log('cannot update any schedule data.');

          res.status(200).json(format.apiResponse("error", "CAFS report already submitted.", 'You cannot update any schedule data.' ));
        }

      } else {

        // save schedule in our database
        const schedule29 = await Afs7.create({ reg_no, report_year, schedule_29, date_submitted: new Date()  });

        // return new account details 
        res.status(201).json(format.apiResponse("success", "App - CAFS Schedule 29 save", schedule29));
        //send transaction logs success
        Sentry.infoLogMsg('CAFS Create Schedule - 29:' + reg_no + ' year:' + report_year, format.getIp(req));

        console.log('Schedule 29 created.');
      }

    }

  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
  }
  // Our logic ends here
});
//-- SUBMIT SCHEDULE 29 END--

//-- SUBMIT SCHEDULE 30 START--
router.post("/sched/30", async (req, res) => {
  // Our submit capr logic starts here
  // Get capr input data
  const { reg_no, report_year,
    advertising_promotion_value,
    amortization_value,
    amortization_leasehold_rights_improve_value,
    breakage_losses_kitchen_equip_value,
    comission_expenses_value,
    communication_value,
    depreciation_value,
    employee_benefits_value,
    freight_out_delivery_expenses_value,
    gas_oil_lubricants_value,
    incentives_allowance_value,
    insurance_value,
    misc_expense_value,
    power_light_water_value,
    product_service_dev_value,
    product_research_value,
    product_service_marketing_prom_value,
    rentals_value,
    repairs_maint_value,
    representation_value,
    retirement_benefits_expense_value,
    royalties_value,
    salaries_wages_value,
    spoilage_break_losses_value,
    sss_philhealth_ecc_pagibig_value,
    storage_warehousing_expenses_value,
    store_canteen_kitchen_catering_supp_value,
    taxes_fees_charges_value,
    travel_transportation_value
   } = req.body;

  try {
    // Validate capr input
    if (!reg_no || !report_year || report_year < 2021) {
      const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
      res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
    } else {

      // create a new object with the safe numbers from the request body
      advertising_promotion  = format.zeroHandler(advertising_promotion_value);
      amortization  = format.zeroHandler(amortization_value);
      amortization_leasehold_rights_improve  = format.zeroHandler(amortization_leasehold_rights_improve_value);
      breakage_losses_kitchen_equip  = format.zeroHandler(breakage_losses_kitchen_equip_value);
      comission_expenses  = format.zeroHandler(comission_expenses_value);
      communication  = format.zeroHandler(communication_value);
      depreciation  = format.zeroHandler(depreciation_value);
      employee_benefits  = format.zeroHandler(employee_benefits_value);
      freight_out_delivery_expenses  = format.zeroHandler(freight_out_delivery_expenses_value);
      gas_oil_lubricants  = format.zeroHandler(gas_oil_lubricants_value);
      incentives_allowance  = format.zeroHandler(incentives_allowance_value);
      insurance  = format.zeroHandler(insurance_value);
      misc_expense  = format.zeroHandler(misc_expense_value);
      power_light_water  = format.zeroHandler(power_light_water_value);
      product_service_dev  = format.zeroHandler(product_service_dev_value);
      product_research  = format.zeroHandler(product_research_value);
      product_service_marketing_prom  = format.zeroHandler(product_service_marketing_prom_value);
      rentals  = format.zeroHandler(rentals_value);
      repairs_maint  = format.zeroHandler(repairs_maint_value);
      representation  = format.zeroHandler(representation_value);
      retirement_benefits_expense  = format.zeroHandler(retirement_benefits_expense_value);
      royalties  = format.zeroHandler(royalties_value);
      salaries_wages  = format.zeroHandler(salaries_wages_value);
      spoilage_break_losses  = format.zeroHandler(spoilage_break_losses_value);
      sss_philhealth_ecc_pagibig  = format.zeroHandler(sss_philhealth_ecc_pagibig_value);
      storage_warehousing_expenses  = format.zeroHandler(storage_warehousing_expenses_value);
      store_canteen_kitchen_catering_supp  = format.zeroHandler(store_canteen_kitchen_catering_supp_value);
      taxes_fees_charges  = format.zeroHandler(taxes_fees_charges_value);
      travel_transportation = format.zeroHandler(travel_transportation_value);

      const total_selling_marketing_cost = format.addAnything(
        advertising_promotion,
        amortization,
        amortization_leasehold_rights_improve,
        breakage_losses_kitchen_equip,
        comission_expenses,
        communication,
        depreciation,
        employee_benefits,
        freight_out_delivery_expenses,
        gas_oil_lubricants,
        incentives_allowance,
        insurance,
        misc_expense,
        power_light_water,
        product_service_dev,
        product_research,
        product_service_marketing_prom,
        rentals,
        repairs_maint,
        representation,
        retirement_benefits_expense,
        royalties,
        salaries_wages,
        spoilage_break_losses,
        sss_philhealth_ecc_pagibig,
        storage_warehousing_expenses,
        store_canteen_kitchen_catering_supp,
        taxes_fees_charges,
        travel_transportation);
    

      // convert the array of key-value pairs to an object with a nested structure
      const schedule_30 = {
        advertising_promotion,
        amortization,
        amortization_leasehold_rights_improve,
        breakage_losses_kitchen_equip,
        comission_expenses,
        communication,
        depreciation,
        employee_benefits,
        freight_out_delivery_expenses,
        gas_oil_lubricants,
        incentives_allowance,
        insurance,
        misc_expense,
        power_light_water,
        product_service_dev,
        product_research,
        product_service_marketing_prom,
        rentals,
        repairs_maint,
        representation,
        retirement_benefits_expense,
        royalties,
        salaries_wages,
        spoilage_break_losses,
        sss_philhealth_ecc_pagibig,
        storage_warehousing_expenses,
        store_canteen_kitchen_catering_supp,
        taxes_fees_charges,
        travel_transportation,
        total_selling_marketing_cost: Number(total_selling_marketing_cost.toFixed(2))
      }

      // Validate if schedule exist in our database and update data
      checkSchedule(reg_no, report_year, 'schedule_30', schedule_30, res, req);

    }

  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
  }
  // Our logic ends here
});
//-- SUBMIT SCHEDULE 30 END--


//-- SUBMIT SCHEDULE 31 START--
router.post("/sched/31", async (req, res) => {
  // Our submit capr logic starts here
  // Get capr input data
  const { reg_no, report_year, 
    affiliation_fee_value,
    amortization_value,
    amortization_leasehold_rights_improve_value,
    bank_charges_value,
    certifications_recog_value,
    collection_expense_value,
    communication_value,
    depreciation_value,
    employee_benefits_value,
    gas_oil_lubricants_value,
    gen_assembly_expenses_value,
    gen_support_services_value,
    impairment_losses_value,
    insurance_value,
    litigation_expenses_value,
    meeting_conferences_value,
    members_benefit_expense_value,
    misc_expense_value,
    office_supplies_value,
    officers_honorarium_allowances_value,
    periodicals_magazine_subsc_value,
    power_light_water_value,
    professional_fees_value,
    probable_losses_accounts_loans_install_reciev_value,
    rentals_value,
    repairs_maintenance_value,
    representation_value,
    retirement_ben_expense_value,
    salaries_wages_value,
    school_program_support_value,
    social_community_service_expense_value,
    sss_philhealth_pagibig_value,
    taxes_fees_charges_value,
    trainings_seminars_value,
    travel_transport_value } = req.body;

  try {
    // Validate capr input
    if (!reg_no || !report_year || report_year < 2021) {
      const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
      res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
    } else {

      // create a new object with the safe numbers from the request body
        affiliation_fee = format.zeroHandler(affiliation_fee_value);
        amortization = format.zeroHandler(amortization_value);
        amortization_leasehold_rights_improve = format.zeroHandler(amortization_leasehold_rights_improve_value);
        bank_charges = format.zeroHandler(bank_charges_value);
        certifications_recog = format.zeroHandler(certifications_recog_value);
        collection_expense = format.zeroHandler(collection_expense_value);
        communication = format.zeroHandler(communication_value);
        depreciation = format.zeroHandler(depreciation_value);
        employee_benefits = format.zeroHandler(employee_benefits_value);
        gas_oil_lubricants = format.zeroHandler(gas_oil_lubricants_value);
        gen_assembly_expenses = format.zeroHandler(gen_assembly_expenses_value);
        gen_support_services = format.zeroHandler(gen_support_services_value);
        impairment_losses = format.zeroHandler(impairment_losses_value);
        insurance = format.zeroHandler(insurance_value);
        litigation_expenses = format.zeroHandler(litigation_expenses_value);
        meeting_conferences = format.zeroHandler(meeting_conferences_value);
        members_benefit_expense = format.zeroHandler(members_benefit_expense_value);
        misc_expense = format.zeroHandler(misc_expense_value);
        office_supplies = format.zeroHandler(office_supplies_value);
        officers_honorarium_allowances = format.zeroHandler(officers_honorarium_allowances_value);
        periodicals_magazine_subsc = format.zeroHandler(periodicals_magazine_subsc_value);
        power_light_water = format.zeroHandler(power_light_water_value);
        professional_fees = format.zeroHandler(professional_fees_value);
        probable_losses_accounts_loans_install_reciev = format.zeroHandler(probable_losses_accounts_loans_install_reciev_value);
        rentals = format.zeroHandler(rentals_value);
        repairs_maintenance = format.zeroHandler(repairs_maintenance_value);
        representation = format.zeroHandler(representation_value);
        retirement_ben_expense = format.zeroHandler(retirement_ben_expense_value);
        salaries_wages = format.zeroHandler(salaries_wages_value);
        school_program_support = format.zeroHandler(school_program_support_value);
        social_community_service_expense = format.zeroHandler(social_community_service_expense_value);
        sss_philhealth_pagibig = format.zeroHandler(sss_philhealth_pagibig_value);
        taxes_fees_charges = format.zeroHandler(taxes_fees_charges_value);
        trainings_seminars = format.zeroHandler(trainings_seminars_value);
        travel_transport = format.zeroHandler(travel_transport_value);

      const total_admin_cost = format.addAnything(
        affiliation_fee,
        amortization,
        amortization_leasehold_rights_improve,
        bank_charges,
        certifications_recog,
        collection_expense,
        communication,
        depreciation,
        employee_benefits,
        gas_oil_lubricants,
        gen_assembly_expenses,
        gen_support_services,
        impairment_losses,
        insurance,
        litigation_expenses,
        meeting_conferences,
        members_benefit_expense,
        misc_expense,
        office_supplies,
        officers_honorarium_allowances,
        periodicals_magazine_subsc,
        power_light_water,
        professional_fees,
        probable_losses_accounts_loans_install_reciev,
        rentals,
        repairs_maintenance,
        representation,
        retirement_ben_expense,
        salaries_wages,
        school_program_support,
        social_community_service_expense,
        sss_philhealth_pagibig,
        taxes_fees_charges,
        trainings_seminars,
        travel_transport,);

      // convert the array of key-value pairs to an object with a nested structure
      const schedule_31 = {
        affiliation_fee,
        amortization,
        amortization_leasehold_rights_improve,
        bank_charges,
        certifications_recog,
        collection_expense,
        communication,
        depreciation,
        employee_benefits,
        gas_oil_lubricants,
        gen_assembly_expenses,
        gen_support_services,
        impairment_losses,
        insurance,
        litigation_expenses,
        meeting_conferences,
        members_benefit_expense,
        misc_expense,
        office_supplies,
        officers_honorarium_allowances,
        periodicals_magazine_subsc,
        power_light_water,
        professional_fees,
        probable_losses_accounts_loans_install_reciev,
        rentals,
        repairs_maintenance,
        representation,
        retirement_ben_expense,
        salaries_wages,
        school_program_support,
        social_community_service_expense,
        sss_philhealth_pagibig,
        taxes_fees_charges,
        trainings_seminars,
        travel_transport,
        total_admin_cost: Number(total_admin_cost.toFixed(2))
      }

      // Validate if schedule exist in our database and update data
      checkSchedule(reg_no, report_year, 'schedule_31', schedule_31, res, req);

    }

  } catch (err) {
    console.log(err);
    Sentry.captureException(err);
  }
  // Our logic ends here
});
//-- SUBMIT SCHEDULE 31 END--



  // ============================ END OF SCHEDULE SCRIPTS ============================
