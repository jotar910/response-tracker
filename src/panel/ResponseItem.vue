<template>
  <article class="response-item__container">
    <div class="response-item__actions response-item__actions--left">
      <template v-for="action in actions">
        <input type="checkbox" v-if="action === 'pick'"
               :checked="selected" :disabled="disabled"
               @change="emit('onAction', action)"/>
      </template>
    </div>
    <div class="response-item__content">
      <div class="response-item__actions response-item__actions--middle response-item__actions--right">
        <span class="response-item__date" v-if="item.date">{{ new Date(item.date).toLocaleString() }}</span>
        <template v-for="action in actions">
          <button v-if="action === 'copy'" @click="copy()">c</button>
          <button v-else-if="action === 'save'" @click="emit('onAction', action)">+</button>
          <button v-else-if="action === 'remove'" @click="emit('onAction', action)">-</button>
          <button v-else-if="action === 'edit'" :disabled ="disabled" @click="emit('onAction', action)">e</button>
        </template>
      </div>
      <div class="response-item__form-group response-item__form-group--flex">
        <label>Status:</label>
        <input type="text" v-model="item.status" :readonly="disabled">
      </div>
      <div class="response-item__form-group">
        <label>Body ({{ item.type }}):</label>
        <textarea v-model="item.body" :readonly="disabled" rows="5" ref="input"></textarea>
      </div>
      <details v-if="item.headers">
        <summary class="headers__title">Headers:</summary>
        <section class="headers__content">
          <div class="headers__item" v-for="(header, index) in item.headers" :key="header">
            <input type="text" v-model="header.name" :readonly="disabled">
            <input type="text" v-model="header.value" :readonly="disabled">
            <button class="headers__action" :disabled="disabled" @click="remHeader(item, index)">x</button>
          </div>
          <button class="headers__action headers__action--middle" :disabled="disabled" @click="addHeader(item)">+</button>
        </section>
      </details>
    </div>
  </article>
</template>

<script setup>
import {ref} from "vue";

const {item, disabled, actions, selected} = defineProps(['item', 'disabled', 'actions', 'selected']);
const emit = defineEmits(['onAction']);
const input = ref(null);

function addHeader(item) {
  item.headers = [...item.headers, {name: '', value: ''}];
}

function remHeader(item, index) {
  item.headers = [...item.headers.slice(0, index), ...item.headers.slice(index + 1)];
}

function copy() {
  input.value.focus();
  input.value.select();
  document.execCommand('copy');
}
</script>

<style scoped>
.response-item__container {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.response-item__content {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  row-gap: 8px;
}

.response-item__actions {
  display: flex;
}

.response-item__actions.response-item__actions--middle {
  align-items: center;
}

.response-item__actions.response-item__actions--left > * {
  margin-right: 8px;
}

.response-item__actions.response-item__actions--left > :last-child {
  margin-right: 24px;
}

.response-item__actions.response-item__actions--right {
  column-gap: 8px;
  justify-content: flex-end;
  margin-left: 16px;
}

.response-item__date {
  color: gray;
  font-size: 10px;
  margin-right: 8px;
}

.headers__title,
.response-item__form-group > label {
  color: gray;
  font-size: 12px;
  margin-bottom: 8px;
}

.response-item__form-group > label {
  display: block;
}

.response-item__form-group.response-item__form-group--flex {
  align-items: center;
  display: flex;
}

.response-item__form-group.response-item__form-group--flex > label {
  margin-bottom: 0;
  margin-right: 8px;
}

.headers__content {
  display: flex;
  flex-direction: column;
  row-gap: 6px;
}

.headers__content > .headers__item {
  display: grid;
  column-gap: 8px;
  grid-template-columns: 1fr 4fr auto;
}

.headers__content > .headers__item > input {
  width: auto;
}

.headers__action.headers__action--middle {
  align-self: center;
}

input {
  width: 100%;
}

textarea {
  resize: vertical;
  width: 100%;
}

input:read-only,
textarea:read-only {
  background-color: #f8f8f8;
  opacity: 0.7;
}
</style>
