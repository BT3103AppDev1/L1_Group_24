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
      <p class="auth-footer">Don't have an account? <RouterLink to="/register">Register here</RouterLink>
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
</style>
