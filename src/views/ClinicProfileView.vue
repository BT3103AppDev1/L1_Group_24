<template>
  <DashboardLayout title="Clinic Profile">
    <form @submit.prevent="save" class="profile-form">

      <!-- Basic clinic information form fields -->
      <AppCard class="section-card">
        <h3 class="sec-title">Clinic Information</h3>
        <AppInput v-model="form.name"          label="Clinic Name"    :error="errors.name"    required />
        <AppInput v-model="form.email"         label="Email Address🔒" type="email" disabled />
        <AppInput v-model="form.contactNumber" label="Contact Number🔒" disabled />
        <AppInput v-model="form.address"       label="Location"        :error="errors.address" required />
        <AppInput v-model="form.postalCode"    label="Postal Code"    :error="errors.postalCode" required />
        <AppSelect v-model="form.district"     label="District"       :options="districtOptions" :error="errors.district" required />
      </AppCard>

      <!-- Operating hours per day with toggle and time pickers -->
      <AppCard class="section-card">
        <h3 class="sec-title">Operating Hours</h3>
        <div class="hours-grid">
          <div v-for="day in DAYS" :key="day.value" class="day-row">
            <label class="day-toggle">
              <AppCheckbox v-model="form.hours[day.value].open" />
              <span class="day-label">{{ day.label }}</span>
            </label>
            <div v-if="form.hours[day.value].open" class="time-inputs">
              <div class="time-field">
                <span class="time-label">Open</span>
                <input type="time" v-model="form.hours[day.value].start" class="time-input" />
              </div>
              <span class="time-sep">–</span>
              <div class="time-field">
                <span class="time-label">Close</span>
                <input type="time" v-model="form.hours[day.value].end" class="time-input" />
              </div>
            </div>
            <span v-else class="closed-label">Closed</span>
          </div>
          <p v-if="errors.hours" v-for="(msg, i) in errors.hours.split('\n')" :key="i" class="field-error">{{ msg }}</p>
        </div>
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
      v-if="confirmLogout"
      :model-value="true"
      title="Log Out?"
      message="Are you sure you want to log out?"
      confirm-text="Log Out"
      @confirm="logout"
      @cancel="confirmLogout = false"
    />
  </DashboardLayout>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore.js'
import { updateClinic }  from '@/firebase/firestore.js'
import { DISTRICTS, DAYS } from '@/constants/index.js'
import AppCard         from '@/components/base/AppCard.vue'
import AppInput        from '@/components/base/AppInput.vue'
import AppSelect       from '@/components/base/AppSelect.vue'
import AppCheckbox     from '@/components/base/AppCheckbox.vue'
import AppButton       from '@/components/base/AppButton.vue'
import AlertBanner     from '@/components/shared/AlertBanner.vue'
import ConfirmDialog   from '@/components/shared/ConfirmDialog.vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'

const router    = useRouter()
const authStore = useAuthStore()

const saving        = ref(false)
const saved         = ref(false)
const serverError   = ref('')
const confirmLogout = ref(false)

// Maps district list to select dropdown options
const districtOptions = DISTRICTS.map(d => ({ value: d, label: d }))

// Initialises default opening hours for each day (closed, 09:00–18:00)
function defaultHours() {
  const h = {}
  DAYS.forEach(d => { h[d.value] = { open: false, start: '09:00', end: '18:00' } })
  return h
}

const form = reactive({
  name: '', email: '', contactNumber: '', address: '', postalCode: '', district: '',
  hours: defaultHours(),
})
const errors = reactive({ name: '', address: '', postalCode: '', district: '', hours: '' })

// Validates required fields and postal code format
function validate() {
  let ok = true
  errors.name = errors.address = errors.postalCode = errors.district = ''
  if (!form.name.trim())       { errors.name      = 'Clinic name is required'; ok = false }
  if (!form.address.trim())    { errors.address   = 'Address is required'; ok = false }
  if (!form.postalCode.trim()) { errors.postalCode = 'Postal code is required'; ok = false }
  else if (!/^\d{6}$/.test(form.postalCode)) { errors.postalCode = 'Must be 6 digits'; ok = false }
  if (!form.district)          { errors.district  = 'District is required'; ok = false }

  errors.hours = ''
  const openDays = DAYS.filter(d => form.hours[d.value].open)
  if (openDays.length === 0) {
    errors.hours = 'Please set at least one open day'
    ok = false
  } else {
    const hourErrors = []
    for (const d of openDays) {
      const h = form.hours[d.value]
      if (!h.start || !h.end) {
        hourErrors.push(`Please set opening and closing times for ${d.label}`)
        ok = false
      } else if (h.start >= h.end) {
        hourErrors.push(`${d.label}: Closing time must be after opening time`)
        ok = false
      }
    }
    if (hourErrors.length > 0) errors.hours = hourErrors.join('\n')
  }

  return ok
}

// Saves updated clinic profile to Firestore
async function save() {
  if (!validate()) return
  saving.value = true
  serverError.value = ''
  saved.value = false
  try {
    await updateClinic(authStore.clinicId, {
      name:          form.name.trim(),
      address:       form.address.trim(),
      postalCode:    form.postalCode.trim(),
      district:      form.district,
      openingHours:  form.hours,
    })
    saved.value = true
    setTimeout(() => { saved.value = false }, 3000)
  } catch {
    serverError.value = 'Failed to update profile.'
  } finally {
    saving.value = false
  }
}

// Logs user out and redirects to clinic login page
async function logout() {
  confirmLogout.value = false
  await authStore.logout()
  router.push('/clinic/login')
}

// Populates form when clinic data loads
watch(
  () => authStore.clinic,
  (c) => {
    if (c) {
      form.name          = c.name || c.clinicName || ''
      form.email         = c.email         || ''
      form.contactNumber = c.contactNumber || ''
      form.address       = c.address       || ''
      form.postalCode    = c.postalCode    || ''
      form.district      = c.district      || ''
      if (c.openingHours) {
        DAYS.forEach(d => {
          if (c.openingHours[d.value]) {
            form.hours[d.value] = { ...c.openingHours[d.value] }
          }
        })
      }
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.profile-form { 
  display: flex; 
  flex-direction: column; 
  gap: 1rem; 
}

.section-card { 
  padding: 1.75rem; 
  display: flex; 
  flex-direction: column; 
  gap: .875rem; 
}

.sec-title { 
  font-size: 1.25rem; 
  font-weight: 700; 
  color: #1f2937; 
  margin: 0;
}

.section-card > :last-child {
  margin-bottom: 0;
}

.hours-grid {
  display: flex;
  flex-direction: column;
  gap: 0;
  border-radius: .75rem;
  padding: 0;
  background: transparent;
}

.day-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding: .6rem .25rem;
  border-bottom: 1px solid #f3f4f6;
}

.day-row:last-child {
  border-bottom: none;
}

.day-toggle {
  display: flex;
  align-items: center;
  gap: .45rem;
  cursor: pointer;
  min-width: 110px;
}

.day-label {
  font-size: .875rem;
  font-weight: 600;
  color: #374151;
}

.time-inputs {
  display: flex;
  align-items: center;
  gap: .5rem;
  flex-wrap: wrap;
}

.time-field {
  display: flex;
  align-items: center;
  gap: .35rem;
}

.time-label {
  font-size: .75rem;
  color: #9ca3af;
  white-space: nowrap;
}

.time-input {
  padding: .3rem .5rem;
  border: 1px solid #e5e7eb;
  border-radius: .4rem;
  font-size: .82rem;
  color: #1f2937;
  background: white;
  outline: none;
  transition: border-color .15s;
}

.time-input:focus {
  border-color: #3b82f6;
}

.time-sep {
  color: #9ca3af;
  font-weight: 600;
}

.closed-label { 
  font-size: .8rem; 
  color: #9ca3af; 
}

.field-error {
  font-size: .8rem;
  color: #ef4444;
  margin: .25rem 0rem;

}
</style>