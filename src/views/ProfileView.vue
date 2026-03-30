<template>
  <PageLayout title="My Profile">
    <form @submit.prevent="save" class="profile-form">

      <!-- Personal information form fields -->
      <AppCard class="section-card">
        <h3 class="sec-title">Personal Information</h3>
        <AppInput
          v-model="form.fullName"
          label="Full Name"
          :error="errors.fullName"
          required
        />
        <AppInput
          v-model="form.email"
          label="Email Address"
          type="email"
          disabled
        />
        <AppInput
          v-model="form.mobileNumber"
          label="Mobile Number"
          placeholder="e.g. 91234567"
          :error="errors.mobileNumber"
          required
        />
        <AppInput
          v-model="form.postalCode"
          label="Residential Postal Code"
          placeholder="e.g. 123456"
          :error="errors.postalCode"
          required
        />
      </AppCard>

      <!-- Error and success feedback banners -->
      <AlertBanner v-if="serverError" type="error" :message="serverError" dismissible @dismiss="serverError=''" />
      <AlertBanner v-if="saved" type="success" message="Profile updated successfully!" />

      <!-- Save and logout actions -->
      <AppButton type="submit" variant="primary" block :loading="saving">Save Changes</AppButton>

      <AppButton variant="secondary" block @click="confirmLogout = true">Log Out</AppButton>
    </form>

    <!-- Logout confirmation dialog -->
    <ConfirmDialog
      v-model="confirmLogout"
      title="Log Out?"
      message="Are you sure you want to log out?"
      confirm-text="Log Out"
      @confirm="logout"
      @cancel="confirmLogout = false"
    />
  </PageLayout>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore.js'
import { updatePatient } from '@/firebase/firestore.js'
import PageLayout    from '@/components/layout/PageLayout.vue'
import AppCard       from '@/components/base/AppCard.vue'
import AppInput      from '@/components/base/AppInput.vue'
import AppButton     from '@/components/base/AppButton.vue'
import AlertBanner   from '@/components/shared/AlertBanner.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'

const router    = useRouter()
const authStore = useAuthStore()

const saving        = ref(false)
const saved         = ref(false)
const serverError   = ref('')
const confirmLogout = ref(false)

const form = reactive({ fullName: '', email: '', mobileNumber: '', postalCode: '' })
const errors = reactive({ fullName: '', mobileNumber: '', postalCode: '' })

// Validates required fields and format (SG mobile number, 6-digit postal code)
function validate() {
  let ok = true
  errors.fullName = errors.mobileNumber = errors.postalCode = ''
  if (!form.fullName.trim())                         { errors.fullName = 'Full name is required'; ok = false }
  if (!form.mobileNumber.trim())                     { errors.mobileNumber = 'Mobile number is required'; ok = false }
  else if (!/^[689]\d{7}$/.test(form.mobileNumber)) { errors.mobileNumber = 'Enter a valid 8-digit Singapore mobile number'; ok = false }
  if (!form.postalCode.trim())                       { errors.postalCode = 'Postal code is required'; ok = false }
  else if (!/^\d{6}$/.test(form.postalCode))         { errors.postalCode = 'Postal code must be 6 digits'; ok = false }
  return ok
}

// Saves updated profile fields to Firestore
async function save() {
  if (!validate()) return
  saving.value = true
  serverError.value = ''
  saved.value = false
  try {
    await updatePatient(authStore.patientId, {
      fullName:     form.fullName.trim(),
      mobileNumber: form.mobileNumber.trim(),
      postalCode:   form.postalCode.trim(),
    })
    saved.value = true
    setTimeout(() => { saved.value = false }, 3000)
  } catch (e) {
    serverError.value = 'Failed to update profile. Please try again.'
  } finally {
    saving.value = false
  }
}

// Logs user out and redirects to login page
async function logout() {
  confirmLogout.value = false
  await authStore.logout()
  router.push('/login')
}

// Populates form when patient data loads 
watch(
  () => authStore.patient,
  (p) => {
    if (p) {
      form.fullName     = p.fullName     || ''
      form.email        = p.email        || ''
      form.mobileNumber = p.mobileNumber || ''
      form.postalCode   = p.postalCode   || ''
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.profile-form { display: flex; flex-direction: column; gap: 1rem; }
.section-card { padding: 1.25rem; display: flex; flex-direction: column; gap: .875rem; }
.sec-title    { font-size: 1rem; font-weight: 700; color: #1f2937; margin: 0 0 .25rem; }
</style>
