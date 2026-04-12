// User login state

import { defineStore } from 'pinia'
import {
  registerWithEmail,
  loginWithEmail,
  logout,
  onAuthChange
} from '@/firebase/auth.js'
import {
  createPatient,
  getPatient,
  createClinic,
  getClinic,
} from '@/firebase/firestore.js'
import { geocodePostalCode } from '@/utils/geo.js'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    patient: null,
    clinic: null,
    role: null,
    loading: false,
    initialized: false,
    isLoggingIn: false,
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
    isPatient: (state) => state.role === 'patient',
    isClinic: (state) => state.role === 'clinic',
    patientId: (state) => state.patient?.id || null,
    clinicId: (state) => state.clinic?.id || null
  },

  actions: {
    // set up Firebase Auth listener to get user data
    initAuth() {
      return new Promise((resolve) => {
        onAuthChange(async (firebaseUser) => {
          if (this.isLoggingIn) return

          this.user = firebaseUser

          if (firebaseUser) {
            try {
              const patient = await getPatient(firebaseUser.uid)

              // try patient first
              if (patient) {
                this.patient = patient
                this.clinic = null
                this.role = 'patient'
              } else {
                // fall back to clinic
                const clinic = await getClinic(firebaseUser.uid)
                if (clinic) {
                  this.clinic = clinic
                  this.patient = null
                  this.role = 'clinic'
                } else {
                  // authenticated but no Firestore profile found
                  this.patient = null
                  this.clinic  = null
                  this.role    = null
                }
              }
            } catch (err) {
              console.error('[AuthStore] initAuth profile fetch error:', err)
            }
          } else {
            // Signed out — clear everything
            this.patient = null
            this.clinic  = null
            this.role    = null
          }

          this.initialized = true
          resolve()
        })
      })
    },

    // register a new patient account
    async registerPatient({ fullName, email, mobileNumber, postalCode, password }) {
      this.loading = true
      try {
        const credential = await registerWithEmail(email, password)
        const uid = credential.user.uid

        await createPatient(uid, { fullName, email, mobileNumber, postalCode })

        const patient = await getPatient(uid)

        this.user    = credential.user
        this.patient = patient
        this.clinic  = null
        this.role    = 'patient'
      } catch (err) {
        console.error('[AuthStore] registerPatient error:', err)
        throw err
      } finally {
        this.loading = false
      }
    },

    // sign in an existing patient
    async loginPatient({ email, password }) {
      this.loading = true
      this.isLoggingIn = true

      try {
        const credential = await loginWithEmail(email, password)
        const uid = credential.user.uid

        const patient = await getPatient(uid)

        if (!patient) {
          await logout()
          this.user = null
          this.patient = null
          this.clinic = null
          this.role = null
          throw new Error('No patient account found for this email.')
        } else {
          this.user = credential.user
          this.patient = patient
          this.clinic = null
          this.role = 'patient'
        }
      } catch (err) {
        console.error('[AuthStore] loginPatient error:', err)
        throw err
      } finally {
        this.loading = false
        this.isLoggingIn = false
      }
    },

    // register a new clinic account
    async registerClinic({
      clinicName,
      district,
      address,
      postalCode,
      contactNumber,
      email,
      operatingHours,
      services,
      password
    }) {
      this.loading = true
      try {
        const credential = await registerWithEmail(email, password)
        const uid = credential.user.uid

        // Geocode postal code to lat/lng so the directory can show real distances
        let coords = null
        try {
          coords = await geocodePostalCode(postalCode)
        } catch (e) {
          console.warn('[AuthStore] geocode failed, clinic saved without coords:', e)
        }

        await createClinic(uid, {
          clinicName,
          district,
          address,
          postalCode,
          contactNumber,
          email,
          operatingHours: operatingHours || {},
          services: services || [],
          ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
        })

        const clinic = await getClinic(uid)

        this.user = credential.user
        this.clinic = clinic
        this.patient = null
        this.role = 'clinic'
      } catch (err) {
        console.error('[AuthStore] registerClinic error:', err)
        throw err
      } finally {
        this.loading = false
      }
    },

    // sign in an existing clinic
    async loginClinic({ email, password }) {
      this.loading = true
      try {
        const credential = await loginWithEmail(email, password)
        const uid = credential.user.uid

        const clinic = await getClinic(uid)

        if (!clinic) {
          await logout()
          this.user = null
          this.clinic = null
          this.patient = null
          this.role = null
          throw new Error('No clinic account found for this email.')
        } else {
          this.user = credential.user
          this.clinic = clinic
          this.patient = null
          this.role = 'clinic'
        }
      } catch (err) {
        console.error('[AuthStore] loginClinic error:', err)
        throw err
      } finally {
        this.loading = false
        this.isLoggingIn = false
      }
    },

    // signs out current user and clears all auth state
    async logoutUser() {
      this.loading = true
      try {
        await logout()
        this.user = null
        this.patient = null
        this.clinic = null
        this.role = null
      } catch (err) {
        console.error('[AuthStore] logoutUser error:', err)
        throw err
      } finally {
        this.loading = false
      }
    },

    // alias for logoutUser - used by views that call authStore.logout()
    async logout() {
      return this.logoutUser()
    },

    setUser(user) {
      this.user = user
    },

    setClinic(clinic) {
      this.clinic = clinic
    },
  }
})