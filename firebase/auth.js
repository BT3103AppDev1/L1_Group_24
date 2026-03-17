import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    confirmPasswordReset as firebaseConfirmPasswordReset,
    onAuthStateChanged
  } from 'firebase/auth'
import { auth } from './config.js'


/**
 * Registers a new Firebase user with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<UserCredential>}
 */
export async function registerWithEmail(email, password) {
    return createUserWithEmailAndPassword(auth, email, password)
}

/**
 * Signs in an existing Firebase user with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<UserCredential>}
 */
export async function loginWithEmail(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
}

/**
 * Signs out the currently authenticated user.
 * @returns {Promise<void>}
 */
export async function logout() {
    return signOut(auth)
}

/**
 * Sends a password reset email to the given address.
 * @param {string} email
 * @returns {Promise<void>}
 */
export async function sendPasswordReset(email) {
    return sendPasswordResetEmail(auth, email)
}

/**
 * Confirms a password reset using the OOB code from the reset email link.
 * @param {string} oobCode / The action code from the password reset email link
 * @param {string} newPassword / The new password to set
 * @returns {Promise<void>}
 */
export async function confirmPasswordReset(oobCode, newPassword) {
    return firebaseConfirmPasswordReset(auth, oobCode, newPassword)
}

/**
 * Returns the currently authenticated Firebase user, or null if not signed in.
 * @returns {User|null}
 */
export function getCurrentUser() {
    return auth.currentUser
}

/**
 * Watches whether the user is logged in or logged out.
 * @param {function} callback / Runs whenever the login status changes
 * @returns {function} / A function to stop watching for login status changes
 */
export function onAuthChange(callback) {
    return onAuthStateChanged(auth, callback)
}
