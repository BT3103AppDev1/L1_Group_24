/**
 * Firestore data-access layer for ClinicQ.
 *
 * Collections / sub-collections used:
 *   patients/{uid}
 *   clinics/{uid}
 *   clinics/{uid}/queues/{serviceId}
 *   services/{serviceId}
 *   queueTickets/{ticketId}
 *   consultations/{consultationId}
 *   consultations/{consultationId}/medications/{medId}
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
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
 * Creates a patient profile document.
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
 * Fetches a patient document by UID.
 * @param {string} uid
 * @returns {Promise<object|null>}
 */
export async function getPatient(uid) {
  const snap = await getDoc(doc(db, 'patients', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

/**
 * Updates fields on a patient document.
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
 * Creates a clinic profile document.
 * @param {string} uid
 * @param {{ clinicName: string, district: string, postalCode: string, contactNumber: string,
 *           operatingHours: object, services: string[], address: string }} data
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
 * Fetches a clinic document by UID.
 * @param {string} uid
 * @returns {Promise<object|null>}
 */
export async function getClinic(uid) {
  const snap = await getDoc(doc(db, 'clinics', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

/**
 * Fetches a clinic document by contact number.
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
 * Updates fields on a clinic document.
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
 * Watches to all clinic documents in real time.
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
// Services (predefined)
// ---------------------------------------------------------------------------

/**
 * Fetches all predefined services.
 * @returns {Promise<object[]>}
 */
export async function getAllServices() {
  const snap = await getDocs(collection(db, 'services'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// ---------------------------------------------------------------------------
// Clinic Queues  (clinics/{uid}/queues/{serviceId})
// ---------------------------------------------------------------------------

/**
 * Creates a queue sub-document for a clinic service.
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
 * Deletes a queue sub-document from a clinic.
 * @param {string} clinicId
 * @param {string} serviceId
 */
export async function deleteClinicQueue(clinicId, serviceId) {
  await deleteDoc(doc(db, 'clinics', clinicId, 'queues', serviceId))
}

/**
 * Watches to all queue sub documents for a clinic in real time.
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
