import { createStore } from 'vuex'

export default createStore({
  state() {
    let user = null
    try { user = JSON.parse(localStorage.getItem('user')) } catch { /* corrupted */ }
    return { user }
  },
  actions: {
    login({ commit }, userData) {
      commit('setUser', userData)
      localStorage.setItem('user', JSON.stringify(userData))
    },
    logout({ commit }) {
      commit('clearUser')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
  },
  mutations: {
    setUser(state, user) {
      state.user = user
    },
    clearUser(state) {
      state.user = null
    },
    updateUser(state, updates) {
      state.user = { ...state.user, ...updates }
      localStorage.setItem('user', JSON.stringify(state.user))
    },
    setAvatar(state, avatarUrl) {
      state.user = { ...state.user, avatarUrl }
      localStorage.setItem('user', JSON.stringify(state.user))
    },
  },
})
