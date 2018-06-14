'use strict'

const _ = require("lodash")

const retry = (times = 10, interval = 1000, func) => {
  return aigle.promisify(async.retry)({
    times: times,
    interval: interval,
  }, (done) => {
    func().then((n) => done(null, n)).catch(done)
  })  
}

const humanSize = (s) => {
  if (parseInt(s / 1024 / 1024 / 1024 / 1024) > 0){
    return `${(s / 1024 / 1024 / 1024 / 1024).toFixed(2)} TB`
  }

  if (parseInt(s / 1024 / 1024 / 1024) > 0){
    return `${(s / 1024 / 1024 / 1024).toFixed(2)} GB`
  }

  if (parseInt(s / 1024 / 1024) > 0){
    return `${(s / 1024 / 1024).toFixed(2)} MB`
  }

  return `${(s / 1024).toFixed(2)} KB`
}

const humanSize2Bytes = (s) => {
  const d = parseFloat(s)

  if (/TB/.test(s)){
    return d * 1024 * 1024 * 1024 * 1024
  }

  if (/GB/.test(s)){
    return d * 1024 * 1024 * 1024
  }

  if (/MB/.test(s)){
    return d * 1024 * 1024
  }

  if (/KB/.test(s)){
    return d * 1024
  }
}

const humanDeadline = (s) => {
    // return moment.duration(s, "seconds").format("Y[y] M[m] D[d] hh:mm:ss")

  const r = [
    [Math.floor(s / (3600 * 24 * 30)), "m"],
    [Math.floor(s % (3600 * 24 * 30) / (3600 * 24)), "d"],
    [Math.floor(s % (3600 * 24 * 30) % (3600 * 24) / 3600), "hh"],
    [Math.floor(s % (3600 * 24 * 30) % (3600 * 24) % 3600 / 60), "mm"],
    [Math.floor(s % (3600 * 24 * 30) % (3600 * 24) % 3600 % 60), "ss"],
  ]

  return _.reduce(r, (rr, [ value, desc ]) => {    
    if (desc == 'hh'){
      return `${rr} ${_.padStart(value, 2, "0")}:`
    }

    if (desc == 'mm'){
      
      return `${rr}${_.padStart(value, 2, "0")}:`
    }

    if (desc == 'ss'){
      return `${rr}${_.padStart(value, 2, "0")}`
    }

    if (desc == "m" && value == 0 && rr.length == 0){
      return rr
    }

    if (desc == "d" && value == 0 && rr.length == 0){
      return rr
    }  

    return `${rr} ${value}${desc}`
  }, "").trim()
}

if (typeof(module)){
  module.exports = {
    retry, humanSize, humanDeadline, humanSize2Bytes
  }
}else{
  eval(`export { retry, humanSize, humanDeadline, humanSize2Bytes }`)
}