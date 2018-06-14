'use strict'

import * as types from '../types'
import * as api from "../api"
import { humanDeadline, humanSize } from "../../../../utilities"


const state = {
  minedBlocks: 0,
  confirmedBlocks: 0,
  confirmedNonces: 0,
  capacity: 0,
  files: [],
  best360Nonce: null,
  bestNonce: null,
}

const getters = {    
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
  async getPlots({commit, dispatch}){
    const { data } = await api.getPlots()

    commit(types.SET_PLOTS_INFO, { data })  
  }
}

const mutations = {
  [types.SET_BASE_INFO] (state, { data }){
    Object.assign(state, {
      bestNonce: {},
      best360Nonce: {}
    }, data)    
  },

  [types.SET_PLOTS_INFO] (state, { data }){
    state.files = data    
  }
}

export default {
  namespaced: true,

  state,
  getters,
  actions,
  mutations
}
