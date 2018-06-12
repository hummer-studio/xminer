'use strict'

class Block{
  constructor(){
  }

  static getBestNonce(){
    return this.best
  }

  static getLast360RoundNonce(){
  }

  static saveStatsData(params){
    _.chain(this.all).find((n) => n.height == params.height).thru((r) => {
      if (!r){
        return
      }      

      if (!this.best.best || this.best.best < params.best){
        this.best = params
      }

      r.nonces = r.nonces || []
      r.nonces.push(_.omit(params, ["height"]))
    }).value()
  }

  // static findBestNonce(height){
  //   return _.chain(this.all)
  //           .find((n) => n.height == height)
  //           .get("nonces")
  //           .orderBy(["best"], ["desc"]).first().value()
  // }

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
    this.last360RoundBest = {}
  }  
}

module.exports = Block