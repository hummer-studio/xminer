'use strict'

function getModelName(name){
  return name.split("_").map((n) => {
    return n.replace(/^\S/,function(s){return s.toUpperCase();})
  }).join("")
}

;(async () => {
  const initFunc = []

  require('require-dir-all')(`../../app/models`, {
    map: async (n) => {                
      global[getModelName(n.name)] = n.exports

      initFunc.push(global[getModelName(n.name)].initialize())      
    }
  })
  
  await aigle.all(initFunc)
  global.initialized = true
})()
