import "./style.css";
import { getRoute, navigate, onRouteChange, type Route } from "./lib/router";
import { iconClipboard, iconLightbulb, iconBarChart } from "./lib/icons";
import { GREEN_ROOM_LABEL } from "./lib/config";
import * as callSheet from "./screens/callSheet";
import * as greenRoom from "./screens/greenRoom";
import * as insights from "./screens/insights";
import * as settings from "./screens/settings";
import * as ideaDetail from "./screens/ideaDetail";
import * as greenRoomSettings from "./screens/greenRoomSettings";
import * as reference from "./screens/reference";

const app = document.getElementById("app")!;

const main = document.createElement("main");
main.id = "view";

const nav = document.createElement("nav");
nav.className = "tabbar";
nav.innerHTML = `
  <button data-route="call-sheet">${iconClipboard}<span>Marquee</span></button>
  <button data-route="green-room">${iconLightbulb}<span>${GREEN_ROOM_LABEL}</span></button>
  <button data-route="insights">${iconBarChart}<span>Insights</span></button>
`;

app.appendChild(main);
app.appendChild(nav);

nav.querySelectorAll<HTMLButtonElement>("button").forEach((btn) => {
  btn.addEventListener("click", () => {
    navigate(btn.dataset.route as Route);
  });
});

const nonTabRoutes: Route[] = [
  "settings",
  "green-room-detail",
  "green-room-settings",
  "green-room-reference",
];

function updateActiveTab(route: Route): void {
  nav.style.display = nonTabRoutes.includes(route) ? "none" : "flex";
  nav.querySelectorAll<HTMLButtonElement>("button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.route === route);
  });
}

async function render(): Promise<void> {
  const route = getRoute();
  updateActiveTab(route);
  main.innerHTML = "";
  switch (route) {
    case "call-sheet":
      await callSheet.mount(main);
      break;
    case "green-room":
      await greenRoom.mount(main);
      break;
    case "insights":
      await insights.mount(main);
      break;
    case "settings":
      await settings.mount(main);
      break;
    case "green-room-detail":
      await ideaDetail.mount(main);
      break;
    case "green-room-settings":
      await greenRoomSettings.mount(main);
      break;
    case "green-room-reference":
      await reference.mount(main);
      break;
  }
}

onRouteChange(render);
render();
