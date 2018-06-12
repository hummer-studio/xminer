'use strict'

import Vue from 'vue'
import * as types from '../types'
import { humanDeadline } from "../../../../utilities"

const state = {
  height: 0,
  baseTarget: 0,
  targetDeadline: 0,
  difficulty: 0,
  scoop: 0,
}

const getters = {  
  height: (state) => state.height || "-",
  baseTarget: (state) => state.baseTarget || "-",
  targetDeadline: (state) => state.targetDeadline ? humanDeadline(state.targetDeadline) : "-",
  difficulty: (state) => state.difficulty ? parseInt(state.difficulty) : "-",
  scoop: (state) => state.scoop || "-",
}

const actions = {  
}

const mutations = {
  [types.SET_BLOCK_INFO] (state, { data }){
    console.log(data)

    _.merge(state, data)

    // state.height = data.height        
    // state.baseTarget = data.baseTarget
    // state.targetDeadline = data.targetDeadline
    // state.difficulty = data.difficulty
  }
}

export default {
  namespaced: true,

  state,
  getters,
  actions,
  mutations
}
