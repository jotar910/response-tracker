<template>
  <main class="container" :class="{'container--disable': !isOn}">
    <section class="actions spacer-top-16">
      <div class="actions__block actions__block--left">
        <div class="actions__port">
          <label>Port:</label>
          <input type="text" :value="serverPort" @blur="checkServerStatus($event.target.value)"/>
        </div>
        <span class="status" :class="['status--' + serverStatus]" :title="serverStatus"
              @click="openServerUrl"></span>
      </div>
      <div class="actions__block actions__block--left">
        <button @click="onOff">{{ isOn ? 'On' : 'Off' }}</button>
        <button @click="save">save</button>
        <button @click="reset">reset</button>
      </div>
    </section>
    <hr class="spacer-top-16 spacer-bottom-32"/>
    <section class="custom">
      <h1>Custom ({{ numOfCustomResponses }})</h1>
      <app-response-form :mainStore="mainStore" class="spacer-bottom-16"/>
      <app-custom-results :mainStore="mainStore"/>
    </section>
    <hr class="spacer-top-32 spacer-bottom-32"/>
    <section class="patterns">
      <h1>Patterns ({{ numOfPatterns }})</h1>
      <header class="patterns__header">
        <input type="text" v-model="newPattern"/>
        <button @click="addPattern" :disabled="!newPattern.length">add pattern</button>
      </header>
      <div v-for="(patternStore, index) of patternStores" :key="patternStore.$id" class="patterns__item">
        <app-pattern :mainStore="mainStore" :store="patternStore" class="pattern"></app-pattern>
        <button @click="remPattern(index)" class="btn-letter">x</button>
      </div>
    </section>
  </main>
</template>

<script setup>
import {computed, onBeforeUnmount, onMounted, ref} from "vue";
import {useMainStore} from "./store/store";
import {ResponseTracker} from "./services";
import {DEFAULT_HOST} from "./utils/utils";

const mainStore = useMainStore();
const service = new ResponseTracker(mainStore);

const newPattern = ref('');

const isOn = computed(() => mainStore.isOn);
const patternStores = computed(() => mainStore.patterns);
const numOfPatterns = computed(() => mainStore.patterns.length);
const numOfCustomResponses = computed(() => mainStore.customResults.size);
const serverStatus = computed(() => mainStore.serverStatus);
const serverPort = computed(() => mainStore.serverPort);

onMounted(async () => {
  await service.onInit();
  await mainStore.load();
  checkServerStatus();
});

onBeforeUnmount(() => {
  service.onDestroy();
});

function addPattern() {
  mainStore.addPattern(newPattern.value);
  newPattern.value = '';
}

function remPattern(index) {
  mainStore.remPattern(index);
}

function checkServerStatus(value = serverPort.value) {
  mainStore.checkServerStatus(value);
}

function onOff() {
  mainStore.setOnOff(!isOn.value);
}

function save() {
  mainStore.save();
}

function reset() {
  service.onReset()
      .then(() => mainStore.clearAll());
}

function openServerUrl() {
  if (serverStatus.value === 'error') {
    window.open(`https://${DEFAULT_HOST}:${serverPort.value}/health`);
  }
}
</script>

<style scoped>
.spacer-top-16 {
  margin-top: 16px;
}

.spacer-bottom-16 {
  margin-bottom: 16px;
}

.spacer-top-32 {
  margin-top: 32px;
}

.spacer-bottom-32 {
  margin-bottom: 32px;
}

.container.container--disable > *:not(.actions) {
  opacity: 0.5;
  pointer-events: none;
}

.actions {
  display: flex;
  justify-content: space-between;
}

.actions .actions__block {
  align-items: center;
  display: flex;
  gap: 12px;
}

.actions .actions__block input {
  width: 50px;
}

.actions .actions__port label {
  margin-right: 4px;
}

.status {
  display: block;
  line-height: 12px;
}

.status:before {
  border-radius: 50%;
  display: inline-block;
  content: '';
  height: 10px;
  margin-right: 4px;
  vertical-align: middle;
  width: 10px;
}

.status.status--off:before {
  background-color: gray;
}

.status.status--on:before {
  background-color: green;
}

.status.status--error:before {
  background-color: red;
  cursor: pointer;
}

.status.status--loading:before {
  background-color: darkorange;
}

.custom {
  margin-bottom: 16px;
}

.pattern {
  margin-bottom: 16px;
}

.patterns__header {
  display: flex;
  margin-bottom: 16px;
}

.patterns__header input {
  flex-grow: 1;
  margin-right: 8px;
}

.patterns__item {
  position: relative;
}

.patterns__item button {
  position: absolute;
  right: 16px;
  top: 16px;
}

.btn-letter {
  line-height: 8px;
  width: 12px;
  padding: 0;
}
</style>
