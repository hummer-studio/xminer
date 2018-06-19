'use strict'

const dirRecursive = require("recursive-readdir"),
              path = require("path"),
                fs = require("fs"),
           request = require("request-promise"),
{ retry, humanDeadline } = require("./utilities"),
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
    if (this._h){
      this._h.writeUInt32LE(v, 0)
      return
    }

    this._h = Buffer.alloc(4)
    this._h.writeUInt32LE(v, 0)
    addon.setHeightVar(this._h)
  }

  static get(){    
    return this._h.readUInt32LE(0);
  }
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
  let bestDeadline = deadline

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

      const d = _.merge({}, rr, {
        fileName: n.fileName,
        height: height,
      })

      if (!rr.nonce){
        Communication.submitNonce(d)

        next()
        return
      }

      if (height < GlobalHeight.get()){
        Communication.submitNonce(_.omit(d, "nonce"))

        logger.warn(`the block is done. skip this nonce. ${JSON.stringify(d)}`)
        next()
        return
      }      

      logger.info(`found valid nonce: ${JSON.stringify(d)}`)
      Pool.submit(rr.nonce, height, () => {
        if (rr.deadline > bestDeadline){
          logger.warn(`has best nonce. skip this nonce. ${JSON.stringify(d)}`)
          return false
        }

        bestDeadline = rr.deadline
        return true
      }).then((r) => {
        if (r){
          Communication.submitNonce(d)          
        }else{
          Communication.submitNonce(_.omit(d, "nonce"))
        }

        next()
      }).catch(next)                      
    })
  })

  if (bestDeadline == deadline){
    logger.info(`height: ${height}, mining is done. not found best deadline.`)
  }else{
    logger.info(`height: ${height}, deadline: ${humanDeadline(bestDeadline)}, mining is done.`)
  }  
}

async function worker2(){
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

  const totalNonce = 409600 || 41943040
  const perNonce = 1024
  
  await aigle.promisify(async.eachLimit)(_.chain().range(totalNonce / perNonce).value(), 10, (n, next) => {
    addon.smartMine({
      //account: "236628450097552694",
      account: "399604754858490715",
      startNonce: "0",
      nonces: totalNonce.toString(),
      index: n,
      perNonce,

      baseTarget: Number(baseTarget),
      targetDeadline,
      generationSignature,
      height: Number(height),
    }, (err, result) => {
      if (err){
        logger.error(err);
        next(err)
        return
      }

      if (result.nonce){
        logger.info(result)

        Pool.submit(rr.nonce, height, () => {
          return true
        }).then((r) => {
          logger.info(r)
        })
      }

      // var crypto = require('crypto');
      // var md5 = crypto.createHash('md5');
  
      // console.log(new Date());
  
      // console.log(md5.update(bb).digest('hex'))
        
      next();
    });    
  })
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
  // setInterval(() => worker(files),  REFRESH_MINE_INFO_TIME)    

  // process.env["UV_THREADPOOL_SIZE"] = 12
  SETTINGS.pool_address = "http://burstneon.com:8080"
  setInterval(() => worker2(),  REFRESH_MINE_INFO_TIME)    
})