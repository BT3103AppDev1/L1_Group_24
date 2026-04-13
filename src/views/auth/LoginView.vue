<template>
  <AuthLayout>
    <!-- ── Role tabs ── -->
    <div class="role-tabs">
      <button class="role-btn" :class="{ active: role === 'patient' }" @click="setRole('patient')">Patient</button>
      <button class="role-btn" :class="{ active: role === 'clinic' }" @click="setRole('clinic')">Clinic</button>
    </div>

    <!-- ── Patient Login ── -->
    <template v-if="role === 'patient'">
      <h2 class="form-heading">Welcome back</h2>
      <p class="form-sub">Log in to your ClinicQ account.</p>

      <!-- Google Login -->
      <div>
        <div class="oauth-buttons">
          <button class="oauth-btn" type="button" @click="handleOAuth" :disabled="oauthLoading">
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
        </div>
        <AlertBanner v-if="oauthError" type="error" :message="oauthError" dismissible @dismiss="oauthError = ''" />
      </div>

      <div class="oauth-divider"><span>or</span></div>

      <!-- Manual Login -->
      <form @submit.prevent="submitPatientLogin" class="auth-form" novalidate>
        <AppInput v-model="pl.email" label="Email Address" type="email" placeholder="name@email.com"
          :error="pl.errors.email" required />
        <AppInputPassword v-model="pl.password" label="Password" :error="pl.errors.password" required />
        <div class="forgot-row">
          <RouterLink to="/forgot-password" class="forgot-link">Forgot Password?</RouterLink>
        </div>
        <AlertBanner v-if="pl.serverError" type="error" :message="pl.serverError" dismissible
          @dismiss="pl.serverError = ''" />
        <AppButton type="submit" variant="primary" block :loading="pl.loading">Log In</AppButton>
      </form>

      <p class="auth-footer">
        Don't have an account? 
        <RouterLink to="/register">Register here</RouterLink>
      </p>
    </template>

    <!-- ── Clinic Login ── -->
    <template v-else>
      <h2 class="form-heading">Welcome back</h2>
      <p class="form-sub">Log in with your clinic email and password.</p>
      <form @submit.prevent="submitClinicLogin" class="auth-form" novalidate>
        <AppInput v-model="cl.email" label="Email Address" type="email" placeholder="clinic@email.com"
          :error="cl.errors.email" required />
        <AppInputPassword v-model="cl.password" label="Password" :error="cl.errors.password" required />
        <AlertBanner v-if="cl.serverError" type="error" :message="cl.serverError" dismissible
          @dismiss="cl.serverError = ''" />
        <AppButton type="submit" variant="primary" block :loading="cl.loading">Log In</AppButton>
      </form>
      <p class="auth-footer">New clinic? <RouterLink to="/clinic/register">Register here</RouterLink>
      </p>
    </template>
  </AuthLayout>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore.js'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppInputPassword from '@/components/base/AppInputPassword.vue'
import AppButton from '@/components/base/AppButton.vue'
import AlertBanner from '@/components/shared/AlertBanner.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Initial role from route name or query
const role = ref(route.name === 'ClinicLogin' || route.query.role === 'clinic' ? 'clinic' : 'patient')

function setRole(r) { role.value = r }

// ── Patient Login ─────────────────────────────────────────
const pl = reactive({
  email: '', password: '', loading: false, serverError: '',
  errors: { email: '', password: '' },
})

async function submitPatientLogin() {
  pl.errors.email = pl.errors.password = ''
  if (!pl.email.trim()) { pl.errors.email = 'Email is required'; return }
  if (!pl.password.trim()) { pl.errors.password = 'Password is required'; return }
  pl.loading = true; pl.serverError = ''
  try {
    await authStore.loginPatient({ email: pl.email.trim().toLowerCase(), password: pl.password })
    router.push('/patient/dashboard')
  } catch {
    pl.serverError = 'Invalid email or password. Please try again.'
  } finally { pl.loading = false }
}

// ── Clinic Login ──────────────────────────────────────────
const cl = reactive({
  email: '', password: '', loading: false, serverError: '',
  errors: { email: '', password: '' },
})

async function submitClinicLogin() {
  cl.errors.email = cl.errors.password = ''

  if (!cl.email.trim()) { cl.errors.email = 'Email is required'; return }
  if (!cl.password.trim()) { cl.errors.password = 'Password is required'; return }
  
  cl.loading = true
  cl.serverError = ''

  try {
    await authStore.loginClinic({ email: cl.email.trim().toLowerCase(), password: cl.password })
    router.push('/clinic/dashboard').catch(err => {
      console.error('Router navigation failed:', err)
      cl.serverError = 'Navigation failed: ' + err.message
    })
  } catch (err) {
    console.error('Login action error:', err)
    cl.serverError = 'Invalid email or password.'
  } finally { cl.loading = false }
}

// Google Login
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
.role-tabs {
  display: flex;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 1.75rem;
}

.role-btn {
  flex: 1;
  padding: .6rem 1rem;
  border: none;
  background: transparent;
  font-size: .9rem;
  font-weight: 600;
  color: #9ca3af;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color .18s, border-color .18s;
}

.role-btn.active {
  color: var(--color-primary, #3b82f6);
  border-bottom-color: var(--color-primary, #3b82f6);
}

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

.forgot-row {
  text-align: right;
}

.forgot-link {
  font-size: .8rem;
  color: #3b82f6;
  font-weight: 500;
}

.auth-footer {
  text-align: center;
  margin-top: 1rem;
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
