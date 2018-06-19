const program = require('commander'),
         plot = require("./build/Release/plot");

program
  .option('-k <account>', "account number")
  .option('-d <directory>', "directory")
  .option('-s <startNonce>', "start nonce")
  .option('-n <nonces>', "nonces")
  .option('-m <staggerNonces>', "stagger nonces")
  .parse(process.argv);


(async () => {

  const bb = Buffer.alloc((1024 * 256) * (4096));

  console.log(new Date());

  // /burst?requestType=getMiningInfo

  plot.run({
    account: program.K || "399604754858490715",
    startNonce: program.S || "810000000",
    nonces: program.N || "1024",
    buffer: bb
  }, () => {
    var crypto = require('crypto');
    var md5 = crypto.createHash('md5');

    console.log(new Date());

    console.log(md5.update(bb).digest('hex'))

    console.log("cao ni yeye")
  });  
})();