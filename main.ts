import { renderApp } from "./app/app";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("Court root element not found");

const render = () => renderApp(root);
window.addEventListener("hashchange", render);
render();
