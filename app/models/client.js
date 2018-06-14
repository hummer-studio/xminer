'use strict'

class Client{
  constructor(ws){
    this.ws = ws
  }
  
  sendBaseInfo(){
    const confirmedBlocks = Block.getConfirmedBlocks()

    return this.ws.send(JSON.stringify({
      command: 'baseInfo',
      data: {
        minedBlocks: Block.getAll().length,
        confirmedBlocks: confirmedBlocks.length,
        confirmedNonces: _.chain(confirmedBlocks).map((n) => n.nonces.length).sum().value(),
        capacity: Plots.getSize(),        
        bestNonce: Block.getBestNonce(),
        best360Nonce: Block.getLast360RoundNonce(),
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

  static boardcastPoolSubscribe(data){
    return aigle.map(this.clients, (n) => n.sendPoolSubscribe(data))
  }

  static boardcastPoolInfo(){
    return aigle.map(this.clients, (n) => n.sendPoolLastBlock())
  }

  static boardcastBaseInfo(){
    return aigle.map(this.clients, (n) => n.sendBaseInfo())
  }

  static boardcastBlock(){    
    return aigle.map(this.clients, (n) => n.sendFreshBlock())
  }

  static boardcast(v){
    return aigle.map(this.clients, (n) => n.ws.send(JSON.stringify(v)))    
  }

  static save(ws){
    ws.on("close", () => {
      logger.warn(`client closed.`)
      Client.remove(ws)
    })

    const client = new Client(ws)

    client.sendFreshBlock()
    client.sendPoolLastBlock()
    client.sendBaseInfo()    

    this.clients.push(client)

    if (this.clients.length == 1){
      Pool.connect()
    }
  }

  static remove(ws){
    this.clients = _.filter(this.clients, (n) => n.ws != ws)

    if (this.clients.length == 0){
      Pool.disconnect()
    }
  }

  static getAll(){
    return this.clients
  }

  static async initialize(){
    this.clients = []
  }
}

module.exports = Client