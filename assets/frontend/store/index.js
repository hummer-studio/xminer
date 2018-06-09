import Vue from 'vue'
import Vuex from 'vuex'

import Pool from './modules/pool'

Vue.use(Vuex)

const debug = process.env.NODE_ENV !== 'production'

export default new Vuex.Store({
  state: {
  },
  // actions,
  // getters,
  modules: {
    Pool,    
  },
  strict: debug,
  // plugins: debug ? [createLogger()] : []
})
