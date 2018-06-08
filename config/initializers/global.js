'use strict'

require("../../common")

global._ = require('lodash')

global.async = require('neo-async')
global.aigle = require('aigle')
global.isProduction = process.env.NODE_ENV == 'production'

global.SETTINGS = {
  development: {
  },

  production: {
  },

  defaults: {        
  }
}

SETTINGS = _.merge({}, SETTINGS['defaults'], SETTINGS[process.env['NODE_ENV'] || "development"], require("../config"))
