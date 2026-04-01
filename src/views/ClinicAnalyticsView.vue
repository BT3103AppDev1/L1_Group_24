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

      <!-- Quick summary cards for the clinic's recent queue activity -->
      <section class="stats-grid">
        <AppCard class="metric-card" flat>
          <p class="metric-label">Average joins</p>
          <p class="metric-value">{{ averageJoinsPerDay }}</p>
          <p class="metric-meta">Per day in the last 30 days</p>
        </AppCard>

        <AppCard class="metric-card" flat>
          <p class="metric-label">Average wait today</p>
          <p class="metric-value">{{ averageWaitToday }}</p>
          <p class="metric-meta">Minutes across today's joins</p>
        </AppCard>

        <AppCard class="metric-card" flat>
          <p class="metric-label">Today</p>
          <p class="metric-value">{{ todayJoins }}</p>
          <p class="metric-meta">Queue joins so far</p>
        </AppCard>
      </section>

      <AppCard class="chart-card">
        <!-- Historical queue trend chart -->
        <div class="chart-header">
          <div>
            <h2 class="section-title">Daily Queue Joins</h2>
            <p class="section-copy">
              Historical patient arrivals across your clinic for the last 30 days.
            </p>
          </div>
          <span class="range-pill">Last 30 days</span>
        </div>

        <AppEmptyState
          v-if="!hasHistory"
          icon="📈"
          title="No queue history yet"
          description="Once patients start joining your clinic queue, the daily trend will appear here."
        />

        <div v-else class="chart-shell">
          <div class="chart-frame">
            <svg
              class="chart-svg"
              viewBox="0 0 760 320"
              role="img"
              aria-label="Line chart showing daily queue joins over the last 30 days"
            >
              <defs>
                <linearGradient id="queueHistoryFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.32" />
                  <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.02" />
                </linearGradient>
              </defs>

              <g v-for="tick in yTicks" :key="`grid-${tick.value}`">
                <line
                  :x1="chartBounds.left"
                  :x2="chartBounds.right"
                  :y1="tick.y"
                  :y2="tick.y"
                  class="grid-line"
                />
                <text :x="chartBounds.left - 12" :y="tick.y + 4" class="axis-label axis-label--y">
                  {{ tick.value }}
                </text>
              </g>

              <path :d="areaPath" class="area-path" />
              <path :d="linePath" class="line-path" />

              <circle
                v-for="point in chartPoints"
                :key="point.dateKey"
                :cx="point.x"
                :cy="point.y"
                r="4"
                class="point-dot"
              />

              <text
                v-for="label in xAxisLabels"
                :key="`label-${label.dateKey}`"
                :x="label.x"
                :y="chartBounds.bottom + 24"
                class="axis-label axis-label--x"
              >
                {{ label.shortLabel }}
              </text>
            </svg>
          </div>

          <div class="chart-summary">
            <span>{{ history[0]?.label }}</span>
            <span>{{ history[history.length - 1]?.label }}</span>
          </div>
        </div>
      </AppCard>
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
import { subscribeToClinicDailyQueueHistory } from '@/firebase/firestore.js'
import { useAuthStore } from '@/stores/useAuthStore.js'

const router = useRouter()
const authStore = useAuthStore()

// Page state for the analytics dashboard
const loading = ref(true)
const loadError = ref('')
const history = ref([])
const averageWaitTodayMinutes = ref(0)

let unsubscribeHistory = null

const chartBounds = {
  left: 52,
  right: 724,
  top: 24,
  bottom: 268,
}

// Formats short labels for the x-axis
const shortDateFormatter = new Intl.DateTimeFormat('en-SG', {
  day: 'numeric',
  month: 'short',
})

// Converts the stored date key back into a local Date for display
function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

// Checks whether the selected date range contains any real queue activity
const hasHistory = computed(() => history.value.some((day) => day.count > 0))

// Average number of joins across the visible 30-day range
const averageJoinsPerDay = computed(() => {
  if (!history.value.length) return '0'

  const total = history.value.reduce((sum, day) => sum + day.count, 0)
  return (total / history.value.length).toFixed(1)
})

// Uses the latest point in the series as today's join count
const todayJoins = computed(() => {
  return history.value[history.value.length - 1]?.count || 0
})

// Rounds the Firestore-derived wait time into a simple card value
const averageWaitToday = computed(() => {
  return `${Math.round(averageWaitTodayMinutes.value)} min`
})

const maxCount = computed(() => {
  return Math.max(...history.value.map((day) => day.count), 1)
})

// Maps each day's count into SVG coordinates for the line graph
const chartPoints = computed(() => {
  if (!history.value.length) return []

  const width = chartBounds.right - chartBounds.left
  const height = chartBounds.bottom - chartBounds.top
  const maxValue = maxCount.value
  const divisor = Math.max(history.value.length - 1, 1)

  return history.value.map((day, index) => {
    const x = chartBounds.left + (width * index) / divisor
    const y = chartBounds.bottom - (day.count / maxValue) * height

    return {
      ...day,
      x,
      y,
      shortLabel: shortDateFormatter.format(parseDateKey(day.dateKey)),
    }
  })
})

// Builds the SVG path for the chart line
const linePath = computed(() => {
  if (!chartPoints.value.length) return ''

  return chartPoints.value
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
})

// Builds the shaded area beneath the chart line
const areaPath = computed(() => {
  if (!chartPoints.value.length) return ''

  const firstPoint = chartPoints.value[0]
  const lastPoint = chartPoints.value[chartPoints.value.length - 1]
  return [
    `M ${firstPoint.x} ${chartBounds.bottom}`,
    `L ${firstPoint.x} ${firstPoint.y}`,
    ...chartPoints.value.slice(1).map((point) => `L ${point.x} ${point.y}`),
    `L ${lastPoint.x} ${chartBounds.bottom}`,
    'Z',
  ].join(' ')
})

// Creates evenly spaced y-axis ticks based on the current range
const yTicks = computed(() => {
  const tickCount = 4
  const height = chartBounds.bottom - chartBounds.top

  return Array.from({ length: tickCount + 1 }, (_, index) => {
    const ratio = index / tickCount
    const value = Math.round(maxCount.value * (1 - ratio))
    const y = chartBounds.top + height * ratio

    return { value, y }
  })
})

// Shows a small set of x-axis labels to keep the chart readable on mobile
const xAxisLabels = computed(() => {
  if (!chartPoints.value.length) return []

  const targetIndexes = [0, 7, 14, 21, chartPoints.value.length - 1]
  const uniqueIndexes = [
    ...new Set(targetIndexes.filter((index) => index < chartPoints.value.length)),
  ]

  return uniqueIndexes.map((index) => {
    const point = chartPoints.value[index]
    return {
      dateKey: point.dateKey,
      x: point.x,
      shortLabel: point.shortLabel,
    }
  })
})

// Starts the real-time Firestore listener for clinic analytics
function beginHistorySubscription() {
  if (!authStore.clinicId) {
    loading.value = false
    router.push('/clinic/login')
    return
  }

  let handledFirstPayload = false

  unsubscribeHistory = subscribeToClinicDailyQueueHistory(
    authStore.clinicId,
    ({ history: series, averageWaitToday }) => {
      history.value = series
      averageWaitTodayMinutes.value = averageWaitToday
      loadError.value = ''

      if (!handledFirstPayload) {
        loading.value = false
        handledFirstPayload = true
      }
    },
    () => {
      loadError.value = 'Failed to load clinic analytics. Please try again shortly.'

      if (!handledFirstPayload) {
        loading.value = false
        handledFirstPayload = true
      }
    },
  )
}

onMounted(async () => {
  // Wait for Firebase auth before deciding whether to load or redirect
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

  beginHistorySubscription()
})

onUnmounted(() => {
  // Clean up the live analytics listener when leaving the page
  if (unsubscribeHistory) unsubscribeHistory()
})
</script>

<style scoped>
.state-shell {
  display: flex;
  justify-content: center;
  padding: 4rem 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.metric-card {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1.25rem;
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

.metric-meta {
  margin: 0;
  font-size: 0.92rem;
  color: #6b7280;
}

.chart-card {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.4rem;
}

.chart-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.section-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #1f2937;
}

.section-copy {
  margin: 0.45rem 0 0;
  max-width: 38rem;
  color: #6b7280;
  line-height: 1.5;
}

.range-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.85rem;
  font-weight: 700;
  white-space: nowrap;
}

.chart-shell {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.chart-frame {
  position: relative;
  border-radius: 1rem;
  padding: 1rem;
  background: linear-gradient(180deg, rgba(239, 246, 255, 0.92), rgba(255, 255, 255, 0.98));
  border: 1px solid rgba(191, 219, 254, 0.9);
  min-height: 320px;
  overflow: hidden;
}

.chart-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.grid-line {
  stroke: rgba(148, 163, 184, 0.3);
  stroke-width: 1;
  stroke-dasharray: 4 6;
}

.axis-label {
  fill: #64748b;
  font-size: 12px;
  font-weight: 600;
}

.axis-label--y {
  text-anchor: end;
}

.axis-label--x {
  text-anchor: middle;
}

.area-path {
  fill: url(#queueHistoryFill);
}

.line-path {
  fill: none;
  stroke: #2563eb;
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.point-dot {
  fill: #ffffff;
  stroke: #2563eb;
  stroke-width: 3;
}

.chart-summary {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  color: #64748b;
  font-size: 0.88rem;
  font-weight: 600;
}

@media (max-width: 960px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .chart-card {
    padding: 1.1rem;
  }

  .chart-frame {
    padding: 0.75rem 0.5rem;
    min-height: 280px;
  }

  .section-copy {
    font-size: 0.92rem;
  }

  .chart-summary {
    font-size: 0.8rem;
  }
}
</style>
