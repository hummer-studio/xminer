'use strict'

const WebSocketClient = require('ws'),
                  url = require("url")
                  
class Pool{
  constructor(ws){
    this.ws = ws
  }

  subscribe(account){
    this.ws.send(account)
  }

  static clear(){
    if (this.timer){
      clearInterval(this.timer)
      this.timer = null
    }

    if (this.autoReconnect){
      setTimeout(this.connect, 1000 * 5)
    }
  }

  static disconnect(){
    this.autoReconnect = false
    this.clear()

    this.instance.ws.terminate();
  }

  static connect(){
    this.autoReconnect = true

    const u = url.parse(SETTINGS.pool_address)
    const client = new WebSocketClient(`${u.protocol == "https:" ? "wss" : "ws"}://${u.host}/ws`);
  
    client.on('open', () => {
      logger.info(`ws connected`);      

      this.instance = new Pool(client)

      logger.info(`subscribe: ${Plots.getAccountId()}`)
      this.instance.subscribe(Plots.getAccountId())

      this.timer = setInterval(() => {
        client.ping()
      }, 1000 * 10)
    });

    client.on('error', (err) => {
      logger.error(`pool ws error.`)
    })

    client.on('close', () => {
      logger.warn(`pool ws closed`)

      Pool.clear()
    })

    client.on('message', function(message) {
      const data = JSON.parse(message)

      if (data.generationSignature){
        Pool.lastBlock = data
        
        Client.boardcastPoolInfo()
      }else if (data.address){
        Client.boardcastPoolSubscribe(data)          
      }      
    })
  }

  static async initialize(){
    this.lastBlock;    
    this.autoReconnect = true;
  }
}

module.exports = Pool