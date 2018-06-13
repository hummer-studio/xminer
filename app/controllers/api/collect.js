'use strict'

const router = require('koa-router')()

router.post("/block", function* (){   

  if (Block.save(_.pick(this.params, [
    "baseTarget", 
    "generationSignature", 
    "height", 
    "targetDeadline",    
    "difficulty",
    "maxReader",
    "scoop",
  ]))){
    Client.boardcastBlock()    
  }  

  this.body = {}
})

router.post("/block/mined", function* (){ 
  const { nonce } = this.params

  Plots.saveStatsData(_.pick(this.params, ["fileName", "readedSize", "readElapsed", "calcElapsed"]))  
  if (nonce > 0){  
    
  }

  Block.saveStatsData(_.pick(this.params, ["fileName", "height", "nonce", "deadline", "readedSize"]))

  Client.boardcastBaseInfo()
  Client.boardcastBlock()
  
  this.body = {}
})

router.post("/block/confiremd", function* (){ 
  
})

module.exports = router