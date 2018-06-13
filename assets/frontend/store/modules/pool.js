import Vue from 'vue'
import * as types from '../types'
import { humanDeadline } from "../../../../utilities"

const state = {
  height: 0,
  miner: 0,
  deadline: 0,
  accountId: "",

  address: null,
  currentDeadline: 0,
  effectiveCapacity: 0,
  historicalShare: 0,
  lastActiveBlockHeight: 0,
  nConf: 0,
  pending: 0,
}

const getters = {
  deadline: (state) => state.deadline ? humanDeadline(state.deadline) : state.deadline || "-",
  currentDeadline: (state) => {
    return state.height == state.lastActiveBlockHeight && state.currentDeadline ?
              humanDeadline(state.currentDeadline) : 
              "-"
  },

  miner: (state) => state.miner || "-",  
  effectiveCapacity: (state) => state.effectiveCapacity.toFixed(4),
  historicalShare: (state) => (state.historicalShare * 100).toFixed(4),  
  pending: (state) => state.pending / 100000000,
}

const actions = {
  async connectWS({commit, dispatch}){    
    const ws = new WebSocket(`ws://${window.location.host}/ws`);
    ws.onmessage = (message) => {
      const d = JSON.parse(message.data)

      switch(d.command){
        case "poolInfo":
          commit(types.SET_POOL_INFO, {
            data: d.data
          })
          break;
        case "block":
          commit(`Block/${types.SET_BLOCK_INFO}`, {data: d.data}, {root: true})
          break
        case "baseInfo":
          commit(`Base/${types.SET_BASE_INFO}`, {data: d.data}, {root: true})
          break
        case "poolSubscribe":
          commit(types.SET_ACCOUNT_INFO, {data: d.data})
          break
      }      
    }

    // ws.onerror = (err) => {
    //   console.error(err)
    // }

    // ws.onopen = (env) => {
    // }

    ws.onclose = () => {      
      setTimeout(dispatch.bind(null, "connectWS"), 1000 * 5)
    }
  },
}

const mutations = {
  [types.SET_POOL_INFO] (state, { data }){
    Object.assign(state, _.omit(data, "minerId"))    
    state.accountId = data.minerID
  },

  [types.SET_ACCOUNT_INFO] (state, { data }){
    Object.assign(state, _.omit(data, "deadline"))
    state.currentDeadline = data.deadline
  }
}

export default {
  namespaced: true,

  state,
  getters,
  actions,
  mutations
}
