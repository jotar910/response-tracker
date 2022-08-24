<template>
  <div :class="{'disabled': isDisabled}">
    <h2>{{ url }}</h2>
    <app-response :title="`Saved (${saved.length})`" :list="saved" class="response" :selectedIdx="selectedIdx" :disabled="isDisabled"
                  :actions="['copy', 'edit', 'remove', 'pick']" @onAction="handleAction('saved', $event)" ></app-response>
    <app-response :title="`History (${history.length})`" :list="history" :disabled="true" class="response"
                  :actions="['copy', 'save']" @onAction="handleAction('history', $event)" ></app-response>
  </div>
</template>

<script setup>
import {computed} from "vue";

const {mainStore, store: resultStore} = defineProps(['mainStore', 'store']);

const url = computed(() => resultStore.url);
const saved = computed(() => resultStore.saved);
const history = computed(() => resultStore.history);
const selectedIdx = computed(() => resultStore.usingIndex);
const isDisabled = computed(() => mainStore.hasCustomResponse(url.value));

function handleAction(name, event) {
  switch (name) {
    case 'saved':
      return handleSavedAction(event);
    case 'history':
      return handleHistoryAction(event);
    default:
      console.warn(`No action named ${name}`);
  }
}

function handleSavedAction({type, value}) {
  switch (type) {
    case 'remove':
      return resultStore.remSavedResponse(value);
    case 'pick':
      return resultStore.useResponse(value);
    case 'edit':
      return resultStore.editResponse(value);
    default:
      console.warn(`No action with type ${type} for saved list`);
  }
}

function handleHistoryAction({type, value}) {
  switch (type) {
    case 'save':
      return resultStore.addSavedResponse(value);
    default:
      console.warn(`No action with type ${type} for history list`);
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

.response {
  margin-bottom: 16px;
  margin-left: 16px;
}

.disabled {
  opacity: 0.5;
}
</style>
