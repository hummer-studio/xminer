<style lang="scss">

</style>

<script>
import "../styles/global.scss"

import Vue from "vue"
import VueRouter from "vue-router"
import iView from 'iview';
import 'iview/dist/styles/iview.css';
// // import Vuex from "vue-resource"

Vue.use(VueRouter)
Vue.use(iView)

import Home from "./home"

const router = new VueRouter({
  mode: 'history',
  routes: [
    { path: '/', component: Home },    
  ],
})

router.afterEach((to, from) => {    
})

new Vue({
  el: '#app',

  template: "<div><router-view></router-view></div>",

  router,
})
</script>
