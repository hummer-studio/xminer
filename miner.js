const dirRecursive = require("recursive-readdir"),
          bluebird = require("bluebird"),
                 _ = require('lodash'),
             async = require("async"),
              path = require("path"),
           request = require("request-promise"),
             addon = require("./build/Release/miner");

const POOL_URL = "http://0-100-pool.burst.cryptoguru.org:8124";
const ENV_MINE_STATUS = "mineStatus"
let _currentHeight = 0

function fuckall(){
  console.log("fuck all callback");
}

//4398046511104 / 240 / baseTarget

async function worker(files){
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

  const r = await request.defaults({timeout: 1000 * 30})({
    url: `${POOL_URL}/burst?requestType=getMiningInfo`,
    json: true,
  })

  console.log(r)

  if (_currentHeight == r.height){
    return
  }
  
  await new Promise((resolve, reject) => {
    async.retry({
      times: Number.MAX_VALUE,
      interval: 200,
    }, (next) => {
      console.log(`test mine status: ${process.env[ENV_MINE_STATUS]}`)

      if (_.isEmpty(process.env[ENV_MINE_STATUS])){
        next()
        return
      }
      
      if (process.env[ENV_MINE_STATUS] == 'running'){
        process.env[ENV_MINE_STATUS] = 'abort'      
      }      

      next("keep waiting.")
    }, (err, result) => {
      if (err){
        reject(err)
        return
      }

      resolve(result)
    })
  })

  // setTimeout(() => {
  //   console.log("abort");
  //   process.env[ENV_MINE_STATUS] = "abort"
  // }, 1000 * 10)

  _currentHeight = r.height

  process.env[ENV_MINE_STATUS] == 'running'
  const f = new Promise((resolve, reject) => {
    async.eachLimit(files, 2, (n, next) => {
      if (process.env[ENV_MINE_STATUS] == "abort"){
        next()
        return
      }

      console.log(n)

      addon.run({
        generationSignature: r.generationSignature, 
        baseTarget: r.baseTarget,
        height: r.height,
        targetDeadline: _.min([r.targetDeadline, 3600 * 24 * 30 * 8]),
        fullPath: n.fullPath, 
        fileName: n.fileName, 
        isPoc2: n.isPoc2,
      }, function (err, n){        
        if (err){
          console.error(err);

          next(err)          
          return
        }

        if (r.height < _currentHeight){
          return
        }

        console.log(n)
        next()
      })

    }, (err) => {
      process.env[ENV_MINE_STATUS] = null

      if (err){
        reject(err)
        return
      }

      resolve()
    })
  })

  await f  
}

(async function(){
  const r = await bluebird.resolve(dirRecursive("/Volumes/plots")).then((n) => {
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

      // accountId,
      // nonceStart,
      // nonceSize,
      // staggerSize: staggerSize || nonceSize,
      isPoc2: staggerSize == null,
    }    
  }).then(_.compact).then((n) => {
    // return _.filter(n, m => /_389096_/.test(m.fileName))
    // return n
    // return _.filter(n, m => /_800000000_/.test(m.fileName))
    return _.filter(n, m => /_810000000_40960$/.test(m.fileName))
    // return _.filter(n, m => /_810000000_40960_40960$/.test(m.fileName))
    // return [_.find(n, m => /_4096$/.test(m.fileName))]
    // return _.filter(n, m => m.isPoc2)
  })

  // console.log(r)

  worker(r)

  // for (;;){
  //   worker(r)
  // }

})()