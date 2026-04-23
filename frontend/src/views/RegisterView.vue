<template>
  <div class="auth-page">
    <div class="auth-card">
      <h2>{{ $t('register.title') }}</h2>

      <form @submit.prevent="handleRegister" class="auth-form" novalidate>

        <!-- Username -->
        <div class="field" :class="{ 'field--error': fieldErrors.username }">
          <label for="username">{{ $t('register.username') }}</label>
          <input
            id="username"
            v-model="username"
            type="text"
            :placeholder="$t('register.usernamePlaceholder')"
            autocomplete="username"
          />
          <span v-if="fieldErrors.username" class="field-error">{{ fieldErrors.username }}</span>
          <ul v-else class="requirements">
            <li :class="req(username.length >= 3 && username.length <= 20)">{{ $t('register.reqChars') }}</li>
            <li :class="req(/^[a-zA-Z0-9_]*$/.test(username) && username.length > 0)">{{ $t('register.reqAlphanum') }}</li>
          </ul>
        </div>

        <!-- Email -->
        <div class="field" :class="{ 'field--error': fieldErrors.email }">
          <label for="email">{{ $t('register.email') }}</label>
          <input
            id="email"
            v-model="email"
            type="email"
            :placeholder="$t('register.emailPlaceholder')"
            autocomplete="email"
          />
          <span v-if="fieldErrors.email" class="field-error">{{ fieldErrors.email }}</span>
        </div>

        <!-- Password -->
        <div class="field" :class="{ 'field--error': fieldErrors.password }">
          <label for="password">{{ $t('register.password') }}</label>
          <input
            id="password"
            v-model="password"
            type="password"
            :placeholder="$t('register.passwordPlaceholder')"
            autocomplete="new-password"
          />
          <span v-if="fieldErrors.password" class="field-error">{{ fieldErrors.password }}</span>
          <ul class="requirements">
            <li :class="req(password.length >= 8)">{{ $t('register.reqLength') }}</li>
            <li :class="req(/[A-Z]/.test(password))">{{ $t('register.reqUpper') }}</li>
            <li :class="req(/[0-9]/.test(password))">{{ $t('register.reqNumber') }}</li>
          </ul>
        </div>

        <p v-if="generalError" class="error-msg">{{ generalError }}</p>

        <button type="submit" class="btn-primary" :disabled="loading || !canSubmit">
          {{ loading ? $t('register.submitting') : $t('register.submit') }}
        </button>
      </form>

      <p v-if="successMessage" class="success-msg">{{ successMessage }}</p>

      <p class="auth-switch">
        {{ $t('register.haveAccount') }}
        <RouterLink to="/login">{{ $t('nav.login') }}</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import api from '../services/api'

const router = useRouter()
const { t } = useI18n()

const username = ref('')
const email    = ref('')
const password = ref('')
const loading        = ref(false)
const generalError   = ref('')
const successMessage = ref('')
const fieldErrors    = ref({ username: '', email: '', password: '' })

const usernameValid = computed(() =>
  username.value.length >= 3 && username.value.length <= 20 && /^[a-zA-Z0-9_]+$/.test(username.value)
)
const emailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value))
const passwordValid = computed(() =>
  password.value.length >= 8 && /[A-Z]/.test(password.value) && /[0-9]/.test(password.value)
)
const canSubmit = computed(() => usernameValid.value && emailValid.value && passwordValid.value)

function req(met) { return met ? 'req-met' : 'req-unmet' }

async function handleRegister() {
  generalError.value = ''
  fieldErrors.value = { username: '', email: '', password: '' }
  if (!canSubmit.value) return
  loading.value = true
  try {
    await api.post('/register', { username: username.value, email: email.value, password: password.value })
    successMessage.value = t('register.success')
    username.value = ''
    email.value = ''
    password.value = ''
    setTimeout(() => router.push('/login'), 1500)
  } catch (error) {
    const data = error.response?.data
    if (data?.field && data?.message) {
      fieldErrors.value[data.field] = data.message
    } else if (data?.message) {
      generalError.value = data.message
    } else {
      generalError.value = t('register.failed')
    }
  } finally {
    loading.value = false
  }
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
  max-width: 420px;
  background: #141c27;
  border: 1px solid rgba(245, 158, 11, 0.15);
  border-radius: var(--radius-lg);
  padding: 2.25rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

h2 {
  font-size: 1.6rem;
  font-weight: 800;
  text-align: center;
  margin-bottom: 1.75rem;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.auth-form { display: flex; flex-direction: column; gap: 1.1rem; }

.field { display: flex; flex-direction: column; gap: 0.35rem; }

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
  box-sizing: border-box;
}
input::placeholder { color: var(--text-muted); }
input:focus {
  outline: none;
  border-color: rgba(245, 158, 11, 0.6);
  background: rgba(245, 158, 11, 0.04);
}
.field--error input { border-color: var(--lose); }

.field-error { font-size: 0.8rem; color: var(--lose); margin-top: 0.1rem; }

.requirements {
  list-style: none;
  padding: 0;
  margin: 0.2rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.requirements li {
  font-size: 0.78rem;
  padding-left: 1.25rem;
  position: relative;
  transition: color 0.2s;
}
.requirements li::before { content: '✕'; position: absolute; left: 0; font-size: 0.7rem; font-weight: 700; }
.req-unmet { color: var(--text-muted); }
.req-met { color: var(--accent-green-hover); }
.req-met::before { content: '✓ ' !important; color: var(--accent-green-hover); }

/* btn-primary base defined in main.css — overrides only */
.btn-primary {
  width: 100%;
  margin-top: 0.4rem;
}

.error-msg { color: var(--lose); font-size: 0.875rem; margin-top: 0.25rem; text-align: center; }
.success-msg { color: #fbbf24; font-size: 0.875rem; margin-top: 0.75rem; text-align: center; }

.auth-switch { text-align: center; font-size: 0.875rem; color: var(--text-secondary); margin-top: 1.25rem; }
.auth-switch a { color: #f59e0b; text-decoration: none; font-weight: 600; }
.auth-switch a:hover { text-decoration: underline; }
</style>
