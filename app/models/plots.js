'use strict'

const dirRecursive = require("recursive-readdir"),
              path = require("path"),
                fs = require("fs");

class Plots{
  constructor(){

  }
  
  static saveStatsData(params){    
    _.chain(Plots.getAll()).find((n) => n.fileName == params.fileName).thru((file) => {

      file.readedSize = file.readedSize || 0
      file.readedSize += params.readedSize
  
      file.calcElapsed = file.calcElapsed || 0
      file.calcElapsed += params.calcElapsed
  
      file.readElapsed = file.readElapsed || 0
      file.readElapsed += params.readElapsed
    }).value()
  }

  static getAll(){
    return this.files
  }

  static getAccountId(){
    return _.chain(this.getAll()).first().get("fileName").split("_").first().value()
  }

  static getSize(){
    return _.chain(this.getAll()).sumBy("fileSize").value()
  }

  static getScanSize(isPoc2Block){
    if (this.cacheScanSize){
      return this.cacheScanSize
    }

    this.cacheScanSize = _.chain(this.getAll())
                          .map(({nonceSize, isPoc2}) => {
                            return isPoc2Block != isPoc2 ? nonceSize * 64 * 2 : nonceSize * 64
                          }).sum().value()

    return this.cacheScanSize                      
  }

  static async initialize(){
    this.files = []    

    /////////////////////////

    this.files = await aigle.resolve(SETTINGS.plots)
                          .map((directory) => dirRecursive(directory))
                          .then(_.flatten).then(_.uniq)
                          .map((fullPath) => {
                              const fileName = path.parse(fullPath).name
                              const [accountId, nonceStart, nonceSize, staggerSize] = fileName.split("_")
                          
                              if (accountId == null || nonceStart == null || nonceSize == null){
                                return
                              }
                          
                              return {
                                fullPath,
                                fileName,
                                nonceSize,
                                fileSize: fs.statSync(fullPath).size,
                                isPoc2: staggerSize == null,
                              }                                
                          }).then(_.compact)
  }
}

module.exports = Plots