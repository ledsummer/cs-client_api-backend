const express = require('express');
const Sentry = require('../config/logs');
var moment = require('moment');
const format = require('../config/global');
const objectFormat = require('../config/objects');


//logs Sentry.infoLogMsg('Account Login fail', email);
const router = express.Router()

module.exports = router;

//call cais model
var { Cais } = require("../model/cais");

// importing authentication
const auth = require("../middleware/auth");

//-- SUBMIT CAPR --
router.post("/capr", async (req, res) => {
    // Our submit capr logic starts here
    try {
        // Get capr input data
        const { reg_no, business_permit, tax_id_no, asset_size, major_classification, subclass_classification, major_product, subclass_product, major_servince, subclass_service, import_items, weight_import, country_origin, export_items, weight_export, country_destination, employee, regular_male, regular_female, regular_judicial, associate_male, associate_female, associate_judicial, secondary_total, tertiary_total, group_age, major_composition, sub_composition, count_composition, member_only,member_gross_sale_reciept, members_amount, non_gross_sale_reciept, non_member_amount, total_amount, cte, cte_no, date_issued, validty, reason_no_cte, type_investment, amount_invested, income_generated_investment, avg_share_month, rate_interest_share_capital, rate_patrionage_fund, name_affiliation, address_affiliation, name_fed_union, amount_remitted, lnic_name_project, name_lnio, pooling_name_project, partner_insurance_provder, no_member_beneficiary, amount, no_branches, no_satellite, other_info_type } = req.body;

        // Validate capr input
        if (!(reg_no)) {
          const obj = "values might be null or empty";
            res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
        } else {
           // check if capr already exist
           // Validate if capr exist in our database
           const caprReport = await Cais.exists({reg_no: reg_no});

           if (caprReport) {
            const obj = "You already submitted report";
            res.status(200).json(format.apiResponse("error", "Report already submitted.", obj));
           } else{

                const general_info = { business_permit, tax_id_no, asset_size};
                
                //business activities entries - START
                //capture the array data and format it to objects. ref: config/objects
                const annual_volume_bus = objectFormat.objValues(major_classification, subclass_classification);
                const product_commodities = objectFormat.objValues(major_product, subclass_product);
                const service_render = objectFormat.objValues(major_servince, subclass_service);

                const export_details = { export_items, weight_export, country_destination };
                const import_details = { import_items, weight_import, country_origin};

                const business_activities = { annual_volume_bus, product_commodities, service_render, export_details, import_details };
                //business activities entries - END

                //membership entries - START
                const regular_total =  regular_male+regular_female+regular_judicial;
                const associate_total =  associate_male+associate_female+associate_judicial;
                const mem_total = regular_total+associate_total;
                const primary = { regular_male, regular_female, regular_judicial, regular_total, associate_male, associate_female, associate_judicial, associate_total, mem_total};

                const employee_num = objectFormat.memberArray(employee);
                const age_group = objectFormat.ageArray(group_age);

                const overall_total = secondary_total+tertiary_total+mem_total;

                const membership_composition = objectFormat.memComposition(major_composition, sub_composition, count_composition);

                const membership = { primary, secondary_total, tertiary_total, overall_total, employee_num, age_group, membership_composition };
                //membership entries - END

                //Transactiom, Deposit Liabilities and Taxes entries - START
                const tdlt = { member_only,member_gross_sale_reciept, members_amount, non_gross_sale_reciept, non_member_amount, total_amount, cte, cte_no, date_issued, validty, reason_no_cte };
                  //Transactiom, Deposit Liabilities and Taxes entries - END

                 //Other relevant information - START
                 const information_investment = objectFormat.otherInfo(type_investment, amount_invested, income_generated_investment);

                 const iscpr = { avg_share_month, rate_patrionage_fund, rate_interest_share_capital  };
                 const affiliation_membership = objectFormat.addressOtherInfo(name_affiliation, address_affiliation);
                 const remit_cetf_to_fed_union = { name_fed_union, amount_remitted };
                 const partnership_lnic = objectFormat.lnicOtherInfo(lnic_name_project, name_lnio);
                 const risk_pooling_act = objectFormat.riskPoolingInfo(pooling_name_project, partner_insurance_provder, no_member_beneficiary, amount);

                 const other_info = { information_investment, iscpr, affiliation_membership, remit_cetf_to_fed_union, partnership_lnic, risk_pooling_act, no_branches, no_satellite };
                
                // save CAPR in our database
                const newCAPR = await Cais.create({reg_no, general_info, business_activities, membership, tdlt, other_info, other_info_type });
           
                 // return new account details
                res.status(201).json(format.apiResponse("success", "App - CAPR save", newCAPR));
                //send transaction logs success
                Sentry.infoLogMsg('CAPR Created Success', newCAPR);
           }
        }
    
      } catch (err) {
        console.log(err);
        Sentry.captureException(err);
      }
      // Our logic ends here
  });