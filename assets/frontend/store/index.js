import Vue from 'vue'
import Vuex from 'vuex'

import Base from './modules/base'
import Pool from './modules/pool'
import Block from './modules/block'

Vue.use(Vuex)

const debug = process.env.NODE_ENV !== 'production'

export default new Vuex.Store({
  state: {
  },
  // actions,
  // getters,
  modules: {
    Base,
    Pool,   
    Block 
  },
  strict: debug,
  // plugins: debug ? [createLogger()] : []
})
