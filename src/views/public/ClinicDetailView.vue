<template>
  <div class="clinic-detail page-container">
    <router-link to="/clinics" class="back-btn">← Back to Clinic Directory</router-link>

    <div v-if="pageLoading" class="spinner-center">
      <AppSpinner />
    </div>

    <div v-else-if="!clinic" class="empty-state card">
      <h2>Clinic not found</h2>
      <p>Please return to the directory and choose another clinic.</p>
    </div>

    <div v-else>
      <!-- Clinic Header -->
      <section class="clinic-header card">
        <div>
          <h1>{{ clinic.clinicName }}</h1>
          <p class="meta">{{ clinic.district }} • {{ clinic.address }}</p>
          <p class="meta">Today: {{ formattedHours }}</p>
          <p class="meta">Contact: {{ clinic.contactNumber }}</p>
        </div>
        <AppBadge :variant="isOpen ? 'open' : 'closed'">{{ isOpen ? 'Open' : 'Closed' }}</AppBadge>
      </section>

      <!-- Services List — click a service to select it -->
      <section class="services-section card">
        <h2>Services</h2>
        <p v-if="clinic.services.length === 0" class="no-services">No services available.</p>
        <ul v-else>
          <li v-for="svcId in clinic.services" :key="svcId" class="service-item"
            :class="{ selected: selectedServiceId === svcId }" @click="selectedServiceId = svcId">
            <div class="service-info">
              <strong>{{ serviceName(svcId) }}</strong>
              <span class="service-time">
                Est. wait: ~{{ waitByService[svcId] ?? 0 }} min
                · {{ queueCountByService[svcId] ?? 0 }} waiting
              </span>
            </div>
            <span v-if="selectedServiceId === svcId" class="selected-tick">✓</span>
            <span v-else class="status">{{ isOpen ? 'Open' : 'Closed' }}</span>
          </li>
        </ul>
      </section>

      <!-- Join Queue CTA -->
      <div class="queue-cta card">
        <p v-if="!isOpen" class="status-note">⚠️ This clinic is currently closed.</p>

        <p v-if="isOpen && !selectedServiceId" class="hint-note">
          👆 Select a service above, then click Join Queue.
        </p>

        <p v-if="selectedServiceId" class="selected-note">
          Joining: <strong>{{ serviceName(selectedServiceId) }}</strong>
        </p>

        <AlertBanner v-if="joinError" type="error" :message="joinError" dismissible @dismiss="joinError = ''" />

        <button class="btn btn-primary" :disabled="!isOpen || !selectedServiceId || joining" @click="handleJoinQueue">
          <span v-if="joining">Joining…</span>
          <span v-else-if="!isOpen">Clinic Closed</span>
          <span v-else-if="!selectedServiceId">Select a Service First</span>
          <span v-else>Join Queue Now</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppBadge from '@/components/base/AppBadge.vue'
import AppSpinner from '@/components/base/AppSpinner.vue'
import AlertBanner from '@/components/shared/AlertBanner.vue'
import { getClinic, getAllServices, subscribeToClinicQueues } from '@/firebase/firestore'
import { useQueueStore } from '@/stores/useQueueStore.js'
import { useAuthStore } from '@/stores/useAuthStore.js'

const route = useRoute()
const router = useRouter()
const queueStore = useQueueStore()
const authStore = useAuthStore()

const clinicId = computed(() => route.params.clinicId)
const servicesData = ref([])
const clinicRef = ref(null)
const waitByService = ref({})
const queueCountByService = ref({})
const pageLoading = ref(true)
const selectedServiceId = ref('')
const joining = ref(false)
const joinError = ref('')
let queuesUnsubscribe = null

onMounted(async () => {
  try {
    servicesData.value = await getAllServices()
    const fetchedClinic = await getClinic(clinicId.value)
    if (fetchedClinic) {
      clinicRef.value = { ...fetchedClinic, services: fetchedClinic.services || [] }
    }
  } catch (err) {
    console.error('Error fetching clinic data:', err)
  } finally {
    pageLoading.value = false
  }

  // Real-time listener for queue counts and wait times per service
  queuesUnsubscribe = subscribeToClinicQueues(clinicId.value, (queues) => {
    const waits = {}
    const counts = {}
    queues.forEach((q) => {
      const duration = q.avgDuration || 15
      const count = q.activeCount || 0
      waits[q.serviceId] = count * duration
      counts[q.serviceId] = count
    })
    waitByService.value = waits
    queueCountByService.value = counts
  })
})

onUnmounted(() => {
  if (queuesUnsubscribe) queuesUnsubscribe()
})

const clinic = computed(() => {
  if (!clinicRef.value) return null
  return {
    ...clinicRef.value,
    waitByService: waitByService.value,
    averageWaitTime: clinicRef.value.averageWaitTime || 15,
  }
})

function serviceName(id) {
  return servicesData.value.find((s) => s.id === id)?.name || id
}

const formattedHours = computed(() => {
  // If clinic manually opened, show that instead of schedule
  if (clinic.value?.isOpen) return 'Currently Open'
  if (!clinic.value?.operatingHours) return 'N/A'
  const day = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()]
  const range = clinic.value.operatingHours[day]
  return range?.open ? `${range.start} - ${range.end}` : 'Closed today'
})

const isOpen = computed(() => {
  // Manual override from Firestore takes precedence over time-based schedule
  if (clinic.value?.isOpen !== undefined) return clinic.value.isOpen

  const hrs = clinic.value?.operatingHours
  if (!hrs) return false
  const day = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()]
  const today = hrs[day]
  if (!today?.open) return false
  const toMin = (t) => {
    const [h, m] = (t || '00:00').split(':').map(Number)
    return h * 60 + (m || 0)
  }
  const now = new Date()
  const cur = now.getHours() * 60 + now.getMinutes()
  return cur >= toMin(today.start) && cur < toMin(today.end)
})

async function handleJoinQueue() {
  if (!clinic.value || !isOpen.value || !selectedServiceId.value) return

  // prevent joining if already in a queue
  if (queueStore.activeTicket && ['waiting', 'serving'].includes(queueStore.activeTicket.status)) {
    alert('You are already in a queue. Please leave your current queue first.')
    return
  }

  // If not logged in as a patient, redirect to login
  if (!authStore.isPatient || !authStore.patientId) {
    router.push('/login')
    return
  }

  joining.value = true
  joinError.value = ''

  try {
    await queueStore.joinQueue({
      patientId: authStore.patientId,
      patientName: authStore.patient?.fullName || 'Patient',
      clinicId: clinic.value.id,
      clinicName: clinic.value.clinicName,
      serviceId: selectedServiceId.value,
      serviceName: serviceName(selectedServiceId.value),
    })
    // Redirect to patient dashboard to see live ticket
    router.push('/patient/dashboard')
  } catch (err) {
    console.error('Failed to join queue:', err)
    joinError.value = 'Failed to join the queue. Please try again.'
  } finally {
    joining.value = false
  }
}
</script>

<style scoped>
.page-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 1rem;
}

.spinner-center {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
}

.back-btn {
  display: inline-block;
  margin-bottom: 1rem;
  color: #1d4ed8;
  font-weight: 700;
  text-decoration: none;
}

.card {
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid #dbeafe;
  box-shadow: 0 10px 22px rgba(59, 130, 246, 0.08);
  padding: 1.2rem;
  margin-bottom: 1rem;
}

.clinic-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.75rem;
}

.clinic-header h1 {
  margin: 0;
  font-size: 2rem;
  color: var(--color-primary-dark);
}

.meta {
  color: #64748b;
  margin: 0.3rem 0;
}

.services-section {
  padding: 1.75rem;
}

.services-section h2 {
  font-size: 1.25rem; 
  font-weight: 700; 
  margin: 0 0 0.85rem;
  color: #1e3a8a;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.service-item {
  padding: 0.85rem 1rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 0.85rem;
  border: 2px solid #dbeafe;
  background: #eef6ff;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.service-item:hover {
  border-color: #93c5fd;
}

.service-item.selected {
  border-color: #3b82f6;
  background: #eff6ff;
}

.service-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.1rem;
}

.service-info strong {
  color: #1d4ed8;
}

.service-time {
  font-size: 0.82rem;
  color: #475569;
}

.selected-tick {
  font-size: 1.1rem;
  font-weight: 900;
  color: #16a34a;
}

.status {
  font-weight: 700;
  color: #2563eb;
}

.no-services {
  color: #475569;
  margin: 0;
}

.queue-cta {
  text-align: center;
  padding: 1.75rem;
}

.status-note {
  margin: 0 0 0.75rem;
  color: #b45309;
  background: #fffbeb;
  padding: 0.75rem;
  border-radius: 0.75rem;
}

.hint-note {
  margin: 0 0 0.75rem;
  color: #1d4ed8;
  background: #eff6ff;
  padding: 0.75rem;
  border-radius: 0.75rem;
}

.selected-note {
  margin: 0 0 0.75rem;
  color: #1e3a8a;
  font-size: 0.95rem;
}

.btn {
  width: 100%;
  border: 0;
  border-radius: 0.75rem;
  padding: 0.9rem 1.2rem;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: white;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-state {
  text-align: center;
}
</style>
