'use strict'

const koa = require('koa')
global.app = new koa()

app.proxy = true        //for nginx forward

require('require-dir-all')('./initializers')

module.exports = function done(callback){
  if (_.isNil(global.initialized)){
    setImmediate(done, callback)
  }else{
    logger.info(`load config from ${_.chain(process.argv).get(1, "").split("/").last().value()}`)

    aigle.resolve(callback()).then(() => {}).catch((e) => {
      logger.error(`task is error!\n${e.stack || e}`)
    })    

    // aigle.resolve(callback()).then(process.exit).catch((e) => {
    //   logger.error(`task is error!\n${e.stack || e}`)
    //   process.exit()
    // })    
  }
}