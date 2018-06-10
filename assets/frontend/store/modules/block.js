'use strict'

import Vue from 'vue'
import * as types from '../types'
import { deadline2Human } from  "../../utility"

const state = {
  height: 0,
  baseTarget: 0,
  targetDeadline: 0,
  difficulty: 0,
}

const getters = {  
  height: (state) => state.height || "-",
  baseTarget: (state) => state.baseTarget || "-",
  targetDeadline: (state) => state.targetDeadline ? deadline2Human(state.targetDeadline) : "-",
  difficulty: (state) => state.difficulty ? parseInt(state.difficulty) : "-"
}

const actions = {  
}

const mutations = {
  [types.SET_BLOCK_INFO] (state, { data }){
    console.log(data)

    state.height = data.height        
    state.baseTarget = data.baseTarget
    state.targetDeadline = data.targetDeadline
    state.difficulty = data.difficulty
  }
}

export default {
  namespaced: true,

  state,
  getters,
  actions,
  mutations
}
