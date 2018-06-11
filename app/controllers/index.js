'use strict'

const router = require('koa-router')()

const { humanSize } = require("../../utilities")

router.get(/^\//, function* (){  
  yield this.render("vue", {
    layout: './layout/vue',    
  })
})

module.exports = router