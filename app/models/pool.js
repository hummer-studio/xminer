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
      setTimeout(() => this.connect, 1000 * 5)
    }
  }

  static disconnect(){
    this.autoReconnect = false
    this.clear()

    if (this.instance){
      this.instance.ws.terminate();

      this.instance = null
    }    
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
        try{ client.ping() }catch(e){}
        
      }, 1000 * 10)
    });

    client.on('error', (err) => {
      logger.error(`pool ws error.`)
    })

    client.on('close', () => {
      logger.warn(`pool ws closed`)

      this.clear()
    })

    client.on('message', (message) => {
      const data = JSON.parse(message)

      if (data.generationSignature){
        this.lastBlock = data
        
        Client.boardcastPoolInfo()
      }else if (data.address){
        Client.boardcastPoolSubscribe(data)          
      }      
    })
  }

  static async initialize(){
    this.instance;
    this.lastBlock;    
    this.autoReconnect = true;
  }
}

module.exports = Pool