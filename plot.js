const program = require('commander'),
            _ = require("lodash"),
        aigle = require("aigle"),
        async = require("neo-async"),
           os = require('os'),
         plot = require("./build/Release/plot");

program
  .option('-k <account>', "account number")
  .option('-d <directory>', "directory")
  .option('-s <startNonce>', "start nonce")
  .option('-n <nonces>', "nonces")
  .option('-m <staggerNonces>', "stagger nonces")
  .parse(process.argv);


(async () => {  

  console.log(new Date());

  

  const numScoop = 4096
  const scoopSize = 64
  const totalNonce = 1024
  const staggerNonce = 1024

  //n * PLOT_SIZE + scoop * staggerSize * SCOOP_SIZE;

  //3033 * 1228800 * 64  read 1228800 * 64  

  // const l = []
  // for (let n = 0; n < totalNonce; n += staggerNonce){
  //   for (let i = 0; i < numScoop; i++){
  //     l.push({
  //       nonce: n,
  //       scoop: i,
  //       offset: i * totalNonce * scoopSize + n * scoopSize
  //     })      
  //   }    
  // }

  // _.chain(l).orderBy(["offset"]).each((n) => {
  //   console.log(n)
  // }).value()


  await aigle.promisify(async.eachLimit)(_.chain(_.range(0, 100000000, 1024)).shuffle().value(), 12, (n, next) => {
    console.log(`start ${n} 1024.`);

    plot.run({
      account: "399604754858490715",
      startNonce: n.toString(),
      nonces: "1024",
    }, (err, result) => {
      if (err){
        console.error(err)
        next(error)
        return
      }

      console.log("done")
      setTimeout(() => {
        console.log(require('crypto').createHash("md5").update(result).digest('hex'))          
        // delete result
        result = null
      }, 1000 * 3)
      

      next()
    });  
  })  
})();