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

  // { nonce: 0,
  //   deadline: 0,
  //   best: 0,
  //   readedSize: 123045888,
  //   readElapsed: 7559,
  //   calcElapsed: 859,
  //   fileName: '399604754858490715_5000000_1922592_1922592',
  //   height: 500170 }

  Plots.saveStatsData(_.pick(this.params, ["fileName", "readedSize", "readElapsed", "calcElapsed"]))
  if (nonce > 0){  
    Block.saveStatsData(_.pick(this.params, ["height", "nonce", "deadline", "best"]))
  }

  Client.boardcastBaseInfo()  
  
  this.body = {}
})

router.post("/block/confiremd", function* (){ 
  
})

module.exports = router