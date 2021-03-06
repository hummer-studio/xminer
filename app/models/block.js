'use strict'

     const Wallet = require("../../mine/wallet"),     
{ getDifficulty } = require("../../mine/utilities")

class Block{
  constructor(params){
    this.readedSize = 0
    this.nonces = []   
     
    _.merge(this, params, {
      createdAt: params.mined ? new Date() * 1 : null,
      difficulty: getDifficulty(params.baseTarget)
    })
  }

  getMinedProgress(){  
    return this.readedSize / Plots.getScanSize(this.height >= 502000)
  }

  getBestNonce(){
    return _.chain(this.nonces).orderBy(["deadline"]).first().value()
  }

  static getConfirmedBlocks(){
    return _.chain(this.getMinedAll()).filter((n) => n.nonces.length > 0).value()
  }

  static getBestNonce(){
    return this.best
  }

  static getLast360RoundNonce(){
    return _.chain(this.getMinedAll())
            .slice(-360)
            .map((n) => n.getBestNonce())
            .compact()
            .orderBy(["deadline"])
            .first().value()
  }

  static saveStatsData(params){
    _.chain(this.getAll()).find((n) => n.height == params.height).thru((r) => {
      if (!r){
        return
      }

      r.readedSize += params.readedSize
      r.elapsed = new Date() * 1 - r.createdAt     

      if (!params.nonce){
        return
      }

      //global best
      if (!this.best || this.best.deadline > params.deadline){
        this.best = params
      }

      r.nonces = r.nonces || []
      r.nonces.push(params)      
    }).value()
  }  

  static save(params){
    return _.chain(this.getAll())
     .find((n) => n.height == params.height)
     .thru((r) => {
       if (r){
         return
       }

       this.fillTimestamp()

       const b = new Block(params)
       this.all.push(b)       

       return b
     }).value()
  }
  
  static getFresh(){
    return _.last(this.getMinedAll())
  }

  static getAll(){
    return this.all
  }

  static getMinedAll(){
    return _.filter(this.getAll(), (n) => n.mined)
  }

  static fillTimestamp(){
    _.chain(this.getAll()).reject((n) => n.timestamp).orderBy("height").forEach((m) => {
      Wallet.send("getBlock", {height: m.height}).then(({timestamp}) => {
        m.timestamp = timestamp
      })
    }).value()
  }

  static async initialize(){
    this.all = []

    this.best = null    
  }  
}

module.exports = Block