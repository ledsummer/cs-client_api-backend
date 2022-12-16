const { Decimal128 } = require("mongodb");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const moment = require('moment');

const capr_schema = new mongoose.Schema({
    reg_no: String,
    report_year: { type: Number, min:2021, max: 9999 },
    submit_status: { type: Boolean, default: true},
    date_submitted: { type: Date, default: () => moment().toDate() }, 
    general_info: { 
        business_permit: String,
        tax_id_no: String,
        asset_size: String
    },
    business_activities: {
        annual_volume_bus: { type: Array, default: null},
        product_commodities:  { type: Array, default: null},
        service_render:  { type: Array, default: null},
        import_details: {
            import_items: { type: String, default: null },
            weight_import: { type: String, default: null },
            country_origin: { type: String, default: null }
        },
        export_details: {
            export_items: { type: String, default: null },
            weight_export: { type: String, default: null },
            country_destination: { type: String, default: null }
        },
    },
    membership: {
        primary: {
            regular_male: { type: Number, default: null },
            regular_female: { type: Number, default: null },
            regular_judicial: { type: Number, default: null },
            regular_total: { type: Number, default: null },
            associate_male: { type: Number, default: null },
            associate_female: { type: Number, default: null },
            associate_judicial: { type: Number, default: null },
            associate_total: { type: Number, default: null },
            mem_total: { type: Number, default: null },
        },
        secondary_total: { type: Number, default: null },
        tertiary_total: { type: Number, default: null },
        overall_total: { type: Number, default: null },
        membership_composition: { type: Array, default: null},
        employee_num: {
            male: { type: Number, default: null },
            female: { type: Number, default: null },
            total: { type: Number, default: null }
        },
        age_group: {
            fr18to35: { type: Number, default: null },
            fr36to59: { type: Number, default: null },
            fr60above: { type: Number, default: null },
            total_mem: { type: Number, default: null },
        }
    },
    tdlt: { 
        member_only: { type: Boolean, default: true},
        member_gross_sale_reciept: { type: Number, decimal: true, integer: false, default: null  },
        members_amount: { type: Number, decimal: true, integer: false, default: null },
        non_gross_sale_reciept: { type: Number, decimal: true, integer: false, default: null  },
        non_member_amount: { type: Number, decimal: true, integer: false, default: null  },
        total_amount: { type: Number, decimal: true, integer: false, default: null  },
        cte: { type: Boolean, default: true },
        cte_no: { type: String, default: null },
        date_issued: { type: Date, default: null },
        validty: { type: String, default: null },
        reason_no_cte: { type: String, default: null }
     },
     other_info: { 
        information_investment: { type: Array, default: null},
        iscpr: { 
            avg_share_month: { type: Number, decimal: true, integer: false, default: null },
            rate_interest_share_capital: { type: Number, decimal: true, integer: false, default: null },
            rate_patrionage_fund: { type: Number, decimal: true, integer: false, default: null },
        },
        affiliation_membership: { type: Array, default: null},
        remit_cetf_to_fed_union: {
            name_fed_union: { type: String, default: null },
            amount_remitted:  { type: Number, decimal: true, integer: false, default: null },
        },
        partnership_lnic: { type: Array, default: null},
        risk_pooling_act: { type: Array, default: null},
        no_branches: { type: Number, default: null },
        no_satellite: { type: Number, default: null },
    },
    other_info_type: { type: Array, default: null}
});
const capr = mongoose.model("capr", capr_schema);

const cafs_schema = new mongoose.Schema({
    reg_no: String,
    report_year: { type: Number, min:2021, max: 9999 },
    submit_status: { type: Boolean, default: true},
    date_submitted: { type: Date, default: () => moment().toDate() }, 
    afs_audited_by: Number,
    other_auditors: { type: Array, default: null},
    statement_financial_condition: {
        assets: {
            current_assets: {
                cash_cash_equivalent: { type: Number, decimal: true, integer: false, default: null  },
                loans_receivables: { type: Number, decimal: true, integer: false, default: null  },
                financial_assets: { type: Number, decimal: true, integer: false, default: null  },
                inventories: { type: Number, decimal: true, integer: false, default: null  },
                biological_assets: { type: Number, decimal: true, integer: false, default: null  },
                other_current_assets: { type: Number, decimal: true, integer: false, default: null  },
                total_current_assets: { type: Number, decimal: true, integer: false, default: null  }
            },
            non_current_assets: {
                financial_asset_long_term: { type: Number, decimal: true, integer: false, default: null  },
                investment_subsidaries: { type: Number, decimal: true, integer: false, default: null  },
                investment_associates: { type: Number, decimal: true, integer: false, default: null  },
                investment_joint_venture: { type: Number, decimal: true, integer: false, default: null  },
                investment_property: { type: Number, decimal: true, integer: false, default: null  },
                property_plant_equipment: { type: Number, decimal: true, integer: false, default: null  },
                biological_assets: { type: Number, decimal: true, integer: false, default: null  },
                intangible_assets: { type: Number, decimal: true, integer: false, default: null  },
                other_non_current_assets: { type: Number, decimal: true, integer: false, default: null  },
                total_non_current_assets: { type: Number, decimal: true, integer: false, default: null  }
            }
        },
        liabilities: {
            current_liabilities: {
                deposit_liabilities: { type: Number, decimal: true, integer: false, default: null  },
                trade_other_payables: { type: Number, decimal: true, integer: false, default: null  },
                accrued_expenses: { type: Number, decimal: true, integer: false, default: null  },
                other_current_liabilities: { type: Number, decimal: true, integer: false, default: null  },
                total_current_liabilities: { type: Number, decimal: true, integer: false, default: null  },
            },
            non_current_liabilities: {
                loans_payable: { type: Number, decimal: true, integer: false, default: null  },
                bonds_payable: { type: Number, decimal: true, integer: false, default: null  },
                revolving_capital_payable: { type: Number, decimal: true, integer: false, default: null  },
                retirement_fund_payable: { type: Number, decimal: true, integer: false, default: null  },
                finance_lease_payable_longterm: { type: Number, decimal: true, integer: false, default: null  },
                other_non_current_liabilities: { type: Number, decimal: true, integer: false, default: null  },
                total_non_current_liabilities: { type: Number, decimal: true, integer: false, default: null  },
            }

        },
        members_equity: {
            paidup_capital_common: { type: Number, decimal: true, integer: false, default: null  },
            paidup_capital_preferred: { type: Number, decimal: true, integer: false, default: null  },
            deposit_share_capital_sub: { type: Number, decimal: true, integer: false, default: null  },
            retained_earnings_restricted: { type: Number, decimal: true, integer: false, default: null  },
            surplus_free: { type: Number, decimal: true, integer: false, default: null  },
            statutory_funds: { type: Number, decimal: true, integer: false, default: null  },
            donations_grants: { type: Number, decimal: true, integer: false, default: null  },
            revaluation_surplus: { type: Number, decimal: true, integer: false, default: null  },
            reinvestment_fund_sustainable_capex: { type: Number, decimal: true, integer: false, default: null  },
            total_members_equity: { type: Number, decimal: true, integer: false, default: null  },
        },
        total_assets: { type: Number, decimal: true, integer: false, default: null  },
        total_liabilities: { type: Number, decimal: true, integer: false, default: null  },
        total_liabilities_members_equity: { type: Number, decimal: true, integer: false, default: null  }, 
    },
    statement_operation: {
        revenues: {
            income_credit_operations: { type: Number, decimal: true, integer: false, default: null  },
            income_service_operations: { type: Number, decimal: true, integer: false, default: null  },
            income_marketing_operations: { type: Number, decimal: true, integer: false, default: null  },
            income_consumer_catering_operations: { type: Number, decimal: true, integer: false, default: null  },
            income_product_operations: { type: Number, decimal: true, integer: false, default: null  },
            other_income: { type: Number, decimal: true, integer: false, default: null  },
            total_revenues: { type: Number, decimal: true, integer: false, default: null  },
        },
        expenses: {
            financial_cost: { type: Number, decimal: true, integer: false, default: null  },
            selling_marketing_cost: { type: Number, decimal: true, integer: false, default: null  },
            administrative_cost: { type: Number, decimal: true, integer: false, default: null  },
            total_expenses: { type: Number, decimal: true, integer: false, default: null  },
        },
        net_surplus_before_other_items: { type: Number, decimal: true, integer: false, default: null  },
        other_items: { type: Number, decimal: true, integer: false, default: null  },
        net_surplus: { type: Number, decimal: true, integer: false, default: null  },
        less_income_tax_due: { type: Number, decimal: true, integer: false, default: null  },
        net_surplus_for_allocation: { type: Number, decimal: true, integer: false, default: null  },
        allocation: {
            reserve_fund: {
                percnt_net_surpus: { type: Number, default: null  },
                amount: { type: Number, decimal: true, integer: false, default: null  },
            },
            coop_educ_training_fund: {
                cetf_local: {
                    percnt_net_surpus: { type: Number, default: null  },
                    amount: { type: Number, decimal: true, integer: false, default: null  },
                },
                due_to_cetf: {
                    percnt_net_surpus: { type: Number,  default: null  },
                    amount: { type: Number, decimal: true, integer: false, default: null  },
                }
            },
            community_dev_fund: { type: Number, decimal: true, integer: false, default: null  },
            optional_fund: { type: Number, decimal: true, integer: false, default: null  },
            total_statutory_reserve: { type: Number, decimal: true, integer: false, default: null  },
            interest_share_capital: { type: Number, decimal: true, integer: false, default: null  },
            patronage_refund: { type: Number, decimal: true, integer: false, default: null  },
            total: { type: Number, decimal: true, integer: false, default: null  }
        }
    }
});
const cafs = mongoose.model("cafs", cafs_schema);

module.exports = { Capr: capr, Cafs: cafs  }