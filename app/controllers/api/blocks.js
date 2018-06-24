'use strict'

const router = require('koa-router')()

router.get("/", function* (){
  this.body = {
    status: 0,
    data: Block.getAll()
  }  
})

module.exports = router