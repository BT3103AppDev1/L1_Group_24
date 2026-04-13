<template>
    <AuthLayout>
        <h2 class="form-heading">Create your account</h2>
        <p class="form-sub">Join ClinicQ to manage your clinic visits.</p>

        <!-- Google Registration -->
        <div>
            <div class="oauth-buttons">
                <button class="oauth-btn" type="button" @click="handleOAuth" :disabled="oauthLoading">
                    <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign up with Google
                </button>
            </div>
            <AlertBanner v-if="oauthError" type="error" :message="oauthError" dismissible @dismiss="oauthError = ''" />
        </div>

        <div class="oauth-divider"><span>or</span></div>

        <!-- Manual Registration -->
        <form @submit.prevent="submit" class="auth-form" novalidate>
            <AppInput v-model="form.fullName" label="Full Name" placeholder="e.g. Tan Ah Ming" :error="errors.fullName"
                required />
            <AppInput v-model="form.email" label="Email Address" type="email" placeholder="e.g. example@email.com"
                :error="errors.email" required />
            <AppInput v-model="form.mobileNumber" label="Mobile Number" placeholder="e.g. 91234567"
                :error="errors.mobileNumber" required />
            <AppInput v-model="form.postalCode" label="Residential Postal Code" placeholder="e.g. 123456"
                :error="errors.postalCode" required />
            <AppInputPassword v-model="form.password" label="Password"
                placeholder="Enter your password" :error="errors.password" required />
            <AppInputPassword v-model="form.confirmPassword" label="Confirm Password"
                placeholder="Re-enter your password" :error="errors.confirmPassword" required />

            <AlertBanner v-if="serverError" type="error" :message="serverError" dismissible
                @dismiss="serverError = ''" />

            <AppButton type="submit" variant="primary" block :loading="loading">Create Account</AppButton>
        </form>

        <p class="auth-footer">
            Already have an account?
            <RouterLink to="/login">Log in here</RouterLink>
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
    else if (!pwRe.test(form.password)) { errors.password = 'Minimum 8 characters with at least one uppercase, lowercase, number and special character'; ok = false }

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

// Google Registration
const oauthLoading = ref(false)
const oauthError = ref('')

async function handleOAuth() {
  oauthLoading.value = true
  oauthError.value = ''
  try {
    const result = await authStore.loginWithOAuth()
    if (result?.isNewUser) {
      router.push('/patient/complete-profile')
    } else {
      // existing Google user — go straight to dashboard
      router.push('/patient/dashboard')
    }
  } catch (err) {
    oauthError.value = 'Google sign in failed. Please try again.'
  } finally {
    oauthLoading.value = false
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

.oauth-divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1rem 0;
  color: #9ca3af;
  font-size: 0.875rem;
}

.oauth-divider::before,
.oauth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e5e7eb;
}

.oauth-buttons {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.oauth-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.7rem;
  border: 1.5px solid #e5e7eb;
  border-radius: 0.75rem;
  background: white;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.oauth-btn:hover:not(:disabled) {
  border-color: #3b82f6;
  background: #f8fafc;
}

.oauth-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
