//format array into objects wit the following value:
/* 
{
  1: {
    major: 'major1',
    sub: ['sub1', 'sub2']
  },
  2: {
    major: 'major2',
    sub: ['sub3', 'sub4']
  }
}
*/

module.exports.objValues =  function obj(main_array, sub_array) {
        const result = main_array.map((major, index) => ({
          major,
          sub: sub_array[index]
        }));

        return result;
  
  }

module.exports.memComposition = function obj(main_array, sub_array, count_array){

      const object = main_array.map((major, index) => ({
        major: major,
        sub: sub_array[index],
        number: count_array[index]
      }));
      
    return object;
}

module.exports.otherInfo = function obj(main_array, sub_array, count_array){

    const object = main_array.map((major, index) => ({
      type_investment: major,
      amount_invested: parseFloat(sub_array[index], 10),
      income_generated: parseFloat(count_array[index], 10)
    }));
    
  return object;
}

module.exports.lnicOtherInfo = function obj(main_array, sub_array){

    const object = main_array.map((major, index) => ({
      name_project: major,
      name_org: sub_array[index]
    }));
    
  return object;
}

module.exports.riskPoolingInfo = function obj(main_array, sub_array, count_array, amount_array){

    const object = main_array.map((major, index) => ({
      name_program: major,
      partner_insurance_provider: sub_array[index],
      no_member_beneficiary: count_array[index],
      amount: parseFloat(amount_array[index], 10)
    }));
    
  return object;
}

module.exports.addressOtherInfo = function obj(main_array, sub_array){

    const object = main_array.map((major, index) => ({
      name_affiliation: major,
      address_affiliation: sub_array[index]
    }));
    
  return object;
}

module.exports.memberArray = function arr(array_value) {
    const obj = Object.fromEntries([  ['male', array_value[0]],
    ['female', array_value[1]], ['total', array_value[0]+array_value[1] ]
    ]);
    return obj
}

module.exports.ageArray = function arr(array_value) {
    const obj = Object.fromEntries([  ['fr18to35', array_value[0]],
    ['fr36to59', array_value[1]], ['fr60above', array_value[2] ], ['total_mem', array_value[0]+array_value[1]+array_value[2] ]
    ]);
    return obj
}

module.exports.calculateObj = function arr(values) {
  for (const value of values) {
    if (!Number.isFinite(value)) {
      return { error: 'Values must be numbers.' };
    }
  }

  const balance_beg = values[0];
  const additions = values[1];
  const disposal = values[2];
  const total = balance_beg + additions - disposal;
  const impairment_loss = values[3];
  const accumulated_depreciation = values[4];
  const balance_end = total - impairment_loss - accumulated_depreciation;

  return {
      balance_beg,
      additions,
      disposal,
      total,
      impairment_loss,
      accumulated_depreciation,
      balance_end,
  };
  
}

module.exports.calculateSched22 = function arr(values) {
  for (const value of values) {
    if (!Number.isFinite(value)) {
      return { error: 'Values must be numbers.' };
    }
  }

  const balance_beg = values[0];
  const current_year_alloc = values[1];
  const total = balance_beg + current_year_alloc;
  const current_year_util = values[2];
  const balance_end = total - current_year_util;

  return {
      balance_beg,
      current_year_alloc,
      total,
      current_year_util,
      balance_end,
  };
  
}





