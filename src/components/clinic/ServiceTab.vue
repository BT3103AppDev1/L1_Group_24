<!--
  This component displays a horizontal list of clickable tabs.
  It allows a clinic to swap between different service queues 
  (e.g., General Consultation, Vaccination) and view their waiting counts.
-->
<template>
    <div class="tabs service-tabs">

        <!-- 
          Loop through all "services" provided by the parent. 
          We render a <button> for each service.
        -->
        <button v-for="svc in services" :key="serviceIdFor(svc)" type="button" class="tab"
            :class="{ active: selectedId === serviceIdFor(svc) }" @click="selectService(serviceIdFor(svc))">
            <!-- 1. Print the Service Name (e.g., 'Health Screening') -->
            {{ serviceNameFor(svc) }}

            <!-- 
              2. Print the Badge with the Active Patient Count.
              It only renders if there's actually someone waiting (count > 0). 
            -->
            <span v-if="serviceCountFor(svc) > 0" class="tab-count">
                {{ serviceCountFor(svc) }}
            </span>
        </button>

    </div>
</template>

<script setup>
import { computed } from 'vue'

// Inputs from the parent component
const props = defineProps({
    services: { type: Array, default: () => [] }, // Array of service objects
    activeId: { type: String, default: '' },      // Optional: Explicitly active tab ID
    modelValue: { type: String, default: '' },    // Supports v-model binding directly on this component
})

// Events this component shouts to its parent
const emit = defineEmits(['update:modelValue', 'select'])

/**
 * Determines which tab is currently clicked/active.
 * It checks 'activeId' first. If not provided, it falls back to 'modelValue' (for v-model).
 */
const selectedId = computed(() => props.activeId || props.modelValue)

/**
 * Safely extracts the ID of a service.
 * Supports different database structures (checking 'serviceId', then 'id').
 */
function serviceIdFor(service) {
    return service.serviceId || service.id || ''
}

/**
 * Safely extracts the beautiful Name of a service.
 * Supports different database structures (checking 'serviceName', then 'name').
 */
function serviceNameFor(service) {
    return service.serviceName || service.name || 'Service'
}

/**
 * Safely extracts how many people are currently waiting for this service.
 * Tries 'activeCount', then 'waitingCount'. Defaults to 0.
 */
function serviceCountFor(service) {
    return service.activeCount ?? service.waitingCount ?? 0
}

/**
 * Fired whenever a clinic clicks on a specific tab.
 * Emits the ID of the clicked service to the parent component, so the 
 * parent can trigger a database fetch for that specific queue.
 */
function selectService(id) {
    emit('update:modelValue', id) // For elements using v-model
    emit('select', id)            // For elements using @select
}
</script>

<style scoped>
.service-tabs {
    width: fit-content;
    max-width: 100%;
}

.tab {
    border: none;
    background: none;
}

.tab-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.4rem;
    padding: 0.1rem 0.45rem;
    border-radius: var(--radius-full);
    font-size: 0.72rem;
    font-weight: 800;
    background: rgba(59, 130, 246, 0.14);
    color: var(--color-primary-dark);
}

.tab.active .tab-count {
    background: rgba(255, 255, 255, 0.22);
    color: white;
}
</style>
