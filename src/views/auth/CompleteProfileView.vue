<!-- Complete Profile page -> for users who register through firebase OAuth -->
<template>
  <AuthLayout>
    <h2 class="form-heading">Complete Your Profile</h2>
    <p class="form-sub">Just a few more details to get started.</p>
    <form @submit.prevent="save" class="auth-form" novalidate >
      <AppInput v-model="form.fullName" label="Full Name" placeholder="e.g. Tan Ah Ming" :error="errors.fullName"
          required />
      <AppInput v-model="form.mobileNumber" label="Mobile Number" placeholder="e.g. 91234567"
          :error="errors.mobileNumber" required />
      <AppInput v-model="form.postalCode" label="Residential Postal Code" placeholder="e.g. 123456"
          :error="errors.postalCode" required />
      
      <AlertBanner v-if="serverError" type="error" :message="serverError" dismissible @dismiss="serverError = ''" />
      <AlertBanner v-if="saved" type="success" message="Profile updated successfully!" />

      <AppButton type="submit" variant="primary" block :loading="saving">Save & Continue</AppButton>
  </form>
  </AuthLayout>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore.js'
import { updatePatient } from '@/firebase/firestore.js'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppButton from '@/components/base/AppButton.vue'
import AlertBanner from '@/components/shared/AlertBanner.vue'

const router = useRouter()
const authStore = useAuthStore()
const saving = ref(false)
const saved = ref(false)
const serverError = ref('')

const form = reactive({ fullName: '', mobileNumber: '', postalCode: '' })
const errors = reactive({ fullName: '', mobileNumber: '', postalCode: '' })

function validate() {
    let ok = true
    Object.keys(errors).forEach(k => errors[k] = '')

    if (!form.fullName.trim()) { errors.fullName = 'Full name is required'; ok = false }

    if (!form.mobileNumber.trim()) { errors.mobileNumber = 'Mobile number is required'; ok = false }
    else if (!/^[689]\d{7}$/.test(form.mobileNumber)) { errors.mobileNumber = 'Enter a valid 8-digit Singapore mobile number'; ok = false }

    if (!form.postalCode.trim()) { errors.postalCode = 'Postal code is required'; ok = false }
    else if (!/^\d{6}$/.test(form.postalCode)) { errors.postalCode = 'Postal code must be 6 digits'; ok = false }

    return ok
}

async function save() {
  if (!validate()) return
  saving.value = true
  serverError.value = ''
  saved.value = false
  try {
    await updatePatient(authStore.patientId, {
      fullName: form.fullName.trim(),
      mobileNumber: form.mobileNumber.trim(),
      postalCode: form.postalCode.trim(),
    })

    if (authStore.patient) {
      authStore.patient.fullName = form.fullName.trim()
      authStore.patient.mobileNumber = form.mobileNumber.trim()
      authStore.patient.postalCode = form.postalCode.trim()
    }

    saved.value = true
    setTimeout(() => { saved.value = false }, 3000)
    router.push('/patient/dashboard')
  } catch (e) {
    serverError.value = 'Failed to update profile. Please try again.'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.form-heading {
    font-size: 1.4rem;
    font-weight: 800;
    color: #1f2937;
    margin-bottom: .25rem;
}

.form-sub {
    color: #6b7280;
    font-size: .875rem;
    margin-bottom: 1.5rem;
}

.auth-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}
</style>