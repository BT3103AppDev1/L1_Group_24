<template>
    <DashboardLayout title="Queue Dashboard">
        <AppSpinner v-if="loading" />

        <template v-else>
            <div class="dashboard-top-row">
                <ServiceTab :services="services" :active-id="activeServiceId" @select="selectService" />

                <!-- Clinic Status Toggle -->
                <AppCard class="status-card">
                    <span class="status-label">Clinic Status:</span>
                    <AppBadge :variant="authStore.clinic?.isOpen ? 'open' : 'closed'" class="status-badge">
                        {{ authStore.clinic?.isOpen ? 'OPEN' : 'CLOSED' }}
                    </AppBadge>
                    <div class="status-actions">
                        <AppButton v-if="!authStore.clinic?.isOpen" variant="primary" size="sm"
                            @click="toggleClinicStatus(true)" :disabled="togglingStatus">
                            Open Clinic
                        </AppButton>
                        <AppButton v-else variant="danger" size="sm" @click="toggleClinicStatus(false)"
                            :disabled="togglingStatus">
                            Close Clinic
                        </AppButton>
                    </div>
                </AppCard>
            </div>

            <!-- Stats -->
            <QueueSummaryCard :waiting="stats.waiting" :serving="stats.serving" :completed="stats.completed" />

            <!-- Queue Table -->
            <AppCard class="queue-table-card">
                <div class="table-header">
                    <h3 class="table-title">Queue — {{ activeServiceName }}</h3>
                    <AppButton variant="secondary" size="sm" @click="refreshQueue">Refresh</AppButton>
                </div>

                <AppSpinner v-if="loadingTickets" />

                <template v-else-if="tickets.length">
                    <div class="table-wrap">
                        <table class="queue-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Ticket</th>
                                    <th>Patient</th>
                                    <th>Wait (min)</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <PatientRow v-for="(ticket, idx) in tickets" :key="ticket.id" :ticket="ticket"
                                    :index="idx + 1" @update-status="updateStatus" @view="openDetail" />
                            </tbody>
                        </table>
                    </div>
                </template>

                <AppEmptyState v-else icon="🎫" title="Queue is empty" description="No tickets yet for this service." />
            </AppCard>
        </template>

        <!-- Ticket Detail Modal -->
        <AppModal v-if="detailTicket" :title="`Ticket ${detailTicket.ticketNumber}`" @close="detailTicket = null">
            <div class="detail-rows">
                <div class="d-row"><span>Patient</span><span>{{ detailTicket.patientName || 'Patient' }}</span></div>
                <div class="d-row"><span>Status</span><span>{{ detailTicket.status }}</span></div>
                <div class="d-row"><span>Joined</span><span>{{ formatTime(detailTicket.joinedAt) }}</span></div>
                <div v-if="detailTicket.symptoms?.length" class="d-row symptoms-row">
                    <span>Symptoms</span>
                    <div class="chips">
                        <span v-for="s in detailTicket.symptoms" :key="s" class="chip">{{ s }}</span>
                    </div>
                </div>
                <div v-if="detailTicket.notes" class="d-row"><span>Notes</span><span>{{ detailTicket.notes }}</span>
                </div>
            </div>
            <template #footer>
                <AppButton v-if="detailTicket.status === 'waiting'" variant="primary" @click="callPatient">Call Patient
                </AppButton>
                <AppButton v-if="detailTicket.status === 'serving'" variant="secondary" @click="goToPostConsult">Post
                    Consult</AppButton>
            </template>
        </AppModal>
    </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useClinicStore } from '@/stores/useClinicStore.js'
import { useQueueStore } from '@/stores/useQueueStore.js'
import { useAuthStore } from '@/stores/useAuthStore.js'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import AppCard from '@/components/base/AppCard.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppSpinner from '@/components/base/AppSpinner.vue'
import AppEmptyState from '@/components/base/AppEmptyState.vue'
import AppModal from '@/components/base/AppModal.vue'
import AppBadge from '@/components/base/AppBadge.vue'
import ServiceTab from '@/components/clinic/ServiceTab.vue'
import QueueSummaryCard from '@/components/clinic/QueueSummaryCard.vue'
import PatientRow from '@/components/clinic/PatientRow.vue'
import { updateClinic } from '@/firebase/firestore'

const router = useRouter()
const clinicStore = useClinicStore()
const queueStore = useQueueStore()
const authStore = useAuthStore()

const loading = ref(false)
const loadingTickets = ref(false)
const services = ref([])
const activeServiceId = ref('')
const detailTicket = ref(null)
const togglingStatus = ref(false)

const tickets = computed(() => queueStore.clinicTickets)

const activeServiceName = computed(() => {
    return services.value.find(s => s.id === activeServiceId.value)?.name || ''
})

const stats = computed(() => ({
    waiting: tickets.value.filter(t => t.status === 'waiting').length,
    serving: tickets.value.filter(t => t.status === 'serving').length,
    completed: tickets.value.filter(t => t.status === 'completed').length,
}))

function selectService(id) {
    activeServiceId.value = id
    loadingTickets.value = true
    queueStore.subscribeToClinicService(authStore.clinicId, id, () => {
        loadingTickets.value = false
    })
}

function refreshQueue() {
    if (activeServiceId.value) selectService(activeServiceId.value)
}

function openDetail(ticket) {
    detailTicket.value = ticket
}

async function toggleClinicStatus(open) {
    if (!authStore.clinicId) return
    togglingStatus.value = true
    try {
        await updateClinic(authStore.clinicId, { isOpen: open })
        // Update local auth store so UI reflects it immediately
        if (authStore.clinic) {
            authStore.clinic.isOpen = open
        }
    } catch (e) {
        console.error('Failed to toggle clinic status:', e)
        alert('Failed to update clinic status.')
    } finally {
        togglingStatus.value = false
    }
}

async function updateStatus({ ticketId, status }) {
    await queueStore.updateStatus(ticketId, status)
}

async function callPatient() {
    if (!detailTicket.value) return
    await queueStore.updateStatus(detailTicket.value.id, 'serving')
    detailTicket.value = null
}

function goToPostConsult() {
    if (!detailTicket.value) return
    router.push({ path: '/clinic/post-consult', query: { ticketId: detailTicket.value.id } })
    detailTicket.value = null
}

function formatTime(ts) {
    if (!ts) return ''
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })
}

onMounted(async () => {
    loading.value = true

    // wait for Firebase auth to finish if it hasn't yet
    if (!authStore.initialized) {
        await new Promise(resolve => {
            const stop = watch(
                () => authStore.initialized,
                (val) => { if (val) { stop(); resolve() } }
            )
        })
    }

    // guard: if no clinic is logged in, redirect away
    if (!authStore.clinicId) {
        router.push('/login')
        return
    }

    services.value = await clinicStore.fetchClinicServices(authStore.clinicId)

    loading.value = false

    if (services.value.length) selectService(services.value[0].id)
})

onUnmounted(() => {
    queueStore.unsubscribeClinic?.()
})
</script>

<style scoped>
.dashboard-top-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    flex-wrap: wrap;
}

.status-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1.25rem;
    margin-bottom: 0;
}

.status-label {
    font-weight: 600;
    color: #4b5563;
    font-size: 0.95rem;
}

.status-badge {
    font-size: 0.85rem;
    padding: 0.35rem 0.65rem;
}

.queue-table-card {
    padding: 1.25rem;
}

.table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.table-title {
    font-size: 1rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
}

.table-wrap {
    overflow-x: auto;
}

.queue-table {
    width: 100%;
    border-collapse: collapse;
    font-size: .875rem;
}

.queue-table th {
    text-align: left;
    padding: .625rem .75rem;
    border-bottom: 2px solid #e5e7eb;
    color: #6b7280;
    font-weight: 600;
    text-transform: uppercase;
    font-size: .75rem;
    white-space: nowrap;
}

.detail-rows {
    display: flex;
    flex-direction: column;
    gap: .75rem;
}

.d-row {
    display: flex;
    justify-content: space-between;
    font-size: .875rem;
    gap: 1rem;
}

.d-row span:first-child {
    color: #6b7280;
    flex-shrink: 0;
}

.d-row span:last-child {
    font-weight: 600;
    color: #1f2937;
    text-align: right;
}

.symptoms-row {
    flex-direction: column;
    gap: .5rem;
}

.chips {
    display: flex;
    flex-wrap: wrap;
    gap: .35rem;
}

.chip {
    padding: .2rem .6rem;
    background: #eff6ff;
    color: #1d4ed8;
    border-radius: 9999px;
    font-size: .75rem;
    font-weight: 500;
}
</style>
