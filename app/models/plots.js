'use strict'

const dirRecursive = require("recursive-readdir"),
              path = require("path"),
                fs = require("fs");

class Plots{
  constructor(){

  }

  static getAll(){
    return this.files
  }

  static getAccountId(){
    return _.chain(this.getAll()).first().get("fileName").split("_").first().value()
  }

  static async initialize(){

    logger.error("fuck m e")
    this.files = []    

    /////////////////////////

    this.files = await aigle.resolve(dirRecursive("/Volumes/plots")).then((n) => {
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
    }).then(_.compact).then((n) => {
      return _.uniqBy(n, m => m.fullPath)
    })
  }
}

module.exports = Plots