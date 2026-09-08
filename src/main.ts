import { refreshPersonalUI, renderApp } from "./app/app";
import { hydratePersonalData } from "./data/personalData";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("Baseline root element not found");

const render = () => renderApp(root);
window.addEventListener("hashchange", render);
render();
void hydratePersonalData().then(() => refreshPersonalUI(root));
