'use strict'

class Client{
  constructor(ws){
    this.ws = ws
  }
  
  sendBaseInfo(){
    return this.ws.send(JSON.stringify({
      command: 'baseInfo',
      data: {
        mined: Block.getAll().length,
        capacity: Plots.getSize(),
        files: Plots.getAll(),        
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
        data: freshBlock
      }))      
    }
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
  }

  static remove(ws){
    this.clients = _.filter(this.clients, (n) => n.ws != ws)
  }

  static getAll(){
    return this.clients
  }

  static async initialize(){
    this.clients = []
  }
}

module.exports = Client