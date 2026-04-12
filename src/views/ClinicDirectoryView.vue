<template>
  <div class="clinic-directory page-container">
    <section class="directory-hero card">
      <h1>Clinic Directory</h1>
      <p>Search clinics by name, district, service and opening status.</p>
    </section>

    <section class="directory-filters card">
      <input v-model="search" type="search" placeholder="Search clinic name" aria-label="Search clinics" />
      <div class="select-wrapper">
        <select v-model="district" aria-label="Filter by district">
          <option value="">All Districts</option>
          <option v-for="d in districts" :key="d" :value="d">{{ d }}</option>
        </select>
        <span class="select-chevron" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>

      <div class="select-wrapper">
        <select v-model="service" aria-label="Filter by service">
          <option value="">All Services</option>
          <option v-for="s in servicesData" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
        <span class="select-chevron" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>
      <label class="openswitch"><input type="checkbox" v-model="openNow" /> Open now</label>
    </section>

    <section class="clinic-list">
      <p v-if="loading" class="no-results">Loading clinics...</p>
      <p v-else-if="filteredClinics.length === 0" class="no-results">No clinics found.</p>
      <article v-for="clinic in filteredClinics" :key="clinic.id" class="clinic-card card">
        <div class="clinic-card-top">
          <div>
            <h2>{{ clinic.clinicName }}</h2>
            <p class="clinic-meta">
              {{ clinic.district }} · {{ formatTodayHours(clinic.operatingHours, clinic) }} ·
              {{ clinic.distance != null ? `${clinic.distance.toFixed(1)} km` : '— km' }}
            </p>
          </div>
          <AppBadge :variant="isClinicOpen(clinic) ? 'open' : 'closed'">
            {{ isClinicOpen(clinic) ? 'Open' : 'Closed' }}
          </AppBadge>
        </div>

        <p class="clinic-address">{{ clinic.address }}</p>

        <div class="service-tags">
          <span
            v-for="svcId in (clinic.services || []).slice(0, 3)"
            :key="svcId"
            class="svc-chip"
          >
            {{ serviceName(svcId) }}
          </span>
          <span v-if="clinic.services && clinic.services.length > 3" class="svc-more">
            +{{ clinic.services.length - 3 }} more
          </span>
        </div>

        <div class="clinic-bottom">
          <span class="wait">
            Est. wait: {{ clinic.waitTime > 0 ? `~${clinic.waitTime} min` : 'No wait' }}
          </span>
          <button class="btn btn-primary" type="button" @click="viewDetail(clinic.id)">
            View details
          </button>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import AppBadge from '@/components/base/AppBadge.vue'
import { subscribeToAllClinics, getAllServices, getClinicServices } from '@/firebase/firestore'
import { geocodePostalCode, getUserLocation, haversineKm } from '@/utils/geo.js'

const router = useRouter()

const search = ref('')
const district = ref('')
const service = ref('')
const openNow = ref(false)

const servicesData = ref([])
const clinics = ref([])
const userLocation = ref(null)
const loading = ref(true)
let clinicsUnsubscribe = null

onMounted(async () => {
  try {
    servicesData.value = await getAllServices()

    // Best-effort: ask for user location (null if denied/unsupported)
    userLocation.value = await Promise.race([
      getUserLocation(),
      new Promise(resolve => setTimeout(() => resolve(null), 3000))
    ])

    clinicsUnsubscribe = subscribeToAllClinics((data) => {
      // Initial population — distance and waitTime get filled in asynchronously
      clinics.value = data.map((c) => ({
        ...c,
        clinicName: c.clinicName || 'Unnamed Clinic',
        district: c.district || 'Unknown District',
        services: c.services || [],
        operatingHours: c.operatingHours || {},
        distance: null,
        waitTime: 0,
      }))
      loading.value = false
      enrichClinics(data)
    })
    setTimeout(() => { loading.value = false }, 5000)
  } catch (err) {
    console.error('Error fetching data:', err)
    loading.value = false
  }
})

// Resolves each clinic's real distance and wait time and writes it back into the reactive list
async function enrichClinics(data) {
  for (const c of data) {
    // Prefer stored lat/lng; fall back to geocoding the postal code
    let coords = c.lat != null && c.lng != null ? { lat: c.lat, lng: c.lng } : null
    if (!coords && c.postalCode) {
      coords = await geocodePostalCode(c.postalCode)
    }

    // Real distance only if we know both ends
    let distance = null
    if (userLocation.value && coords) {
      distance = haversineKm(
        userLocation.value.lat,
        userLocation.value.lng,
        coords.lat,
        coords.lng
      )
    }

    // Longest live wait across this clinic's queues (activeCount * avgDuration)
    let waitTime = 0
    try {
      const queues = await getClinicServices(c.id)
      for (const q of queues) {
        const w = (q.activeCount || 0) * (q.avgDuration || 15)
        if (w > waitTime) waitTime = w
      }
    } catch (e) {
      console.warn('[ClinicDirectory] failed to load queues for', c.id, e)
    }

    // Merge enriched fields back in-place
    const idx = clinics.value.findIndex((x) => x.id === c.id)
    if (idx >= 0) {
      clinics.value[idx] = { ...clinics.value[idx], distance, waitTime }
    }
  }
}

onUnmounted(() => {
  if (clinicsUnsubscribe) clinicsUnsubscribe()
})

const districts = computed(() => {
  return Array.from(new Set(clinics.value.map((clinic) => clinic.district))).sort()
})

function serviceName(id) {
  return servicesData.value.find((s) => s.id === id)?.name || id
}

const filteredClinics = computed(() => {
  return clinics.value.filter((clinic) => {
    const nameMatch = clinic.clinicName.toLowerCase().includes(search.value.toLowerCase())
    const districtMatch = district.value ? clinic.district === district.value : true
    const serviceMatch = service.value ? clinic.services?.includes(service.value) : true
    const openMatch = openNow.value ? isClinicOpen(clinic) : true
    return nameMatch && districtMatch && serviceMatch && openMatch
  })
})

function isClinicOpen(clinic) {
  if (clinic.isOpen !== undefined) return clinic.isOpen

  const hrs = clinic.operatingHours || {}
  const day = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()]
  const today = hrs[day]
  if (!today?.open) return false

  const toMin = (t) => {
    if (!t || typeof t !== 'string') return 0
    const [hh, mm] = t.split(':').map(Number)
    return (hh || 0) * 60 + (mm || 0)
  }

  const now = new Date()
  const total = now.getHours() * 60 + now.getMinutes()
  return total >= toMin(today.start) && total < toMin(today.end)
}

function formatTodayHours(operatingHours, clinic) {
  if (clinic?.isOpen) return 'Currently Open (Manual)'
  const day = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()]
  const today = (operatingHours || {})[day]
  if (!today || !today.open) return 'Closed today'
  return `${today.start || '00:00'} - ${today.end || '23:59'}`
}

function viewDetail(clinicId) {
  router.push({ name: 'ClinicDetail', params: { clinicId } })
}
</script>

<style scoped>
.page-container {
  max-width: 900px;
  margin: 0 auto;
  padding-bottom: 4rem;
}

.card {
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid #e0edfc;
  box-shadow: 0 8px 20px rgba(28, 94, 212, 0.08);
  padding: 1rem;
  margin-bottom: 1rem;
}

.directory-hero {
  text-align: center;
  padding: 1.6rem;
}

.directory-hero h1 {
  margin: 0 0 0.5rem;
  font-size: 2rem;
  color: var(--color-primary-dark);
}

.directory-hero p {
  margin: 0;
  color: var(--color-text-muted);
}

.directory-filters {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 0.8rem;
  align-items: center;
  padding: 1.25rem;
}

.directory-filters input,
.directory-filters select {
  border: 1px solid #dbeafe;
  border-radius: 0.75rem;
  padding: 0.7rem 0.85rem;
  background: #fff;
}

.openswitch {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: #334155;
  font-size: 0.94rem;
  font-weight: 700;
}

.clinic-list {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.no-results {
  grid-column: 1 / -1;
  color: #64748b;
  text-align: center;
  font-weight: 700;
  margin-top: 1rem;
}

.clinic-card {
  margin-bottom: 0;
  padding: 1.5rem;
  min-height: 220px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.clinic-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.6rem;
}

.clinic-card h2 {
  margin: 0;
  font-size: 1.1rem;
  line-height: 1.25;
}

.clinic-meta {
  margin: 0.2rem 0 0;
  color: #64748b;
  font-size: 0.85rem;
  line-height: 1.35;
}

.clinic-address {
  margin: 0.55rem 0;
  color: #475569;
  font-size: 0.9rem;
  line-height: 1.4;
}

.service-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.65rem;
}

.svc-chip {
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 700;
  font-size: 0.74rem;
  padding: 0.28rem 0.6rem;
}

.svc-more {
  color: #64748b;
  font-size: 0.74rem;
}

.clinic-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-top: auto;
}

.wait {
  color: #0f766e;
  font-weight: 700;
  font-size: 0.95rem;
}

.btn {
  border: 0;
  border-radius: 0.65rem;
  padding: 0.5rem 0.85rem;
  cursor: pointer;
  font-size: 0.9rem;
  white-space: nowrap;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: white;
}

@media (max-width: 720px) {
  .directory-filters {
    grid-template-columns: 1fr;
  }

  .clinic-list {
    grid-template-columns: 1fr;
  }

  .clinic-card {
    min-height: auto;
  }

  .clinic-bottom {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .clinic-bottom .btn {
    width: 100%;
  }
}

.select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.select-wrapper select {
  width: 100%;
  padding-right: 2.5rem; /* make room for the custom arrow */
  appearance: none;
  -webkit-appearance: none;
}

.select-chevron {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--color-primary-dark);
  display: flex;
  align-items: center;
}
</style>