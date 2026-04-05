<template>
    <PageLayout title="Consultation Records">
        <AppSpinner v-if="loading" />
        <template v-else-if="records.length">
            <RecordCard v-for="rec in records" :key="rec.id" :record="rec" />
        </template>
        <AppEmptyState v-else icon="📋" title="No records yet"
            description="Your past consultations will appear here after your visits." />
    </PageLayout>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore.js'
import { getPatientConsultations } from '@/firebase/firestore.js'
import PageLayout from '@/components/layout/PageLayout.vue'
import AppSpinner from '@/components/base/AppSpinner.vue'
import AppEmptyState from '@/components/base/AppEmptyState.vue'
import RecordCard from '@/components/patient/RecordCard.vue'

const authStore = useAuthStore()
const loading = ref(true)
const records = ref([])

onMounted(async () => {
    // Wait for Firebase Auth to finish before we read patientId
    if (!authStore.initialized) {
        await new Promise(resolve => {
            const stop = watch(
                () => authStore.initialized,
                (val) => { if (val) { stop(); resolve() } }
            )
        })
    }

    try {
        records.value = await getPatientConsultations(authStore.patientId)
    } catch (e) {
        console.error('[RecordsView] failed to load records:', e)
    } finally {
        loading.value = false
    }
})
</script>
