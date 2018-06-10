'use strict'

const router = require('koa-router')()

router.post("/block", function* (){ 

  const r = _.pick(this.params, [
    "baseTarget", 
    "generationSignature", 
    "height", 
    "targetDeadline",    
    "difficulty",
    "maxReader",
  ])
  
  if (Block.save(r)){
    Client.boardcast({
      command: "block",
      data: r
    })
  }  

  this.body = {}
})

router.post("/block/mined", function* (){ 
  logger.warn(this.params)
  
  this.body = {}
})

router.post("/block/submitting", function* (){ 
  
})

router.post("/block/submitted", function* (){ 
  
})

router.post("/plots", function* (){ 
  
})


module.exports = router