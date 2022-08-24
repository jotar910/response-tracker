import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App'
import Pattern from "./Pattern";
import Result from "./Result";
import Response from "./Response";
import ResponseItem from "./ResponseItem";
import ResponseForm from "./ResponseForm";
import CustomResults from "./CustomResults";
import CustomResult from "./CustomResult";

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.component('app-pattern', Pattern);
app.component('app-result', Result);
app.component('app-response', Response);
app.component('app-response-item', ResponseItem);
app.component('app-response-form', ResponseForm);
app.component('app-custom-results', CustomResults);
app.component('app-custom-result', CustomResult);
app.mount('#app')
