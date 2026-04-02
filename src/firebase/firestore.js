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
