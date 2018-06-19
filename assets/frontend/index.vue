<script>
//import "babel-polyfill"

import "../styles/global.scss"

import Vue from "vue"
import VueResource from 'vue-resource'
import store from './store'
import VueRouter from "vue-router"
import iView from 'iview'
import 'iview/dist/styles/iview.css'
import locale from 'iview/dist/locale/en-US'

Vue.use(VueRouter)
Vue.use(VueResource)
Vue.use(iView, {locale})

import Home from "./home"

const router = new VueRouter({
  mode: 'history',
  routes: [
    { path: '/', component: Home },    
  ],
})

// router.afterEach((to, from) => {    
// })

new Vue({
  el: '#app',

  template: "<div><router-view></router-view></div>",

  router,
  store,
})
</script>