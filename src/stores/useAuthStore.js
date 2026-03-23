import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    clinic: null
  }),
  actions: {
    loginPatient({ email, password }) {
      if (!email || !password) {
        throw new Error('Email and password are required')
      }

      this.user = { email, role: 'patient' }
    },
    setUser(user) {
      this.user = user
    },
    setClinic(clinic) {
      this.clinic = clinic
    },
    logout() {
      this.user = null
      this.clinic = null
    }
  }
})