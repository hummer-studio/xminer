'use strict'

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
    port: process.env["PORT"] || "3000",
    plots_directory_path: process.env["PLOTS_DIRECTORY_PATH"].split(","),
    pool_address: process.env["POOL_ADDRESS"],
    wallet_address: process.env["WALLET_ADDRESS"] || "https://wallet3.burst-team.us:2083",
    deadline: Number(process.env["DEADLINE"] || 3600 * 24 * 30 * 6),
    max_reader: Number(process.env["MAX_READER"] || 2),
  }
}

SETTINGS = _.merge({}, SETTINGS['defaults'], SETTINGS[process.env['NODE_ENV'] || "development"])