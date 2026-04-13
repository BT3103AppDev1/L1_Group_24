<template>
    <AuthLayout>
        <template v-if="!success">
            <h2 class="form-heading">Register Your Clinic</h2>
            <p class="form-sub">Create a ClinicQ account to manage your queues.</p>

            <form @submit.prevent="submit" class="auth-form" novalidate>
                <AppInput v-model="form.name" label="Clinic Name" placeholder="e.g. Bright Family Clinic"
                    :error="errors.name" required />
                <AppInput v-model="form.contactNumber" label="Contact Number" placeholder="e.g. 62345678"
                    :error="errors.contactNumber" required />
                <AppInput v-model="form.email" label="Email Address" type="email" placeholder="e.g. clinic@email.com"
                    :error="errors.email" required />
                <AppInput v-model="form.address" label="Location" placeholder="e.g. 123 Orchard Rd"
                    :error="errors.address" required />
                <AppInput v-model="form.postalCode" label="Residential Postal Code" placeholder="e.g. 123456"
                    :error="errors.postalCode" required />
                <AppSelect v-model="form.district" label="District" :options="districtOptions" :error="errors.district"
                    required />

                <!-- Services offered -->
                <div class="form-group">
                    <label class="form-label">Services Offered <span class="required">*</span></label>
                    <div v-if="clinicStore.loading" class="services-loading">Loading services…</div>
                    <div v-else class="services-grid">
                        <label v-for="svc in clinicStore.services" :key="svc.id" class="service-option"
                            :class="{ selected: form.services.includes(svc.id) }">
                            <input type="checkbox" :value="svc.id" v-model="form.services" class="service-checkbox" />
                            {{ svc.name }}
                        </label>
                    </div>
                    <p v-if="errors.services" class="field-error">{{ errors.services }}</p>
                </div>

                <!-- Operating Hours -->
                <div class="form-group">
                    <label class="form-label">Operating Hours <span class="required">*</span></label>
                    <p class="form-hint">Set the days and hours your clinic is open.</p>
                    <div class="hours-grid" :class="{ 'hours-grid--error': errors.operatingHours }">
                        <div v-for="day in DAYS" :key="day.key" class="day-row">
                            <label class="day-toggle">
                                <input type="checkbox" v-model="form.operatingHours[day.key].open"
                                    class="service-checkbox" />
                                <span class="day-label">{{ day.label }}</span>
                            </label>
                            <div v-if="form.operatingHours[day.key].open" class="time-inputs">
                                <div class="time-field">
                                    <span class="time-label">Open</span>
                                    <input type="time" v-model="form.operatingHours[day.key].start"
                                        class="time-input" />
                                </div>
                                <span class="time-sep">–</span>
                                <div class="time-field">
                                    <span class="time-label">Close</span>
                                    <input type="time" v-model="form.operatingHours[day.key].end" class="time-input" />
                                </div>
                            </div>
                            <span v-else class="closed-label">Closed</span>
                        </div>
                    </div>
                    <p v-if="errors.operatingHours" class="field-error">{{ errors.operatingHours }}</p>
                </div>

                <AppInputPassword v-model="form.password" label="Password" placeholder="Enter a password"
                    :error="errors.password" required />
                <AppInputPassword v-model="form.confirmPassword" label="Confirm Password" placeholder="Re-enter your password"
                    :error="errors.confirmPassword" required />

                <AlertBanner v-if="serverError" type="error" :message="serverError" dismissible
                    @dismiss="serverError = ''" />
                <AppButton type="submit" variant="primary" block :loading="loading">Register Clinic</AppButton>
            </form>

            <p class="auth-footer">
                Already registered? <RouterLink to="/clinic/login">Log in here</RouterLink>
            </p>
        </template>
    </AuthLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore.js'
import { useClinicStore } from '@/stores/useClinicStore.js'
import { DISTRICTS } from '@/constants/index.js'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppInputPassword from '@/components/base/AppInputPassword.vue'
import AppSelect from '@/components/base/AppSelect.vue'
import AppButton from '@/components/base/AppButton.vue'
import AlertBanner from '@/components/shared/AlertBanner.vue'

const router = useRouter()
const authStore = useAuthStore()
const clinicStore = useClinicStore()

const loading = ref(false)
const serverError = ref('')
const success = ref(false)

const districtOptions = DISTRICTS.map(d => ({ value: d, label: d }))

// Days of the week in the format the DB expects
const DAYS = [
    { key: 'mon', label: 'Monday' },
    { key: 'tue', label: 'Tuesday' },
    { key: 'wed', label: 'Wednesday' },
    { key: 'thu', label: 'Thursday' },
    { key: 'fri', label: 'Friday' },
    { key: 'sat', label: 'Saturday' },
    { key: 'sun', label: 'Sunday' },
]

// Default hours: Mon–Fri open 08:00–18:00, Sat 09:00–13:00, Sun closed
function defaultHours() {
    return {
        mon: { open: true, start: '08:00', end: '18:00' },
        tue: { open: true, start: '08:00', end: '18:00' },
        wed: { open: true, start: '08:00', end: '18:00' },
        thu: { open: true, start: '08:00', end: '18:00' },
        fri: { open: true, start: '08:00', end: '18:00' },
        sat: { open: true, start: '09:00', end: '13:00' },
        sun: { open: false, start: '', end: '' },
    }
}

const form = reactive({
    name: '', contactNumber: '', email: '', address: '',
    postalCode: '', district: '', services: [],
    operatingHours: defaultHours(),
    password: '', confirmPassword: '',
})

const errors = reactive({
    name: '', contactNumber: '', email: '', address: '',
    postalCode: '', district: '', services: '',
    operatingHours: '',
    password: '', confirmPassword: '',
})

onMounted(async () => {
    if (clinicStore.services.length === 0) {
        await clinicStore.fetchServices()
    }
})

function validate() {
    let ok = true
    Object.keys(errors).forEach(k => errors[k] = '')

    if (!form.name.trim()) { errors.name = 'Clinic name is required'; ok = false }
    if (!form.contactNumber.trim()) { errors.contactNumber = 'Contact number is required'; ok = false }
    else if (!/^[36]\d{7}$/.test(form.contactNumber)) { errors.contactNumber = 'Enter a valid 8-digit Singapore phone number'; ok = false }
    if (!form.email.trim()) { errors.email = 'Email is required'; ok = false }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { errors.email = 'Enter a valid email'; ok = false }
    if (!form.address.trim()) { errors.address = 'Residential address is required'; ok = false }
    if (!form.postalCode.trim()) { errors.postalCode = 'Postal code is required'; ok = false }
    else if (!/^\d{6}$/.test(form.postalCode)) { errors.postalCode = 'Postal code must be 6 digits'; ok = false }
    if (!form.district) { errors.district = 'District is required'; ok = false }
    if (form.services.length === 0) { errors.services = 'Please select at least one service'; ok = false }

    // Validate that open days have valid start/end times
    const openDays = DAYS.filter(d => form.operatingHours[d.key].open)
    if (openDays.length === 0) {
        errors.operatingHours = 'Please set at least one open day'
        ok = false
    } else {
        for (const d of openDays) {
            const h = form.operatingHours[d.key]
            if (!h.start || !h.end) {
                errors.operatingHours = `Please set opening and closing times for ${d.label}`
                ok = false
                break
            }
            if (h.start >= h.end) {
                errors.operatingHours = `${d.label}: Closing time must be after opening time`
                ok = false
                break
            }
        }
    }

    const pwRe = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
    if (!form.password) { errors.password = 'Password is required'; ok = false }
    else if (!pwRe.test(form.password)) { errors.password = 'Minimum 8 characters with at least one uppercase, lowercase, number and special character'; ok = false }
    if (!form.confirmPassword) { errors.confirmPassword = 'Please confirm your password'; ok = false }
    else if (form.password !== form.confirmPassword) { errors.confirmPassword = 'Passwords do not match'; ok = false }

    return ok
}

// Build a clean operatingHours object: closed days only have { open: false }
function buildOperatingHours() {
    const result = {}
    for (const d of DAYS) {
        const h = form.operatingHours[d.key]
        if (h.open) {
            result[d.key] = { open: true, start: h.start, end: h.end }
        } else {
            result[d.key] = { open: false }
        }
    }
    return result
}

async function submit() {
    if (!validate()) return
    loading.value = true
    serverError.value = ''
    try {
        await authStore.registerClinic({
            clinicName: form.name.trim(),
            contactNumber: form.contactNumber.trim(),
            email: form.email.trim().toLowerCase(),
            address: form.address.trim(),
            postalCode: form.postalCode.trim(),
            district: form.district,
            services: form.services,
            operatingHours: buildOperatingHours(),
            password: form.password,
        })
        
        setTimeout(() => router.push('/clinic/verify-email'), 1500)
    } catch (e) {
        serverError.value = e.code === 'auth/email-already-in-use'
            ? 'This email address is already registered.'
            : (e.message || 'Registration failed. Please try again.')
    } finally {
        loading.value = false
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

.form-hint {
    font-size: .8rem;
    color: #9ca3af;
    margin: .15rem 0 .6rem;
}

.auth-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.auth-footer {
    text-align: center;
    margin-top: 1.25rem;
    font-size: .875rem;
    color: #6b7280;
}

.auth-footer a {
    color: #3b82f6;
    font-weight: 600;
}

.required {
    color: #ef4444;
    margin-left: 2px;
}

.services-loading {
    font-size: .875rem;
    color: #6b7280;
}

.services-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: .5rem;
}

.service-option {
    display: flex;
    align-items: center;
    gap: .5rem;
    padding: .5rem .75rem;
    border: 1px solid #e5e7eb;
    border-radius: .5rem;
    font-size: .875rem;
    cursor: pointer;
    transition: background .15s, border-color .15s;
}

.service-option:hover {
    background: #f0f9ff;
    border-color: #93c5fd;
}

.service-option.selected {
    background: #eff6ff;
    border-color: #3b82f6;
    color: #1d4ed8;
    font-weight: 500;
}

.service-checkbox {
    accent-color: #3b82f6;
}

.field-error {
    font-size: .8rem;
    color: #ef4444;
    margin-top: .25rem;
}

/* --- Operating Hours --- */
.hours-grid {
    display: flex;
    flex-direction: column;
    gap: .5rem;
    border: 1px solid #e5e7eb;
    border-radius: .75rem;
    padding: .75rem;
    background: #f9fafb;
}

.day-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    padding: .4rem .25rem;
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

.hours-grid--error {
  border-color: var(--color-danger);
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.12);
}

.closed-label {
    font-size: .8rem;
    color: #9ca3af;
    font-style: italic;
}
</style>
