'use strict'

const dirRecursive = require("recursive-readdir"),
              path = require("path"),
                fs = require("fs"),
           request = require("request-promise"),
         { retry } = require("./utilities"),
             addon = require("./build/Release/miner");         


const HTTP_TIMEOUT = 1000 * 15             
const REFRESH_MINE_INFO_TIME = 1000 * 3
const MAX_RETRY_TIMES = 10
const BASE_DIFFICULTY = 4398046511104
const BACKEND_URL = "http://localhost"

class Pool{
  static getBlock(){
    return request.defaults({timeout: HTTP_TIMEOUT})({
      url: `${SETTINGS.pool_address}/burst`,
      qs: {
        requestType: 'getMiningInfo'
      },
      json: true,
    }).then((r) => {
      if (!r.height){
        logger.warn('get mine info failed.')
        throw r
      }

      return r
    })
  }

  static submit(nonce, height, confirmCallback){
    return retry(MAX_RETRY_TIMES, 200, () => {
      if (!confirmCallback()){
        return aigle.resolve()
      }

      return request.defaults({timeout: HTTP_TIMEOUT})({
        url: `${SETTINGS.pool_address}/burst`,
        qs: {
          requestType: 'submitNonce',
          nonce: nonce,
          accountId: Plots.getAccountId(),
          blockheight: height,            
        },
        json: true
      }).then((r) => {
        if (r.result != "success"){
          logger.warn(`submit nonce failed.`)
          throw r
        }

        logger.info(`pool confirmed the nonce. ${JSON.stringify(_.merge({}, r, {height, nonce}))}`)
        return r
      }).catch((e) => {
        if (_.get(e, "error.errorCode")){
          logger.error(e.error)
          return
        }

        throw e
      })
    })
  }
}

class Communication{
  static submitBlock(params){
    return request({
      method: "post",
      url: `${BACKEND_URL}:${SETTINGS.port}/api/collect/block`,
      json: params,
    }).then(_.noop()).catch(_.noop())
  }

  static submitNonce(params){
    return request({
      method: "post",
      url: `${BACKEND_URL}:${SETTINGS.port}/api/collect/block/mined`,
      json: params,
    })
  }  
}

class GlobalHeight{  
  static set(v){
    process.env[this.k()] = v
  }

  static get(){
    return parseInt(process.env[this.k()])
  }

  static k(){ return "currentHeight" }
}

async function worker(files){
  const { baseTarget, targetDeadline, generationSignature, height } = await Pool.getBlock().catch((e) => {
    if (e.error.code == 'ETIMEDOUT' || e.error.code == 'ESOCKETTIMEDOUT'){
      logger.warn("get block timeout. try again later.")
      return {}
    }

    throw e    
  })
  
  if (!height || GlobalHeight.get() >= height){
    //not found more height.
    return
  }  

  GlobalHeight.set(height)  

  logger.info(`block: ${JSON.stringify({baseTarget, targetDeadline, generationSignature, height})}`)
  
  const difficulty = BASE_DIFFICULTY / 240 / baseTarget
  const deadline = SETTINGS.deadline ? _.min([targetDeadline, SETTINGS.deadline]) : targetDeadline
  const maxReader = SETTINGS.max_reader == 0 ? _.min([SETTINGS.plots.length, 3]) : SETTINGS.max_reader  
  let best = targetDeadline * baseTarget

  Communication.submitBlock({
    height,
    baseTarget,
    generationSignature,    
    difficulty,
    maxReader,
    targetDeadline: deadline,
    scoop: addon.getScoop({generationSignature: generationSignature, height: height}),
  })
  
  await aigle.promisify(async.eachLimit)(files, maxReader, (n, next) => {
    if (GlobalHeight.get() != height){
      logger.warn(`found new block. skip this block. name: ${n.fileName}`);
      next()
      return
    }

    logger.info(`scanning ${n.fileName}`)

    addon.run({
      generationSignature: generationSignature, 
      baseTarget: baseTarget,
      height: height,
      targetDeadline: deadline,
      fullPath: n.fullPath, 
      fileName: n.fileName, 
      isPoc2: n.isPoc2,
    }, function (err, rr){              
      if (err){
        logger.error(err);

        next(err)          
        return
      }            

      if (rr.nonce == 0){
        Communication.submitNonce(_.merge({}, rr, {
          fileName: n.fileName,
          height: height,
        }))

        next()
        return
      }

      if (height < GlobalHeight.get()){
        logger.warn(`the block is done. skip this nonce. name: ${n.fileName}`)
        next()
        return
      }

      best = rr.best

      logger.info(`found valid nonce: ${JSON.stringify(_.merge({}, rr, {height: height}))}`)
      Pool.submit(rr.nonce, height, () => {
        if (rr.best > best){
          logger.warn(`has best nonce. skip this nonce. name: ${n.fileName}`)
          return false
        }

        return true
      }).then((r) => {
        if (r){
          Communication.submitNonce(_.merge({}, rr, {
            fileName: n.fileName,
            height: height,
          })) 
        }

        next()
      }).catch(next)                      
    })
  })

  logger.info(`height: ${height}, mining is done.`)
}

require("./config")(async function () {
  const files = await aigle.resolve(Plots.getAll()).sortBy((n) => -n.fileSize).then((n) => {
    return n
    // return _.filter(n, m => /_389096_/.test(m.fileName))
    // return _.filter(n, m => (
    //   /399604754858490715_240000000_409600_409600/.test(m.fileName) ||
    //   /399604754858490715_780000000_819200_819200/.test(m.fileName) ||
    //   /399604754858490715_790000000_409600_409600/.test(m.fileName)
    // ))  
    // return _.filter(n, m => /_800000000_/.test(m.fileName))
    // return _.filter(n, m => /_810000000_40960$/.test(m.fileName))
    // return _.filter(n, m => /_810000000_40960_40960$/.test(m.fileName))
    // return [_.find(n, m => /_4096$/.test(m.fileName))]
    // return _.filter(n, m => m.isPoc2)
  })  

  GlobalHeight.set(0)
  setInterval(() => worker(files),  REFRESH_MINE_INFO_TIME)
})