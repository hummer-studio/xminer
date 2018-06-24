'use strict'

import Vue from 'vue'
import aigle from "aigle"

export const getPlots = () => {
  return aigle.resolve(Vue.http.get("/api/plots")).then((n) => n.body)
}

export const getBlocks = () => {
  return aigle.resolve(Vue.http.get("/api/blocks")).then((n) => n.body)
}