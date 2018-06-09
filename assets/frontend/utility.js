'use strict'

import miment from "miment"

export function deadline2Human(s){ 
  const r = miment().distance(new Date() * 1 + (s * 1000), new Date() * 1).format("YYYYy MMm DDd hh:mm:ss", true)

  return r.replace("0y ", "").replace("00m ", "").replace("00d", "")
}