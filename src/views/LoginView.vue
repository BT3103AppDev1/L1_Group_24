<template>
  <AuthLayout>
    <!-- ── Patient Login ── -->
    <h2 class="form-heading">Welcome back</h2>
    <p class="form-sub">Log in to your ClinicQ account.</p>
    <form @submit.prevent="submitPatientLogin" class="auth-form" novalidate>
      <AppInput
        v-model="pl.email"
        label="Email Address"
        type="email"
        placeholder="you@email.com"
        :error="pl.errors.email"
        required
      />
      <AppInputPassword
        v-model="pl.password"
        label="Password"
        :error="pl.errors.password"
        required
      />
      <div class="forgot-row">
        <RouterLink to="/forgot-password" class="forgot-link">Forgot Password?</RouterLink>
      </div>
      <AlertBanner
        v-if="pl.serverError"
        type="error"
        :message="pl.serverError"
        dismissible
        @dismiss="pl.serverError=''"
      />
      <AppButton type="submit" variant="primary" block :loading="pl.loading">
        Log In
      </AppButton>
    </form>
    <p class="auth-footer">
      Don't have an account? <RouterLink to="/register">Register</RouterLink>
    </p>
  </AuthLayout>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore.js'
import AuthLayout       from '@/components/layout/AuthLayout.vue'
import AppInput         from '@/components/base/AppInput.vue'
import AppInputPassword from '@/components/base/AppInputPassword.vue'
import AppButton        from '@/components/base/AppButton.vue'
import AlertBanner      from '@/components/shared/AlertBanner.vue'

const router = useRouter()
const authStore = useAuthStore()

const pl = reactive({
  email: '',
  password: '',
  loading: false,
  serverError: '',
  errors: { email: '', password: '' },
})

async function submitPatientLogin() {
  pl.errors.email = ''
  pl.errors.password = ''

  if (!pl.email.trim()) {
    pl.errors.email = 'Email is required'
    return
  }

  if (!pl.password.trim()) {
    pl.errors.password = 'Password is required'
    return
  }

  pl.loading = true
  pl.serverError = ''

  try {
    await authStore.loginPatient({
      email: pl.email.trim().toLowerCase(),
      password: pl.password,
    })
    router.push('/patient/dashboard')
  } catch {
    pl.serverError = 'Invalid email or password. Please try again.'
  } finally {
    pl.loading = false
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