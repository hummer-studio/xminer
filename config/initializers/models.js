'use strict'

function getModelName(name){
  return name.split("_").map((n) => {
    return n.replace(/^\S/,function(s){return s.toUpperCase();})
  }).join("")
}

require('require-dir-all')(`../../app/models`, {
  map: (n) => {                
    global[getModelName(n.name)] = n.exports
    global[getModelName(n.name)].initialize()
  }
})

global.initialized = true
