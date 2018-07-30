'use strict'

const router = require('koa-router')()

router.get(/^\//, function* (){  
  yield this.render("vue")
})

module.exports = router