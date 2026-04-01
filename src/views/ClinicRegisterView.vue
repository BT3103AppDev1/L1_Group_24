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
                <AppInput v-model="form.email" label="Email Address" type="email" placeholder="clinic@email.com"
                    :error="errors.email" required />
                <AppInput v-model="form.address" label="Address" placeholder="e.g. 123 Orchard Rd"
                    :error="errors.address" required />
                <AppInput v-model="form.postalCode" label="Postal Code" placeholder="e.g. 123456"
                    :error="errors.postalCode" required />
                <AppSelect v-model="form.district" label="District" :options="districtOptions" :error="errors.district"
                    required />

                <!-- Services offered -->
                <div class="form-group">
                    <label class="form-label">Services Offered <span class="required">*</span></label>
                    <div v-if="clinicStore.loading" class="services-loading">Loading services…</div>
                    <div v-else class="services-grid">
                        <label
                            v-for="svc in clinicStore.services"
                            :key="svc.id"
                            class="service-option"
                            :class="{ selected: form.services.includes(svc.id) }"
                        >
                            <input
                                type="checkbox"
                                :value="svc.id"
                                v-model="form.services"
                                class="service-checkbox"
                            />
                            {{ svc.name }}
                        </label>
                    </div>
                    <p v-if="errors.services" class="field-error">{{ errors.services }}</p>
                </div>

                <AppInputPassword v-model="form.password" label="Password" :error="errors.password" required />
                <AppInputPassword v-model="form.confirmPassword" label="Confirm Password"
                    :error="errors.confirmPassword" required />

                <AlertBanner v-if="serverError" type="error" :message="serverError" dismissible
                    @dismiss="serverError = ''" />
                <AppButton type="submit" variant="primary" block :loading="loading">Register Clinic</AppButton>
            </form>

            <p class="auth-footer">
                Already registered? <RouterLink to="/clinic/login">Log in here</RouterLink>
            </p>
        </template>

        <template v-else>
            <div class="success-box">
                <div class="success-icon">✅</div>
                <h2 class="form-heading">Registration Successful!</h2>
                <p class="form-sub">Your clinic account has been created. Redirecting to service setup…</p>
            </div>
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

const form = reactive({
    name: '', contactNumber: '', email: '', address: '',
    postalCode: '', district: '', services: [],
    password: '', confirmPassword: '',
})

const errors = reactive({
    name: '', contactNumber: '', email: '', address: '',
    postalCode: '', district: '', services: '',
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
    if (!form.address.trim()) { errors.address = 'Address is required'; ok = false }
    if (!form.postalCode.trim()) { errors.postalCode = 'Postal code is required'; ok = false }
    else if (!/^\d{6}$/.test(form.postalCode)) { errors.postalCode = 'Postal code must be 6 digits'; ok = false }
    if (!form.district) { errors.district = 'District is required'; ok = false }
    if (form.services.length === 0) { errors.services = 'Please select at least one service'; ok = false }

    const pwRe = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
    if (!form.password) { errors.password = 'Password is required'; ok = false }
    else if (!pwRe.test(form.password)) { errors.password = 'Min 8 chars with uppercase, lowercase, number and special character'; ok = false }
    if (!form.confirmPassword) { errors.confirmPassword = 'Please confirm your password'; ok = false }
    else if (form.password !== form.confirmPassword) { errors.confirmPassword = 'Passwords do not match'; ok = false }

    return ok
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
            password: form.password,
        })
        success.value = true
        setTimeout(() => router.push('/clinic/setup'), 1500)
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

.success-box {
    text-align: center;
    padding: 1rem 0;
}

.success-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
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
}
</style>
