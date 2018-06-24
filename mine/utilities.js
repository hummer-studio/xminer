'use stirct'

module.exports = {
  getDifficulty: (baseTarget) => {
    return parseInt(4398046511104 / 240 / baseTarget)
  },  
}