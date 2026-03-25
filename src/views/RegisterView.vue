<template>
    <AuthLayout>
        <h2 class="form-heading">Create your account</h2>
        <p class="form-sub">Join ClinicQ to manage your clinic visits.</p>

        <form @submit.prevent="submit" class="auth-form" novalidate>
            <AppInput v-model="form.fullName" label="Full Name" placeholder="e.g. Tan Ah Ming" :error="errors.fullName"
                required />
            <AppInput v-model="form.email" label="Email Address" type="email" placeholder="you@email.com"
                :error="errors.email" required />
            <AppInput v-model="form.mobileNumber" label="Mobile Number" placeholder="e.g. 91234567"
                :error="errors.mobileNumber" required />
            <AppInput v-model="form.postalCode" label="Residential Postal Code" placeholder="e.g. 123456"
                :error="errors.postalCode" required />
            <AppInputPassword v-model="form.password" label="Password"
                placeholder="Min 8 chars, upper, lower, number, special" :error="errors.password" required />
            <AppInputPassword v-model="form.confirmPassword" label="Confirm Password"
                placeholder="Re-enter your password" :error="errors.confirmPassword" required />

            <AlertBanner v-if="serverError" type="error" :message="serverError" dismissible
                @dismiss="serverError = ''" />

            <AppButton type="submit" variant="primary" block :loading="loading">Create Account</AppButton>
        </form>

        <p class="auth-footer">
            Already have an account?
            <RouterLink to="/login">Log In</RouterLink>
        </p>
    </AuthLayout>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore.js'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppInputPassword from '@/components/base/AppInputPassword.vue'
import AppButton from '@/components/base/AppButton.vue'
import AlertBanner from '@/components/shared/AlertBanner.vue'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const serverError = ref('')

const form = reactive({ fullName: '', email: '', mobileNumber: '', postalCode: '', password: '', confirmPassword: '' })
const errors = reactive({ fullName: '', email: '', mobileNumber: '', postalCode: '', password: '', confirmPassword: '' })

function validate() {
    let ok = true
    Object.keys(errors).forEach(k => errors[k] = '')

    if (!form.fullName.trim()) { errors.fullName = 'Full name is required'; ok = false }
    if (!form.email.trim()) { errors.email = 'Email is required'; ok = false }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { errors.email = 'Enter a valid email address'; ok = false }

    if (!form.mobileNumber.trim()) { errors.mobileNumber = 'Mobile number is required'; ok = false }
    else if (!/^[689]\d{7}$/.test(form.mobileNumber)) { errors.mobileNumber = 'Enter a valid 8-digit Singapore mobile number'; ok = false }

    if (!form.postalCode.trim()) { errors.postalCode = 'Postal code is required'; ok = false }
    else if (!/^\d{6}$/.test(form.postalCode)) { errors.postalCode = 'Postal code must be 6 digits'; ok = false }

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
        await authStore.registerPatient({
            fullName: form.fullName.trim(),
            email: form.email.trim().toLowerCase(),
            mobileNumber: form.mobileNumber.trim(),
            postalCode: form.postalCode.trim(),
            password: form.password,
        })
        router.push('/login')
    } catch (e) {
        serverError.value = e.code === 'auth/email-already-in-use'
            ? 'This email is already registered. Please log in.'
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
</style>
