<!--
  Patient Dashboard — shows active queue ticket (if any) and recent consultation records.
-->
<template>
  <PageLayout title="Dashboard">
    <div v-if="!authStore.initialized || queueStore.loading || !queueStore.ticketChecked" class="spinner-center">
      <AppSpinner />
    </div>

    <div v-else class="dashboard">
      <!-- Active Queue Card: displayed when the patient is currently in a queue -->
      <template v-if="queueStore.isInQueue">
        <AppCard class="queue-card">
          <div class="queue-header">
            <span class="queue-badge" :class="ticketStatusClass">{{ ticketStatusLabel }}</span>
            <span class="queue-clinic">{{ clinicName }}</span>
          </div>

          <div class="ticket-number">{{ activeTicket.ticketNumber }}</div>
          <p class="service-name">{{ serviceName }}</p>

          <div v-if="activeTicket.status === 'waiting'" class="wait-time">
            <span class="wait-time-label">Estimated wait</span>
            <span class="wait-time-value">
              {{ estimatedWaitLabel }}
            </span>
          </div>

          <AlertBanner v-if="activeTicket.status === 'serving'" type="info"
            message="It's your turn! Please proceed to the counter." />
          <AlertBanner v-if="activeTicket.status === 'completed'" type="success"
            message="Consultation done. Please proceed to payment." />

          <div class="queue-actions">
            <AppButton v-if="activeTicket.status === 'waiting'" variant="danger" block @click="leaveQueue">Leave Queue</AppButton>
            <AppButton v-if="activeTicket.status === 'completed'" variant="primary" block @click="goToRecords">View Records</AppButton>
          </div>
        </AppCard>
      </template>

      <!-- No Queue State: shown when the patient is not in any queue -->
      <template v-else>
        <AppCard class="no-queue-card">
          <AppEmptyState icon="🏥" title="Not in any queue"
            description="Browse nearby clinics and join a queue to get started." />
          <AppButton variant="primary" block @click="$router.push('/clinics')">
            Find a Clinic
          </AppButton>
        </AppCard>
      </template>

      <!-- Recent Records: lists the patient's past consultations (mock data for now) -->
      <section class="section">
        <h3 class="section-title">Recent Consultations</h3>
        <AppSpinner v-if="loadingRecords" />
        <template v-else-if="recentRecords.length">
          <RecordCard v-for="rec in recentRecords" :key="rec.id" :record="rec" />
        </template>
        <AppEmptyState v-else icon="📋" title="No records yet"
          description="Your consultation history will appear here." />
      </section>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQueueStore } from '@/stores/useQueueStore.js'
import { useAuthStore } from '@/stores/useAuthStore.js'
import { getPatientConsultations } from '@/firebase/firestore.js'
import PageLayout from '@/components/layout/PageLayout.vue'
import AppCard from '@/components/base/AppCard.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppSpinner from '@/components/base/AppSpinner.vue'
import AppEmptyState from '@/components/base/AppEmptyState.vue'
import AlertBanner from '@/components/shared/AlertBanner.vue'
import RecordCard from '@/components/patient/RecordCard.vue'

const router = useRouter()
const queueStore = useQueueStore()
const authStore = useAuthStore()

const loadingRecords = ref(false)  // spinner toggle for records section
const recentRecords = ref([])     // list of recent consultation records

// Derived ticket data from the queue store
const activeTicket = computed(() => queueStore.activeTicket)
const clinicName = computed(() => activeTicket.value?.clinicName || '')
const serviceName = computed(() => activeTicket.value?.serviceName || '')

// Live estimated wait time label shown while the patient is waiting
const estimatedWaitLabel = computed(() => {
  const mins = queueStore.liveEstimatedWaitMinutes
  if (mins === null) return '—'
  if (mins === 0) return 'Less than 1 min'
  if (mins < 60) return `~${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `~${h}h ${m}min` : `~${h}h`
})

// Maps ticket status to CSS class for badge styling
const ticketStatusClass = computed(() => ({
  'badge-waiting': activeTicket.value?.status === 'waiting',
  'badge-serving': activeTicket.value?.status === 'serving',
  'badge-completed': activeTicket.value?.status === 'completed',
  'badge-no-show': activeTicket.value?.status === 'no-show',
}))

// Maps ticket status to display text
const ticketStatusLabel = computed(() => {
  const map = { waiting: 'Waiting', serving: 'Serving', completed: 'Completed', 'no-show': 'No Show' }
  return map[activeTicket.value?.status] || ''
})

async function leaveQueue() {
  await queueStore.leaveQueue()
}

function goToRecords() {
  router.push('/patient/records')
}

async function loadRecords() {
  if (!authStore.patientId) return
  loadingRecords.value = true
  try {
    const records = await getPatientConsultations(authStore.patientId)
    recentRecords.value = records
      .sort((a, b) => {
      const dateA = a.consultationDate?.toDate?.() ?? new Date(a.consultationDate)
      const dateB = b.consultationDate?.toDate?.() ?? new Date(b.consultationDate)
      return dateB - dateA
    })
      .slice(0, 3)
  } catch (e) {
    console.error('Failed to load records:', e)
  } finally {
    loadingRecords.value = false
  }
}

onMounted(async () => {
  if (!authStore.initialized) {
    await new Promise(resolve => {
      const unwatch = watch(() => authStore.initialized, (init) => {
        if (init) {
          unwatch()
          resolve()
        }
      })
    })
  }

  loadRecords()

  // Reload records dynamically if active ticket status changes to 'completed'
  watch(() => queueStore.activeTicket?.status, (newStatus) => {
    if (newStatus === 'completed') {
      loadRecords()
    }
  })
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.spinner-center {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
}

.queue-card {
  padding: 1.5rem;
}

.queue-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.queue-clinic {
  font-size: .875rem;
  color: #6b7280;
  font-weight: 500;
}

.ticket-number {
  font-size: 3.5rem;
  font-weight: 900;
  color: #1f2937;
  text-align: center;
  line-height: 1;
  margin-bottom: .25rem;
}

.service-name {
  text-align: center;
  font-size: .9rem;
  color: #6b7280;
  margin-bottom: 1.25rem;
}

.wait-time {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .2rem;
  margin-bottom: 1rem;
  padding: .6rem 1rem;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: .75rem;
}

.wait-time-label {
  font-size: .72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: #0369a1;
}

.wait-time-value {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0c4a6e;
  line-height: 1.2;
}

.queue-actions {
  margin-top: 1rem;
}

.no-queue-card {
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary-dark);
  margin: 0.5rem;
  margin-bottom: 0;
}

.badge-waiting {
  background: #fef9c3;
  color: #92400e;
}

.badge-serving {
  background: #dbeafe;
  color: #1d4ed8;
}

.badge-completed {
  background: #d1fae5;
  color: #065f46;
}

.badge-no-show {
  background: #fee2e2;
  color: #991b1b;
}

.queue-badge {
  padding: .25rem .75rem;
  border-radius: 9999px;
  font-size: .75rem;
  font-weight: 700;
  text-transform: uppercase;
}
</style>