import { createRouter, createWebHashHistory } from "vue-router";
import HistoryPage from "@pages/HistoryPage.vue";
import DashboardPage from "@pages/DashboardPage.vue";

const routes = [
  { path: "/", name: "DashboardRouter", component: DashboardPage },
  { path: "/history", name: "HistoryRouter", component: HistoryPage },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
