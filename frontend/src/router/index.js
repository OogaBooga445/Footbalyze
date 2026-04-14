import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import store from '../store/store.js'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/dashboard', name: 'dashboard', component: () => import('../views/UserDashboard.vue') },
    { path: '/teams', name: 'team-details', component: () => import('../views/TeamDetails.vue') },
    { path: '/table', name: 'table', component: () => import('../views/TableView.vue') },
    { path: '/leagues', name: 'leagues', component: () => import('../views/LeagueView.vue') },
    { path: '/teams/:id', name: 'team-squad', component: () => import('../views/TeamView.vue') },
    { path: '/matches', name: 'match-details', component: () => import('../views/MatchDetails.vue') },
    { path: '/h2h', name: 'h2h', component: () => import('../views/H2HView.vue') },
    { path: '/leaderboard', name: 'leaderboard', component: () => import('../views/LeaderboardView.vue') },
    { path: '/players', name: 'player-profile', component: () => import('../views/PlayerProfile.vue') },
    { path: '/players/:id', name: 'player-view', component: () => import('../views/PlayerView.vue') },
    { path: '/admin', name: 'admin-panel', component: () => import('../views/AdminPanel.vue') },
    { path: '/login', name: 'Login', component: () => import('../views/LoginView.vue') },
    { path: '/register', name: 'Register', component: () => import('../views/RegisterView.vue') },
    { path: '/account', name: 'Account', component: () => import('../views/AccountView.vue') },
    { path: '/settings', name: 'Settings', component: () => import('../views/SettingsView.vue') },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue') },
  ],
})

router.beforeEach((to, from, next) => {
  const storedUser = store.state.user
  const isLoggedIn = !!storedUser
  const isAdmin = storedUser?.role?.toLowerCase() === 'admin'

  if (['/account', '/dashboard', '/settings'].includes(to.path) && !isLoggedIn) {
    next('/login')
  } else if (to.path === '/admin' && !isAdmin) {
    next('/')
  } else if (['/login', '/register'].includes(to.path) && isLoggedIn) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
