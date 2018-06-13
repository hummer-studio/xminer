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
  nonces: [],
  progress: 0,
}

const getters = {    
  targetDeadline: (state) => state.targetDeadline ? humanDeadline(state.targetDeadline) : "-",
  difficulty: (state) => state.difficulty ? parseInt(state.difficulty) : "-",
  scoop: (state) => state.scoop || "-",
  deadline: (state) => {
    return _.chain(state.nonces)
            .orderBy(["deadline"], ["asc"])
            .first()
            .get("deadline")
            .thru((n) => {
              if (n){
                return humanDeadline(n)
              }

              return "-"
            }).value()
  }
}

const actions = {  
}

const mutations = {
  [types.SET_BLOCK_INFO] (state, { data }){
    Object.assign(state, {
      nonces: [],
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
