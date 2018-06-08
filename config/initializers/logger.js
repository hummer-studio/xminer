'use strict'

const log4js = require('koa-log4')

log4js.configure({
  appenders: {
    out: { type: 'stdout' },
  },
  categories: {
    default: {appenders: ['out'], level: "all" }
  },
  pm2: isProduction,
})

app.use(log4js.koaLogger(log4js.getLogger("http"), { level: 'auto' }))

global.logger = log4js.getLogger("manual")
