'use strict'

class Block{
  constructor(){
  }

  static getBestNonce(){
    return _.chain(this.best).get("deadline").value()
  }

  static getLast360RoundNonce(){
    return _.chain(this.all)
            .slice(-360)
            .map("best")
            .compact()
            .orderBy(["deadline"], ["asc"])
            .first().get("deadline").value()
  }

  static saveStatsData(params){
    _.chain(this.all).find((n) => n.height == params.height).thru((r) => {
      if (!r){
        return
      }      

      //global best
      if (!this.best.best || this.best.best < params.best){
        this.best = params
      }

      if (!r.best || r.best < params.best){
        r.best = params
      }

      r.nonces = r.nonces || []
      r.nonces.push(params)
    }).value()
  }  

  static save(params){
    return _.chain(this.all)
     .find((n) => n.height == params.height)
     .thru((r) => {
       if (r){
         return
       }

       this.all.push(params)       
       return params
     }).value()
  }
  
  static getFresh(){
    return _.last(this.all)
  }

  static getAll(){
    return this.all
  }

  static async initialize(){
    this.all = []

    this.best = {}
  }  
}

module.exports = Block