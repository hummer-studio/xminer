'use strict'

import * as api from "../api"
import * as types from '../types'
import { humanDeadline } from "../../../../utilities"

const state = {
  createdAt: null,
  currentTime: null,
  elapsed: null,

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
  },
  elapsed: (state) => {
    if (state.elapsed && state.progress >= 1){
      return `${humanDeadline((state.currentTime - state.createdAt) / 1000)} (${humanDeadline(state.elapsed / 1000)})`
    }

    if (!state.currentTime || !state.createdAt){
      return "-"
    }

    return humanDeadline((state.currentTime - state.createdAt) / 1000)    
  }
}

const actions = {
  async getBlocks({commit, dispatch}){
    commit(types.SET_BLOCK_LOADING, true)

    const r = await api.getBlocks()

    commit(types.SET_BLOCK_LOADING, false)  
    commit(types.SET_BLOCK_HISTORY, r)  
  },

  async ticktock({commit, dispatch, state}){    
    commit(types.TICKTOCK)
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
  },

  [types.TICKTOCK] (state){
    state.currentTime = new Date() * 1
  }
}

export default {
  namespaced: true,

  state,
  getters,
  actions,
  mutations
}
