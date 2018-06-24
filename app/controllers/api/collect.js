'use strict'

const router = require('koa-router')()

router.post("/block", function* (){   
  if (Block.save(
    _.merge({mined: true}, _.pick(this.params, [
      "baseTarget", 
      "generationSignature", 
      "height", 
      "targetDeadline",
      "scoop",
    ]))
  )){
    Client.boardcastBlock()    
  }  

  this.body = {}
})

router.post("/block/mined", function* (){ 
  const { nonce } = this.params

  Plots.saveStatsData(_.pick(this.params, ["fileName", "nonce", "readedSize", "readElapsed", "calcElapsed"]))
  if (nonce > 0){  
    
  }

  Block.saveStatsData(_.pick(this.params, ["fileName", "height", "nonce", "deadline", "readedSize"]))

  Client.boardcastBaseInfo()
  Client.boardcastBlock()
  
  this.body = {}
})

module.exports = router