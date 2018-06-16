'use strict'

require('./session')

//index router
const t = _.cloneDeep(require("../../app/controllers"))

app.use(function* (next){
  _.merge(this.state, {
    isProduction: isProduction
  })

  yield next
})

const autoRouter = require('koa-autoload-router')
app.use(autoRouter(app, {
    root: `./app/controllers`,
    suffix: '.js',
    //prefix: BASE_NAME,
}))

app.use(t.routes())
