'use strict'

import * as api from "../api"
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

  blocksLoading: false,
  his: []
}

const getters = {    
  targetDeadline: (state) => state.targetDeadline ? humanDeadline(state.targetDeadline) : "-",
  difficulty: (state) => state.difficulty ? parseInt(state.difficulty) : "-",  
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
  async getBlocks({commit, dispatch}){
    commit(types.SET_BLOCK_LOADING, true)  

    const r = await api.getBlocks()

    commit(types.SET_BLOCK_LOADING, false)  
    commit(types.SET_BLOCK_HISTORY, r)  
  }  
}

const mutations = {
  [types.SET_BLOCK_INFO] (state, { data }){
    Object.assign(state, {
      nonces: [],
    }, data)
  },
  
  [types.SET_BLOCK_LOADING] (state, r){
    state.blocksLoading = r
  },

  [types.SET_BLOCK_HISTORY] (state, r){
    state.his = r.data
  }
}

export default {
  namespaced: true,

  state,
  getters,
  actions,
  mutations
}
