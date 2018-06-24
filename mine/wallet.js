'use strict'

const request = require("request-promise")

class Wallet{
  // static getBlockId(height){
  //   return request({
  //     url: `${SETTINGS.wallet_address}/burst`,
  //     qs: {
  //       requestType: "getBlockId",
  //       height,
  //     },
  //     json: true
  //   })
  // }

  // static getBlockchainStatus(){
  //   return request({
  //     url: `${SETTINGS.wallet_address}/burst`,
  //     qs: {
  //       requestType: "getBlockchainStatus",
  //     },
  //     json: true
  //   })
  // }

  static send(command, params){
    return request({
      url: `${SETTINGS.wallet_address}/burst`,
      qs: _.merge({}, {
        requestType: command,
      }, params),
      json: true
    })    
  }
}

module.exports = Wallet