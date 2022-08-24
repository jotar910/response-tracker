<template>
  <div>
    <h2>{{ url }}</h2>
    <app-response-item v-if="response" :item="response" :disabled="true"
                       :actions="['copy', 'remove']" @onAction="handleAction" />
  </div>
</template>

<script setup>
import {computed} from "vue";

const {mainStore, store: resultStore} = defineProps(['mainStore', 'store']);

const url = computed(() => resultStore.url);
const history = computed(() => JSON.stringify(resultStore.history));
const response = computed(() => resultStore.history?.[0]);

function handleAction(action) {
  switch (action) {
    case 'remove':
      return mainStore.remCustomResult(url.value);
    default:
      console.warn(`No action with type ${action} for saved list`);
  }
}
</script>

<style scoped>
h2 {
  color: forestgreen;
  font-size: 12px;
  font-weight: 200;
  margin-bottom: 16px;
  word-break: break-all;
}
</style>
