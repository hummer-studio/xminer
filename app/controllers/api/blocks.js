'use strict'

const router = require('koa-router')(),
      Wallet = require("../../../mine/wallet");

router.get("/", function* (){

  const totalCount = 360
  const nn = _.range(Block.getAll().length, totalCount, 100)

  yield aigle.resolve(nn).map((n) => {      
    return Wallet.send("getBlocks", {firstIndex: n})
  }).map(({blocks}) => blocks).then(_.flatten).filter((n) => {
    return n.height      
  }).map((r) => {    
    return _.merge({mined: false}, 
      _.pick(r, ['height', 'scoopNum', 'timestamp', 'baseTarget'])
    )      
  }).then((n) => _.orderBy(n, ["timestamp"])).forEach((n) => {
    Block.save(n)
  }).then((n) => {
    this.body = {
      status: 0,
      data: Block.getAll().slice(-totalCount)
    }
  })  
})

module.exports = router