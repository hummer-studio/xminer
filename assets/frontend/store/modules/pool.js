import Vue from 'vue'
import * as types from '../types'
import { humanDeadline } from "../../../../utilities"

const state = {
  height: 0,
  miner: 0,
  deadline: 0,
  accountId: null,
}

const getters = {
  height: (state) => state.height || "-",
  deadline: (state) => state.deadline ? humanDeadline(state.deadline) : state.deadline || "-",

  miner: (state) => state.miner || "-",
  accountId: (state) => state.accountId,
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
      }      
    }

    // ws.onerror = (err) => {
    //   debugger
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
    console.log(data)

    state.height = data.height    
    state.miner = data.miner
    state.deadline = data.deadline
    state.accountId = data.minerID
  },
}

export default {
  namespaced: true,

  state,
  getters,
  actions,
  mutations
}
