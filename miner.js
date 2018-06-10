'use strict'

const dirRecursive = require("recursive-readdir"),
              path = require("path"),
                fs = require("fs"),
           request = require("request-promise"),
         { retry } = require("./utilities"),
             addon = require("./build/Release/miner");         


const HTTP_TIMEOUT = 1000 * 15             
const REFRESH_MINE_INFO_TIME = 1000 * 15             
const MAX_RETRY_TIMES = 10
const ENV_CURRENT_HEIGHT = "currentHeight"
const BASE_DIFFICULTY = 4398046511104
const BACKEND_URL = "http://localhost"
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

class Pool{
  constructor(){

  }

  getBlock(){
    return retry(1, 0, () => {
      return request.defaults({timeout: HTTP_TIMEOUT})({
        url: `${SETTINGS.pool_address}/burst`,
        qs: {
          requestType: 'getMiningInfo'
        },
        json: true,
      })
    })
  }

  submit(nonce, accountId, height){
    return retry(1000, 200, () => {
      return request.defaults({timeout: HTTP_TIMEOUT})({
        url: `${SETTINGS.pool_address}/burst`,
        qs: {
          requestType: 'submitNonce',
          nonce: nonce,
          accountId: accountId,
          blockheight: height,            
        },
        json: true
      })
    })
  }
}

async function worker(files){
  // return await test()  

  const r = await retry(1, 0, () => {
                    return request.defaults({timeout: HTTP_TIMEOUT})({
                      url: `${SETTINGS.pool_address}/burst`,
                      qs: {
                        requestType: 'getMiningInfo'
                      },
                      json: true,
                    })
                  })

  if (_currentHeight >= r.height){
    logger.info(`not found more height`)
    return
  }
  
  logger.info(r)
  
  const difficulty = BASE_DIFFICULTY / 240 / r.baseTarget
  const targetDeadline = SETTINGS.deadline ? _.min([r.targetDeadline, SETTINGS.deadline]) : r.targetDeadline
  const maxReader = SETTINGS.max_reader == 0 ? _.min([SETTINGS.plots.length, 3]) : SETTINGS.max_reader  
  let best = targetDeadline * r.baseTarget
  _currentHeight = r.height

  request({
    method: "post",
    url: `${BACKEND_URL}:${SETTINGS.port}/api/collect/block`,
    json: _.merge({}, r, {
      targetDeadline: targetDeadline,
      difficulty: difficulty,
      maxReader: maxReader
    }),
  }).then(_.noop()).catch(_.noop())

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

      request({
        method: "post",
        url: `${BACKEND_URL}:${SETTINGS.port}/api/collect/block/mined`,
        json: _.merge({}, rr, {
          fileName: n.fileName,
          height: r.height,
        }),
      })

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

require("./config")(async function () {
  const r = await aigle.resolve(Plots.getAll()).sortBy((n) => -n.fileSize).then((n) => {
    // return _.filter(n, m => /_389096_/.test(m.fileName))
    return n
    // return _.filter(n, m => /_800000000_/.test(m.fileName))
    // return _.filter(n, m => /_810000000_40960$/.test(m.fileName))
    // return _.filter(n, m => /_810000000_40960_40960$/.test(m.fileName))
    // return [_.find(n, m => /_4096$/.test(m.fileName))]
    // return _.filter(n, m => m.isPoc2)
  })

  // logger.warn(Plots.getAccountId());
  // logger.warn(r)
  return

  setInterval(() => worker(r),  REFRESH_MINE_INFO_TIME)
})