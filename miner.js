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

class Pool{
  static getBlock(){
    return retry(1, 0, () => {
      return request.defaults({timeout: HTTP_TIMEOUT})({
        url: `${SETTINGS.pool_address}/burst`,
        qs: {
          requestType: 'getMiningInfo'
        },
        json: true,
      }).then((r) => {
        if (!r.height){
          logger.wanr('get mine info failed.')
          throw r
        }

        return r
      })
    })
  }

  static submit(nonce, height, confirmCallback){
    return retry(MAX_RETRY_TIMES, 200, () => {
      if (!confirmCallback()){
        return
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

        logger.info(`pool confirmed the nonce. ${height} ${nonce}`)
        return r
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

async function worker(files){
  const r = await Pool.getBlock()

  if (_currentHeight > r.height){
    logger.info(`not found more height. ${_currentHeight} ${r.height}`)
    return
  }
  
  logger.info(r)
  
  const difficulty = BASE_DIFFICULTY / 240 / r.baseTarget
  const targetDeadline = SETTINGS.deadline ? _.min([r.targetDeadline, SETTINGS.deadline]) : r.targetDeadline
  const maxReader = SETTINGS.max_reader == 0 ? _.min([SETTINGS.plots.length, 3]) : SETTINGS.max_reader  
  let best = targetDeadline * r.baseTarget
  _currentHeight = r.height

  Communication.submitBlock(_.merge({}, r, {
    targetDeadline: targetDeadline,
    difficulty: difficulty,
    maxReader: maxReader
  }))

  process.env[ENV_CURRENT_HEIGHT] = r.height
  const f = aigle.promisify(async.eachLimit)(files, maxReader, (n, next) => {
    if (Number(process.env[ENV_CURRENT_HEIGHT]) != r.height){      
      logger.warn("found new block. skip this block.");
      next()
      return
    }

    logger.info(`mine ${n.fileName}`)

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

      Communication.submitNonce(_.merge({}, rr, {
        fileName: n.fileName,
        height: r.height,
      }))

      if (rr.nonce == 0){
        next()
        return
      }

      if (r.height < _currentHeight){
        logger.warn(`the block is done. skip this nonce.`)
        next()
        return
      }

      best = rr.best

      logger.info(`found valid nonce: ${JSON.stringify(rr)}`)
      Pool.submit(rr.nonce, r.height, () => {
        if (rr.best > best){
          logger.warn("has best nonce. skip this nonce.")
          return false
        }

        return true
      }).then(() => next()).catch(next)                      
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

  setInterval(() => worker(r),  REFRESH_MINE_INFO_TIME)
})