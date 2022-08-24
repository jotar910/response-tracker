<template>
  <details>
    <summary>Custom Responses</summary>
    <article v-for="resultStore in resultStores" :key="resultStore.$id">
      <app-custom-result :mainStore="mainStore" :store="resultStore"/>
    </article>
  </details>
</template>

<script setup>
import {computed} from "vue";

const {mainStore} = defineProps(['mainStore']);

const resultStores = computed(() => mainStore.customResultsList);
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
