'use strict'

const dirRecursive = require("recursive-readdir"),
            //  aigle = require("aigle"),
            //      _ = require('lodash'),
            //  async = require("neo-async"),
              path = require("path"),
                fs = require("fs"),
           request = require("request-promise"),
             addon = require("./build/Release/miner");


const HTTP_TIMEOUT = 1000 * 15             
const REFRESH_MINE_INFO_TIME = 1000 * 15             
const MAX_RETRY_TIMES = 10
const ENV_CURRENT_HEIGHT = "currentHeight"
const BASE_DIFFICULTY = 4398046511104
let _currentHeight = 0

async function test(){  
  // process.env['env1'] = "nima"
  // setTimeout(() => {
  //   process.env['env1'] = "nima2"
  // }, 1000 * 5);

  // setTimeout(() => {
  //    console.log(process.env['env1'])
  // }, 1000 * 12);

  // addon.run({fuck: "haha"}, function(n1, n2){
  //   console.log(`it's me. ${n1}, ${n2}`);
  // })

  // return

  // addon.run({
  //   generationSignature: "ksdjhflksdjfklsjdklfjksldflksdjf",
  //   baseTarget: 1232443,
  //   height: 12345,
  //   targetDeadline: 9843758945,

  //   fullPath: _.first(files).fullPath,
  //   fileName: _.first(files).fileName,
  //   isPoc2: _.first(files).isPoc2,
  // }, function(){
  //   console.log("fuck out all")
  // })      

  // return 
}

async function worker(files){
  // return await test()
  
  const r = await aigle.promisify(async.retry)({
    times: 10,
    interval: 1000,
  }, (done) => {
    request.defaults({timeout: HTTP_TIMEOUT})({
      url: `${SETTINGS.pool_address}/burst`,
      qs: {
        requestType: 'getMiningInfo'
      },
      json: true,
    }).then((n) => done(null, n)).catch(done)
  })

  if (_currentHeight >= r.height){
    logger.info(`not found more height`)
    return
  }

  logger.info(r)    

  
  const difficulty = BASE_DIFFICULTY / 240 / r.baseTarget
  const targetDeadline = SETTINGS.targetDeadline == 0 ? r.targetDeadline : _.min([r.targetDeadline, SETTINGS.targetDeadline])      
  const maxReader = SETTINGS.max_reader == 0 ? _.min([SETTINGS.plots.length, 3]) : SETTINGS.max_reader  
  let best = targetDeadline * r.baseTarget
  _currentHeight = r.height

  process.env[ENV_CURRENT_HEIGHT] = r.height
  const f = aigle.promisify(async.eachLimit)(files, maxReader, (n, next) => {
    if (Number(process.env[ENV_CURRENT_HEIGHT]) != r.height){      
      logger.info("sssssssssssssssssssssssssssssssskip the block");
      next()
      return
    }

    logger.info(n)

    addon.run({
      generationSignature: r.generationSignature, 
      baseTarget: r.baseTarget,
      height: r.height,
      targetDeadline: targetDeadline,
      fullPath: n.fullPath, 
      fileName: n.fileName, 
      isPoc2: n.isPoc2,
    }, function (err, rr){              
      if (err){
        logger.error(err);

        next(err)          
        return
      }

      if (r.height < _currentHeight){
        next()
        return
      }

      if (rr.best >= best){
        logger.info(`skip this record.`)
        next()
        return
      }

      if (rr.nonce == 0){
        next()
        return
      }

      best = rr.best

      logger.info(rr);        

      aigle.promisify(async.retry)({
        times: MAX_RETRY_TIMES,
        interval: 1000,
      }, (done) => {
        if (rr.best > best){
          logger.info("skip this request")

          done()
          return
        }

        request.defaults({timeout: HTTP_TIMEOUT})({
          url: `${SETTINGS.pool_address}/burst`,
          qs: {
            requestType: 'submitNonce',
            nonce: rr.nonce,
            accountId: _.first(n.fileName.split("_")),
            blockheight: r.height,            
          },
          json: true
        }).then((r1) => done(null, r1)).catch(done)
      }).then((n) => {
        logger.info(n)
      }).catch(() => {
        logger.error("error")
      })
              
      next()
    })
  })

  await f

  logger.info(`mine done`)
}

async function socketIO(){
  // const s = require("socket.io-client")("wss://0-100-pool.burst.cryptoguru.org",  {path: "/ws"})  

  
  // s.on('connect', function(){
  //   log('connect')
  // });
  // s.on('event', function(data){
  //   log(data)
  // });

  // s.on('disconnect', function(){
  //   log("dis")
  // });

  // s.on("connect_error", function(err){
  //   log(err);
  // })

  var WebSocketClient = require('websocket').client;

  var client = new WebSocketClient();

  client.on('connectFailed', function(error) {
      console.log('Connect Error: ' + error.toString());
  });

  client.on('connect', function(connection) {
      console.log('WebSocket Client Connected');
      connection.on('error', function(error) {
          console.log("Connection Error: " + error.toString());
      });
      connection.on('close', function() {
          console.log('echo-protocol Connection Closed');
      });
      connection.on('message', function(message) {
          if (message.type === 'utf8') {
              console.log("Received: '" + message.utf8Data + "'");
          }
      });
      
      // function sendNumber() {
      //     if (connection.connected) {
      //         var number = Math.round(Math.random() * 0xFFFFFF);
      //         connection.sendUTF(number.toString());
      //         setTimeout(sendNumber, 1000);
      //     }
      // }
      // sendNumber();
  });

  // client.connect('wss://0-100-pool.burst.cryptoguru.org/ws', 'echo-protocol');
  client.connect('wss://0-100-pool.burst.cryptoguru.org/ws');
}

require("./config")(async function () {
  return socketIO()

  const r = await aigle.resolve(dirRecursive("/Volumes/plots")).then((n) => {
    return _.flatten(n)
  }).map((fullPath) => {

    const fileName = path.parse(fullPath).name
    const [accountId, nonceStart, nonceSize, staggerSize] = fileName.split("_")

    if (accountId == null || nonceStart == null || nonceSize == null){
      return
    }

    return {
      fullPath,
      fileName,
      fileSize: fs.statSync(fullPath).size,
      isPoc2: staggerSize == null,
    }    
  }).then(_.compact).sortBy((n) => -n.fileSize).then((n) => {
    return _.uniqBy(n, m => m.fullPath)
  }).then((n) => {
    // return _.filter(n, m => /_389096_/.test(m.fileName))
    return n
    // return _.filter(n, m => /_800000000_/.test(m.fileName))
    // return _.filter(n, m => /_810000000_40960$/.test(m.fileName))
    // return _.filter(n, m => /_810000000_40960_40960$/.test(m.fileName))
    // return [_.find(n, m => /_4096$/.test(m.fileName))]
    // return _.filter(n, m => m.isPoc2)
  })

  setInterval(() => worker(r),  REFRESH_MINE_INFO_TIME)
})