import Vue from 'vue'
import * as types from '../types'
import { deadline2Human } from  "../../utility"

const state = {
  height: "-",
  miner: "-",
  deadline: "-",
}

const getters = {
  height: (state) => state.height,
  deadline: (state) => state.deadline == "-" ? state.deadline : deadline2Human(state.deadline),

  miner: (state) => state.miner
}

const actions = {
  async connectWS({commit, dispatch}){
    
    // this.ws = new WebSocket("wss://0-100-pool.burst.cryptoguru.org/ws");
    const ws = new WebSocket(`ws://${window.location.host}/ws`);
    ws.onmessage = (message) => {
      const d = JSON.parse(message.data)

      if (d.command == "poolInfo"){
        commit(types.SET_POOL_INFO, {
          info: d.data
        })
      }
    }

    // this.ws.onerror = (err) => {
    //   debugger
    // }

    ws.onclose = () => {      
      setTimeout(dispatch.bind(null, "connectWS"), 1000 * 5)
    }
  },
}

const mutations = {
  [types.SET_POOL_INFO] (state, { info }){
    console.log(info)
    state.height = info.height    
    state.miner = info.miner
    state.deadline = info.deadline || "-"
  } 
}

export default {
  state,
  getters,
  actions,
  mutations
}
