import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    clinic: null
  }),
  actions: {
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
