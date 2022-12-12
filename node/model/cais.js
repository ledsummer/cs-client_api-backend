const { Decimal128 } = require("mongodb");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const moment = require('moment');

const capr_schema = new mongoose.Schema({
    reg_no: String,
    report_year: { type: Number, min:2021, max: 9999 },
    submit_status: { type: Boolean, default: true},
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


module.exports = { Cais: capr }