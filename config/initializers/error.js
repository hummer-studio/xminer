'use strict'

require("./global")
const Raven = require('raven')

if (isProduction){
  Raven.config('https://a5b90a6cf9044f028dd3f7396ab50d34@sentry.io/1232569').install();
}

app.on("error", (err, ctx) => {
  logger.error(err)

  if (isProduction){
    Raven.captureException(err, {req: ctx.req})
  }
})
