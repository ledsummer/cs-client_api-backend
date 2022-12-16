const { Decimal128 } = require("mongodb");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const moment = require('moment');

const schedule = new mongoose.Schema({
    cafs_id: String,
    schedule_1: {
        cash_on_hand: { type: Number, decimal: true, integer: false, default: null  },
        checks_other_cash_items: { type: Number, decimal: true, integer: false, default: null  },
        cash_in_bank: { type: Number, decimal: true, integer: false, default: null  },
        cash_in_cooperative_federations: { type: Number, decimal: true, integer: false, default: null  },
        petty_cash_fund: { type: Number, decimal: true, integer: false, default: null  },
        revolving_fund: { type: Number, decimal: true, integer: false, default: null  },
        change_fund: { type: Number, decimal: true, integer: false, default: null  },
        atm_fund: { type: Number, decimal: true, integer: false, default: null  },
        total_cash_cash_equivalents: { type: Number, decimal: true, integer: false, default: null  },
    },
    schedule_2: {
        loans_receivable: {
            current: { type: Number, decimal: true, integer: false, default: null  },
            past_due: { 
                one_30_days: { type: Number, decimal: true, integer: false, default: null  },
                thirty_one_360_days: { type: Number, decimal: true, integer: false, default: null  },
                over_360_days: { type: Number, decimal: true, integer: false, default: null  },
                total_past_due_loans: { type: Number, decimal: true, integer: false, default: null  },
              },
            restructure: { type: Number, decimal: true, integer: false, default: null  },
            loans_litigation: { type: Number, decimal: true, integer: false, default: null  },
            less_unearned_interest_discounts: { type: Number, decimal: true, integer: false, default: null  },
            less_allowance_for_probable_losses_on_loans: { type: Number, decimal: true, integer: false, default: null  },
            net_loans_receivable: { type: Number, decimal: true, integer: false, default: null  },
        },
        account_receivable: {
           current: { type: Number, decimal: true, integer: false, default: null  },
           past_due: {
            one_30_days: { type: Number, decimal: true, integer: false, default: null  },
            thirty_one_360_days: { type: Number, decimal: true, integer: false, default: null  },
            over_360_days: { type: Number, decimal: true, integer: false, default: null  },
            total_past_due_accounts_receivable: { type: Number, decimal: true, integer: false, default: null  },
           },
           restructure: { type: Number, decimal: true, integer: false, default: null  },
           in_litigation: { type: Number, decimal: true, integer: false, default: null  },
           less_allowance_for_probable_losses_on_accounts_receivables: { type: Number, decimal: true, integer: false, default: null  },
           net_accounts_receivable: { type: Number, decimal: true, integer: false, default: null  }, 
        },
        intallment_receivable: {
            current: { type: Number, decimal: true, integer: false, default: null  },
            past_due: { type: Number, decimal: true, integer: false, default: null  },
            restructure: { type: Number, decimal: true, integer: false, default: null  },
            in_litigation: { type: Number, decimal: true, integer: false, default: null  },
            less_allowance_for_probable_losses_on_installment: { type: Number, decimal: true, integer: false, default: null  },
            unrealized_gross_margin: { type: Number, decimal: true, integer: false, default: null  },
        },
        sales_contract_receivable: {
            less_allowance_for_probable_losses_sales_contract: { type: Number, decimal: true, integer: false, default: null  },
            net_sales_contract_receivable: { type: Number, decimal: true, integer: false, default: null  },
        },
        service_receivable: { type: Number, decimal: true, integer: false, default: null  },
        account_receivable_non_trade: { type: Number, decimal: true, integer: false, default: null  },
        advances_officers_emp_members: { type: Number, decimal: true, integer: false, default: null  },
        due_accountable_officers_emp: { type: Number, decimal: true, integer: false, default: null  },
        finance_less_receivable: { type: Number, decimal: true, integer: false, default: null  },
        less_allowance_for_impairment_finance_lease: { type: Number, decimal: true, integer: false, default: null  },
        other_current_receivables: { type: Number, decimal: true, integer: false, default: null  },
        total_loans_receivables: { type: Number, decimal: true, integer: false, default: null  },
    },
    schedule_3: {
        financial_asset_fair_value_profit_loss: { type: Number, decimal: true, integer: false, default: null  },
        financial_asset_cost: { type: Number, decimal: true, integer: false, default: null  },
        total_financial_assets: { type: Number, decimal: true, integer: false, default: null  },
    },
    schedule_4: {
        
    }
});

const afs_schedule = mongoose.model("afs_schedule", schedule);

module.exports = { Schedule: afs_schedule }