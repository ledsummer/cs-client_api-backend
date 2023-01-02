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
    const { reg_no, report_year, afs_audited_by, other_auditors, cash_cash_equivalent, loans_receivables, financial_assets, inventories, current_biological_assets, other_current_assets, financial_asset_long_term, investment_subsidaries, investment_associates, investment_joint_venture, investment_property, property_plant_equipment, non_biological_assets, intangible_assets, other_non_current_assets, deposit_liabilities, trade_other_payables, accrued_expenses, other_current_liabilities, loans_payable, bonds_payable, revolving_capital_payable, retirement_fund_payable, finance_lease_payable_longterm, other_non_current_liabilities, paidup_capital_common, paidup_capital_preferred, deposit_share_capital_sub, retained_earnings_restricted, surplus_free, statutory_funds, donations_grants, revaluation_surplus, reinvestment_fund_sustainable_capex, income_credit_operations, income_service_operations, income_marketing_operations, income_consumer_catering_operations, income_product_operations, other_income, financial_cost, selling_marketing_cost, administrative_cost, net_surplus_before_other_items, other_items, net_surplus, less_income_tax_due, net_surplus_for_allocation, reserve_fund, cetf_local, due_to_cetf, community_dev_fund, optional_fund, interest_share_capital, patronage_refund } = req.body;

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
                const safeNumbers =  {
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
                    reinvestment_fund_sustainable_capex: format.zeroHandler(reinvestment_fund_sustainable_capex),
                    income_credit_operations: format.zeroHandler(income_credit_operations),
                    income_service_operations: format.zeroHandler(income_service_operations),
                    income_marketing_operations: format.zeroHandler(income_marketing_operations),
                    income_consumer_catering_operations: format.zeroHandler(income_consumer_catering_operations),
                    income_product_operations: format.zeroHandler(income_product_operations),
                    other_income: format.zeroHandler(other_income),
                    financial_cost: format.zeroHandler(financial_cost),
                    selling_marketing_cost: format.zeroHandler(selling_marketing_cost),
                    administrative_cost: format.zeroHandler(administrative_cost),
                    net_surplus_before_other_items: format.zeroHandler(net_surplus_before_other_items), 
                    other_items, net_surplus: format.zeroHandler(net_surplus), 
                    less_income_tax_due: format.zeroHandler(less_income_tax_due), 
                    net_surplus_for_allocation: format.zeroHandler(net_surplus_for_allocation),
                    reserve_fund: format.percentageValue(reserve_fund),
                    cetf_local: format.percentageValue(cetf_local),
                    due_to_cetf: format.percentageValue(due_to_cetf),
                    community_dev_fund: format.percentageValue(community_dev_fund), 
                    optional_fund: format.percentageValue(optional_fund),
                    interest_share_capital: format.zeroHandler(interest_share_capital), 
                    patronage_refund: format.zeroHandler(patronage_refund)
                };
                
                // compute the total_current_asset and totla_non_current_asset and others, and output with this format:
                const total_current_asset = await safeNumbers.cash_cash_equivalent + safeNumbers.loans_receivables + safeNumbers.financial_assets + safeNumbers.inventories + safeNumbers.current_biological_assets + safeNumbers.other_current_assets;

                const total_non_current_asset = await safeNumbers.financial_asset_long_term + safeNumbers.investment_subsidaries + safeNumbers.investment_associates+safeNumbers.investment_joint_venture + safeNumbers.investment_property +safeNumbers.property_plant_equipment + safeNumbers.non_biological_assets +safeNumbers.intangible_assets + safeNumbers.other_non_current_assets;

                const total_curren_liab = await safeNumbers.deposit_liabilities + safeNumbers.trade_other_payables + safeNumbers.accrued_expenses + safeNumbers.other_current_liabilities;
                const total_non_curr_liab = await safeNumbers.loans_payable + safeNumbers.bonds_payable + safeNumbers.revolving_capital_payable + safeNumbers.retirement_fund_payable + safeNumbers.finance_lease_payable_longterm + safeNumbers.other_non_current_liabilities;

                const total_members_equity = await safeNumbers.paidup_capital_common + safeNumbers.paidup_capital_preferred + safeNumbers.deposit_share_capital_sub + safeNumbers.retained_earnings_restricted + safeNumbers.surplus_free + safeNumbers.statutory_funds + safeNumbers.donations_grants + safeNumbers.revaluation_surplus + safeNumbers.reinvestment_fund_sustainable_capex;

                // convert the array of key-value pairs to an object with a nested structure
                const statement_financial_condition =  {
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

                const totalRevenues = await safeNumbers.income_credit_operations + safeNumbers.income_service_operations + safeNumbers.income_marketing_operations + safeNumbers.income_consumer_catering_operations + safeNumbers.income_product_operations + safeNumbers.other_income;

                const totalExpenses = await safeNumbers.financial_cost + safeNumbers.selling_marketing_cost + safeNumbers.administrative_cost;

                const totalStatutory = (safeNumbers.net_surplus_for_allocation * safeNumbers.reserve_fund)+(safeNumbers.net_surplus_for_allocation*safeNumbers.cetf_local)+(safeNumbers.net_surplus_for_allocation*safeNumbers.due_to_cetf)+(safeNumbers.net_surplus_for_allocation*safeNumbers.community_dev_fund)+(safeNumbers.net_surplus_for_allocation*safeNumbers.optional_fund);

                const statement_operation = {
                    revenues: {
                        income_credit_operations: safeNumbers.income_credit_operations,
                        income_service_operations: safeNumbers.income_service_operations,
                        income_marketing_operations: safeNumbers.income_marketing_operations,
                        income_consumer_catering_operations: safeNumbers.income_consumer_catering_operations,
                        income_product_operations: safeNumbers.income_product_operations,
                        other_income: safeNumbers.other_income,
                        total_revenues: totalRevenues
                    },
                    expenses: {
                        financial_cost: safeNumbers.financial_cost,
                        selling_marketing_cost: safeNumbers.selling_marketing_cost,
                        administrative_cost: safeNumbers.administrative_cost,
                        total_expenses: totalExpenses
                    },
                    net_surplus_before_other_items: safeNumbers.net_surplus_before_other_items,
                    other_items: safeNumbers.other_items,
                    net_surplus: safeNumbers.net_surplus,
                    less_income_tax_due: safeNumbers.less_income_tax_due,
                    net_surplus_for_allocation: safeNumbers.net_surplus_for_allocation,
                    allocation: {
                        reserve_fund: {
                            percnt_net_surpus: reserve_fund,
                            amount: Math.round(safeNumbers.net_surplus_for_allocation * safeNumbers.reserve_fund)
                        },
                        coop_educ_training_fund: {
                            cetf_local: {
                                percnt_net_surpus: cetf_local,
                                amount: Math.round(safeNumbers.net_surplus_for_allocation * safeNumbers.cetf_local)
                            },
                            due_to_cetf: {
                                percnt_net_surpus: due_to_cetf,
                                amount: Math.round(safeNumbers.net_surplus_for_allocation * safeNumbers.due_to_cetf)
                            }
                        },
                        community_dev_fund: {
                            percnt_net_surpus: community_dev_fund,
                            amount: Math.round(safeNumbers.net_surplus_for_allocation * safeNumbers.community_dev_fund)
                        },
                        optional_fund: {
                            percnt_net_surpus: optional_fund,
                            amount: Math.round(safeNumbers.net_surplus_for_allocation * safeNumbers.optional_fund)
                        },
                        total_statutory_reserve: totalStatutory.toFixed(2),
                        interest_share_capital: safeNumbers.interest_share_capital,
                        patronage_refund: safeNumbers.patronage_refund,
                        total: Math.round(totalStatutory + safeNumbers.interest_share_capital + safeNumbers.patronage_refund)
                    }
                }
                
                // save CAPR in our database
                const newCAFS = await Cafs.create({reg_no, report_year, afs_audited_by, other_auditors, statement_financial_condition, statement_operation  });
           
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


  //-- START VIEW CAFS --
  router.get("/report/:reg_no/:report_year", async (req, res) => {
    // View capr logic starts here
    // Get capr input data
    const  reg_no = req.params.reg_no;
    const  report_year = req.params.report_year;
  
    try {
        // Validate capr input
        if ( !reg_no || !report_year || report_year < 2021 ) {
            const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
            res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
        } else {
           // check if capr already exist
           // Validate if capr exist in our database
           const cafsReport = await Cafs.findOne({reg_no: reg_no, report_year: report_year});
  
           if (cafsReport) {
            res.status(200).json(format.apiResponse("success", "Report found.", cafsReport));
           } else {
            const obj = "Registration Number or Report Year cannot be found";
                res.status(200).json(format.apiResponse("error", "Report error.", obj));
                //send transaction logs success
                Sentry.infoLogMsg('CAFS viewed - registration:'+reg_no+' year:'+report_year, format.getIp(req));
           }
        }
    
      } catch (err) {
        console.log(err);
        Sentry.captureException(err);
      }
      // Our logic ends here
  });
  //-- END VIEW CAFS --


//-- UPDATE CAFS END--
router.put("/report/:reg_no/:report_year", async (req, res) => {
    // View capr logic starts here
    // Get capr input data
    const  reg_no = req.params.reg_no;
    const  report_year = req.params.report_year;
  
    // Get capr input data
    const {  afs_audited_by, other_auditors, cash_cash_equivalent, loans_receivables, financial_assets, inventories, current_biological_assets, other_current_assets, financial_asset_long_term, investment_subsidaries, investment_associates, investment_joint_venture, investment_property, property_plant_equipment, non_biological_assets, intangible_assets, other_non_current_assets, deposit_liabilities, trade_other_payables, accrued_expenses, other_current_liabilities, loans_payable, bonds_payable, revolving_capital_payable, retirement_fund_payable, finance_lease_payable_longterm, other_non_current_liabilities, paidup_capital_common, paidup_capital_preferred, deposit_share_capital_sub, retained_earnings_restricted, surplus_free, statutory_funds, donations_grants, revaluation_surplus, reinvestment_fund_sustainable_capex, income_credit_operations, income_service_operations, income_marketing_operations, income_consumer_catering_operations, income_product_operations, other_income, financial_cost, selling_marketing_cost, administrative_cost, net_surplus_before_other_items, other_items, net_surplus, less_income_tax_due, net_surplus_for_allocation, reserve_fund, cetf_local, due_to_cetf, community_dev_fund, optional_fund, interest_share_capital, patronage_refund } = req.body;
  
    try {
        // Validate capr input
        if ( !reg_no || !report_year || report_year < 2021 ) {
            const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted."];
            res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
        } else {
           // Validate if capr exist in our database
            // create a new object with the safe numbers from the request body
            const safeNumbers = {
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
                reinvestment_fund_sustainable_capex: format.zeroHandler(reinvestment_fund_sustainable_capex),
                income_credit_operations: format.zeroHandler(income_credit_operations),
                income_service_operations: format.zeroHandler(income_service_operations),
                income_marketing_operations: format.zeroHandler(income_marketing_operations),
                income_consumer_catering_operations: format.zeroHandler(income_consumer_catering_operations),
                income_product_operations: format.zeroHandler(income_product_operations),
                other_income: format.zeroHandler(other_income),
                financial_cost: format.zeroHandler(financial_cost),
                selling_marketing_cost: format.zeroHandler(selling_marketing_cost),
                administrative_cost: format.zeroHandler(administrative_cost),
                net_surplus_before_other_items: format.zeroHandler(net_surplus_before_other_items),
                other_items, net_surplus: format.zeroHandler(net_surplus),
                less_income_tax_due: format.zeroHandler(less_income_tax_due),
                net_surplus_for_allocation: format.zeroHandler(net_surplus_for_allocation),
                reserve_fund: format.percentageValue(reserve_fund),
                cetf_local: format.percentageValue(cetf_local),
                due_to_cetf: format.percentageValue(due_to_cetf),
                community_dev_fund: format.percentageValue(community_dev_fund),
                optional_fund: format.percentageValue(optional_fund),
                interest_share_capital: format.zeroHandler(interest_share_capital),
                patronage_refund: format.zeroHandler(patronage_refund)
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

            const totalRevenues = await safeNumbers.income_credit_operations + safeNumbers.income_service_operations + safeNumbers.income_marketing_operations + safeNumbers.income_consumer_catering_operations + safeNumbers.income_product_operations + safeNumbers.other_income;

            const totalExpenses = await safeNumbers.financial_cost + safeNumbers.selling_marketing_cost + safeNumbers.administrative_cost;

            const totalStatutory = await (safeNumbers.net_surplus_for_allocation*safeNumbers.reserve_fund)+(safeNumbers.net_surplus_for_allocation*safeNumbers.cetf_local)+(safeNumbers.net_surplus_for_allocation*safeNumbers.due_to_cetf)+(safeNumbers.net_surplus_for_allocation*safeNumbers.community_dev_fund)+(safeNumbers.net_surplus_for_allocation*safeNumbers.optional_fund);

            const statement_operation = await {
                revenues: {
                    income_credit_operations: safeNumbers.income_credit_operations,
                    income_service_operations: safeNumbers.income_service_operations,
                    income_marketing_operations: safeNumbers.income_marketing_operations,
                    income_consumer_catering_operations: safeNumbers.income_consumer_catering_operations,
                    income_product_operations: safeNumbers.income_product_operations,
                    other_income: safeNumbers.other_income,
                    total_revenues: totalRevenues
                },
                expenses: {
                    financial_cost: safeNumbers.financial_cost,
                    selling_marketing_cost: safeNumbers.selling_marketing_cost,
                    administrative_cost: safeNumbers.administrative_cost,
                    total_expenses: totalExpenses
                },
                net_surplus_before_other_items: safeNumbers.net_surplus_before_other_items, 
                other_items: safeNumbers.other_items, 
                net_surplus: safeNumbers.net_surplus, 
                less_income_tax_due: safeNumbers.less_income_tax_due, 
                net_surplus_for_allocation: safeNumbers.net_surplus_for_allocation,
                allocation: {
                    reserve_fund: {
                        percnt_net_surpus: reserve_fund,
                        amount: Math.round(safeNumbers.net_surplus_for_allocation*safeNumbers.reserve_fund)
                    },
                    coop_educ_training_fund: {
                        cetf_local: {
                          percnt_net_surpus: cetf_local,
                          amount: Math.round(safeNumbers.net_surplus_for_allocation*safeNumbers.cetf_local)
                        },
                        due_to_cetf: {
                          percnt_net_surpus: due_to_cetf,
                          amount: Math.round(safeNumbers.net_surplus_for_allocation*safeNumbers.due_to_cetf)
                        }
                      },
                    community_dev_fund: {
                        percnt_net_surpus: community_dev_fund,
                        amount: Math.round(safeNumbers.net_surplus_for_allocation*safeNumbers.community_dev_fund)
                    },
                    optional_fund: {
                        percnt_net_surpus: optional_fund,
                        amount: Math.round(safeNumbers.net_surplus_for_allocation*safeNumbers.optional_fund)
                    },
                    total_statutory_reserve: totalStatutory.toFixed(2),
                    interest_share_capital: safeNumbers.interest_share_capital,
                    patronage_refund: safeNumbers.patronage_refund,
                    total: (totalStatutory+safeNumbers.interest_share_capital+safeNumbers.patronage_refund).toFixed(2)
                }

            }
  
           const cafsReport = await Cafs.findOne({reg_no: reg_no, report_year: report_year});
           
  
           if (cafsReport) {
            cafsReport.afs_audited_by = afs_audited_by;
            cafsReport.other_auditors = other_auditors;
            cafsReport.statement_financial_condition = statement_financial_condition;
            cafsReport.statement_operation = statement_operation;
            cafsReport.save();
            res.status(200).json(format.apiResponse("success", "Report updated.", cafsReport));
            //send transaction logs success
            Sentry.infoLogMsg('CAFS updated registration:'+reg_no+' year:'+report_year, format.getIp(req) ); //send transaction logs public ip requestor
            
           } else {
            const obj = "Registration Number or Report Year cannot be found";
                res.status(200).json(format.apiResponse("error", "Report error.", obj));
           }
        }
    
      } catch (err) {
        console.log(err);
        Sentry.captureException(err);
      }
      // Our logic ends here
  });
  
  //-- UPDATE CAFS END--

  //-- DELETE CAFS --
  router.delete("/report/:reg_no/:report_year", async (req, res) => {
    // View capr logic starts here
    // Get capr input data
    const  reg_no = req.params.reg_no;
    const  report_year = req.params.report_year;
  
    try {
        // Validate capr input
        if ( !reg_no || !report_year || report_year < 2021 ) {
            const obj = ["registration number or report year might be null or empty", "Only 2021 and above report years are only accepted.", "report might be already deleted"];
            res.status(200).json(format.apiResponse("error", "Please provide input.", obj));
        } else {
           // check if capr already exist
           // Validate if capr exist in our database
           const cafsReport = await Cafs.findOneAndDelete({reg_no: reg_no, report_year: report_year});
  
           if (cafsReport) {
            res.status(200).json(format.apiResponse("success", "Report deleted.", cafsReport));
            //send transaction logs success
            Sentry.infoLogMsg('CAPR Deleted: registration:'+reg_no+' year:'+report_year, format.getIp(req));
  
           } else {
            const obj = "Registration Number or Report Year cannot be found";
                res.status(200).json(format.apiResponse("error", "Report error.", obj));
           }
        }
    
      } catch (err) {
        console.log(err);
        Sentry.captureException(err);
      }
      // Our logic ends here
  });


  // ============================ END OF CAFS SCRIPTS ============================
