import { defineStore } from 'pinia'
import { registerWithEmail } from '@/firebase/auth.js'
import { createClinic } from '@/firebase/firestore.js'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    clinic: null
  }),

  getters: {
    clinicId: (state) => state.clinic?.clinicId || null
  },

  actions: {
    async registerClinic(payload) {
      // Create user in Firebase Auth
      const userCredential = await registerWithEmail(payload.email, payload.password)
      const user = userCredential.user

      // Add extra details to Firestore
      const clinicData = {
        clinicName: payload.name,
        contactNumber: payload.contactNumber,
        email: payload.email,
        address: payload.address,
        postalCode: payload.postalCode,
        district: payload.district,
        role: 'clinic',
        services: [] // Add empty services array by default
      }
      
      await createClinic(user.uid, clinicData)

      // Set the current clinic in store
      this.clinic = { ...clinicData, clinicId: user.uid, role: 'clinic' }
      this.user = null
    },

    loginPatient({ email, password }) {
      if (!email || !password) {
        throw new Error('Email and password are required')
      }

      // Hardcoded mock credentials so you can test the patient dashboard UI
      if (email === 'patient@test.com' && password === '123456') {
        this.user = {
          email,
          role: 'patient'
        }
      } else {
        throw new Error('Invalid mock credentials. Try patient@test.com / 123456')
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