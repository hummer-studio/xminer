// const addon = require("./build/Release/hello") 

// console.log(addon.hello());

const dirRecursive = require("recursive-readdir"),
          bluebird = require("bluebird"),
                 _ = require('lodash'),
              path = require("path"),
           request = require("request-promise"),
             addon = require("./build/Release/miner")

function fuckall(){
  console.log("fuck all callback");
}

//4398046511104 / 240 / baseTarget

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
    // return _.filter(n, m => /_389096_/.test(m.fileName))
    // return n
    return _.filter(n, m => /_800000000_/.test(m.fileName))
    return _.filter(n, m => /_810000000_40960$/.test(m.fileName))
    return _.first(n)
    return _.find(n, m => /_4096$/.test(m.fileName))
  }).then((n) => {
    console.log(n)        

    // addon.test({
    //   generationSignature: "ksdjhflksdjfklsjdklfjksldflksdjf",
    //   baseTarget: 1232443,
    //   height: 12345,
    //   targetDeadline: 9843758945,

    //   fullPath: _.first(n).fullPath,
    //   fileName: _.first(n).fileName,
    //   isPoc2: Number(_.first(n).isPoc2),
    // }, function(){
    //   console.log("fuck out all")
    // }).then((r) => {
    //   console.log(r)
    //   console.log('done')
    // })      

    // return 

    request.defaults({timeout: 1000 * 30})({
      url: "http://0-100-pool.burst.cryptoguru.org:8124/burst?requestType=getMiningInfo",
      json: true,
    }).then((r) => {
      console.log(r)

      _.map(n, (nn) => {
        addon.test({
          generationSignature: r.generationSignature, 
          baseTarget: r.baseTarget,
          height: r.height,
          targetDeadline: r.targetDeadline,
          fullPath: nn.fullPath, 
          fileName: nn.fileName, 
          isPoc2: Number(nn.isPoc2)
        }, function(){
          console.log("fuck out all")
        }).then((n) => {
          console.log(n)
          console.log('done')
        })      
      })      
    })

    // setInterval(() => {
    //   console.log('111')
    // }, 3000)
  })
})()