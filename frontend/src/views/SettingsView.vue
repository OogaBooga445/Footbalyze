<template>
  <div class="settings-page">
    <div class="settings-card">
      <h1 class="settings-title">{{ $t('settings.title') }}</h1>

      <div v-if="saved" class="banner success">{{ $t('settings.saved') }}</div>
      <div v-if="serverError" class="banner error">{{ serverError }}</div>

      <form @submit.prevent="save" novalidate>

        <!-- Display name -->
        <div class="field-group">
          <label class="field-label">{{ $t('settings.displayName') }}</label>
          <input
            v-model="form.username"
            type="text"
            class="field-input"
            :class="{ invalid: errors.username }"
            autocomplete="username"
          />
          <p v-if="errors.username" class="field-error">{{ errors.username }}</p>
        </div>

        <!-- New password -->
        <div class="field-group">
          <label class="field-label">{{ $t('settings.newPassword') }} <span class="optional">{{ $t('settings.newPasswordHint') }}</span></label>
          <input
            v-model="form.newPassword"
            type="password"
            class="field-input"
            :class="{ invalid: errors.newPassword }"
            autocomplete="new-password"
            placeholder="••••••"
          />
          <p v-if="errors.newPassword" class="field-error">{{ errors.newPassword }}</p>
        </div>

        <div class="divider"></div>

        <!-- Current password — always required -->
        <div class="field-group">
          <label class="field-label">{{ $t('settings.currentPassword') }} <span class="required">*</span></label>
          <input
            v-model="form.currentPassword"
            type="password"
            class="field-input"
            :class="{ invalid: errors.currentPassword }"
            autocomplete="current-password"
            :placeholder="$t('settings.currentPasswordPlaceholder')"
          />
          <p v-if="errors.currentPassword" class="field-error">{{ errors.currentPassword }}</p>
        </div>

        <div class="form-actions">
          <RouterLink to="/account" class="btn-cancel">{{ $t('settings.cancel') }}</RouterLink>
          <button type="submit" class="btn-save" :disabled="saving">
            {{ saving ? $t('settings.saving') : $t('settings.save') }}
          </button>
        </div>

      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import api from '../services/api'

const store = useStore()
const { t } = useI18n()

const form = reactive({
  username: '',
  newPassword: '',
  currentPassword: '',
})
const errors = ref({})
const serverError = ref('')
const saving = ref(false)
const saved = ref(false)

onMounted(() => {
  form.username = store.state.user?.username || ''
})

function validate() {
  const e = {}
  if (!form.username.trim())
    e.username = t('settings.errEmpty')
  else if (form.username.length < 3 || form.username.length > 20)
    e.username = t('settings.err320')
  else if (!/^[a-zA-Z0-9_]+$/.test(form.username))
    e.username = t('settings.errAlpha')

  if (form.newPassword && (form.newPassword.length < 8 || !/[A-Z]/.test(form.newPassword) || !/[0-9]/.test(form.newPassword)))
    e.newPassword = t('settings.errPassword')

  if (!form.currentPassword)
    e.currentPassword = t('settings.errCurrentRequired')

  errors.value = e
  return !Object.keys(e).length
}

async function save() {
  saved.value = false
  serverError.value = ''
  if (!validate()) return

  saving.value = true
  try {
    const payload = { username: form.username, currentPassword: form.currentPassword }
    if (form.newPassword) payload.newPassword = form.newPassword

    const res = await api.put('/user/settings', payload)
    const { token, user } = res.data

    localStorage.setItem('token', token)
    store.commit('updateUser', user)

    form.currentPassword = ''
    form.newPassword = ''
    saved.value = true
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (err) {
    const data = err.response?.data
    if (data?.field) {
      errors.value = { [data.field]: data.message }
    } else {
      serverError.value = data?.message || 'Something went wrong. Please try again.'
    }
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.settings-page {
  display: flex;
  justify-content: center;
  padding: 2.5rem 1rem 5rem;
}

.settings-card {
  width: 100%;
  max-width: 440px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-top: 3px solid var(--accent);
  border-radius: var(--radius-lg);
  padding: 2rem 2rem 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.settings-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

/* Banners */
.banner {
  padding: 0.65rem 1rem;
  border-radius: var(--radius);
  font-size: 0.875rem;
  font-weight: 600;
}
.banner.success {
  background: rgba(16,185,129,0.1);
  border: 1px solid rgba(16,185,129,0.3);
  color: var(--win);
}
.banner.error {
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.3);
  color: var(--lose);
}

/* Fields */
form { display: flex; flex-direction: column; gap: 1.1rem; }

.field-group { display: flex; flex-direction: column; gap: 0.35rem; }

.field-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
}
.optional {
  font-weight: 400;
  color: var(--text-muted);
}
.required { color: var(--lose); }

.field-input {
  background: var(--bg-surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-primary);
  font-size: 0.9rem;
  padding: 0.6rem 0.85rem;
  outline: none;
  transition: border-color 0.15s;
  width: 100%;
  box-sizing: border-box;
}
.field-input:focus { border-color: rgba(245, 158, 11, 0.6); }
.field-input.invalid { border-color: var(--lose); }

.field-error {
  font-size: 0.75rem;
  color: var(--lose);
  margin: 0;
}

.divider {
  border: none;
  border-top: 1px solid var(--border);
  margin: 0.1rem 0;
}

/* Actions */
.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.btn-cancel {
  padding: 0.6rem 1.25rem;
  border-radius: var(--radius);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-muted);
  background: transparent;
  border: 1px solid var(--border);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  transition: border-color 0.15s, color 0.15s;
}
.btn-cancel:hover { border-color: var(--text-muted); color: var(--text-primary); }

.btn-save {
  padding: 0.6rem 1.5rem;
  border-radius: var(--radius);
  font-size: 0.875rem;
  font-weight: 700;
  color: #0f1419;
  background: var(--accent);
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-save:hover:not(:disabled) { background: var(--accent-hover); }
.btn-save:disabled { opacity: 0.55; cursor: not-allowed; }
</style>
