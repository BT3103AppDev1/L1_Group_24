/**
 * ============================================================================
 * useClinicStore.js
 * 
 * Pinia Store handling clinic-related data state and actions.
 * It interacts directly with the Firestore backend to fetch clinic details,
 * global services, and specific clinic configurations.
 * ============================================================================
 */
import { defineStore } from 'pinia'
import {
  subscribeToAllClinics,
  getAllServices,
  subscribeToClinicQueues,
  getClinicServices
} from '@/firebase/firestore.js'

export const useClinicStore = defineStore('clinicStore', {
  // --- State ---
  // The reactive data storage for this store.
  state: () => ({
    allClinics: [],     // A list of all clinics available in the app
    clinicQueues: [],   // Live data of all queue services running in a specific clinic
    services: [],       // Global list of supported medical services across the app
    loading: false      // Boolean to track if a background database request is currently running
  }),

  // --- Actions ---
  // Methods to modify the state or perform async API requests
  actions: {
    /**
     * Initializes a real-time listening connection to the database.
     * Whenever any clinic updates its profile, the allClinics state will automatically update.
     */
    fetchAllClinics() {
      subscribeToAllClinics((clinics) => {
        this.allClinics = clinics
      })
    },

    /**
     * Asynchronously fetches the static list of allowed medical services.
     * Uses a try/finally block to ensure 'loading' is turned back to false 
     * even if the request fails.
     */
    async fetchServices() {
      this.loading = true
      try {
        this.services = await getAllServices()
      } finally {
        this.loading = false
      }
    },

    /**
     * Listens to the live queue information (like wait times and current turn) 
     * for a specific clinic. Updates automatically when changes happen server-side.
     */
    fetchClinicQueues(clinicId) {
      subscribeToClinicQueues(clinicId, (queues) => {
        this.clinicQueues = queues
      })
    },

    /**
     * Asynchronously fetches a list of services offered by ONE specific clinic.
     * Used mainly by the clinic dashboard upon load to figure out which tabs to display.
     */
    async fetchClinicServices(clinicId) {
      this.loading = true
      try {
        const services = await getClinicServices(clinicId)
        return services
      } finally {
        this.loading = false
      }
    }
  }
})
