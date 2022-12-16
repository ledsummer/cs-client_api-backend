const express = require('express');
const Sentry = require('../config/logs');
var moment = require('moment');
const format = require('../config/global');
const objectFormat = require('../config/objects');


//logs Sentry.infoLogMsg('Account Login fail', email);
const router = express.Router()

module.exports = router;

//call cais model
var { Cafs } = require("../model/cais");

// importing authentication
const auth = require("../middleware/auth");


  // ============================ START OF CAFS SCRIPTS ============================

//-- SUBMIT CAFS START--
router.post("/report", async (req, res) => {
    // Our submit capr logic starts here
    // Get capr input data
    const { reg_no, report_year, afs_audited_by, other_auditors, cash_cash_equivalent, loans_receivables, financial_assets, inventories, current_biological_assets, other_current_assets, financial_asset_long_term, investment_subsidaries, investment_associates, investment_joint_venture, investment_property, property_plant_equipment, non_biological_assets, intangible_assets, other_non_current_assets, deposit_liabilities, trade_other_payables, accrued_expenses, other_current_liabilities, loans_payable, bonds_payable, revolving_capital_payable, retirement_fund_payable, finance_lease_payable_longterm, other_non_current_liabilities, paidup_capital_common, paidup_capital_preferred, deposit_share_capital_sub, retained_earnings_restricted, surplus_free, statutory_funds, donations_grants, revaluation_surplus, reinvestment_fund_sustainable_capex } = req.body;

    try {
        // Validate capr input
        if ( !reg_no || !report_year || report_year < 2021 ) {
            const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
            res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
        } else {
           // check if capr already exist
           // Validate if capr exist in our database
           const cafsReport = await Cafs.exists({reg_no: reg_no, report_year: report_year});

           if (cafsReport) {
            const obj = "You already submitted report";
            res.status(200).json(format.apiResponse("error", "Report already submitted.", obj));
           } else{
            
                // create a new object with the safe numbers from the request body
                const safeNumbers = await {
                    cash_cash_equivalent: format.zeroHandler(cash_cash_equivalent),
                    loans_receivables: format.zeroHandler(loans_receivables),
                    financial_assets: format.zeroHandler(financial_assets),
                    inventories: format.zeroHandler(inventories),
                    current_biological_assets: format.zeroHandler(current_biological_assets),
                    other_current_assets: format.zeroHandler(other_current_assets),
                    financial_asset_long_term: format.zeroHandler(financial_asset_long_term),
                    investment_subsidaries: format.zeroHandler(investment_subsidaries),
                    investment_associates: format.zeroHandler(investment_associates),
                    investment_joint_venture: format.zeroHandler(investment_joint_venture),
                    investment_property: format.zeroHandler(investment_property),
                    property_plant_equipment: format.zeroHandler(property_plant_equipment),
                    non_biological_assets: format.zeroHandler(non_biological_assets),
                    intangible_assets: format.zeroHandler(intangible_assets),
                    other_non_current_assets: format.zeroHandler(other_non_current_assets),
                    deposit_liabilities: format.zeroHandler(deposit_liabilities), 
                    trade_other_payables: format.zeroHandler(trade_other_payables), 
                    accrued_expenses: format.zeroHandler(accrued_expenses), 
                    other_current_liabilities: format.zeroHandler(other_current_liabilities), 
                    loans_payable: format.zeroHandler(loans_payable), 
                    bonds_payable: format.zeroHandler(bonds_payable), 
                    revolving_capital_payable: format.zeroHandler(revolving_capital_payable), 
                    retirement_fund_payable: format.zeroHandler(retirement_fund_payable), 
                    finance_lease_payable_longterm: format.zeroHandler(finance_lease_payable_longterm), 
                    other_non_current_liabilities: format.zeroHandler(other_non_current_liabilities),
                    paidup_capital_common: format.zeroHandler(paidup_capital_common), 
                    paidup_capital_preferred: format.zeroHandler(paidup_capital_preferred), 
                    deposit_share_capital_sub: format.zeroHandler(deposit_share_capital_sub), 
                    retained_earnings_restricted: format.zeroHandler(retained_earnings_restricted), 
                    surplus_free: format.zeroHandler(surplus_free), 
                    statutory_funds: format.zeroHandler(statutory_funds), 
                    donations_grants: format.zeroHandler(donations_grants), 
                    revaluation_surplus: format.zeroHandler(revaluation_surplus), 
                    reinvestment_fund_sustainable_capex: format.zeroHandler(reinvestment_fund_sustainable_capex)
                };
                
                // compute the total_current_asset and totla_non_current_asset and others, and output with this format:
                const total_current_asset = await safeNumbers.cash_cash_equivalent + safeNumbers.loans_receivables + safeNumbers.financial_assets + safeNumbers.inventories + safeNumbers.current_biological_assets + safeNumbers.other_current_assets;

                const total_non_current_asset = await safeNumbers.financial_asset_long_term + safeNumbers.investment_subsidaries + safeNumbers.investment_associates+safeNumbers.investment_joint_venture + safeNumbers.investment_property +safeNumbers.property_plant_equipment + safeNumbers.non_biological_assets +safeNumbers.intangible_assets + safeNumbers.other_non_current_assets;

                const total_curren_liab = await safeNumbers.deposit_liabilities + safeNumbers.trade_other_payables + safeNumbers.accrued_expenses + safeNumbers.other_current_liabilities;
                const total_non_curr_liab = await safeNumbers.loans_payable + safeNumbers.bonds_payable + safeNumbers.revolving_capital_payable + safeNumbers.retirement_fund_payable + safeNumbers.finance_lease_payable_longterm + safeNumbers.other_non_current_liabilities;

                const total_members_equity = await safeNumbers.paidup_capital_common + safeNumbers.paidup_capital_preferred + safeNumbers.deposit_share_capital_sub + safeNumbers.retained_earnings_restricted + safeNumbers.surplus_free + safeNumbers.statutory_funds + safeNumbers.donations_grants + safeNumbers.revaluation_surplus + safeNumbers.reinvestment_fund_sustainable_capex;

                // convert the array of key-value pairs to an object with a nested structure
                const statement_financial_condition = await  {
                    assets: {
                        current_assets: {
                        cash_cash_equivalent: safeNumbers.cash_cash_equivalent,
                        loans_receivables: safeNumbers.loans_receivables,
                        financial_assets: safeNumbers.financial_assets,
                        inventories: safeNumbers.inventories,
                        biological_assets: safeNumbers.current_biological_assets,
                        other_current_assets: safeNumbers.other_current_assets,
                        total_current_assets: total_current_asset,
                        },
                        non_current_assets: {
                        financial_asset_long_term: safeNumbers.financial_asset_long_term,
                        investment_subsidaries: safeNumbers.investment_subsidaries,
                        investment_associates: safeNumbers.investment_associates,
                        investment_joint_venture: safeNumbers.investment_joint_venture,
                        investment_property: safeNumbers.investment_property,
                        property_plant_equipment: safeNumbers.property_plant_equipment,
                        biological_assets: safeNumbers.non_biological_assets,
                        intangible_assets: safeNumbers.intangible_assets,
                        other_non_current_assets: safeNumbers.other_non_current_assets,
                        total_non_current_assets: total_non_current_asset
                        }
                    },
                    liabilities: {
                        current_liabilities: {
                            deposit_liabilities: safeNumbers.deposit_liabilities,
                            trade_other_payables: safeNumbers.trade_other_payables,
                            accrued_expenses: safeNumbers.accrued_expenses,
                            other_current_liabilities: safeNumbers.other_current_liabilities,
                            total_current_liabilities: total_curren_liab
                        },
                        non_current_liabilities: {
                            loans_payable: safeNumbers.loans_payable,
                            bonds_payable: safeNumbers.bonds_payable,
                            revolving_capital_payable: safeNumbers.revolving_capital_payable,
                            retirement_fund_payable: safeNumbers.retirement_fund_payable,
                            finance_lease_payable_longterm: safeNumbers.finance_lease_payable_longterm,
                            other_non_current_liabilities: safeNumbers.other_non_current_liabilities,
                            total_non_current_liabilities: total_non_curr_liab
                        }
                    },
                    members_equity: {
                        paidup_capital_common: safeNumbers.paidup_capital_common, 
                        paidup_capital_preferred: safeNumbers.paidup_capital_preferred, 
                        deposit_share_capital_sub: safeNumbers.deposit_share_capital_sub, 
                        retained_earnings_restricted: safeNumbers.retained_earnings_restricted, 
                        surplus_free: safeNumbers.surplus_free, 
                        statutory_funds: safeNumbers.statutory_funds, 
                        donations_grants: safeNumbers.donations_grants, 
                        revaluation_surplus: safeNumbers.revaluation_surplus, 
                        reinvestment_fund_sustainable_capex: safeNumbers.reinvestment_fund_sustainable_capex,
                        total_members_equity: total_members_equity
                    },
                    total_assets: total_current_asset+total_non_current_asset,
                    total_liabilities: total_curren_liab+total_non_curr_liab,
                    total_liabilities_members_equity: total_curren_liab+total_non_curr_liab+total_members_equity
                }
                

                
                // save CAPR in our database
                const newCAFS = await Cafs.create({reg_no, report_year, afs_audited_by, other_auditors, statement_financial_condition });
           
                 // return new account details
                res.status(201).json(format.apiResponse("success", "App - CAFS save", newCAFS));
                //send transaction logs success
                Sentry.infoLogMsg('CAFS Created - registration:'+reg_no+' year:'+report_year, format.getIp(req));
           }
        }
    
      } catch (err) {
        console.log(err);
        Sentry.captureException(err);
      }
      // Our logic ends here
  });
//-- SUBMIT CAFS END --