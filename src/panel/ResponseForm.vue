<template>
  <details class="response-form__container">
    <summary>Custom Form</summary>
    <form @submit.prevent="submit">
      <div class="response-form__form-group response-form__form-group--flex">
        <label>URL:</label>
        <input type="text" v-model="item.url">
      </div>
      <div class="response-form__form-group response-form__form-group--flex">
        <label>Status:</label>
        <input type="text" v-model="item.status">
      </div>
      <div class="response-form__form-group">
        <label>Body (<input type="text" v-model="item.type" class="response-form__type">):</label>
        <textarea v-model="item.body" rows="5"></textarea>
      </div>
      <details v-if="item.headers" open>
        <summary class="headers__title">Headers:</summary>
        <section class="headers__content">
          <div class="headers__item" v-for="(header, index) in item.headers" :key="header">
            <input type="text" v-model="header.name">
            <input type="text" v-model="header.value">
            <button class="headers__action" @click="remHeader(item, index)">x</button>
          </div>
          <button class="headers__action headers__action--middle" @click="addHeader(item)">+</button>
        </section>
      </details>
      <button type="submit" :disabled="!item.url || !item.status || !item.type">add custom</button>
    </form>
  </details>
</template>

<script setup>
import {Factory} from "./utils/utils";
import {ref} from "vue";

const {mainStore} = defineProps(['mainStore']);

const emptyItem = Factory.emptyCustomResponse();
const item = ref(Object.keys(emptyItem).reduce((obj, key) => ({...obj, [key]: ref(emptyItem[key])}), {}));

function submit() {
  const response = Object.keys(item.value).reduce((obj, key) => ({...obj, [key]: item.value[key]}), {});
  mainStore.addCustomResult(response.url, response)
      .catch((error) => console.error('adding custom result', error))
      .then(() => Object.assign(item.value, Factory.emptyCustomResponse()));
}

function addHeader() {
  item.headers = [...item.headers, {name: '', value: ''}];
}

function remHeader(index) {
  item.headers = [...item.headers.slice(0, index), ...item.headers.slice(index + 1)];
}
</script>

<style scoped>
.response-form__container {
  border: 1px solid black;
  padding: 20px 16px;
  border-radius: 10px;
}

.response-form__container > summary {
  font-size: 18px;
  font-weight: 500;
  margin-right: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

form {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  margin-top: 12px;
  row-gap: 8px;
}

.response-form__form-group > label {
  display: block;
}

.response-form__form-group.response-form__form-group--flex {
  align-items: center;
  display: flex;
}

.response-form__form-group.response-form__form-group--flex > label {
  margin-bottom: 0;
  margin-right: 8px;
}

.headers__title,
.response-form__form-group > label {
  color: gray;
  font-size: 12px;
  margin-bottom: 8px;
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

input.response-form__type {
  width: auto;
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

button[type=submit] {
  margin: 16px 0;
}
</style>
