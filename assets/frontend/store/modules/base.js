'use strict'

import Vue from 'vue'
import * as types from '../types'
import { humanDeadline, humanSize } from "../../../../utilities"

const state = {
  mined: 0,
  capacity: 0,
  files: [],
  best360Nonce: null,
  bestNonce: null,
}

const getters = {  
  mined: (state) => state.mined || "-",  
  capacity: (state) => state.capacity ? humanSize(state.capacity) : "-",  
  best360Deadline: (state) => {
    const r = _.get(state, "best360Nonce.deadline")
    if (r){
      return `${humanDeadline(r)} @${state.best360Nonce.height}`
    }

    return "-"
  },
  bestDeadline: (state) => {
    const r = _.get(state, "bestNonce.deadline")
    if (r){
      return `${humanDeadline(r)} @${state.bestNonce.height}`
    }

    return "-"
  }
}

const actions = {  
}

const mutations = {
  [types.SET_BASE_INFO] (state, { data }){
    Object.assign(state, {
      files: [],
      bestNonce: {},
      best360Nonce: {}
    }, data)    
  }
}

export default {
  namespaced: true,

  state,
  getters,
  actions,
  mutations
}
