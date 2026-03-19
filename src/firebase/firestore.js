import {
    collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc,
    query, where, orderBy, onSnapshot, increment, writeBatch
} from 'firebase/firestore'

import { db } from './config.js'

// ---------------------------------------------------------------------------
// Queue Tickets  (queueTickets/{ticketId})
// ---------------------------------------------------------------------------

/**
 * Joins a patient to a clinic queue by creating a ticket.
 * @param {{ patientId: string, clinicId: string, serviceId: string,
 *           serviceName: string, clinicName: string }} queueData
 * @returns {Promise<string>} The new ticket ID
 */
export async function joinQueue(queueData) {
    const queueDocRef = doc(db, 'clinics', queueData.clinicId, 'queues', queueData.serviceId)

    // Read current ticket counter to generate ticket number
    const queueSnap = await getDoc(queueDocRef)
    const currentCounter = queueSnap.exists() ? (queueSnap.data().ticketCounter || 0) : 0
    const newCounter = currentCounter + 1
    const ticketNumber = `Q${String(newCounter).padStart(3, '0')}`

    // Count current waiting tickets to determine position
    const waitingQuery = query(
        collection(db, 'queueTickets'),
        where('clinicId', '==', queueData.clinicId),
        where('serviceId', '==', queueData.serviceId),
        where('status', '==', 'waiting')
    )
    const waitingSnap = await getDocs(waitingQuery)
    const position = waitingSnap.size + 1
    const estimatedWaitTime = position * 10

    const ticketRef = await addDoc(collection(db, 'queueTickets'), {
        ...queueData,
        ticketNumber,
        status: 'waiting',
        position,
        estimatedWaitTime,
        joinedAt: now(),
        updatedAt: now()
    })

    await updateDoc(queueDocRef, { activeCount: increment(1), ticketCounter: increment(1) })

    return ticketRef.id
}

/**
 * Marks a ticket as cancelled / left and decrements the queue counter
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
 * Updates the status of a queue ticket.
 * @param {string} ticketId
 * @param {'waiting'|'serving'|'completed'|'cancelled'} status
 * @param {object} [extra] Optional extra fields to merge (example: position, estimatedWaitTime)
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
 * Real-time watcher to a single ticket document.
 * @param {string} ticketId
 * @param {function} callback Called with ticket object (or null if deleted)
 * @returns {function} Unsubscribe function
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
 * @param {function} callback Called with array of ticket objects
 * @returns {function} Unsubscribe function
 */
export function subscribeToClinicServiceTickets(clinicId, serviceId, callback) {
    const q = query(
        collection(db, 'queueTickets'),
        where('clinicId', '==', clinicId),
        where('serviceId', '==', serviceId),
        where('status', 'in', ['waiting', 'serving']),
        orderBy('joinedAt', 'asc')
    )
    return onSnapshot(q, (snap) => {
        const tickets = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        callback(tickets)
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

// ---------------------------------------------------------------------------
// Extra functions used by views
// ---------------------------------------------------------------------------

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
