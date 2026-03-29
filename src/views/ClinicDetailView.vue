<template>
  <div class="clinic-detail page-container">
    <router-link to="/clinics" class="back-btn">← Back to Clinic Directory</router-link>

    <div v-if="!clinic" class="empty-state card">
      <h2>Clinic not found</h2>
      <p>Please return to the directory and choose another clinic.</p>
    </div>

    <div v-else>
      <section class="clinic-header card">
        <div>
          <h1>{{ clinic.clinicName }}</h1>
          <p class="meta">{{ clinic.district }} • {{ clinic.address }}</p>
          <p class="meta">Today: {{ formattedHours }}</p>
          <p class="meta">Contact: {{ clinic.contactNumber }}</p>
        </div>
        <AppBadge :variant="isOpen ? 'open' : 'closed'">{{ isOpen ? 'Open' : 'Closed' }}</AppBadge>
      </section>

      <section class="services-section card">
        <h2>Services</h2>
        <p v-if="clinic.services.length === 0" class="no-services">No services available.</p>
        <ul>
          <li v-for="serviceId in clinic.services" :key="serviceId" class="service-item">
            <div>
              <strong>{{ serviceName(serviceId) }}</strong>
              <span class="service-time"
                >~{{
                  clinic.waitByService?.[serviceId] || clinic.averageWaitTime
                }}
                min/patient</span
              >
            </div>
            <span class="status">{{ isOpen ? 'Waiting' : 'Closed' }}</span>
          </li>
        </ul>
      </section>

      <div class="queue-cta card">
        <p v-if="!isOpen" class="status-note">⚠️ This clinic is currently closed.</p>
        <button class="btn btn-primary" :disabled="!isOpen" @click="joinQueue">
          Join Queue — {{ isOpen ? 'Now' : 'Unavailable' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppBadge from '@/components/base/AppBadge.vue'
import { getClinic, getAllServices, subscribeToClinicQueues } from '@/firebase/firestore'

const route = useRoute()
const router = useRouter()

const clinicId = computed(() => route.params.clinicId)
const servicesData = ref([])
const clinicRef = ref(null)
const waitByService = ref({})
let queuesUnsubscribe = null

onMounted(async () => {
  try {
    servicesData.value = await getAllServices()
    const fetchedClinic = await getClinic(clinicId.value)
    if (fetchedClinic) {
      // Provide a default empty services array if missing
      clinicRef.value = { ...fetchedClinic, services: fetchedClinic.services || [] }
    }
  } catch (err) {
    console.error('Error fetching clinic data:', err)
  }

  queuesUnsubscribe = subscribeToClinicQueues(clinicId.value, (queues) => {
    const waits = {}
    queues.forEach((q) => {
      const duration = q.avgDuration || 15
      waits[q.serviceId] = (q.activeCount || 0) * duration
    })
    waitByService.value = waits
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
  if (!clinic.value?.operatingHours) return 'N/A'
  const day = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()]
  const range = clinic.value.operatingHours[day]
  return range?.open ? `${range.start} - ${range.end}` : 'Closed today'
})

const isOpen = computed(() => {
  const hrs = clinic.value?.operatingHours
  if (!hrs) return false

  const day = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()]
  const today = hrs[day]
  if (!today?.open) return false

  const toMinutes = (t) => {
    const [h, m] = (t || '00:00').split(':').map(Number)
    return h * 60 + (m || 0)
  }

  const now = new Date()
  const current = now.getHours() * 60 + now.getMinutes()
  return current >= toMinutes(today.start) && current < toMinutes(today.end)
})

function joinQueue() {
  if (!clinic.value || !isOpen.value) return
  alert(`You joined queue for ${clinic.value.clinicName}.`)
  router.push('/clinics')
}
</script>

<style scoped>
.page-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 1rem;
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
  border-radius: 1rem;
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
}
.clinic-header h1 {
  margin: 0;
  font-size: 2rem;
  color: #1d4ed8;
}
.meta {
  color: #64748b;
  margin: 0.3rem 0;
}
.services-section h2 {
  margin: 0 0 0.7rem;
  color: #1e3a8a;
}
.service-item {
  padding: 0.8rem 1rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 0.85rem;
  border: 1px solid #dbeafe;
  background: #eef6ff;
}
.service-item strong {
  color: #1d4ed8;
}
.service-time {
  margin-left: 0.5rem;
  color: #475569;
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
  margin-top: 0.5rem;
}
.status-note {
  margin: 0 0 0.75rem;
  color: #b45309;
  background-color: #fffbeb;
  padding: 0.75rem;
  border-radius: 0.75rem;
}
.btn {
  border: 0;
  border-radius: 0.75rem;
  padding: 0.8rem 1.2rem;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
}
.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: white;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.empty-state {
  text-align: center;
}
</style>
