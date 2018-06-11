'use strict'

import Vue from 'vue'
import * as types from '../types'
import { humanDeadline, humanSize } from "../../../../utilities"

const state = {
  mined: 0,
  capacity: 0,
  files: [],
}

const getters = {  
  mined: (state) => state.mined || "-",  
  capacity: (state) => state.capacity ? humanSize(state.capacity) : "-",
  files: (state) => state.files,
}

const actions = {  
}

const mutations = {
  [types.SET_BASE_INFO] (state, { data }){
    console.log(data)

    state.mined = data.mined
    state.capacity = data.capacity
    state.files = data.files
    // _.merge(state, data)
  }
}

export default {
  namespaced: true,

  state,
  getters,
  actions,
  mutations
}
