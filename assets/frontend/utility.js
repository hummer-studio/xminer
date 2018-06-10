'use strict'

import _ from "lodash"
import moment from "moment"

export function deadline2Human(s){ 
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
  }, "")
}