import Vue from 'vue'
import App from './App'
import Pattern from "./Pattern";

/* eslint-disable no-new */

Vue.component('app-pattern', Pattern)

const vue = new Vue({
  el: '#app',
  render: h => h(App)
})
