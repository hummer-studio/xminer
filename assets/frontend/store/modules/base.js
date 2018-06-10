'use strict'

import Vue from 'vue'
import * as types from '../types'
import { deadline2Human } from  "../../utility"

const state = {
  mined: 0
}

const getters = {  
  mined: (state) => state.mined || "-",  
}

const actions = {  
}

const mutations = {
  [types.SET_BASE_INFO] (state, { data }){
    console.log(data)

    state.mined = data.mined    
  }
}

export default {
  namespaced: true,

  state,
  getters,
  actions,
  mutations
}
