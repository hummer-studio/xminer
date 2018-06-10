'use strict'

class Client{
  constructor(){

  }

  static boardcast(v){
    _.each(this.clients, (n) => {
      logger.info(`boardcast: ${JSON.stringify(v)}`)
      n.send(JSON.stringify(v))
    })
  }

  static save(ws){
    ws.on("close", () => {
      logger.warn(`client closed.`)
      Client.remove(ws)
    })

    this.clients.push(ws)

    const freshBlock = Block.getFresh()    
    if (freshBlock){      
      ws.send(JSON.stringify({
        command: 'block',
        data: freshBlock
      }))      
    }

    if (Pool.lastBlock){
      ws.send(JSON.stringify({
        command: 'poolInfo',
        data: Pool.lastBlock,
      }))
    }    

    ws.send(JSON.stringify({
      command: 'baseInfo',
      data: {
        mined: Block.getAll().length,
      },
    }))
  }

  static remove(ws){
    this.clients = _.filter(this.clients, (n) => n != ws)
  }

  static length(){
    return this.clients.length
  }

  static async initialize(){
    this.clients = []
  }
}

module.exports = Client