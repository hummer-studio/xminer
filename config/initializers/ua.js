'use strict'

const ua = require('universal-analytics'),
     pkg = require("../../package.json"),
    path = require("path"),
      fs = require("fs"),
    uuid = require('uuid/v4');

require("./logger")

function getClientID(){  
  const configFile = path.resolve(require.resolve("../../package.json"), "..", ".config")

  if (!fs.existsSync(configFile)){
    fs.writeFileSync(configFile, JSON.stringify({uuid: uuid()}, null, 2))
  }

  try{    
    const c = JSON.parse(fs.readFileSync(configFile))

    if (!c.uuid){
      throw "not found valid uuid."
    }

    return c.uuid
  }catch(e){
    logger.error("load config error.")
    throw e
  }
}

const visitor = ua('UA-5836737-15', getClientID(), {http: !isProduction});

visitor.set("an", pkg.name);
visitor.set("av", pkg.version);

global.visitor = visitor