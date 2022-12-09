const Sentry = require('@sentry/node');
Sentry.init({ dsn: 'https://165633f2eb394e1fa4ea21623233fdb4@o1316399.ingest.sentry.io/4504296913895424' });
module.exports = Sentry;

module.exports.infoLogMsg = function logMsg(transaction, email) {
    msg = 'Transaction: '+transaction+', from: '+email;
    Sentry.captureMessage(msg, 'info');
}