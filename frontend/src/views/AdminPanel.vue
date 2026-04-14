<template>
  <div class="admin-page">
    <div class="admin-container">

      <div class="admin-header">
        <h1 class="admin-title">Admin Panel</h1>
        <p class="admin-sub">Logged in as <span class="admin-you">{{ currentUser?.username }}</span></p>
      </div>

      <!-- ── TABS ───────────────────────────────────────────────────────────── -->
      <div class="admin-tabs">
        <button class="admin-tab" :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'">Users</button>
        <button class="admin-tab" :class="{ active: activeTab === 'reports' }" @click="switchToReports">
          Reports
          <span v-if="reports.length" class="report-badge">{{ reports.length }}</span>
        </button>
      </div>

      <!-- ── USERS ──────────────────────────────────────────────────────────── -->
      <template v-if="activeTab === 'users'">
      <div v-if="usersLoading" class="loading-text">Loading users...</div>
      <div v-else-if="usersError" class="error-text">{{ usersError }}</div>
      <template v-else>

        <!-- Stats strip -->
        <div class="user-stats-strip">
          <div class="user-stat">
            <span class="ustat-val">{{ users.length }}</span>
            <span class="ustat-lbl">Total Users</span>
          </div>
          <div class="ustat-divider"></div>
          <div class="user-stat">
            <span class="ustat-val ustat-val--admin">{{ adminCount }}</span>
            <span class="ustat-lbl">Admins</span>
          </div>
          <div class="ustat-divider"></div>
          <div class="user-stat">
            <span class="ustat-val">{{ users.length - adminCount }}</span>
            <span class="ustat-lbl">Regular</span>
          </div>
          <div class="ustat-divider"></div>
          <div class="user-stat">
            <span class="ustat-val ustat-val--banned">{{ bannedCount }}</span>
            <span class="ustat-lbl">Banned</span>
          </div>
        </div>

        <!-- Search -->
        <input v-model="userSearch" class="user-search" type="text" placeholder="Search by username or email..." />

        <!-- Table -->
        <div class="users-table-wrap">
          <table class="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th class="col-hide-mobile">Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in filteredUsers" :key="u.User_ID" :class="{ 'row-self': u.User_ID === currentUser?.id, 'row-banned': u.banned }">
                <td class="col-id">{{ u.User_ID }}</td>
                <td class="col-username">
                  {{ u.Username }}
                  <span v-if="u.User_ID === currentUser?.id" class="you-badge">you</span>
                  <span v-if="u.banned" class="banned-badge">banned</span>
                </td>
                <td class="col-email col-hide-mobile">{{ u.Email }}</td>
                <td class="col-role">
                  <span class="role-badge" :class="`role-badge--${u.Role?.trim().toLowerCase()}`">{{ u.Role?.trim() }}</span>
                </td>
                <td class="col-actions">
                  <template v-if="u.User_ID !== currentUser?.id">
                    <button
                      class="action-btn action-btn--promote"
                      :disabled="!!actionLoading[u.User_ID]"
                      @click="toggleRole(u)"
                    >{{ u.Role?.trim().toLowerCase() === 'admin' ? 'Demote' : 'Promote' }}</button>
                    <button
                      class="action-btn action-btn--ban"
                      :disabled="!!actionLoading[u.User_ID]"
                      @click="toggleBan(u)"
                    >{{ u.banned ? 'Unban' : 'Ban' }}</button>
                    <button
                      class="action-btn action-btn--delete"
                      :disabled="!!actionLoading[u.User_ID]"
                      @click="deleteUser(u)"
                    >Delete</button>
                  </template>
                  <span v-else class="no-actions">—</span>
                </td>
              </tr>
              <tr v-if="filteredUsers.length === 0">
                <td colspan="5" class="empty-row">No users match your search.</td>
              </tr>
            </tbody>
          </table>
        </div>

      </template>
      </template>

      <!-- ── REPORTS ───────────────────────────────────────────────────────── -->
      <template v-if="activeTab === 'reports'">
        <div v-if="reportsLoading" class="loading-text">Loading reports...</div>
        <div v-else-if="!reports.length" class="empty-reports">No reported comments.</div>
        <div v-else class="reports-list">
          <div v-for="r in reports" :key="r.Comment_ID" class="report-card">
            <div class="report-meta">
              <span class="report-user">{{ r.Username }}</span>
              <span class="report-time">{{ formatReportTime(r.CreatedAt) }}</span>
              <span class="report-count">🚩 {{ r.report_count }} report{{ r.report_count !== 1 ? 's' : '' }}</span>
              <span class="report-match">Match #{{ r.Match_ID }}</span>
            </div>
            <p class="report-content">{{ r.Content }}</p>
            <div class="report-actions">
              <button class="action-btn action-btn--delete" @click="deleteReportedComment(r)">Delete Comment</button>
              <button class="action-btn action-btn--dismiss" @click="dismissReport(r)">Dismiss</button>
            </div>
          </div>
        </div>
      </template>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import api from '../services/api'

const store = useStore()
const currentUser = computed(() => store.state.user)

const activeTab = ref('users')

const users = ref([])
const usersLoading = ref(false)
const usersError = ref('')
const actionLoading = ref({})
const userSearch = ref('')

const reports = ref([])
const reportsLoading = ref(false)

const formatReportTime = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

async function fetchReports() {
  reportsLoading.value = true
  try {
    const res = await api.get('/admin/reports')
    reports.value = res.data
  } catch (err) {
    console.error('Failed to load reports:', err)
  } finally {
    reportsLoading.value = false
  }
}

function switchToReports() {
  activeTab.value = 'reports'
  fetchReports()
}

async function deleteReportedComment(r) {
  if (!confirm(`Delete comment by "${r.Username}"?`)) return
  try {
    await api.delete(`/comments/${r.Comment_ID}`)
    reports.value = reports.value.filter(x => x.Comment_ID !== r.Comment_ID)
  } catch (err) {
    alert(err.response?.data?.error || 'Failed to delete comment')
  }
}

async function dismissReport(r) {
  try {
    await api.delete(`/admin/reports/${r.Comment_ID}`)
    reports.value = reports.value.filter(x => x.Comment_ID !== r.Comment_ID)
  } catch (err) {
    alert(err.response?.data?.error || 'Failed to dismiss report')
  }
}

const adminCount  = computed(() => users.value.filter(u => u.Role?.trim().toLowerCase() === 'admin').length)
const bannedCount = computed(() => users.value.filter(u => u.banned).length)

const filteredUsers = computed(() => {
  const s = userSearch.value.toLowerCase().trim()
  if (!s) return users.value
  return users.value.filter(u =>
    u.Username.toLowerCase().includes(s) || u.Email.toLowerCase().includes(s)
  )
})

async function fetchUsers() {
  usersLoading.value = true
  usersError.value = ''
  try {
    const res = await api.get('/admin/users')
    users.value = res.data
  } catch (err) {
    usersError.value = err.response?.data?.error || 'Failed to load users'
  } finally {
    usersLoading.value = false
  }
}

async function toggleRole(u) {
  const newRole = u.Role?.trim().toLowerCase() === 'admin' ? 'user' : 'admin'
  actionLoading.value = { ...actionLoading.value, [u.User_ID]: true }
  try {
    await api.patch(`/admin/users/${u.User_ID}/role`, { role: newRole })
    u.Role = newRole
  } catch (err) {
    alert(err.response?.data?.error || 'Failed to update role')
  } finally {
    const copy = { ...actionLoading.value }
    delete copy[u.User_ID]
    actionLoading.value = copy
  }
}

async function toggleBan(u) {
  actionLoading.value = { ...actionLoading.value, [u.User_ID]: true }
  try {
    await api.patch(`/admin/users/${u.User_ID}/ban`, { banned: !u.banned })
    u.banned = !u.banned
  } catch (err) {
    alert(err.response?.data?.error || 'Failed to update ban status')
  } finally {
    const copy = { ...actionLoading.value }
    delete copy[u.User_ID]
    actionLoading.value = copy
  }
}

async function deleteUser(u) {
  if (!confirm(`Delete user "${u.Username}"? This cannot be undone.`)) return
  actionLoading.value = { ...actionLoading.value, [u.User_ID]: true }
  try {
    await api.delete(`/admin/users/${u.User_ID}`)
    users.value = users.value.filter(x => x.User_ID !== u.User_ID)
  } catch (err) {
    alert(err.response?.data?.error || 'Failed to delete user')
  } finally {
    const copy = { ...actionLoading.value }
    delete copy[u.User_ID]
    actionLoading.value = copy
  }
}

onMounted(fetchUsers)
</script>

<style scoped>
.admin-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
}

.admin-container {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.admin-header { display: flex; flex-direction: column; gap: 0.25rem; }
.admin-title { font-size: 1.75rem; font-weight: 800; color: var(--text-primary); }
.admin-sub { font-size: 0.9rem; color: var(--text-muted); }
.admin-you { color: var(--accent-hover); font-weight: 700; }

/* ── Stats strip ──────────────────────────────────────────────────────────── */
.user-stats-strip {
  display: flex;
  align-items: center;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 0.85rem 1.5rem;
}

.user-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  flex: 1;
}

.ustat-val {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
}
.ustat-val--admin { color: var(--accent-hover); }

.ustat-lbl {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  white-space: nowrap;
}

.ustat-divider {
  width: 1px;
  height: 36px;
  background: var(--border);
  flex-shrink: 0;
  margin: 0 0.5rem;
}

/* ── Search ───────────────────────────────────────────────────────────────── */
.user-search {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-primary);
  padding: 0.5rem 0.85rem;
  font-size: 0.875rem;
  width: 100%;
  transition: border-color 0.2s;
}
.user-search:focus { outline: none; border-color: var(--accent); }
.user-search::placeholder { color: var(--text-muted); }

/* ── Table ────────────────────────────────────────────────────────────────── */
.users-table-wrap {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.users-table thead tr {
  background: var(--bg-surface-2);
  border-bottom: 1px solid var(--border);
}

.users-table th {
  padding: 0.7rem 1rem;
  text-align: left;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.users-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border);
  color: var(--text-secondary);
  vertical-align: middle;
}

.users-table tbody tr:last-child td { border-bottom: none; }
.users-table tbody tr:hover td { background: rgba(255,255,255,0.02); }
.row-self td { background: rgba(59,130,246,0.04); }

.col-id { color: var(--text-muted); font-size: 0.78rem; width: 50px; }
.col-username { font-weight: 600; color: var(--text-primary); }
.col-email { color: var(--text-muted); font-size: 0.82rem; }
.col-actions { white-space: nowrap; }
.col-actions > * + * { margin-left: 0.4rem; }

@media (max-width: 600px) {
  .col-hide-mobile { display: none; }
  .col-actions { white-space: normal; }
  .col-actions > * + * { margin-left: 0.25rem; margin-top: 0.25rem; }
  .action-btn { font-size: 0.65rem; padding: 0.2rem 0.5rem; }
}

.you-badge {
  font-size: 0.62rem;
  font-weight: 700;
  background: var(--accent-muted);
  color: var(--accent-hover);
  border: 1px solid var(--accent);
  border-radius: 999px;
  padding: 1px 6px;
  margin-left: 0.4rem;
}

.role-badge {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 2px 8px;
  border-radius: 999px;
}
.role-badge--admin {
  background: rgba(59,130,246,0.15);
  color: var(--accent-hover);
  border: 1px solid rgba(59,130,246,0.3);
}
.role-badge--user {
  background: var(--bg-surface-2);
  color: var(--text-muted);
  border: 1px solid var(--border);
}

.action-btn {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  border: 1.5px solid;
  cursor: pointer;
  background: none;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
}
.action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.action-btn--promote {
  border-color: var(--accent);
  color: var(--accent-hover);
}
.action-btn--promote:hover:not(:disabled) { background: var(--accent-muted); }

.action-btn--ban {
  border-color: rgba(249,115,22,0.4);
  color: #f97316;
}
.action-btn--ban:hover:not(:disabled) { background: rgba(249,115,22,0.1); }

.action-btn--delete {
  border-color: rgba(239,68,68,0.4);
  color: var(--lose);
}
.action-btn--delete:hover:not(:disabled) { background: rgba(239,68,68,0.1); }

.no-actions { color: var(--text-muted); font-size: 0.8rem; }

.row-banned td { background: rgba(249,115,22,0.04); }

.banned-badge {
  font-size: 0.62rem;
  font-weight: 700;
  background: rgba(249,115,22,0.15);
  color: #f97316;
  border: 1px solid rgba(249,115,22,0.3);
  border-radius: 999px;
  padding: 1px 6px;
  margin-left: 0.4rem;
}

.ustat-val--banned { color: #f97316; }

.empty-row {
  text-align: center;
  color: var(--text-muted);
  font-style: italic;
  padding: 1.5rem;
}

.loading-text { color: var(--text-muted); font-style: italic; font-size: 0.875rem; }
.error-text   { color: var(--lose); font-size: 0.82rem; }

/* ── Tabs ─────────────────────────────────────────────────────────────────── */
.admin-tabs {
  display: flex;
  gap: 0.25rem;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0;
}

.admin-tab {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 0.5rem 1rem;
  margin-bottom: -1px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.admin-tab:hover { color: var(--text-primary); }
.admin-tab.active { color: var(--accent-hover); border-bottom-color: var(--accent-hover); }

.report-badge {
  background: rgba(239,68,68,0.2);
  color: #f87171;
  border: 1px solid rgba(239,68,68,0.3);
  border-radius: 999px;
  font-size: 0.62rem;
  font-weight: 700;
  padding: 1px 6px;
  line-height: 1.4;
}

/* ── Reports ──────────────────────────────────────────────────────────────── */
.empty-reports {
  text-align: center;
  color: var(--text-muted);
  font-style: italic;
  font-size: 0.875rem;
  padding: 2rem 0;
}

.reports-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.report-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-left: 3px solid rgba(249,115,22,0.5);
  border-radius: var(--radius-lg);
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.report-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.report-user { font-weight: 700; font-size: 0.82rem; color: var(--text-primary); }
.report-time { font-size: 0.72rem; color: var(--text-muted); }
.report-count { font-size: 0.72rem; color: #f97316; font-weight: 700; margin-left: auto; }
.report-match { font-size: 0.72rem; color: var(--text-muted); }

.report-content {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
  background: var(--bg-surface-2);
  border-radius: var(--radius);
  padding: 0.5rem 0.75rem;
}

.report-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn--dismiss {
  border-color: var(--border);
  color: var(--text-muted);
}
.action-btn--dismiss:hover:not(:disabled) { background: var(--bg-surface-2); color: var(--text-primary); }
</style>
