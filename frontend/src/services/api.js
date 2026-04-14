import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Cache-Control': 'no-cache' },
})

// Always read the token fresh from localStorage on every request
// so logins that happen after module load are picked up automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})



export default api
