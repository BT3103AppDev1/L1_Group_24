import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore.js'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [

    // Public views
    {
      path: '/',
      name: 'Home',
      component: () => import('@/views/public/HomeView.vue'), // CHANGE TO '@/views/patients/HomeView.vue' AFTER FOLDER HAS BEEN CREATED
    },
    {
      path: '/clinics',
      name: 'ClinicDirectory',
      component: () => import('@/views/public/ClinicDirectoryView.vue'),
    },
    {
      path: '/clinics/:clinicId',
      name: 'ClinicDetail',
      component: () => import('@/views/public/ClinicDetailView.vue'),
    },

    // Patient Authentication views
    {
      path: '/register',
      name: 'PatientRegister',
      component: () => import('@/views/auth/PatientRegisterView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/login',
      name: 'PatientLogin',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { guestOnly: true },
     },
     {
      path: '/forgot-password',
      name: 'ForgotPassword',
      component: () => import('@/views/auth/ForgotPasswordView.vue'),
      meta: { guestOnly: true },
    },
    { 
      path: '/patient/complete-profile', 
      name: 'CompleteProfile', 
      component: () => import('@/views/auth/CompleteProfileView.vue') 
    },
    { 
      path: '/patient/verify-email', 
      name: 'PatientVerifyEmail', 
      component: () => import('@/views/auth/VerifyEmailView.vue') 
    },

    // Patient Specific views
    {
      path: '/patient/dashboard',
      name: 'PatientDashboard',
      component: () => import('@/views/patient/DashboardView.vue'),
    },
    {
      path: '/patient/profile',
      name: 'PatientProfile',
      component: () => import('@/views/patient/ProfileView.vue'),
      meta: { requiresAuth: true, role: 'patient' },
    },
    {
      path: '/patient/records',
      name: 'PatientRecords',
      component: () => import('@/views/patient/RecordsView.vue'),
      meta: { requiresAuth: true, role: 'patient' },
    },

    // Clinic Authentication views
    {
      path: '/clinic/register',
      name: 'ClinicRegister',
      component: () => import('@/views/auth/ClinicRegisterView.vue'),
      meta: { guestOnly: true },
    },
    {
       path: '/clinic/login',
       name: 'ClinicLogin',
       component: () => import('@/views/auth/LoginView.vue'),
       meta: { guestOnly: true },
     },
    { 
      path: '/clinic/verify-email', 
      name: 'ClinicVerifyEmail', 
      component: () => import('@/views/auth/VerifyEmailView.vue') 
    },

    // Clinic Specific views
    {
      path: '/clinic/dashboard',
      name: 'ClinicDashboard',
      component: () => import('@/views/clinic/QueueDashboardView.vue'),
      meta: { requiresAuth: true, role: 'clinic' },
    },
    {
      path: '/clinic/analytics',
      name: 'ClinicAnalytics',
      component: () => import('@/views/clinic/ClinicAnalyticsView.vue'),
      meta: { requiresAuth: true, role: 'clinic' },
    },
    {
      path: '/clinic/profile',
      name: 'ClinicProfile',
      component: () => import('@/views/clinic/ClinicProfileView.vue'),
      meta: { requiresAuth: true, role: 'clinic' },
    },
    {
      path: '/clinic/post-consult',
      name: 'PostConsultList',
      component: () => import('@/views/clinic/PostConsultListView.vue'),
      meta: { requiresAuth: true, role: 'clinic' },
    },
    {
      path: '/clinic/post-consult/form',
      name: 'PostConsult',
      component: () => import('@/views/clinic/PostConsultView.vue'),
      meta: { requiresAuth: true, role: 'clinic' },
    },
    {
      path: '/clinic/medical-status',
      name: 'MedicalStatus',
      component: () => import('@/views/clinic/MedicalStatusView.vue'),
      meta: { requiresAuth: true, role: 'clinic' },
    },
  ],
})

// router guard to handle unverified users
router.beforeEach((to, from) => {
  const authStore = useAuthStore()
  const isPasswordUser = authStore.user?.providerData?.every(p => p.providerId === 'password')
  const isUnverified = authStore.user && !authStore.user.emailVerified && isPasswordUser

  const isMidRegistration = !!authStore.pendingPatientData || !!authStore.pendingClinicData

  // Patient routes guard
  const isPatientRoute = to.path.startsWith('/patient/')
  const isPatientVerifyPage = to.name === 'PatientVerifyEmail'
  const isCompleteProfile = to.name === 'CompleteProfile'

  if (isPatientRoute && !isPatientVerifyPage && !isCompleteProfile && isUnverified && isMidRegistration) {
    return { name: 'PatientVerifyEmail' }
  }

  // Clinic routes guard
  const isClinicRoute = to.path.startsWith('/clinic/') && 
    !to.path.startsWith('/clinic/login') && 
    !to.path.startsWith('/clinic/register')
  const isClinicVerifyPage = to.name === 'ClinicVerifyEmail'

  if (isClinicRoute && !isClinicVerifyPage && isUnverified && isMidRegistration) {
    return { name: 'ClinicVerifyEmail' }
  }
})

export default router
