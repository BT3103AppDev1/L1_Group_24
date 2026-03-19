import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [

    // ---------------------------------------------------------------------------
    // Public
    // ---------------------------------------------------------------------------

    {
      path: '/',
      name: 'Home',
      component: () => import('@/views/patient/HomeView.vue'),
    },
    {
      path: '/clinics',
      name: 'ClinicDirectory',
      component: () => import('@/views/patient/directory/ClinicDirectoryView.vue'),
    },
    {
      path: '/clinics/:clinicId',
      name: 'ClinicDetail',
      component: () => import('@/views/patient/directory/ClinicDetailView.vue'),
    },

    // ---------------------------------------------------------------------------
    // Patient Auth
    // ---------------------------------------------------------------------------

    {
      path: '/register',
      name: 'PatientRegister',
      component: () => import('@/views/patient/auth/RegisterView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/login',
      name: 'PatientLogin',
      component: () => import('@/views/patient/auth/LoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/forgot-password',
      name: 'ForgotPassword',
      component: () => import('@/views/patient/auth/ForgotPasswordView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/reset-password',
      name: 'ResetPassword',
      component: () => import('@/views/patient/auth/ResetPasswordView.vue'),
    },

    // ---------------------------------------------------------------------------
    // Patient Specific
    // ---------------------------------------------------------------------------

    {
      path: '/patient/dashboard',
      name: 'PatientDashboard',
      component: () => import('@/views/patient/dashboard/DashboardView.vue'),
      meta: { requiresAuth: true, role: 'patient' },
    },
    {
      path: '/patient/profile',
      name: 'PatientProfile',
      component: () => import('@/views/patient/profile/ProfileView.vue'),
      meta: { requiresAuth: true, role: 'patient' },
    },
    {
      path: '/patient/queue',
      name: 'QueueTracker',
      component: () => import('@/views/patient/queue/QueueTrackerView.vue'),
      meta: { requiresAuth: true, role: 'patient' },
    },
    {
      path: '/clinics/:clinicId/join',
      name: 'JoinQueue',
      component: () => import('@/views/patient/directory/JoinQueueView.vue'),
      meta: { requiresAuth: true, role: 'patient' },
    },

    // ---------------------------------------------------------------------------
    // Clinic Auth
    // ---------------------------------------------------------------------------

    {
      path: '/clinic/register',
      name: 'ClinicRegister',
      component: () => import('@/views/clinic/auth/ClinicRegisterView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/clinic/login',
      name: 'ClinicLogin',
      component: () => import('@/views/clinic/auth/ClinicLoginView.vue'),
      meta: { guestOnly: true },
    },

    // ---------------------------------------------------------------------------
    // Clinic Specific
    // ---------------------------------------------------------------------------

    {
      path: '/clinic/setup',
      name: 'ServiceSetup',
      component: () => import('@/views/clinic/auth/ServiceSetupView.vue'),
      meta: { requiresAuth: true, role: 'clinic' },
    },
    {
      path: '/clinic/dashboard',
      name: 'ClinicDashboard',
      component: () => import('@/views/clinic/queue/QueueDashboardView.vue'),
      meta: { requiresAuth: true, role: 'clinic' },
    },
    {
      path: '/clinic/queue-list',
      name: 'QueueList',
      component: () => import('@/views/clinic/queue/QueueListView.vue'),
      meta: { requiresAuth: true, role: 'clinic' },
    },
    {
      path: '/clinic/profile',
      name: 'ClinicProfile',
      component: () => import('@/views/clinic/profile/ClinicProfileView.vue'),
      meta: { requiresAuth: true, role: 'clinic' },
    },
    {
      path: '/clinic/services',
      name: 'ManageServices',
      component: () => import('@/views/clinic/profile/ManageServicesView.vue'),
      meta: { requiresAuth: true, role: 'clinic' },
    },
  ],
})

export default router