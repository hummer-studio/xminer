// const addon = require("./build/Release/hello") 

// console.log(addon.hello());

const dirRecursive = require("recursive-readdir"),
          bluebird = require("bluebird"),
                 _ = require('lodash'),
              path = require("path"),
           request = require("request-promise"),
             addon = require("./build/Release/miner")

;(async function(){
  bluebird.resolve(dirRecursive("/Volumes/plots")).then((n) => {
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
    return n
    return _.filter(n, m => /_810000000_/.test(m.fileName))
    return _.filter(n, m => /_810000000_40960$/.test(m.fileName))
    return n;
    return _.first(n)
    return _.find(n, m => /_4096$/.test(m.fileName))
  }).then((n) => {
    console.log(n)        

    request({
      url: "http://0-100-pool.burst.cryptoguru.org:8124/burst?requestType=getMiningInfo",
      json: true,
    }).then((r) => {
      console.log(r)

      _.map(n, (nn) => {
        addon.test(        
          r.generationSignature, 
          r.baseTarget,
          r.height,
          r.targetDeadline,
          nn.fullPath, 
          nn.fileName, 
          Number(nn.isPoc2)
        , function(){
          console.log("fuck all")
        }).then(() => {
          console.log('done')
        })      
      })      
    })

    // setInterval(() => {
    //   console.log('111')
    // }, 3000)
  })
})()