'use strict'

class Client{
  constructor(){

  }

  static boardcast(v){
    _.each(this.clients, (n) => {
      n.send(JSON.stringify(v))
    })
  }

  static save(ws){
    ws.on("close", () => {
      logger.warn(`client closed.`)
      Client.remove(ws)
    })

    this.clients.push(ws)
  }

  static remove(ws){
    this.clients = _.filter(this.clients, (n) => n != ws)
  }

  static length(){
    return this.clients.length
  }

  static initialize(){
    this.clients = []
  }
}

module.exports = Client