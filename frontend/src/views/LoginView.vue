<template>
  <div class="auth-page">
    <div class="auth-card">
      <h2 v-if="!user">Login</h2>
      <h2 v-else>Welcome back, {{ user.username }}</h2>

      <form v-if="!user" @submit.prevent="handleLogin" class="auth-form">
        <div class="field">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="you@example.com"
            required
            autocomplete="email"
          />
        </div>
        <div class="field">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Your password"
            required
            autocomplete="current-password"
          />
        </div>

        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
      </form>

      <div v-if="user" class="logged-in-actions">
        <RouterLink to="/dashboard" class="btn-primary">Go to Dashboard</RouterLink>
        <button class="btn-ghost" @click="logout">Logout</button>
      </div>

      <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>

      <p v-if="!user" class="auth-switch">
        Don't have an account?
        <RouterLink to="/register">Register</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import api from '../services/api'

const store = useStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const user = computed(() => store.state.user)

async function handleLogin() {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await api.post('/login', {
      email: email.value,
      password: password.value
    })
    const { token, user: loggedInUser } = response.data

    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(loggedInUser))

    store.dispatch('login', loggedInUser)

    email.value = ''
    password.value = ''
    router.push('/dashboard')
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Unable to connect to server. Is the backend running?'
  } finally {
    loading.value = false
  }
}

function logout() {
  store.dispatch('logout')
}
</script>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 60px);
  padding: 2rem 1rem;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  background: rgba(8, 14, 26, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-lg);
  padding: 2.25rem;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
}

h2 {
  font-size: 1.6rem;
  font-weight: 800;
  text-align: center;
  margin-bottom: 1.75rem;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: 0.02em;
}

input {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius);
  color: var(--text-primary);
  padding: 0.65rem 0.9rem;
  font-size: 0.95rem;
  transition: border-color 0.2s, background 0.2s;
  width: 100%;
}
input::placeholder { color: var(--text-muted); }
input:focus {
  outline: none;
  border-color: var(--accent-green);
  background: rgba(16, 185, 129, 0.05);
}

/* btn-primary / btn-ghost base defined in main.css — overrides only */
.btn-primary {
  width: 100%;
  margin-top: 0.4rem;
  text-align: center;
  display: block;
  box-shadow: 0 4px 20px rgba(16, 185, 129, 0.25);
}
.btn-primary:hover:not(:disabled) {
  box-shadow: 0 6px 28px rgba(16, 185, 129, 0.35);
}
.btn-ghost {
  width: 100%;
  margin-top: 0.5rem;
}

.logged-in-actions { display: flex; flex-direction: column; gap: 0.5rem; }

.error-msg {
  color: var(--lose);
  font-size: 0.875rem;
  margin-top: 0.75rem;
  text-align: center;
}

.auth-switch {
  text-align: center;
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 1.25rem;
}
.auth-switch a {
  color: var(--accent-green-hover);
  text-decoration: none;
  font-weight: 600;
}
.auth-switch a:hover { text-decoration: underline; }
</style>
