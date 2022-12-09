//computing reward points
module.exports.rewardPoints = function reward(amount) {
    const totalPoints = 1000;
    return pointsEarned = (amount*100)/totalPoints;
 }

//compute the total reward points earned, total purchase, total number of transaction

module.exports.totalDetails = function showAll(arrayName) {
    var _sumPoints = arrayName.map(element => element.pointsEarned).reduce((a, b) => a + b, 0);
    var _sumPurchase = arrayName.map(element => element.purchaseAmount).reduce((a, b) => a + b, 0);
    var length = arrayName.length;

    const response = [];
    response.push( { reward:_sumPoints, amount: _sumPurchase, total: length } );
    return response[0];
}