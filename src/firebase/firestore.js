// Firebase data functions

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment,
  writeBatch,
} from 'firebase/firestore'
import { db } from './config.js'

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function now() {
  return serverTimestamp()
}

// Normalises a timestamp to midnight so tickets can be grouped by calendar day
function startOfDay(date) {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

// Creates a stable YYYY-MM-DD key for daily analytics buckets
function formatDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Creates the human-readable date label shown on the analytics page
function formatDateLabel(date) {
  return new Intl.DateTimeFormat('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatShortDateLabel(date) {
  return new Intl.DateTimeFormat('en-SG', {
    day: 'numeric',
    month: 'short',
  }).format(date)
}

// ---------------------------------------------------------------------------
// Patients
// ---------------------------------------------------------------------------

/**
 * Creates a patient profile document
 * @param {string} uid
 * @param {{ fullName: string, email: string, mobileNumber: string, postalCode: string }} data
 */
export async function createPatient(uid, data) {
  await setDoc(doc(db, 'patients', uid), {
    ...data,
    createdAt: now(),
    updatedAt: now(),
  })
}

/**
 * Fetches a patient document by UID
 * @param {string} uid
 * @returns {Promise<object|null>}
 */
export async function getPatient(uid) {
  const snap = await getDoc(doc(db, 'patients', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

/**
 * Updates fields on a patient document
 * @param {string} uid
 * @param {object} data
 */
export async function updatePatient(uid, data) {
  await updateDoc(doc(db, 'patients', uid), {
    ...data,
    updatedAt: now(),
  })
}

// ---------------------------------------------------------------------------
// Clinics
// ---------------------------------------------------------------------------

/**
 * Creates a clinic profile document
 * @param {string} uid
 * @param {{ clinicName: string, district: string, postalCode: string, contactNumber: string,
 *           operatingHours: object, services: string[], email: string, address: string }} data
 */
export async function createClinic(uid, data) {
  await setDoc(doc(db, 'clinics', uid), {
    ...data,
    isOpen: false,
    createdAt: now(),
    updatedAt: now(),
  })
}

/**
 * Fetches a clinic document by UID
 * @param {string} uid
 * @returns {Promise<object|null>}
 */
export async function getClinic(uid) {
  const snap = await getDoc(doc(db, 'clinics', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

/**
 * Fetches a clinic document by contact number
 * @param {string} contactNumber
 * @returns {Promise<object|null>}
 */
export async function getClinicByContactNumber(contactNumber) {
  const q = query(collection(db, 'clinics'), where('contactNumber', '==', contactNumber))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const first = snap.docs[0]
  return { id: first.id, ...first.data() }
}

/**
 * Updates fields on a clinic document
 * @param {string} uid
 * @param {object} data
 */
export async function updateClinic(uid, data) {
  await updateDoc(doc(db, 'clinics', uid), {
    ...data,
    updatedAt: now(),
  })
}

/**
 * Watches to all clinic documents in real time
 * @param {function} callback
 * @returns {function}
 */
export function subscribeToAllClinics(callback) {
  return onSnapshot(collection(db, 'clinics'), (snap) => {
    const clinics = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    callback(clinics)
  })
}

// ---------------------------------------------------------------------------
// Clinic/Medical Services (predefined)
// ---------------------------------------------------------------------------

/**
 * Fetches all predefined medical services.
 * @returns {Promise<object[]>}
 */
export async function getAllServices() {
  const snap = await getDocs(collection(db, 'services'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// Clinic Queues 
/**
 * Creates a queue sub-document for a clinic service
 * @param {string} clinicId
 * @param {string} serviceId
 * @param {object} serviceData
 */
export async function createClinicQueue(clinicId, serviceId, serviceData) {
  await setDoc(doc(db, 'clinics', clinicId, 'queues', serviceId), {
    serviceId,
    serviceName: serviceData.name ?? '',
    activeCount: 0,
    createdAt: now(),
  })
}

/**
 * Deletes a queue sub-document from a clinic
 * @param {string} clinicId
 * @param {string} serviceId
 */
export async function deleteClinicQueue(clinicId, serviceId) {
  await deleteDoc(doc(db, 'clinics', clinicId, 'queues', serviceId))
}

/**
 * Watches to all queue sub documents for a clinic in real time
 * @param {string} clinicId
 * @param {function} callback
 * @returns {function}
 */
export function subscribeToClinicQueues(clinicId, callback) {
  return onSnapshot(collection(db, 'clinics', clinicId, 'queues'), (snap) => {
    const queues = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    callback(queues)
  })
}

/**
 * One-time fetch of all queue sub-documents for a clinic (used as "services" list)
 * @param {string} clinicId
 * @returns {Promise<object[]>}
 */
export async function getClinicServices(clinicId) {
    const snap = await getDocs(collection(db, 'clinics', clinicId, 'queues'))
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * One-time fetch of a single queue sub-document for a clinic service
 * @param {string} clinicId
 * @param {string} serviceId
 * @returns {Promise<object|null>}
 */
export async function getClinicService(clinicId, serviceId) {
    const snap = await getDoc(doc(db, 'clinics', clinicId, 'queues', serviceId))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

/**
 * Batch-creates or overwrites queue sub-documents for an array of services
 * @param {string} clinicId
 * @param {{ id: string, name: string, avgDuration: number }[]} services
 */
export async function saveClinicServices(clinicId, services) {
    await Promise.all(
        services.map((svc) =>
            setDoc(doc(db, 'clinics', clinicId, 'queues', svc.id), {
                serviceId: svc.id,
                serviceName: svc.name,
                avgDuration: svc.avgDuration,
                activeCount: 0,
                ticketCounter: 0,
                createdAt: now()
            }, { merge: true })
        )
    )
}

/**
 * Seeds the global services collection with predefined service types
 */
export async function seedServices() {
    const services = [
        { id: 'general_consultation', name: 'General Consultation', avgDuration: 15 },
        { id: 'health_screening', name: 'Health Screening', avgDuration: 30 },
        { id: 'vaccination', name: 'Vaccination', avgDuration: 10 },
        { id: 'xray', name: 'X-Ray', avgDuration: 20 },
        { id: 'dental', name: 'Dental', avgDuration: 30 },
        { id: 'physiotherapy', name: 'Physiotherapy', avgDuration: 45 },
        { id: 'child_health', name: 'Child Health', avgDuration: 20 },
        { id: 'womens_health', name: "Women's Health", avgDuration: 20 },
        { id: 'chronic_disease', name: 'Chronic Disease Management', avgDuration: 20 },
        { id: 'pharmacy', name: 'Pharmacy', avgDuration: 10 }
    ]
    const batch = writeBatch(db)
    services.forEach(({ id, name, avgDuration }) => {
        batch.set(doc(db, 'services', id), { name, avgDuration })
    })
    await batch.commit()
}

// ---------------------------------------------------------------------------
// Queue Tickets  
// ---------------------------------------------------------------------------

/**
 * Resets all queues and active tickets for a clinic (used when opening/closing clinic).
 * @param {string} clinicId
 */
export async function resetClinicQueues(clinicId) {
    const batch = writeBatch(db)

    // 1. Reset all queue sub-documents
    const queuesSnap = await getDocs(collection(db, 'clinics', clinicId, 'queues'))
    queuesSnap.forEach(d => {
        batch.update(d.ref, {
            activeCount: 0,
            ticketCounter: 0
        })
    })

    // 2. Mark all active tickets as cancelled
    const ticketsQ = query(
        collection(db, 'queueTickets'),
        where('clinicId', '==', clinicId)
    )
    const ticketsSnap = await getDocs(ticketsQ)

    ticketsSnap.forEach(d => {
        const data = d.data()
        if (data.status === 'waiting' || data.status === 'serving') {
            batch.update(d.ref, {
                status: 'cancelled',
                updatedAt: now()
            })
        }
    })

    await batch.commit()
}

/**
 * Joins a patient to a clinic queue by creating a ticket
 * @param {{ patientId: string, clinicId: string, serviceId: string,
 *           serviceName: string, clinicName: string }} queueData
 * @returns {Promise<string>} The new ticket ID
 */
export async function joinQueue(queueData) {
    const queueDocRef = doc(db, 'clinics', queueData.clinicId, 'queues', queueData.serviceId)

    // Read queue sub-doc to derive position from activeCount (avoids compound query / composite index requirement)
    const queueSnap = await getDoc(queueDocRef)
    const queueInfo = queueSnap.exists() ? queueSnap.data() : {}
    const currentCounter    = queueInfo.ticketCounter || 0
    const currentActive     = queueInfo.activeCount   || 0
    const newCounter        = currentCounter + 1
    const ticketNumber      = `Q${String(newCounter).padStart(3, '0')}`
    const position          = currentActive + 1
    const estimatedWaitTime = position * (queueInfo.avgDuration || 15)

    const ticketRef = await addDoc(collection(db, 'queueTickets'), {
        ...queueData,
        ticketNumber,
        status: 'waiting',
        position,
        estimatedWaitTime,
        joinedAt: now(),
        updatedAt: now()
    })

    // setDoc with merge safely creates the sub-doc if it doesn't exist yet
    await setDoc(queueDocRef, {
        serviceId:     queueData.serviceId,
        serviceName:   queueData.serviceName,
        activeCount:   increment(1),
        ticketCounter: increment(1),
    }, { merge: true })

    return ticketRef.id
}

/**
 * Marks a ticket as cancelled/left and decrements the queue counter
 * @param {string} ticketId
 */
export async function leaveQueue(ticketId) {
    const ticketRef = doc(db, 'queueTickets', ticketId)
    const snap = await getDoc(ticketRef)
    if (!snap.exists()) return

    const { clinicId, serviceId, status } = snap.data()
    await updateDoc(ticketRef, { status: 'cancelled', updatedAt: now() })

    // Only decrement if the ticket was still active
    if (status === 'waiting' || status === 'serving') {
        const queueDocRef = doc(db, 'clinics', clinicId, 'queues', serviceId)
        await updateDoc(queueDocRef, { activeCount: increment(-1) })
    }
}

/**
 * One-time fetch of a single queueTicket document
 * @param {string} ticketId
 * @returns {Promise<object|null>}
 */
export async function getTicket(ticketId) {
    const snap = await getDoc(doc(db, 'queueTickets', ticketId))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

/**
 * Updates the status of a queue ticket
 * @param {string} ticketId
 * @param {'waiting'|'serving'|'completed'|'cancelled'} status
 * @param {object} [extra] // Optional extra fields to merge (example: position, estimatedWaitTime)
 */
export async function updateTicketStatus(ticketId, status, extra = {}) {
    const ticketRef = doc(db, 'queueTickets', ticketId)
    await updateDoc(ticketRef, {
        status,
        ...extra,
        updatedAt: now()
    })

    // When completing or cancelling, decrement activeCount
    if (status === 'completed' || status === 'cancelled') {
        const snap = await getDoc(ticketRef)
        if (snap.exists()) {
            const { clinicId, serviceId } = snap.data()
            const queueDocRef = doc(db, 'clinics', clinicId, 'queues', serviceId)
            await updateDoc(queueDocRef, { activeCount: increment(-1) })
        }
    }
}

/**
 * Real-time watcher to a single ticket document
 * @param {string} ticketId
 * @param {function} callback // Called with ticket object (or null if deleted)
 * @returns {function} // Unsubscribe function
 */
export function subscribeToTicket(ticketId, callback) {
    return onSnapshot(doc(db, 'queueTickets', ticketId), (snap) => {
        callback(snap.exists() ? { id: snap.id, ...snap.data() } : null)
    })
}

/**
 * Real-time watcher to all tickets for a clinic + service combination
 * Returns tickets with status 'waiting' or 'serving', ordered by joinedAt
 * @param {string} clinicId
 * @param {string} serviceId
 * @param {function} callback // Called with array of ticket objects
 * @returns {function} // Unsubscribe function
 */
export function subscribeToClinicServiceTickets(clinicId, serviceId, callback) {
    // Only equality filters — no orderBy — to avoid requiring a Firestore composite index.
    // Filtering by status and sorting by joinedAt is done client-side.
    const q = query(
        collection(db, 'queueTickets'),
        where('clinicId', '==', clinicId),
        where('serviceId', '==', serviceId)
    )
    return onSnapshot(q, (snap) => {
        const tickets = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((t) => ['waiting', 'serving'].includes(t.status))
            .sort((a, b) => {
                const aTime = a.joinedAt?.toMillis?.() ?? 0
                const bTime = b.joinedAt?.toMillis?.() ?? 0
                return aTime - bTime
            })
        callback(tickets)
    }, (err) => {
        console.error('[Firestore] subscribeToClinicServiceTickets error:', err)
        callback([]) // unblock spinner even on error
    })
}

/**
 * Real-time watcher for a clinic's daily queue join history over the last N days.
 * Counts each ticket once based on its joinedAt date, regardless of later status changes.
 * Also returns today's average estimated wait time across tickets joined today.
 * @param {string} clinicId
 * @param {function} callback
 * @param {function} [onError]
 * @param {number} [days]
 * @returns {function}
 */
export function subscribeToClinicDailyQueueHistory(clinicId, callback, onError, days = 30) {
  const q = query(collection(db, 'queueTickets'), where('clinicId', '==', clinicId))

  return onSnapshot(
    q,
    (snap) => {
      // Build a fixed date window so the chart always renders the last N days
      const dayCount = Math.max(days, 1)
      const today = startOfDay(new Date())
      const startDate = new Date(today)
      startDate.setDate(today.getDate() - (dayCount - 1))

      const totalsByDay = new Map()
      let todayWaitTotal = 0
      let todayWaitCount = 0

      snap.docs.forEach((ticketDoc) => {
        const ticket = ticketDoc.data()
        const joinedAt = ticket.joinedAt?.toDate?.()
        if (!(joinedAt instanceof Date) || Number.isNaN(joinedAt.getTime())) return

        const joinedDay = startOfDay(joinedAt)
        const isToday = joinedDay.getTime() === today.getTime()

        if (isToday && typeof ticket.estimatedWaitTime === 'number') {
          todayWaitTotal += ticket.estimatedWaitTime
          todayWaitCount += 1
        }

        if (joinedDay < startDate || joinedDay > today) return

        // Count every join once based on the day the patient entered the queue
        const key = formatDateKey(joinedDay)
        totalsByDay.set(key, (totalsByDay.get(key) || 0) + 1)
      })

      // Zero-fill missing dates so the chart line remains continuous
      const history = Array.from({ length: dayCount }, (_, index) => {
        const currentDate = new Date(startDate)
        currentDate.setDate(startDate.getDate() + index)
        const dateKey = formatDateKey(currentDate)

        return {
          dateKey,
          label: formatDateLabel(currentDate),
          count: totalsByDay.get(dateKey) || 0,
        }
      })

      callback({
        history,
        averageWaitToday: todayWaitCount ? todayWaitTotal / todayWaitCount : 0,
      })
    },
    (err) => {
      console.error('[Firestore] subscribeToClinicDailyQueueHistory error:', err)
      if (onError) onError(err)
    },
  )
}

/**
 * Real-time watcher for a clinic's hourly queue volume across the last N days.
 * Counts each ticket once by the hour it joined the queue.
 * @param {string} clinicId
 * @param {function} callback
 * @param {function} [onError]
 * @param {number} [days]
 * @returns {function}
 */
export function subscribeToClinicHourlyQueueVolume(clinicId, callback, onError, days = 7) {
  const q = query(collection(db, 'queueTickets'), where('clinicId', '==', clinicId))

  return onSnapshot(
    q,
    (snap) => {
      const dayCount = Math.max(days, 1)
      const today = startOfDay(new Date())
      const startDate = new Date(today)
      startDate.setDate(today.getDate() - (dayCount - 1))

      const historyByDate = new Map()

      Array.from({ length: dayCount }, (_, index) => {
        const currentDate = new Date(startDate)
        currentDate.setDate(startDate.getDate() + index)
        const dateKey = formatDateKey(currentDate)

        historyByDate.set(dateKey, {
          dateKey,
          label: formatDateLabel(currentDate),
          shortLabel: formatShortDateLabel(currentDate),
          weekdayKey: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][currentDate.getDay()],
          hourlyCounts: Array.from({ length: 24 }, (_, hour) => ({
            hour,
            count: 0,
          })),
        })
      })

      snap.docs.forEach((ticketDoc) => {
        const joinedAt = ticketDoc.data().joinedAt?.toDate?.()
        if (!(joinedAt instanceof Date) || Number.isNaN(joinedAt.getTime())) return

        const joinedDay = startOfDay(joinedAt)
        if (joinedDay < startDate || joinedDay > today) return

        const dateKey = formatDateKey(joinedDay)
        const dayEntry = historyByDate.get(dateKey)
        if (!dayEntry) return

        dayEntry.hourlyCounts[joinedAt.getHours()].count += 1
      })

      callback(Array.from(historyByDate.values()))
    },
    (err) => {
      console.error('[Firestore] subscribeToClinicHourlyQueueVolume error:', err)
      if (onError) onError(err)
    },
  )
}

/**
 * Fetches the active (waiting or serving) ticket for a patient, if any
 * @param {string} patientId
 * @returns {Promise<object|null>}
 */
export async function getPatientActiveTicket(patientId) {
    const q = query(
        collection(db, 'queueTickets'),
        where('patientId', '==', patientId),
        where('status', 'in', ['waiting', 'serving'])
    )
    const snap = await getDocs(q)
    if (snap.empty) return null
    const first = snap.docs[0]
    return { id: first.id, ...first.data() }
}

/**
 * Fetches all completed consultation tickets for a specific patient.
 * @param {string} patientId
 * @returns {Promise<object[]>}
 */
export async function getPatientConsultations(patientId) {
    const q = query(
        collection(db, 'queueTickets'),
        where('patientId', '==', patientId),
        where('status', '==', 'completed')
    )
    const snap = await getDocs(q)
    const records = snap.docs.map(d => {
        const data = d.data()
        return {
            id: d.id,
            consultationDate: data.updatedAt, // Map for RecordCard
            ...data
        }
    })
    
    // Sort descending by completion time (newest first)
    return records.sort((a, b) => {
        const aTime = a.updatedAt?.toMillis?.() ?? 0
        const bTime = b.updatedAt?.toMillis?.() ?? 0
        return bTime - aTime
    })
}

/**
 * Saves consultation notes and medications to the ticket.
 * @param {string} ticketId 
 * @param {object} data
 */
export async function saveConsultationNotes(ticketId, data) {
    const ticketRef = doc(db, 'queueTickets', ticketId)
    // If medications exist, default status to 'pending'
    const overrides = {}
    if (data.medications && data.medications.length > 0) {
        overrides.medicationStatus = 'pending'
    } else {
        overrides.medicationStatus = 'none'
    }
    await updateDoc(ticketRef, {
        diagnosis: data.diagnosis,
        notes: data.notes,
        medications: data.medications,
        ...overrides,
        updatedAt: now()
    })
}

/**
 * Fetches all completed consultation tickets for a specific clinic.
 * @param {string} clinicId
 * @returns {Promise<object[]>}
 */
export async function getClinicConsultations(clinicId) {
    const q = query(
        collection(db, 'queueTickets'),
        where('clinicId', '==', clinicId),
        where('status', '==', 'completed')
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => {
        const aTime = a.updatedAt?.toMillis?.() ?? 0
        const bTime = b.updatedAt?.toMillis?.() ?? 0
        return bTime - aTime
    })
}

/**
 * Updates the medication status of a completed consultation.
 * @param {string} ticketId
 * @param {string} status
 */
export async function updateConsultationMedStatus(ticketId, status) {
    const ticketRef = doc(db, 'queueTickets', ticketId)
    await updateDoc(ticketRef, {
        medicationStatus: status,
        updatedAt: now()
    })
}

/**
 * Fetches all currently 'serving' tickets for a specific clinic.
 * Used to build the post-consult patient picker list.
 * @param {string} clinicId
 * @returns {Promise<object[]>}
 */
export async function getClinicServingTickets(clinicId) {
    const q = query(
        collection(db, 'queueTickets'),
        where('clinicId', '==', clinicId),
        where('status', '==', 'serving')
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => {
        const aTime = a.joinedAt?.toMillis?.() ?? 0
        const bTime = b.joinedAt?.toMillis?.() ?? 0
        return aTime - bTime  // oldest first (waiting longest)
    })
}
