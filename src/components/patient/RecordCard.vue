<template>
    <div class="record-card card" :class="{ expanded }">
        <div class="record-header" @click="expanded = !expanded">
            <div class="record-header-left">
                <span class="record-date">{{ formatDate(record.consultationDate) }}</span>
                <h4 class="record-clinic">{{ record.clinicName }}</h4>
                <p class="record-service">{{ record.serviceName }}</p>
                <p v-if="record.doctor" class="record-doctor">Dr. {{ record.doctor }}</p>
            </div>
            <div class="record-header-right">
                <span v-if="record.hasMedication" class="med-badge" :class="record.medicationStatus">
                    {{ record.medicationStatus === 'ready' ? 'Collected' : 'Prescribed' }}
                </span>
                <span class="expand-icon">{{ expanded ? 'up' : 'down' }}</span>
            </div>
        </div>

        <Transition name="expand">
            <div v-if="expanded" class="record-body">
                <div v-if="record.diagnosis" class="field">
                    <label>Diagnosis</label>
                    <p class="primary-text">{{ record.diagnosis }}</p>
                </div>
                <div v-if="record.notes" class="field">
                    <label>Doctor's Notes</label>
                    <p>{{ record.notes }}</p>
                </div>
                <div v-if="record.instructions" class="field">
                    <label>Instructions</label>
                    <p>{{ record.instructions }}</p>
                </div>
                <div v-if="medications && medications.length > 0" class="field">
                    <label>Medications Prescribed</label>
                    <div class="med-list">
                        <div v-for="(med, i) in medications" :key="i" class="med-item">
                            <p class="med-name">{{ med.name }}</p>
                            <p v-if="med.purpose" class="med-detail"><b>Purpose:</b> {{ med.purpose }}</p>
                            <p v-if="med.dosage" class="med-detail"><b>Dosage:</b> {{ med.dosage }}</p>
                            <p v-if="med.frequency" class="med-detail"><b>Frequency:</b> {{ med.frequency }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
    record: { type: Object, required: true },
    medications: { type: Array, default: () => [] },
})

const expanded = ref(false)

function formatDate(ts) {
    if (!ts) return ''
    const date = ts?.toDate ? ts.toDate() : new Date(ts)
    return date.toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<style scoped>
.record-card {
    margin-bottom: 0;
}

.record-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-md);
    cursor: pointer;
}

.record-date {
    display: inline-flex;
    margin-bottom: 0.35rem;
    padding: 0.26rem 0.65rem;
    border-radius: var(--radius-full);
    background: rgba(239, 246, 255, 0.9);
    color: var(--color-primary-dark);
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
}

.record-clinic {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.05rem;
    color: var(--color-text-main);
}

.record-service {
    margin: 0.22rem 0 0;
    color: var(--color-primary-dark);
    font-size: 0.9rem;
    font-weight: 700;
}

.record-doctor {
    margin: 0.18rem 0 0;
    color: var(--color-text-muted);
    font-size: 0.86rem;
}

.record-header-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.6rem;
}

.med-badge {
    padding: 0.35rem 0.7rem;
    border-radius: var(--radius-full);
    background: rgba(219, 234, 254, 0.85);
    color: var(--color-primary-dark);
    font-size: 0.74rem;
    font-weight: 800;
    letter-spacing: 0.03em;
    text-transform: uppercase;
}

.med-badge.ready {
    background: rgba(209, 250, 229, 0.82);
    color: var(--color-text-green);
}

.expand-icon {
    color: var(--color-text-muted);
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
}

.record-body {
    margin-top: var(--space-md);
    padding-top: var(--space-md);
    border-top: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    gap: 0.95rem;
}

.field label {
    display: block;
    margin-bottom: 0.35rem;
    font-size: 0.72rem;
    font-weight: 800;
    color: var(--color-text-muted);
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.field p {
    margin: 0;
    font-size: 0.94rem;
    color: var(--color-text-main);
    line-height: 1.65;
}

.primary-text {
    color: var(--color-primary-dark);
    font-weight: 700;
}

.med-list {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
}

.med-item {
    padding: 0.9rem 1rem;
    border-radius: var(--radius-md);
    background: rgba(248, 250, 252, 0.96);
    border: 1px solid rgba(226, 232, 240, 0.8);
}

.med-name {
    margin-bottom: 0.3rem;
    font-family: var(--font-display);
    font-size: 0.98rem;
    font-weight: 700;
    color: var(--color-primary-dark);
}

.med-detail {
    color: var(--color-text-muted);
    font-size: 0.84rem;
}

.expand-enter-active,
.expand-leave-active {
    transition: all 0.25s ease;
    max-height: 600px;
    overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
    max-height: 0;
    opacity: 0;
    padding-top: 0;
}
</style>
