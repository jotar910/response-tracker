<template>
  <details>
    <summary class="response__title">{{ title }}</summary>
    <dl>
      <dd v-for="(item, index) in list">
        <app-response-item :item="item" :disabled="disabled" :actions="actions" :selected="selectedIdx === index"
                           @onAction="emitAction($event, index)" />
      </dd>
    </dl>
  </details>
</template>

<script setup>

const {title, list, disabled, actions, selectedIdx} = defineProps(['title', 'list', 'disabled', 'actions', 'selectedIdx']);
const emit = defineEmits(['onAction']);

function emitAction(action, index) {
  if (action === 'edit') {
    return emit('onAction', {type: action, value: {index, body: list[index].body}});
  }
  emit('onAction', {type: action, value: index});
}
</script>

<style scoped>
dl dd {
  margin-inline-start: 0;
}

.response__title {
  font-size: 14px;
  font-weight: 400;
  text-transform: uppercase;
}
</style>
