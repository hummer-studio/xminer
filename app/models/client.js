'use strict'

const addon = require("../..//build/Release/miner")

class Client{
  constructor(ws){
    this.ws = ws
  }
  
  sendBaseInfo(){
    const confirmedBlocks = Block.getConfirmedBlocks()

    return this.ws.send(JSON.stringify({
      command: 'baseInfo',
      data: {
        minedBlocks: Block.getMinedAll().length,
        confirmedBlocks: confirmedBlocks.length,
        confirmedNonces: _.chain(confirmedBlocks).map((n) => n.nonces.length).sum().value(),
        capacity: Plots.getSize(),        
        bestNonce: Block.getBestNonce(),
        best360Nonce: Block.getLast360RoundNonce(),

        poolAddress: SETTINGS.pool_address,
        walletAddress: SETTINGS.wallet_address,
        targetDeadline: SETTINGS.deadline,
        maxReader: SETTINGS.max_reader,

        instruction: addon.getInstruction(),
      },
    }))
  }

  sendPoolLastBlock(){
    if (Pool.lastBlock){
      return this.ws.send(JSON.stringify({
        command: 'poolInfo',
        data: Pool.lastBlock,
      }))
    }
  }

  sendFreshBlock(){
    const freshBlock = Block.getFresh()
    if (freshBlock){
      return this.ws.send(JSON.stringify({
        command: 'block',
        data: _.merge({}, freshBlock, {
          progress: freshBlock.getMinedProgress(),          
        })
      }))      
    }
  }  

  sendPoolSubscribe(data){
    this.ws.send(JSON.stringify({
      command: 'poolSubscribe',
      data,
    }))
  }

  sendPoolMinerCount(data){
    this.ws.send(JSON.stringify({
      command: 'poolMiner',
      data,
    }))
  }

  static async boardcast(callback){
    await this.getAll().forEach(async (n) => {
      callback(new Client(n))
    })
  }

  static save(ws){
    ws.on("close", () => {
      logger.warn(`client closed.`)

      // this.remove(ws)

      if (this.getAll().size == 0){
        Pool.disconnect()
      }
    })

    const client = new Client(ws)

    client.sendFreshBlock()
    client.sendPoolLastBlock()
    client.sendBaseInfo()    

    if (this.getAll().size == 1){
      Pool.connect()
    }
  }

  // static remove(ws){
  //   // this.clients = _.filter(this.clients, (n) => n.ws != ws)

  //   if (this.clients.length == 0){
  //     Pool.disconnect()
  //   }
  // }

  static getAll(){
    return app.ws.server.clients

    //todo: improve

    const clients = []
    app.ws.server.clients.forEach((n) => clients.push(n))

    return clients
  }

  static async initialize(){
  }
}

module.exports = Client