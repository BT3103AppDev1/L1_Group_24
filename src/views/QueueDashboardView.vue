<template>
    <DashboardLayout title="Queue Dashboard">
        <AppSpinner v-if="loading" />

        <template v-else>
            <div class="dashboard-top-row">
                <div class="custom-dropdown">
                    <button class="dropdown-trigger" @click="dropdownOpen = !dropdownOpen">
                        {{ activeServiceName || 'Select Service' }}
                        <span class="chevron" :class="{ open: dropdownOpen }">▼</span>
                    </button>
                    <div v-show="dropdownOpen" class="dropdown-menu">
                        <div
                            v-for="s in services"
                            :key="s.id"
                            class="dropdown-item"
                            :class="{ active: s.id === activeServiceId }"
                            @click="selectServiceLocal(s.id)"
                        >
                            {{ s.serviceName }}
                        </div>
                    </div>
                </div>

                <AppCard class="status-card">
                    <span class="status-label">Clinic Status:</span>
                    <AppBadge :variant="authStore.clinic?.isOpen ? 'open' : 'closed'">
                        {{ authStore.clinic?.isOpen ? 'OPEN' : 'CLOSED' }}
                    </AppBadge>

                    <AppButton
                        v-if="!authStore.clinic?.isOpen"
                        variant="primary"
                        size="sm"
                        :disabled="togglingStatus"
                        @click="toggleClinicStatus(true)"
                    >
                        Open Clinic
                    </AppButton>

                    <AppButton
                        v-else
                        variant="danger"
                        size="sm"
                        :disabled="togglingStatus"
                        @click="toggleClinicStatus(false)"
                    >
                        Close Clinic
                    </AppButton>
                </AppCard>
            </div>

            <QueueSummaryCard
                :waiting="stats.waiting"
                :serving="stats.serving"
                :completed="stats.completed"
            />

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
                                <PatientRow
                                    v-for="(ticket, idx) in tickets"
                                    :key="ticket.id"
                                    :ticket="ticket"
                                    :index="idx + 1"
                                    @update-status="updateStatus"
                                    @view="openDetail"
                                />
                            </tbody>
                        </table>
                    </div>
                </template>

                <AppEmptyState
                    v-else
                    icon = ""
                    title="Queue is empty"
                    description="No tickets yet for this service."
                />
            </AppCard>
        </template>

        <AppModal
            v-if="detailTicket"
            :title="`Ticket ${detailTicket.ticketNumber}`"
            @close="detailTicket = null"
        >
            <div class="detail-rows">
                <div class="d-row">
                    <span>Patient</span>
                    <span>{{ detailTicket.patientName || 'Patient' }}</span>
                </div>
                <div class="d-row">
                    <span>Status</span>
                    <span>{{ detailTicket.status }}</span>
                </div>
                <div class="d-row">
                    <span>Joined</span>
                    <span>{{ formatTime(detailTicket.joinedAt) }}</span>
                </div>
                <div v-if="detailTicket.symptoms?.length" class="d-row symptoms-row">
                    <span>Symptoms</span>
                    <div class="chips">
                        <span v-for="s in detailTicket.symptoms" :key="s" class="chip">{{ s }}</span>
                    </div>
                </div>
                <div v-if="detailTicket.notes" class="d-row">
                    <span>Notes</span>
                    <span>{{ detailTicket.notes }}</span>
                </div>
            </div>

            <template #footer>
                <AppButton
                    v-if="detailTicket.status === 'waiting'"
                    variant="primary"
                    @click="callPatient"
                >
                    Call Patient
                </AppButton>
                <AppButton
                    v-if="detailTicket.status === 'serving'"
                    variant="secondary"
                    @click="goToPostConsult"
                >
                    Post Consult
                </AppButton>
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
import QueueSummaryCard from '@/components/clinic/QueueSummaryCard.vue'
import PatientRow from '@/components/clinic/PatientRow.vue'
import { updateClinic, resetClinicQueues } from '@/firebase/firestore'

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
const dropdownOpen = ref(false)

const completedByService = ref({})
const prevServingIdsByService = ref({})

const tickets = computed(() => queueStore.clinicTickets)

const activeServiceName = computed(() => {
    return services.value.find(s => s.id === activeServiceId.value)?.serviceName || ''
})

const stats = computed(() => ({
    waiting: tickets.value.filter(t => t.status === 'waiting').length,
    serving: tickets.value.filter(t => t.status === 'serving').length,
    completed: completedByService.value[activeServiceId.value] || 0,
}))

function selectService(id) {
    activeServiceId.value = id
    loadingTickets.value = true

    if (completedByService.value[id] === undefined) {
        completedByService.value = {
            ...completedByService.value,
            [id]: 0,
        }
    }

    if (!prevServingIdsByService.value[id]) {
        prevServingIdsByService.value = {
            ...prevServingIdsByService.value,
            [id]: [],
        }
    }

    queueStore.subscribeToClinicService(authStore.clinicId, id, () => {
        loadingTickets.value = false
    })
}

function selectServiceLocal(id) {
    selectService(id)
    dropdownOpen.value = false
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
        await resetClinicQueues(authStore.clinicId)

        completedByService.value = {}
        prevServingIdsByService.value = {}

        if (authStore.clinic) authStore.clinic.isOpen = open
    } catch (e) {
        console.error('Failed to toggle clinic status:', e)
        alert('Failed to update clinic status. Please try again.')
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

watch(
    [() => activeServiceId.value, () => tickets.value.map(t => `${t.id}:${t.status}`).join('|')],
    () => {
        const serviceId = activeServiceId.value
        if (!serviceId) return

        const currentActiveIds = new Set(tickets.value.map(t => t.id))
        const currentServingIds = tickets.value
            .filter(t => t.status === 'serving')
            .map(t => t.id)

        const prevServingIds = prevServingIdsByService.value[serviceId] || []

        let completedAdded = 0

        for (const ticketId of prevServingIds) {
            if (!currentActiveIds.has(ticketId)) {
                completedAdded += 1
            }
        }

        if (completedAdded > 0) {
            completedByService.value = {
                ...completedByService.value,
                [serviceId]: (completedByService.value[serviceId] || 0) + completedAdded,
            }
        }

        prevServingIdsByService.value = {
            ...prevServingIdsByService.value,
            [serviceId]: currentServingIds,
        }
    }
)

onMounted(async () => {
    loading.value = true

    if (!authStore.initialized) {
        await new Promise(resolve => {
            const stop = watch(
                () => authStore.initialized,
                (val) => {
                    if (val) {
                        stop()
                        resolve()
                    }
                }
            )
        })
    }

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
    margin-bottom: 0;
}

.status-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.25rem;
    flex-shrink: 0;
}

.status-label {
    font-weight: 600;
    color: #4b5563;
    font-size: 0.9rem;
    white-space: nowrap;
}

.custom-dropdown {
    position: relative;
    min-width: 260px;
    z-index: 50;
}

.dropdown-trigger {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: white;
    border: 2px solid #e5e7eb;
    padding: 0.8rem 1.25rem;
    border-radius: 9999px;
    font-size: 0.95rem;
    font-weight: 700;
    color: #33371f;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
    transition: all 0.2s;
}

.dropdown-trigger:hover {
    border-color: #0c0c0c;
    background-color: #f8fafc;
}

.chevron {
    font-size: 0.75rem;
    color: #6b7280;
    transition: transform 0.2s;
}

.chevron.open {
    transform: rotate(180deg);
}

.dropdown-menu {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    width: 100%;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 1rem;
    padding: 0.5rem;
    box-shadow: 0 15px 30px -5px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.dropdown-item {
    padding: 0.8rem 1rem;
    font-size: 0.95rem;
    font-weight: 600;
    color: #111404;
    cursor: pointer;
    border-radius: 0.75rem;
    transition: all 0.2s;
}

.dropdown-item:hover {
    background: #f1f5f9;
    color: #000000;
}

.dropdown-item.active {
    background: #eff6ff;
    color: #1d4ed8;
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