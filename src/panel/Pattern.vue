<template>
  <details>
    <summary :title="pattern">{{ pattern }}</summary>
    <article v-for="resultStore in resultStores" :key="resultStore.$id">
      <app-result :mainStore="mainStore" :store="resultStore"></app-result>
    </article>
  </details>
</template>

<script setup>
import {computed} from "vue";

const {mainStore, store: patternStore} = defineProps(['mainStore', 'store']);

const pattern = computed(() => patternStore.patternStr);
const resultStores = computed(() => patternStore.urls.map(mainStore.getResult));
</script>

<style scoped>
details {
  border: 1px solid black;
  padding: 20px 16px;
  border-radius: 10px;
}

summary {
  font-size: 18px;
  font-weight: 500;
  margin-right: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

article {
  margin-left: 16px;
}
</style>
