<template>
    <DashboardLayout title="Medication Status">
        <div class="med-page">
            <!-- Filter -->
            <div class="filter-bar">
                <AppSelect v-model="statusFilter" :options="statusOptions" placeholder="All Statuses" />
            </div>

            <AppSpinner v-if="loading" />

            <template v-else-if="filtered.length">
                <AppCard v-for="consult in filtered" :key="consult.id" class="consult-card">
                    <div class="consult-header">
                        <div>
                            <p class="patient-name">{{ consult.patientName || 'Patient' }}</p>
                            <p class="consult-meta">{{ consult.serviceName }} · {{ formatDate(consult.createdAt) }}</p>
                        </div>
                        <span class="med-badge" :class="medClass(consult.medicationStatus)">
                            {{ medLabel(consult.medicationStatus) }}
                        </span>
                    </div>

                    <div v-if="consult.medications?.length" class="med-list">
                        <div v-for="(med, i) in consult.medications" :key="i" class="med-item">
                            <span class="med-name">{{ med.name }}</span>
                            <span class="med-info">{{ med.dosage }} · {{ med.duration }}</span>
                        </div>
                    </div>

                    <div class="action-row">
                        <AppButton v-if="consult.medicationStatus === 'pending'" variant="secondary" size="sm"
                            @click="updateMedStatus(consult.id, 'preparing')">Mark Preparing</AppButton>
                        <AppButton v-if="consult.medicationStatus === 'preparing'" variant="primary" size="sm"
                            @click="updateMedStatus(consult.id, 'ready')">Mark Ready</AppButton>
                        <AppButton v-if="consult.medicationStatus === 'ready'" variant="success" size="sm"
                            @click="updateMedStatus(consult.id, 'dispensed')">Mark Dispensed</AppButton>
                    </div>
                </AppCard>
            </template>

            <AppEmptyState v-else icon="💊" title="No medication records"
                description="Completed consultations with medications will appear here." />
        </div>
    </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore.js'
import { useClinicStore } from '@/stores/useClinicStore.js'
import { updateConsultationMedStatus } from '@/firebase/firestore.js'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import AppCard from '@/components/base/AppCard.vue'
import AppSelect from '@/components/base/AppSelect.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppSpinner from '@/components/base/AppSpinner.vue'
import AppEmptyState from '@/components/base/AppEmptyState.vue'

const authStore = useAuthStore()
const clinicStore = useClinicStore()

const loading = ref(false)
const statusFilter = ref('')
const consultations = ref([])

const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'ready', label: 'Ready' },
    { value: 'dispensed', label: 'Dispensed' },
]

const filtered = computed(() => {
    let list = consultations.value.filter(c => c.medications?.length)
    if (statusFilter.value) list = list.filter(c => c.medicationStatus === statusFilter.value)
    return list
})

function medLabel(status) {
    const map = { pending: 'Pending', preparing: 'Preparing', ready: 'Ready', dispensed: 'Dispensed' }
    return map[status] || 'Pending'
}
function medClass(status) {
    return {
        'badge-pending': !status || status === 'pending',
        'badge-preparing': status === 'preparing',
        'badge-ready': status === 'ready',
        'badge-dispensed': status === 'dispensed',
    }
}
function formatDate(ts) {
    if (!ts) return ''
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function updateMedStatus(consultId, status) {
    await updateConsultationMedStatus(consultId, status)
    const idx = consultations.value.findIndex(c => c.id === consultId)
    if (idx >= 0) consultations.value[idx].medicationStatus = status
}

onMounted(async () => {
    loading.value = true
    consultations.value = await clinicStore.fetchClinicConsultations(authStore.clinicId)
    loading.value = false
})
</script>

<style scoped>
.med-page {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.filter-bar {
    display: flex;
    gap: .75rem;
}

.consult-card {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: .875rem;
}

.consult-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.patient-name {
    font-weight: 700;
    color: #1f2937;
    font-size: .95rem;
    margin: 0;
}

.consult-meta {
    font-size: .8rem;
    color: #6b7280;
    margin: .2rem 0 0;
}

.med-badge {
    padding: .25rem .75rem;
    border-radius: 9999px;
    font-size: .75rem;
    font-weight: 700;
    white-space: nowrap;
}

.badge-pending {
    background: #f3f4f6;
    color: #6b7280;
}

.badge-preparing {
    background: #fef9c3;
    color: #92400e;
}

.badge-ready {
    background: #dbeafe;
    color: #1d4ed8;
}

.badge-dispensed {
    background: #d1fae5;
    color: #065f46;
}

.med-list {
    display: flex;
    flex-direction: column;
    gap: .4rem;
}

.med-item {
    display: flex;
    justify-content: space-between;
    font-size: .875rem;
    padding: .375rem .5rem;
    background: #f9fafb;
    border-radius: 6px;
}

.med-name {
    font-weight: 600;
    color: #1f2937;
}

.med-info {
    color: #6b7280;
    font-size: .8rem;
}

.action-row {
    display: flex;
    justify-content: flex-end;
}
</style>
