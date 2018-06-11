'use strict'

class Client{
  constructor(ws){
    this.ws = ws
  }
  
  sendBaseInfo(){
    this.ws.send(JSON.stringify({
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
      this.ws.send(JSON.stringify({
        command: 'poolInfo',
        data: Pool.lastBlock,
      }))
    }        
  }

  sendFreshBlock(){
    const freshBlock = Block.getFresh()    
    if (freshBlock){      
      this.ws.send(JSON.stringify({
        command: 'block',
        data: freshBlock
      }))      
    }
  }

  static boardcast(v){
    _.each(this.clients, (n) => {
      logger.info(`boardcast: ${JSON.stringify(v)}`)
      n.ws.send(JSON.stringify(v))
    })
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