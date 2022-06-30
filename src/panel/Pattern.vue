<template>
  <div>
  </div>
</template>

<script>
export default {
  name: 'Pattern',
  data() {
    return {
      patterns: []
    }
  },
  methods: {
    addPattern(pattern) {
      this.patterns.push({
        pattern: ''
      });
    }
  }
}
</script>
