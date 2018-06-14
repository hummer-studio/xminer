'use strict'

const router = require('koa-router')()

router.get("/", function* (){
  this.body = {
    status: 0,
    data: _.chain(Plots.getAll()).map((n) => _.omit(n, ["fullPath", "isPoc2"])).value(),
  }
})

module.exports = router