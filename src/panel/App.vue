<template>
  <!--  <h1>Test ResponseTracker</h1>-->
  <div>
  </div>
</template>

<script>
import {ResponseTracker} from './services';
import Pattern from "./Pattern";

export default {
  name: 'App',
  components: {
    'app-pattern': Pattern
  },
  data: () => ({
    service: new ResponseTracker()
  }),
  computed: {
    test() {
      return JSON.stringify(this.service.patterns);
    }
  },
  created() {
    console.log('joao creating');
    this.service.onInit();
    this.service.addPattern('www.google.com/*')
  },
  beforeDestroy() {
    this.service.onDestroy();
    console.log('joao destroying');
  }
};
</script>
