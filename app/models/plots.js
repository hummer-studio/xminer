'use strict'

const dirRecursive = require("recursive-readdir"),
              path = require("path"),
                fs = require("fs");

class Plots{
  constructor(){

  }
  
  static saveStatsData(fileName, readedSize, readElapsed, calcElapsed){    
    _.chain(Plots.getAll()).find((n) => n.fileName == fileName).thru((file) => {

      file.readedSize = file.readedSize || 0
      file.readedSize += readedSize
  
      file.calcElapsed = file.calcElapsed || 0
      file.calcElapsed += calcElapsed
  
      file.readElapsed = file.readElapsed || 0
      file.readElapsed += readElapsed
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
                                fileSize: fs.statSync(fullPath).size,
                                isPoc2: staggerSize == null,
                              }                                
                          }).then(_.compact)
  }
}

module.exports = Plots