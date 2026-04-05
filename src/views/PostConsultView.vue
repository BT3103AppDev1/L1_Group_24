<template>
    <DashboardLayout title="Post Consultation">
        <AppSpinner v-if="loading" />

        <form v-else @submit.prevent="submit" class="consult-form">
            <AppCard class="section-card">
                <h3 class="sec-title">Patient Info</h3>
                <div class="info-row"><span>Ticket</span><span>{{ ticket?.ticketNumber }}</span></div>
                <div class="info-row"><span>Service</span><span>{{ ticket?.serviceName }}</span></div>
                <div class="info-row" v-if="ticket?.symptoms?.length">
                    <span>Reported Symptoms</span>
                    <div class="chips">
                        <span v-for="s in ticket.symptoms" :key="s" class="chip">{{ s }}</span>
                    </div>
                </div>
            </AppCard>

            <AppCard class="section-card">
                <h3 class="sec-title">Diagnosis & Notes</h3>
                <AppInput v-model="form.diagnosis" label="Diagnosis" placeholder="e.g. URTI" :error="errors.diagnosis"
                    required />
                <AppTextarea v-model="form.notes" label="Doctor's Notes" placeholder="Clinical observations..."
                    :rows="4" />
            </AppCard>

            <AppCard class="section-card">
                <div class="med-header">
                    <h3 class="sec-title">Medications</h3>
                    <AppButton type="button" variant="secondary" size="sm" @click="addMed">+ Add</AppButton>
                </div>

                <div v-for="(med, i) in form.medications" :key="i" class="med-row">
                    <AppInput v-model="med.name" :label="`Medication ${i + 1}`" placeholder="e.g. Paracetamol 500mg" />
                    <AppInput v-model="med.dosage" label="Dosage" placeholder="e.g. 3x daily" />
                    <AppInput v-model="med.duration" label="Duration" placeholder="e.g. 3 days" />
                    <button type="button" class="remove-btn" @click="removeMed(i)">✕</button>
                </div>

                <p v-if="!form.medications.length" class="no-meds">No medications added.</p>
            </AppCard>

            <AlertBanner v-if="serverError" type="error" :message="serverError" dismissible
                @dismiss="serverError = ''" />

            <AppButton type="submit" variant="primary" block :loading="saving">
                Save & Complete Consultation
            </AppButton>
        </form>
    </DashboardLayout>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore.js'
import { useClinicStore } from '@/stores/useClinicStore.js'
import { useQueueStore } from '@/stores/useQueueStore.js'
import { getTicket } from '@/firebase/firestore.js'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import AppCard from '@/components/base/AppCard.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppTextarea from '@/components/base/AppTextarea.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppSpinner from '@/components/base/AppSpinner.vue'
import AlertBanner from '@/components/shared/AlertBanner.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const clinicStore = useClinicStore()
const queueStore = useQueueStore()

const loading = ref(true)  // default true so spinner shows immediately
const saving = ref(false)
const serverError = ref('')
const ticket = ref(null)

const form = reactive({
    diagnosis: '',
    notes: '',
    medications: [],
})
const errors = reactive({ diagnosis: '' })

function addMed() {
    form.medications.push({ name: '', dosage: '', duration: '' })
}
function removeMed(i) {
    form.medications.splice(i, 1)
}

async function submit() {
    errors.diagnosis = ''
    if (!form.diagnosis.trim()) { errors.diagnosis = 'Diagnosis is required'; return }

    saving.value = true
    serverError.value = ''
    try {
        const ticketId = route.query.ticketId
        await clinicStore.saveConsultation({
            clinicId: authStore.clinicId,
            ticketId,
            patientId: ticket.value?.patientId,
            serviceId: ticket.value?.serviceId,
            serviceName: ticket.value?.serviceName,
            diagnosis: form.diagnosis.trim(),
            notes: form.notes.trim(),
            medications: form.medications.filter(m => m.name.trim()),
        })
        await queueStore.updateStatus(ticketId, 'completed')
        router.push('/clinic/dashboard')
    } catch (e) {
        console.error('[PostConsult] submit error:', e)
        serverError.value = 'Failed to save consultation. Please try again.'
    } finally {
        saving.value = false
    }
}

onMounted(async () => {
    // Wait for Firebase Auth to finish initializing (same pattern as QueueDashboardView)
    if (!authStore.initialized) {
        await new Promise(resolve => {
            const stop = watch(
                () => authStore.initialized,
                (val) => { if (val) { stop(); resolve() } }
            )
        })
    }

    // Read ticketId after auth is ready (route.query is always reactive)
    const ticketId = route.query.ticketId
    if (!ticketId) {
        console.warn('[PostConsult] No ticketId in query, redirecting to dashboard')
        router.replace('/clinic/dashboard')
        return
    }

    try {
        ticket.value = await getTicket(ticketId)
    } catch (e) {
        console.error('[PostConsult] getTicket error:', e)
    } finally {
        loading.value = false
    }
})
</script>

<style scoped>
.consult-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.section-card {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: .875rem;
}

.sec-title {
    font-size: 1rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
}

.info-row {
    display: flex;
    justify-content: space-between;
    font-size: .875rem;
    padding: .35rem 0;
    border-bottom: 1px solid #f3f4f6;
}

.info-row span:first-child {
    color: #6b7280;
}

.info-row span:last-child {
    font-weight: 600;
    color: #1f2937;
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
}

.med-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.med-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr auto;
    gap: .5rem;
    align-items: end;
    padding: .75rem;
    background: #f9fafb;
    border-radius: 8px;
}

.remove-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    color: #9ca3af;
    padding: .25rem;
    align-self: center;
}

.remove-btn:hover {
    color: #ef4444;
}

.no-meds {
    font-size: .875rem;
    color: #9ca3af;
    text-align: center;
    padding: .5rem 0;
}
</style>
