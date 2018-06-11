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

  const { fileName, readedSize, readElapsed, calcElapsed} = this.params
  const { height, nonce, deadline, best } = this.params

  // { nonce: 0,
  //   deadline: 0,
  //   best: 0,
  //   readedSize: 123045888,
  //   readElapsed: 7559,
  //   calcElapsed: 859,
  //   fileName: '399604754858490715_5000000_1922592_1922592',
  //   height: 500170 }

  Plots.saveStatsData(fileName, readedSize, readElapsed, calcElapsed)
  if (nonce > 0){
    Block.saveStatsData(height, nonce, deadline, best)
  }

  aigle.resolve(Client.getAll()).map((n) => {
    n.sendBaseInfo()
  })  
  
  this.body = {}
})

router.post("/block/submitting", function* (){ 
  
})

router.post("/block/submitted", function* (){ 
  
})

router.post("/plots", function* (){ 
  
})


module.exports = router