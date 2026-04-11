import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [

    // Public views
    {
      path: '/',
      name: 'Home',
      component: () => import('@/views/HomeView.vue'), // CHANGE TO '@/views/patients/HomeView.vue' AFTER FOLDER HAS BEEN CREATED
    },
    {
      path: '/clinics',
      name: 'ClinicDirectory',
      component: () => import('@/views/ClinicDirectoryView.vue'),
    },
    {
      path: '/clinics/:clinicId',
      name: 'ClinicDetail',
      component: () => import('@/views/ClinicDetailView.vue'),
    },

    // Patient Authentication views
    {
      path: '/register',
      name: 'PatientRegister',
      component: () => import('@/views/RegisterView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/login',
      name: 'PatientLogin',
      component: () => import('@/views/LoginView.vue'),
      meta: { guestOnly: true },
     },

    // Patient Specific views
    {
      path: '/patient/dashboard',
      name: 'PatientDashboard',
      component: () => import('@/views/DashboardView.vue'),
    },
    {
      path: '/patient/profile',
      name: 'PatientProfile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true, role: 'patient' },
    },
    {
      path: '/patient/records',
      name: 'PatientRecords',
      component: () => import('@/views/RecordsView.vue'),
      meta: { requiresAuth: true, role: 'patient' },
    },

    // Clinic Authentication views
    {
      path: '/clinic/register',
      name: 'ClinicRegister',
      component: () => import('@/views/ClinicRegisterView.vue'),
      meta: { guestOnly: true },
    },
    {
       path: '/clinic/login',
       name: 'ClinicLogin',
       component: () => import('@/views/LoginView.vue'),
       meta: { guestOnly: true },
     },

    // Clinic Specific views
    {
      path: '/clinic/dashboard',
      name: 'ClinicDashboard',
      component: () => import('@/views/QueueDashboardView.vue'),
      meta: { requiresAuth: true, role: 'clinic' },
    },
    {
      path: '/clinic/analytics',
      name: 'ClinicAnalytics',
      component: () => import('@/views/ClinicAnalyticsView.vue'),
      meta: { requiresAuth: true, role: 'clinic' },
    },
    {
      path: '/clinic/profile',
      name: 'ClinicProfile',
      component: () => import('@/views/ClinicProfileView.vue'),
      meta: { requiresAuth: true, role: 'clinic' },
    },
    {
      path: '/clinic/post-consult',
      name: 'PostConsultList',
      component: () => import('@/views/PostConsultListView.vue'),
      meta: { requiresAuth: true, role: 'clinic' },
    },
    {
      path: '/clinic/post-consult/form',
      name: 'PostConsult',
      component: () => import('@/views/PostConsultView.vue'),
      meta: { requiresAuth: true, role: 'clinic' },
    },
    {
      path: '/clinic/medical-status',
      name: 'MedicalStatus',
      component: () => import('@/views/MedicalStatusView.vue'),
      meta: { requiresAuth: true, role: 'clinic' },
    },
  ],
})

export default router
