<template>
  <DashboardLayout title="Clinic Analytics">
    <!-- Full-page loading state while auth and analytics data initialise -->
    <div v-if="loading" class="state-shell">
      <AppSpinner size="lg" />
    </div>

    <template v-else>
      <AlertBanner
        v-if="loadError"
        type="error"
        :message="loadError"
        dismissible
        @dismiss="loadError = ''"
      />

      <!-- TOP SECTION: DAILY ANALYTICS -->
      <div class="section">
        <div class="analytics-header">
          <h2 class="section-title">Daily Analytics <span class="badge-today">Today</span></h2>
          <p class="section-desc">Real-time overview of today's queue activity.</p>
        </div>

        <section class="stats-grid mb-8">
          <AppCard class="metric-card" flat>
            <p class="metric-label">Queue Joins</p>
            <p class="metric-value">{{ todayJoins }}</p>
            <p class="metric-meta">Total number of patients that joined</p>
          </AppCard>

          <AppCard class="metric-card" flat>
            <p class="metric-label">Average Wait Time</p>
            <p class="metric-value">{{ Math.round(averageWaitTodayMinutes) }}</p>
            <p class="metric-meta">minutes per patient</p>
          </AppCard>

          <AppCard class="metric-card" flat>
            <p class="metric-label">Peak Hour</p>
            <p class="metric-value text-md">{{ todayPeakHourLabel }}</p>
            <p class="metric-meta">{{ todayPeakHourObj ? `${todayPeakHourObj.count} patient(s) joined at this hour` : 'No activity yet' }}</p>
          </AppCard>
        </section>

        <AppCard class="metric-card" flat>
          <p class="metric-label">Peak Hour</p>
          <p class="metric-value text-md">{{ todayPeakHourLabel }}</p>
          <p class="metric-meta">Highest queue volume</p>
        </AppCard>
      </section>

      <section class="small-metrics-grid mb-8">
        <AppCard class="metric-card small-metric-card completed-tint" flat>
          <p class="metric-label">Completed</p>
          <p class="metric-value">{{ todayCompleted }}</p>
          <p class="metric-meta">Completed consultations today</p>
        </AppCard>
        <AppCard class="metric-card small-metric-card no-show-tint" flat>
          <p class="metric-label">No Shows</p>
          <p class="metric-value">{{ todayNoShow }}</p>
          <p class="metric-meta">No shows today</p>
        </AppCard>
        <AppCard class="metric-card small-metric-card cancelled-tint" flat>
          <p class="metric-label">Cancellations</p>
          <p class="metric-value">{{ todayCancelled }}</p>
          <p class="metric-meta">Cancellations today</p>
        </AppCard>
      </section>

        <AppCard class="chart-card mb-12">
          <div class="chart-header">
            <div>
              <h3 class="chart-title">Queue Volume by Hour</h3>
              <p class="chart-copy">Real-time hourly arrivals based on opening hours.</p>
            </div>
          </div>
          <div class="chart-shell">
            <Line
              v-if="todayJoins > 0"
              :data="todayLineChartData"
              :options="lineChartOptions"
              class="chart-canvas"
            />
            <AppEmptyState
              v-else
              icon="🕒"
              title="No activity yet"
              description="Hourly queue volume will appear here as patients join."
              class="chart-empty"
            />
          </div>
        </AppCard>
      </div>

      <!-- BOTTOM SECTION: PAST ANALYTICS -->
      <div class="section">
        <div class="analytics-header split-header">
          <div>
            <h2 class="section-title">Past Analytics</h2>
            <p class="section-desc">Historical queue trends and service breakdowns.</p>
          </div>
          <div class="analytics-controls">
            <div class="toggle-group">
              <button
                class="toggle-btn"
                :class="{ active: pastMode === 'week' }"
                @click="pastMode = 'week'"
              >
                Past Week
              </button>
              <button
                class="toggle-btn"
                :class="{ active: pastMode === 'month' }"
                @click="pastMode = 'month'"
              >
                Monthly
              </button>
            </div>
            <select
              v-model="selectedMonth"
              class="app-select"
              :class="{ 'hidden-select': pastMode !== 'month' }"
            >
              <option v-for="month in availableMonths" :key="month.value" :value="month.value">
                {{ month.label }}
              </option>
            </select>
          </div>
        </div>

        <div v-if="loadingPast" class="state-shell min-h-[300px]">
          <AppSpinner />
        </div>
        <template v-else>
          <!-- Past Stats Cards -->
          <section class="stats-grid mb-8">
            <AppCard class="metric-card green-tint" flat>
              <p class="metric-label">Average Joins</p>
              <p class="metric-value">{{ pastAverageJoins }}</p>
              <p class="metric-meta">per day</p>
            </AppCard>

            <AppCard class="metric-card green-tint" flat>
              <p class="metric-label">Average Wait Time</p>
              <p class="metric-value">{{ pastAverageWaitTime }}</p>
              <p class="metric-meta">minutes per patient</p>
            </AppCard>

            <AppCard class="metric-card green-tint" flat>
              <p class="metric-label">Peak Hour</p>
              <p class="metric-value text-md">{{ pastPeakHourLabel }}</p>
              <p class="metric-meta">{{ pastPeakHourMeta }}</p>
            </AppCard>
          </section>

        <section class="small-metrics-grid mb-8">
          <AppCard class="metric-card small-metric-card completed-tint" flat>
            <p class="metric-label">Avg Completed</p>
            <p class="metric-value">{{ pastAverageCompleted }}</p>
            <p class="metric-meta">Completed per day</p>
          </AppCard>
          <AppCard class="metric-card small-metric-card no-show-tint" flat>
            <p class="metric-label">Avg No Shows</p>
            <p class="metric-value">{{ pastAverageNoShow }}</p>
            <p class="metric-meta">No shows per day</p>
          </AppCard>
          <AppCard class="metric-card small-metric-card cancelled-tint" flat>
            <p class="metric-label">Avg Cancellations</p>
            <p class="metric-value">{{ pastAverageCancelled }}</p>
            <p class="metric-meta">Cancellations per day</p>
          </AppCard>
        </section>

          <AppCard v-if="pastTickets.length === 0" class="chart-card">
            <AppEmptyState
              icon="📅"
              title="No data found"
              description="There is no queue history for this selected period."
            />
          </AppCard>

          <div v-else class="charts-grid mb-12">
            <!-- Past Line Chart -->
            <AppCard class="chart-card">
              <div class="chart-header">
                <div>
                  <h3 class="chart-title">Avg Daily Volume by Hours</h3>
                  <p class="chart-copy">When patients arrived during the day.</p>
                </div>
              </div>
              <div class="chart-shell">
                <Line
                  :data="pastLineChartData"
                  :options="lineChartOptionsGreen"
                  class="chart-canvas"
                />
              </div>
            </AppCard>

            <!-- Service Proportion Pie Chart -->
            <AppCard class="chart-card">
              <div class="chart-header">
                <div>
                  <h3 class="chart-title">Service Proportion</h3>
                  <p class="chart-copy">Breakdown of services joined.</p>
                </div>
              </div>
              <div class="chart-shell pie-shell">
                <Pie
                  :data="pastPieChartData"
                  :options="pieChartOptions"
                  class="chart-canvas pie-canvas"
                />
              </div>
            </AppCard>
          </div>
        </template>
      </div>
    </template>
  </DashboardLayout>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import AppCard from '@/components/base/AppCard.vue'
import AppSpinner from '@/components/base/AppSpinner.vue'
import AppEmptyState from '@/components/base/AppEmptyState.vue'
import AlertBanner from '@/components/shared/AlertBanner.vue'
import {
  subscribeToClinicDailyQueueHistory,
  subscribeToClinicHourlyQueueVolume,
  subscribeToClinicOutcomeCounts,
  getPastAnalyticsTickets,
} from '@/firebase/firestore.js'
import { useAuthStore } from '@/stores/useAuthStore.js'

// Import Chart.js logic
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js'
import { Pie, Line } from 'vue-chartjs'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
)

const router = useRouter()
const authStore = useAuthStore()

// Root state
const loading = ref(true)
const loadError = ref('')
let unsubscribeHistory = null
let unsubscribeHourlyHistory = null
let unsubscribeOutcomeTotals = null

// Real-time (Today) state
const history = ref([])
const averageWaitTodayMinutes = ref(0)
const hourlyHistory = ref([])
const dailyOutcomeTotals = ref({ completed: 0, noShow: 0, cancelled: 0, combined: 0 })

// Past Analytics state
const pastMode = ref('week')
const selectedMonth = ref('')
const availableMonths = ref([])
const loadingPast = ref(false)
const pastTickets = ref([])

// Generate month options
function initMonths() {
  const now = new Date()
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const lbl = new Intl.DateTimeFormat('en-SG', { month: 'long', year: 'numeric' }).format(d)
    availableMonths.value.push({ value: val, label: lbl })
  }
  selectedMonth.value = availableMonths.value[0].value
}

// Formatters
function formatHourLabel(hour) {
  const normalized = ((hour + 11) % 12) + 1
  const suffix = hour >= 12 ? 'PM' : 'AM'
  return `${normalized} ${suffix}`
}

function parseTimeToMinutes(value) {
  const [hours, minutes] = (value || '00:00').split(':').map(Number)
  return hours * 60 + (minutes || 0)
}

function isUsableHours(entry) {
  return (
    !!entry?.start &&
    !!entry?.end &&
    parseTimeToMinutes(entry.end) > parseTimeToMinutes(entry.start)
  )
}

// Clinic Hours Fallback checking
const clinicOperatingHours = computed(() => authStore.clinic?.operatingHours || {})
const clinicOpeningHours = computed(() => authStore.clinic?.openingHours || {})

const fallbackClinicHours = computed(() => {
  const openingMatch = Object.values(clinicOpeningHours.value).find((entry) => isUsableHours(entry))
  if (openingMatch) return openingMatch
  const operatingMatch = Object.values(clinicOperatingHours.value).find((entry) =>
    isUsableHours(entry),
  )
  return operatingMatch || null
})

// === DAILY ANALYTICS (TODAY) ===
const todayJoins = computed(() => {
  if (!history.value.length) return 0
  return history.value[history.value.length - 1]?.count || 0
})

const todayHourlyActivity = computed(() => {
  if (!hourlyHistory.value.length) return null
  return hourlyHistory.value[hourlyHistory.value.length - 1]
})

const todayPeakHourObj = computed(() => {
  const todayRecord = todayHourlyActivity.value
  if (!todayRecord || !todayRecord.hourlyCounts) return null

  let max = -1
  let peak = null
  todayRecord.hourlyCounts.forEach((hc) => {
    if (hc.count > max) {
      max = hc.count
      peak = hc
    }
  })
  return peak?.count > 0 ? peak : null
})

const todayPeakHourLabel = computed(() => {
  const peak = todayPeakHourObj.value
  if (!peak) return '--'
  return formatHourLabel(peak.hour)
})

const todayCompleted = computed(() => dailyOutcomeTotals.value.completed)
const todayNoShow = computed(() => dailyOutcomeTotals.value.noShow)
const todayCancelled = computed(() => dailyOutcomeTotals.value.cancelled)

const pastAverageCompleted = computed(() => {
  if (!pastTickets.value.length) return 0
  const total = pastTickets.value.filter((t) => t.status === 'completed').length
  return pastPeriodDays.value ? (total / pastPeriodDays.value).toFixed(1) : 0
})

const pastAverageNoShow = computed(() => {
  if (!pastTickets.value.length) return 0
  const total = pastTickets.value.filter((t) => t.status === 'no-show').length
  return pastPeriodDays.value ? (total / pastPeriodDays.value).toFixed(1) : 0
})

const pastAverageCancelled = computed(() => {
  if (!pastTickets.value.length) return 0
  const total = pastTickets.value.filter((t) => t.status === 'cancelled').length
  return pastPeriodDays.value ? (total / pastPeriodDays.value).toFixed(1) : 0
})

const todayLineChartData = computed(() => {
  const counts = todayHourlyActivity.value?.hourlyCounts || []
  let startHour = 8
  let endHour = 20

  const fallback = fallbackClinicHours.value
  if (fallback && isUsableHours(fallback)) {
    startHour = Math.floor(parseTimeToMinutes(fallback.start) / 60)
    startHour = Math.max(0, startHour - 1) // pad open hour start
    endHour = Math.ceil(parseTimeToMinutes(fallback.end) / 60)
  }

  const filtered = counts.filter((c) => c.hour >= startHour && c.hour <= endHour)

  return {
    labels: filtered.map((c) => formatHourLabel(c.hour)),
    datasets: [
      {
        label: 'Joins',
        data: filtered.map((c) => c.count),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  }
})

// === PAST ANALYTICS ===

// Fetch past data whenever mode or month changes
async function fetchPastAnalytics() {
  if (!authStore.clinicId) return
  loadingPast.value = true

  try {
    let start, end
    const now = new Date()

    if (pastMode.value === 'week') {
      start = new Date(now)
      start.setDate(now.getDate() - 7)
      start.setHours(0, 0, 0, 0)
      end = new Date(now)
      end.setHours(23, 59, 59, 999)
    } else {
      const [y, m] = selectedMonth.value.split('-').map(Number)
      start = new Date(y, m - 1, 1, 0, 0, 0, 0)
      end = new Date(y, m, 0, 23, 59, 59, 999)
    }

    pastTickets.value = await getPastAnalyticsTickets(authStore.clinicId, start, end)
  } catch (err) {
    console.error('Failed to load past analytics:', err)
  } finally {
    loadingPast.value = false
  }
}

watch([pastMode, selectedMonth], fetchPastAnalytics)

const pastPeriodDays = computed(() => {
  if (pastMode.value === 'week') return 7
  const [y, m] = selectedMonth.value.split('-').map(Number)
  return new Date(y, m, 0).getDate()
})

const pastAverageJoins = computed(() => {
  if (!pastTickets.value.length) return 0
  return (pastTickets.value.length / pastPeriodDays.value).toFixed(1)
})

const pastAverageWaitTime = computed(() => {
  if (!pastTickets.value.length) return 0
  let totalWait = 0
  let waitCount = 0
  pastTickets.value.forEach((t) => {
    if (typeof t.estimatedWaitTime === 'number') {
      totalWait += t.estimatedWaitTime
      waitCount++
    }
  })
  return waitCount > 0 ? Math.round(totalWait / waitCount) : 0
})

const pastHourlyData = computed(() => {
  const hourly = Array.from({ length: 24 }, () => 0)
  pastTickets.value.forEach((t) => {
    const d = t.joinedAt?.toDate?.()
    if (d) {
      hourly[d.getHours()] += 1
    }
  })
  return hourly
})

const pastPeakHourLabel = computed(() => {
  let max = -1
  let peakHour = -1
  pastHourlyData.value.forEach((count, i) => {
    if (count > max) {
      max = count
      peakHour = i
    }
  })
  if (max === 0) return '--'
  return formatHourLabel(peakHour)
})

const pastPeakHourMeta = computed(() => {
  let max = -1
  pastHourlyData.value.forEach((count) => {
    if (count > max) max = count
  })
  if (max === 0) return 'No data for this period'
  return `${(max / pastPeriodDays.value).toFixed(1)} patients per day at this hour`
})

const pastLineChartData = computed(() => {
  let startHour = 8
  let endHour = 20

  const fallback = fallbackClinicHours.value
  if (fallback && isUsableHours(fallback)) {
    startHour = Math.floor(parseTimeToMinutes(fallback.start) / 60)
    startHour = Math.max(0, startHour - 1)
    endHour = Math.ceil(parseTimeToMinutes(fallback.end) / 60)
  }

  const labels = []
  const data = []
  for (let i = startHour; i <= endHour; i++) {
    labels.push(formatHourLabel(i))
    data.push(pastHourlyData.value[i] / pastPeriodDays.value)
  }

  return {
    labels,
    datasets: [
      {
        label: 'Avg Joins',
        data,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  }
})

const pastPieChartData = computed(() => {
  const serviceCounts = {}
  pastTickets.value.forEach((t) => {
    const sn = t.serviceName || 'Other'
    serviceCounts[sn] = (serviceCounts[sn] || 0) + 1
  })

  const labels = Object.keys(serviceCounts)
  const data = Object.values(serviceCounts)

  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor: [
          '#3b82f6',
          '#10b981',
          '#f59e0b',
          '#ec4899',
          '#8b5cf6',
          '#ef4444',
          '#06b6d4',
          '#14b8a6',
          '#6366f1',
        ],
        borderWidth: 1,
        borderColor: '#fff',
      },
    ],
  }
})

// === CHART OPTIONS ===
const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => {
          let y = context.parsed.y
          if (y % 1 !== 0) y = y.toFixed(1)
          return ` ${y} joins`
        },
      },
    },
  },
  scales: {
    y: { beginAtZero: true, border: { dash: [4, 4] } },
    x: { grid: { display: false } },
  },
}

const lineChartOptionsGreen = {
  ...lineChartOptions,
  // custom overrides if necessary
}

const pieChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
      labels: { boxWidth: 14, font: { size: 12 } },
    },
  },
}

// === LIFECYCLE ===
function beginSubscriptions() {
  if (!authStore.clinicId) return

  let handledHistory = false

  unsubscribeHistory = subscribeToClinicDailyQueueHistory(
    authStore.clinicId,
    (res) => {
      history.value = res.history
      averageWaitTodayMinutes.value = res.averageWaitToday
      if (!handledHistory) {
        loading.value = false
        handledHistory = true
      }
    },
    () => {
      loadError.value = 'Failed to load daily analytics.'
      loading.value = false
    },
  )

  unsubscribeHourlyHistory = subscribeToClinicHourlyQueueVolume(
    authStore.clinicId,
    (series) => {
      hourlyHistory.value = series
    },
    () => {}, // error handled above
  )

  unsubscribeOutcomeTotals = subscribeToClinicOutcomeCounts(
    authStore.clinicId,
    (totals) => {
      dailyOutcomeTotals.value = totals
    },
    () => {},
  )
}

onMounted(async () => {
  initMonths()

  if (!authStore.initialized) {
    await new Promise((resolve) => {
      const stop = watch(
        () => authStore.initialized,
        (ready) => {
          if (ready) {
            stop()
            resolve()
          }
        },
      )
    })
  }

  if (!authStore.isClinic || !authStore.clinicId) {
    loading.value = false
    router.push('/clinic/login')
    return
  }

  beginSubscriptions()
  fetchPastAnalytics()
})

onUnmounted(() => {
  if (unsubscribeHistory) unsubscribeHistory()
  if (unsubscribeHourlyHistory) unsubscribeHourlyHistory()
  if (unsubscribeOutcomeTotals) unsubscribeOutcomeTotals()
})
</script>

<style scoped>
.section {
  padding: 0.5rem 1rem;
}

.state-shell {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem 0;
}
.min-h-\[300px\] {
  min-height: 300px;
}

.mb-4 {
  margin-bottom: 1rem;
}
.mb-6 {
  margin-bottom: 1.5rem;
}
.mb-8 {
  margin-bottom: 2rem;
}
.mb-10 {
  margin-bottom: 2.5rem;
}
.mb-12 {
  margin-bottom: 0.5rem;
}
.ml-4 {
  margin-left: 1rem;
}

.analytics-header {
  margin-bottom: 1.5rem;
}

.split-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
}

.analytics-controls {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.hidden-select {
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
}

.section-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-desc {
  margin: 0.25rem 0 0 0;
  color: #64748b;
  font-size: 1rem;
}

.badge-today {
  font-size: 0.75rem;
  background: #dbeafe;
  color: #1d4ed8;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.toggle-group {
  display: flex;
  background: #f1f5f9;
  border-radius: 0.5rem;
  padding: 0.25rem;
}

.toggle-btn {
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  color: #64748b;
  font-weight: 600;
  font-size: 0.85rem;
  border-radius: 0.35rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  color: #334155;
}

.toggle-btn.active {
  background: white;
  color: #0f172a;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.app-select {
  padding: 0.5rem 2rem 0.5rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  background-color: white;
  color: #334155;
  font-weight: 600;
  font-size: 0.85rem;
  outline: none;
  cursor: pointer;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}

.metric-card {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1.5rem 1.75rem;
}

.metric-card.small-metric-card {
  padding: 1rem;
}

.small-metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(140px, 1fr));
  gap: 1rem;
}

.metric-card.small-metric-card .metric-label {
  font-size: 0.75rem;
}

.metric-card.small-metric-card .metric-value {
  font-size: 2rem;
}

.metric-card.small-metric-card .metric-meta {
  font-size: 0.8rem;
}

.metric-card.small-metric-card {
  padding: 1rem;
}

.small-metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(140px, 1fr));
  gap: 1rem;
}

.metric-card.small-metric-card .metric-label {
  font-size: 0.75rem;
}

.metric-card.small-metric-card .metric-value {
  font-size: 2rem;
}

.metric-card.small-metric-card .metric-meta {
  font-size: 0.8rem;
}

.metric-card.green-tint .metric-value {
  color: #10b981;
}

.metric-card.completed-tint {
  background-color: rgba(16, 185, 129, 0.08);
}

.metric-card.completed-tint .metric-value {
  color: #10b981;
}

.metric-card.no-show-tint {
  background-color: rgba(239, 68, 68, 0.08);
}

.metric-card.no-show-tint .metric-value {
  color: #b91c1c;
}

.metric-card.cancelled-tint {
  background-color: #f1f5f9;
}

.metric-card.cancelled-tint .metric-value {
  color: #64748b;
}

.metric-label {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.metric-value {
  margin: 0;
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 800;
  line-height: 1;
  color: #1d4ed8;
}

.metric-value.text-md {
  font-size: clamp(2rem, 4vw, 2.495rem);
  line-height: 1;
  padding: 0.1rem 0;
}

.metric-meta {
  margin: 0;
  font-size: 0.92rem;
  color: #94a3b8;
}

.charts-grid {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 1.5rem;
}

.chart-card {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.75rem;
}

.chart-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.chart-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #1f2937;
}

.chart-copy {
  margin: 0.45rem 0 0;
  color: #64748b;
  font-size: 0.9rem;
}

.chart-shell {
  position: relative;
  border-radius: 0.75rem;
  min-height: 320px;
  width: 100%;
}

.chart-shell :deep(.empty-state) {
  padding: 1.5rem;
  min-height: unset;
}

.pie-shell {
  display: flex;
  justify-content: center;
  align-items: center;
}

@media (max-width: 960px) {
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  .charts-grid {
    grid-template-columns: 1fr;
  }
  .split-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .analytics-controls {
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .chart-card {
    padding: 1.1rem;
  }
  .chart-shell {
    min-height: 280px;
  }
}
</style>
