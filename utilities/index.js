'use strict'

module.exports = {
  retry: (times = 10, interval = 1000, func) => {
    return aigle.promisify(async.retry)({
      times: times,
      interval: interval,
    }, (done) => {
      func().then((n) => done(null, n)).catch(done)
    })  
  }
}