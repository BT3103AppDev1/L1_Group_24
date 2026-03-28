import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    clinic: null
  }),

  getters: {
    clinicId: (state) => state.clinic?.clinicId || null
  },

  actions: {
    loginPatient({ email, password }) {
      if (!email || !password) {
        throw new Error('Email and password are required')
      }

      this.user = {
        email,
        role: 'patient'
      }

      this.clinic = null
    },

    loginClinic({ email, password }) {
      if (!email || !password) {
        throw new Error('Email and password are required')
      }

      // Hardcoded mock credentials so you can test the dashboard UI
      if (email === 'clinic@test.com' && password === '123456') {
        this.clinic = {
          email,
          role: 'clinic',
          clinicId: 'mock_clinic_123'
        }
      } else {
        throw new Error('Invalid mock credentials. Try clinic@test.com / 123456')
      }

      this.user = null
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