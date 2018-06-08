'use strict'

let baseName = ""

if (typeof(global) != 'undefined'){
  global.BASE_NAME = baseName
}

if (typeof(moment) == 'undefined'){
  global.moment = require('moment')
}
moment.locale('zh-cn')

module.exports = {  
  BASE_NAME: baseName,
}
