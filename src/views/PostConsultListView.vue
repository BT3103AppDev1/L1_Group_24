<template>
    <DashboardLayout title="Post Consultation">
        <AppSpinner v-if="loading" />

        <template v-else>
            <!-- Count badge -->
            <div class="list-meta" v-if="tickets.length">
                <span class="count-badge">{{ tickets.length }} patient{{ tickets.length > 1 ? 's' : '' }} ready</span>
                <button class="refresh-btn" @click="load">↻ Refresh</button>
            </div>

            <!-- Patient cards -->
            <template v-if="tickets.length">
                <AppCard v-for="ticket in tickets" :key="ticket.id" class="patient-card"
                    @click="goToConsult(ticket.id)">
                    <div class="card-left">
                        <span class="ticket-num">{{ ticket.ticketNumber }}</span>
                        <div class="card-info">
                            <p class="patient-name">{{ ticket.patientName || 'Patient' }}</p>
                            <p class="card-meta">{{ ticket.serviceName }} · Joined {{ formatTime(ticket.joinedAt) }}</p>
                            <!-- Show symptoms chips if they exist -->
                            <div v-if="ticket.symptoms?.length" class="chips">
                                <span v-for="s in ticket.symptoms" :key="s" class="chip">{{ s }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="card-right">
                        <span class="serving-badge">Serving</span>
                        <AppButton variant="primary" size="sm" @click.stop="goToConsult(ticket.id)">
                            Start Post-Consult →
                        </AppButton>
                    </div>
                </AppCard>
            </template>

            <!-- Empty state -->
            <AppEmptyState v-else icon="🩺" title="No patients currently being served"
                description="Patients will appear here once their status is set to 'Serving' in the Queue Dashboard." />
        </template>
    </DashboardLayout>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore.js'
import { useClinicStore } from '@/stores/useClinicStore.js'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import AppCard from '@/components/base/AppCard.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppSpinner from '@/components/base/AppSpinner.vue'
import AppEmptyState from '@/components/base/AppEmptyState.vue'

const router = useRouter()
const authStore = useAuthStore()
const clinicStore = useClinicStore()

const loading = ref(true)
const tickets = ref([])

function formatTime(ts) {
    if (!ts) return '—'
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })
}

function goToConsult(ticketId) {
    router.push({ path: '/clinic/post-consult/form', query: { ticketId } })
}

async function load() {
    loading.value = true
    try {
        tickets.value = await clinicStore.fetchServingTickets(authStore.clinicId)
    } catch (e) {
        console.error('[PostConsultList] load error:', e)
    } finally {
        loading.value = false
    }
}

onMounted(async () => {
    // Wait for auth to initialize before using clinicId
    if (!authStore.initialized) {
        await new Promise(resolve => {
            const stop = watch(
                () => authStore.initialized,
                (val) => { if (val) { stop(); resolve() } }
            )
        })
    }
    await load()
})
</script>

<style scoped>
.list-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.count-badge {
    font-size: .875rem;
    font-weight: 700;
    color: #1d4ed8;
    background: #eff6ff;
    padding: .3rem .85rem;
    border-radius: 9999px;
}

.refresh-btn {
    background: none;
    border: none;
    font-size: .875rem;
    font-weight: 600;
    color: #6b7280;
    cursor: pointer;
    padding: .3rem .5rem;
    border-radius: 6px;
    transition: color .15s;
}

.refresh-btn:hover {
    color: #1f2937;
}

.patient-card {
    padding: 1.25rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    cursor: pointer;
    transition: box-shadow .15s, transform .15s;
}

.patient-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px -4px rgba(0, 0, 0, .1);
}

.card-left {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
    min-width: 0;
}

.ticket-num {
    flex-shrink: 0;
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #eff6ff;
    color: #1d4ed8;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 900;
    letter-spacing: -.02em;
}

.card-info {
    min-width: 0;
}

.patient-name {
    font-weight: 700;
    font-size: 1rem;
    color: #1f2937;
    margin: 0 0 .2rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.card-meta {
    font-size: .8rem;
    color: #6b7280;
    margin: 0 0 .4rem;
}

.chips {
    display: flex;
    flex-wrap: wrap;
    gap: .3rem;
}

.chip {
    padding: .15rem .55rem;
    background: #f0fdf4;
    color: #166534;
    border-radius: 9999px;
    font-size: .72rem;
    font-weight: 600;
}

.card-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: .6rem;
    flex-shrink: 0;
}

.serving-badge {
    font-size: .72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .04em;
    color: #1d4ed8;
    background: #dbeafe;
    padding: .2rem .65rem;
    border-radius: 9999px;
}

@media (max-width: 600px) {
    .patient-card {
        flex-direction: column;
        align-items: flex-start;
    }

    .card-right {
        align-items: flex-start;
        flex-direction: row;
        align-items: center;
        width: 100%;
        justify-content: space-between;
    }
}
</style>
