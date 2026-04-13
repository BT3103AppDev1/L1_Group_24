/**
 * ============================================================================
 * useQueueStore.js
 * 
 * Pinia Store managing all real-time queuing functionality.
 * This file is highly active for both patients (joining/leaving queues)
 * and clinics (monitoring massive lists of patients and changing their status).
 * ============================================================================
 */
import { defineStore } from 'pinia'
import {
  joinQueue,
  leaveQueue,
  subscribeToTicket,
  subscribeToClinicServiceTickets,
  getPatientActiveTicket,
  getTicket,
  updateTicketStatus
} from '@/firebase/firestore.js'

export const useQueueStore = defineStore('queue', {
  // --- State ---
  state: () => ({
    activeTicket: null,    // The unique ticket object for the currently logged-in patient
    clinicTickets: [],     // The large list of all patient tickets (Used by the clinic dashboard)
    loading: false,        // Visual loader indicator for database operations
    ticketChecked: false,
    ticketUnsubscribe: null
  }),

  // --- Getters ---
  // Computed values derived from the state
  getters: {
    /**
     * Quick boolean check to see if the current user is actively waiting in line.
     * Returns true only if they have a ticket that is 'waiting' or 'serving'.
     */
    isInQueue: (state) =>
      !!state.activeTicket &&
      ['waiting', 'serving'].includes(state.activeTicket.status),
  },

  // --- Actions ---
  actions: {
    /**
     * Automatically attempts to create a new ticket in the database.
     * On success, immediately subscribes to that new ticket so the UI 
     * receives live updates.
     */
    async joinQueue(queueData) {
      // prevent joining if already in a queue
      if (this.activeTicket && ['waiting', 'serving'].includes(this.activeTicket.status)) {
        console.warn('[joinQueue] already in a queue, aborting')
        return
      }
      
      this.loading = true
      try {
        const ticketId = await joinQueue(queueData)
        localStorage.setItem('activeTicketId', ticketId)
        this.subscribeToMyTicket(ticketId)
      } finally {
        this.loading = false
      }
    },

    /**
     * Quits the queue for the current logged in user.
     * Marks the activeTicket local state as null afterwards.
     */
    async leaveQueue() {
      if (!this.activeTicket) return
      this.loading = true
      try {
        await leaveQueue(this.activeTicket.id)
        localStorage.removeItem('activeTicketId')
        this.activeTicket = null
      } finally {
        this.loading = false
      }
    },

    /**
     * Patient-side: Sets up a real-time listener on a specific ticket ID.
     * If the clinic changes the status of this ticket to 'serving', 
     * this local state automatically updates.
     */
    subscribeToMyTicket(ticketId) {
      // Clean up any existing listener first
      if (this.ticketUnsubscribe) {
        this.ticketUnsubscribe()
        this.ticketUnsubscribe = null
      }

      const unsubscribe = subscribeToTicket(ticketId, (ticket) => {
        console.log('[subscribeToMyTicket] ticket update:', ticket?.status, ticket)
        this.activeTicket = ticket
        if (!ticket || ['cancelled', 'completed'].includes(ticket?.status)) {
          localStorage.removeItem('activeTicketId')
        }
      })
      this.ticketUnsubscribe = unsubscribe
    },

    /**
     * Clinic-side: Sets up a real-time listener for ALL tickets under 
     * a specific hospital service (e.g., all tickets for "General Consultation").
     * The `onFirst` callback is fired only once when the initial data loads.
     */
    subscribeToClinicService(clinicId, serviceId, onFirst) {
      subscribeToClinicServiceTickets(clinicId, serviceId, (tickets) => {
        this.clinicTickets = tickets
        if (onFirst) {
          onFirst(tickets)
          onFirst = null // only fire once to prevent repetitive spinner flashing
        }
      })
    },

    /**
     * Updates the status of an existing ticket in the database.
     * (e.g. from 'waiting' to 'serving' to 'completed')
     */
    async updateStatus(ticketId, status, extra = {}) {
      this.loading = true
      try {
        await updateTicketStatus(ticketId, status, extra)
      } finally {
        this.loading = false
      }
    },

    /**
     * Usually checks when the app first loads if the currently logged in patient
     * accidentally refreshed the page, retrieving their active ticket from the backend
     * so they don't lose their place in line.
     */
    async checkActiveTicket(patientId) {
      this.loading = true
      try {
        // Check localStorage first for instant recovery on refresh
        const savedTicketId = localStorage.getItem('activeTicketId')
        if (savedTicketId) {
          // verify it belongs to this patient
          const ticket = await getTicket(savedTicketId)
          if (ticket && ticket.patientId === patientId && ['waiting', 'serving'].includes(ticket.status)) {
            this.activeTicket = ticket
            this.subscribeToMyTicket(savedTicketId)
            this.ticketChecked = true
            return
          } else {
            // ticket doesn't belong to this patient or is no longer active
            localStorage.removeItem('activeTicketId')
          }
        }

        // Fall back to Firestore query
        const ticket = await getPatientActiveTicket(patientId)
        if (ticket) {
          this.activeTicket = ticket
          this.subscribeToMyTicket(ticket.id)
          this.ticketChecked = true
        } else {
          this.activeTicket = null
          this.ticketChecked = true
        }
      } finally {
        this.loading = false
      }
    },

    resetTicketState() {
      if (this.ticketUnsubscribe) {
        this.ticketUnsubscribe()
        this.ticketUnsubscribe = null
      }
      this.activeTicket = null
      this.ticketChecked = false
      localStorage.removeItem('activeTicketId')
    }
  }
})
