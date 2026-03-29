<template>
  <div class="clinic-directory page-container">
    <section class="directory-hero card">
      <h1>Clinic Directory</h1>
      <p>Search clinics by name, district, service and opening status.</p>
    </section>

    <section class="directory-filters card">
      <input v-model="search" type="search" placeholder="Search clinic name..." aria-label="Search clinics" />
      <select v-model="district" aria-label="Filter by district">
        <option value="">All Districts</option>
        <option v-for="d in districts" :key="d" :value="d">{{ d }}</option>
      </select>
      <select v-model="service" aria-label="Filter by service">
        <option value="">All Services</option>
        <option v-for="s in servicesData" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
      <label class="openswitch"><input type="checkbox" v-model="openNow" /> Open now</label>
    </section>

    <section class="clinic-list">
      <p v-if="filteredClinics.length === 0" class="no-results">No clinics found.</p>
      <article v-for="clinic in filteredClinics" :key="clinic.id" class="clinic-card card">
        <div class="clinic-card-top">
          <div>
            <h2>{{ clinic.clinicName }}</h2>
            <p class="clinic-meta">{{ clinic.district }} · {{ formatTodayHours(clinic.operatingHours) }} · {{
              clinic.distance?.toFixed(1) }} km</p>
          </div>
          <AppBadge :variant="isClinicOpen(clinic) ? 'open' : 'closed'">{{ isClinicOpen(clinic) ? 'Open' : 'Closed' }}
          </AppBadge>
        </div>

        <p class="clinic-address">{{ clinic.address }}</p>

        <div class="service-tags">
          <span v-for="svcId in (clinic.services || []).slice(0, 3)" :key="svcId" class="svc-chip">{{ serviceName(svcId)
            }}</span>
          <span v-if="clinic.services && clinic.services.length > 3" class="svc-more">+{{ clinic.services.length - 3 }}
            more</span>
        </div>

        <div class="clinic-bottom">
          <span class="wait">Est. wait: {{ clinic.averageWaitTime ? `~${clinic.averageWaitTime} min` : 'No wait'
            }}</span>
          <button class="btn btn-primary" type="button" @click="viewDetail(clinic.id)">View details</button>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppBadge from '@/components/base/AppBadge.vue'

const router = useRouter()

const search = ref('')
const district = ref('')
const service = ref('')
const openNow = ref(false)

const servicesData = ref([
  { id: 'general', name: 'General Practice' },
  { id: 'dental', name: 'Dental' },
  { id: 'pediatrics', name: 'Pediatrics' },
  { id: 'vaccination', name: 'Vaccination' },
])

const clinics = ref([
  {
    id: 'clinic-1',
    clinicName: 'Clementi Family Clinic',
    district: 'Clementi',
    address: '123 Clementi Ave',
    distance: 2.1,
    operatingHours: { mon: { open: true, start: '00:00', end: '23:59' }, tue: { open: true, start: '00:00', end: '23:59' }, wed: { open: true, start: '00:00', end: '23:59' }, thu: { open: true, start: '00:00', end: '23:59' }, fri: { open: true, start: '00:00', end: '23:59' }, sat: { open: true, start: '00:00', end: '23:59' }, sun: { open: true, start: '00:00', end: '23:59' } },
    averageWaitTime: 12,
    services: ['general', 'vaccination'],
    contactNumber: '60123456',
  },
  {
    id: 'clinic-2',
    clinicName: 'Bukit Timah Care',
    district: 'Bukit Timah',
    address: '80 Bukit Timah Rd',
    distance: 4.8,
    operatingHours: { mon: { open: true, start: '00:00', end: '23:59' }, tue: { open: true, start: '00:00', end: '23:59' }, wed: { open: true, start: '00:00', end: '23:59' }, thu: { open: true, start: '00:00', end: '23:59' }, fri: { open: true, start: '00:00', end: '23:59' }, sat: { open: true, start: '00:00', end: '23:59' }, sun: { open: true, start: '00:00', end: '23:59' } },
    averageWaitTime: 6,
    services: ['dental', 'pediatrics'],
    contactNumber: '60223457',
  },
])

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
  const hrs = clinic.operatingHours || {}
  const day = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()]
  const today = hrs[day]
  if (!today?.open) return false
  const toMin = (t) => {
    if (!t) return 0
    const [hh, mm] = t.split(':').map(Number)
    return hh * 60 + (mm || 0)
  }
  const now = new Date()
  const total = now.getHours() * 60 + now.getMinutes()
  return total >= toMin(today.start) && total < toMin(today.end)
}

function formatTodayHours(operatingHours) {
  const day = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()]
  const today = (operatingHours || {})[day]
  if (!today || !today.open) return 'Closed today'
  return `${today.start} - ${today.end}`
}

function viewDetail(clinicId) {
  router.push({ name: 'ClinicDetail', params: { clinicId } })
}
</script>

<style scoped>
.page-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 1rem;
}

.card {
  background: white;
  border-radius: 1rem;
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
  color: #1d4ed8;
}

.directory-hero p {
  margin: 0;
  color: #64748b;
}

.directory-filters {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 0.8rem;
  align-items: center;
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
}

.clinic-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.8rem;
}

.clinic-card h2 {
  margin: 0;
  font-size: 1.25rem;
}

.clinic-meta {
  margin: 0.25rem 0 0;
  color: #64748b;
  font-size: 0.9rem;
}

.clinic-address {
  margin: 0.65rem 0;
  color: #475569;
  font-size: 0.95rem;
}

.service-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-bottom: 0.75rem;
}

.svc-chip {
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 700;
  font-size: 0.78rem;
  padding: 0.3rem 0.65rem;
}

.svc-more {
  color: #64748b;
  font-size: 0.78rem;
}

.clinic-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}

.wait {
  color: #0f766e;
  font-weight: 700;
}

.btn {
  border: 0;
  border-radius: 0.65rem;
  padding: 0.55rem 0.9rem;
  cursor: pointer;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: white;
}

.no-results {
  color: #64748b;
  text-align: center;
  font-weight: 700;
  margin-top: 1rem;
}

@media (max-width: 720px) {
  .directory-filters {
    grid-template-columns: 1fr;
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
</style>
