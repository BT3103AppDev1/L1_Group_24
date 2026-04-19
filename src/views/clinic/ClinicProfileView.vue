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

      <!-- Services offered by this clinic -->
      <AppCard class="section-card">
        <h3 class="sec-title">Services Offered</h3>
        <div v-if="loadingServices" class="services-loading">Loading services…</div>
        <div v-else class="svc-dropdown" :class="{ open: svcOpen }">
          <button
            type="button"
            class="svc-trigger"
            :class="{ 'svc-trigger--error': errors.services }"
            @click="svcOpen = !svcOpen"
          >
            <span class="svc-trigger__text">
              {{ form.services.length === 0 ? 'Select services…' : form.services.length === 1 ? allServices.find(s => s.id === form.services[0])?.name : `${form.services.length} services selected` }}
            </span>
            <svg class="svc-trigger__chevron" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <div v-if="svcOpen" class="svc-menu" @click.stop>
            <label
              v-for="svc in allServices"
              :key="svc.id"
              class="svc-item"
              :class="{ 'svc-item--selected': form.services.includes(svc.id) }"
            >
              <input type="checkbox" class="svc-checkbox" :value="svc.id" :checked="form.services.includes(svc.id)" @change="toggleService(svc.id)" />
              {{ svc.name }}
            </label>
          </div>
        </div>
        <!-- Selected tags -->
        <div v-if="form.services.length > 0 && !loadingServices" class="svc-tags">
          <span v-for="id in form.services" :key="id" class="svc-tag">
            {{ allServices.find(s => s.id === id)?.name }}
            <button type="button" class="svc-tag__remove" @click="toggleService(id)">×</button>
          </span>
        </div>
        <p v-if="errors.services" class="field-error">{{ errors.services }}</p>
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
import { ref, reactive, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore.js'
import { updateClinic, getAllServices, getClinicServices, saveClinicServices, deleteClinicQueue } from '@/firebase/firestore.js'
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

const saving         = ref(false)
const saved          = ref(false)
const serverError    = ref('')
const confirmLogout  = ref(false)
const allServices     = ref([])
const loadingServices = ref(false)
const svcOpen         = ref(false)

function onClickOutside(e) {
  if (!e.target.closest('.svc-dropdown')) svcOpen.value = false
}

onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))

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
  services: [],
})
const errors = reactive({ name: '', address: '', postalCode: '', district: '', hours: '', services: '' })

function toggleService(id) {
  const idx = form.services.indexOf(id)
  if (idx === -1) form.services.push(id)
  else form.services.splice(idx, 1)
}

// Validates required fields and postal code format
function validate() {
  let ok = true
  errors.name = errors.address = errors.postalCode = errors.district = errors.services = ''
  if (!form.name.trim())       { errors.name      = 'Clinic name is required'; ok = false }
  if (!form.address.trim())    { errors.address   = 'Address is required'; ok = false }
  if (!form.postalCode.trim()) { errors.postalCode = 'Postal code is required'; ok = false }
  else if (!/^\d{6}$/.test(form.postalCode)) { errors.postalCode = 'Must be 6 digits'; ok = false }
  if (!form.district)          { errors.district  = 'District is required'; ok = false }
  if (form.services.length === 0) { errors.services = 'Please select at least one service'; ok = false }

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

// Saves updated clinic profile to Firestore, including service changes
async function save() {
  if (!validate()) return
  saving.value = true
  serverError.value = ''
  saved.value = false
  try {
    const clinicId = authStore.clinicId

    // Sync queue sub-documents: add new services, remove deselected ones
    const currentQueues = await getClinicServices(clinicId)
    const currentIds = currentQueues.map(q => q.serviceId || q.id)
    const selectedIds = form.services

    const toAdd = selectedIds.filter(id => !currentIds.includes(id))
    const toRemove = currentIds.filter(id => !selectedIds.includes(id))

    const svcMap = Object.fromEntries(allServices.value.map(s => [s.id, s]))
    await saveClinicServices(clinicId, toAdd.map(id => svcMap[id]))
    await Promise.all(toRemove.map(id => deleteClinicQueue(clinicId, id)))

    await updateClinic(clinicId, {
      name:           form.name.trim(),
      address:        form.address.trim(),
      postalCode:     form.postalCode.trim(),
      district:       form.district,
      operatingHours: form.hours,
      services:       selectedIds,
    })
    saved.value = true
    setTimeout(() => { saved.value = false }, 3000)
  } catch {
    serverError.value = 'Failed to update profile.'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  document.addEventListener('click', onClickOutside)
  loadingServices.value = true
  try {
    allServices.value = await getAllServices()
  } finally {
    loadingServices.value = false
  }
})

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
      form.services = Array.isArray(c.services) ? [...c.services] : []
      const storedHours = c.operatingHours || c.openingHours
      if (storedHours) {
        DAYS.forEach(d => {
          if (storedHours[d.value]) {
            form.hours[d.value] = { ...storedHours[d.value] }
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

.services-loading {
  font-size: .875rem;
  color: #6b7280;
}

/* Dropdown trigger */
.svc-dropdown {
  position: relative;
}

.svc-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: .65rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: .5rem;
  background: white;
  font-size: .875rem;
  color: #374151;
  cursor: pointer;
  transition: border-color .15s;
  text-align: left;
}

.svc-trigger:hover,
.svc-dropdown.open .svc-trigger {
  border-color: #3b82f6;
}

.svc-trigger--error {
  border-color: #ef4444;
}

.svc-trigger__text {
  flex: 1;
  color: inherit;
}

.svc-trigger__chevron {
  flex-shrink: 0;
  color: #6b7280;
  transition: transform .2s;
}

.svc-dropdown.open .svc-trigger__chevron {
  transform: rotate(180deg);
}

/* Dropdown menu */
.svc-menu {
  margin-top: .35rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: .5rem;
  max-height: 220px;
  overflow-y: auto;
  padding: .35rem;
}

.svc-item {
  display: flex;
  align-items: center;
  gap: .6rem;
  padding: .45rem .65rem;
  border-radius: .35rem;
  font-size: .875rem;
  color: #374151;
  cursor: pointer;
  transition: background .12s;
}

.svc-item:hover {
  background: #f0f9ff;
}

.svc-item--selected {
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 500;
}

.svc-checkbox {
  accent-color: #3b82f6;
  flex-shrink: 0;
}

/* Selected tags */
.svc-tags {
  display: flex;
  flex-wrap: wrap;
  gap: .4rem;
  margin-top: .25rem;
}

.svc-tag {
  display: inline-flex;
  align-items: center;
  gap: .3rem;
  padding: .2rem .55rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  font-size: .78rem;
  color: #1d4ed8;
  font-weight: 500;
}

.svc-tag__remove {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: #60a5fa;
  font-size: 1rem;
  line-height: 1;
  display: flex;
  align-items: center;
}

.svc-tag__remove:hover {
  color: #1d4ed8;
}
</style>