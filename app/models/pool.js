'use strict'

const WebSocketClient = require('websocket').client,
                  url = require("url")
                  
class Pool{
  constructor(ws){
    this.ws = ws
  }

  subscribe(account){
    this.ws.send(account)
  }

  static get(){
    return this.instance
  }

  static initialize(){    
    const client = new WebSocketClient();

    client.on('connectFailed', (error) => {
      logger.error(`connectFailed: ${error.toString()}`)
      setTimeout(() => Pool.initialize, 1000 * 5)        
    });
  
    client.on('connect', (connection) => {

      connection.on('error', function(error) {
        logger.error("Connection Error: " + error.toString());
      })

      //auto reconnect
      connection.on('close', () => {
        logger.error(`closed`)
        setTimeout(() => Pool.initialize, 1000 * 5)        
      })

      connection.on('message', function(message) {
        //message.type === 'utf8'

        const data = JSON.parse(message.utf8Data)
        if (data.generationSignature){
          Client.boardcast({
            command: 'poolInfo',
            data,
          })
        }else if (data.address){
          Client.boardcast({
            command: 'poolSubscribe',
            data,
          })
        }            
      })      

      this.instance = new Pool(connection)
      this.instance.subscribe("DGUV-F35Y-PPWM-2GX4D")
    });

    const u = url.parse(SETTINGS.pool_address)

    client.connect(`${u.protocol == "https:" ? "wss" : "ws"}://${u.host}/ws`);    
  }
}

module.exports = Pool