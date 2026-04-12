<template>
  <NavBar :portal="navPortal" @logout="handleLogout" />
  <router-view />
</template>

<script setup>
import NavBar from '@/components/shared/NavBar.vue'
import { computed, onMounted, watch } from 'vue'
// import { seedServices } from '@/firebase/firestore.js'
// import { runSeed } from './firebase/seed.js'
import { useAuthStore } from '@/stores/useAuthStore.js'
import { useClinicStore } from '@/stores/useClinicStore.js'
import { useQueueStore } from '@/stores/useQueueStore.js'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const clinicStore = useClinicStore()
const queueStore = useQueueStore()
const router = useRouter()

// render correct NavBar for different users
const navPortal = computed(() => {
  if (authStore.isPatient) return 'patient'
  if (authStore.isClinic) return 'clinic'
  return 'public'
})

// logout handler in NavBar
async function handleLogout() {
  await authStore.logoutUser()
  router.push('/')
}

// renders when app loads
onMounted(async () => {
  // initialise authentication
  authStore.initAuth()

  // seed medical services to populate database -> only needs to be done once
  // await seedServices()

  // seed patients and clinics to populate database -> only needs to be done once
  // await runSeed()

  // pre-load services and clinic list (public data)
  clinicStore.fetchServices()
  clinicStore.fetchAllClinics()

  // Wait for auth to finish initializing, then restore active ticket
  const stop = watch(
    () => authStore.initialized,
    async (initialized) => {
      if (!initialized) return
      stop() // only run once
      if (authStore.isPatient && authStore.patientId) {
        await queueStore.checkActiveTicket(authStore.patientId)
      }
    },
    { immediate: true }
  )
})
</script>