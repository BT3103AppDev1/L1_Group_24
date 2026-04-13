<template>
  <AuthLayout>
    <!-- Verification screen -->
    <div v-if="!verified" class="verify-shell">
      <div class="verify-icon">📧</div>
      <h2 class="form-heading">Email Verification</h2>
      <p class="form-sub">
        We sent a verification link to <strong>{{ authStore.user?.email }}</strong>.
        Please check your inbox and click the link to continue.
        If you can’t find it, check your spam or junk folder.
      </p>

      <div v-if="checking" class="checking-state">
        <AppSpinner />
        <p>Checking verification status...</p>
      </div>

      <div v-if="error" class="error-msg">{{ error }}</div>

      <div class="verify-actions">
        <AppButton variant="primary" block :loading="checking" @click="checkVerification">
          I've verified my email
        </AppButton>
        <AppButton variant="secondary" block :loading="resending" @click="resendEmail">
          {{ resent ? 'Email sent !' : 'Resend verification email' }}
        </AppButton>
        <button class="logout-link" type="button" @click="cancelAndLogout">
          Use a different email
        </button>
      </div>
    </div>

    <!-- Success screen -->
    <div v-else class="verify-shell">
      <div class="success-box">
        <div class="success-icon">✅</div>
        <h2 class="form-heading-success">Registration Successful!</h2>
        <p class="form-sub-success">Your clinic account has been created. Redirecting to service setup…</p>
      </div>
    </div>
  </AuthLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore.js'
import { createPatient, createClinic } from '@/firebase/firestore.js'
import { sendVerificationEmail } from '@/firebase/auth.js'
import { reload, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth'
import { auth } from '@/firebase/config.js'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppSpinner from '@/components/base/AppSpinner.vue'

const router = useRouter()
const authStore = useAuthStore()
const checking = ref(false)
const resending = ref(false)
const resent = ref(false)
const error = ref('')
const verified = ref(false)

async function checkVerification() {
  checking.value = true
  error.value = ''
  console.log('error cleared:', error.value)
  try {
    await reload(auth.currentUser)
    if (auth.currentUser.emailVerified) {
      const uid = auth.currentUser.uid

      if (authStore.pendingClinicData) {
        // Clinic verification
        const data = authStore.pendingClinicData
        await createClinic(uid, data)
        const { getClinic } = await import('@/firebase/firestore.js')
        const clinic = await getClinic(uid)
        authStore.clinic = clinic
        authStore.role = 'clinic'
        authStore.pendingClinicData = null
        authStore.pendingPassword = null
        verified.value = true
        error.value = ''
        setTimeout(() => router.push('/clinic/dashboard'), 1500)
      } else {
        // Patient verification
        const data = authStore.pendingPatientData
        await createPatient(uid, {
          fullName: data?.fullName || '',
          email: auth.currentUser.email || '',
          mobileNumber: data?.mobileNumber || '',
          postalCode: data?.postalCode || '',
        })
        const { getPatient } = await import('@/firebase/firestore.js')
        const patient = await getPatient(uid)
        authStore.patient = patient
        authStore.role = 'patient'
        authStore.pendingPatientData = null
        authStore.pendingPassword = null
        error.value = ''
        router.push('/patient/dashboard')
      }
    } else {
      error.value = 'Email not verified yet. Please click the link in your inbox.'
    }
  } catch (err) {
    console.error('[VerifyEmail] error:', err)
    error.value = 'Something went wrong. Please try again.'
  } finally {
    checking.value = false
    if (verified.value) error.value = ''
  }
}

async function resendEmail() {
  resending.value = true
  resent.value = false
  error.value = ''
  try {
    await sendVerificationEmail()
    resent.value = true
    setTimeout(() => { resent.value = false }, 3000)
  } catch (err) {
    error.value = 'Failed to resend email. Please try again later.'
  } finally {
    resending.value = false
  }
}

async function cancelAndLogout() {
  const isClinic = !!authStore.pendingClinicData
  const email = isClinic
    ? authStore.pendingClinicData?.email
    : authStore.pendingPatientData?.email
  const redirectTo = isClinic ? '/clinic/register' : '/register'

  try {
    const user = auth.currentUser
    if (user && email && authStore.pendingPassword) {
      const credential = EmailAuthProvider.credential(email, authStore.pendingPassword)
      await reauthenticateWithCredential(user, credential)
      await deleteUser(user)
    }
  } catch (e) {
    console.error('Failed to delete unverified user:', e)
  } finally {
    authStore.pendingPatientData = null
    authStore.pendingClinicData = null
    authStore.pendingPassword = null
    await authStore.logoutUser()
    router.push(redirectTo)
  }
}
</script>

<style scoped>
.form-heading {
    font-size: 1.75rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: .25rem;
}

.verify-shell {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1rem;
    padding: 0.25rem;
}

.verify-icon {
    font-size: 3rem;
}

.checking-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    color: #6b7280;
    font-size: 0.875rem;
}

.error-msg {
    color: #ef4444;
    font-size: 0.875rem;
    background: #fef2f2;
    padding: 0.75rem;
    border-radius: 1.75rem;
    width: 100%;
}

.verify-actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
}

.logout-link {
    background: none;
    border: none;
    color: #6b7280;
    font-size: 0.875rem;
    cursor: pointer;
    text-decoration: underline;
    margin-top: 0.5rem;
}

.form-heading-success {
    font-size: 1.4rem;
    font-weight: 800;
    color: #1f2937;
    margin-bottom: .25rem;
}

.form-sub-success {
    color: #6b7280;
    font-size: .875rem;
    margin-bottom: 1.5rem;
}

.success-box {
    text-align: center;
    padding: 1rem 0;
}

.success-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
}
</style>