<!--
  This component displays visual metric cards (statistics) for a clinic's queue.
  It can either display an "Aggregate" view (Waiting, Serving, Completed all at once)
  or a single detailed metric card if passed different props. 
-->
<template>
    <!-- 
      If 'isAggregate' is true, we display three full-width cards showing the total
      waiting, serving, and completed counts in a row. 
    -->
    <div v-if="isAggregate" class="metric-cards">

        <!-- Waiting Stat Card -->
        <article class="metric-card metric-orange">
            <div class="metric-card-header">
                <div class="metric-card-icon">W</div>
                <p class="metric-card-title">Waiting</p>
            </div>
            <div class="metric-value">{{ waiting ?? 0 }}</div>
            <p class="metric-subtext">Patients in queue</p>
        </article>

        <!-- Serving Stat Card -->
        <article class="metric-card metric-purple">
            <div class="metric-card-header">
                <div class="metric-card-icon">S</div>
                <p class="metric-card-title">Serving</p>
            </div>
            <div class="metric-value">{{ serving ?? 0 }}</div>
            <p class="metric-subtext">Patients being served</p>
        </article>

        <!-- Completed Stat Card -->
        <article class="metric-card metric-green">
            <div class="metric-card-header">
                <div class="metric-card-icon">C</div>
                <p class="metric-card-title">Completed</p>
            </div>
            <div class="metric-value">{{ completed ?? 0 }}</div>
            <p class="metric-subtext">Completed consultations</p>
        </article>
    </div>

    <!-- 
      If 'isAggregate' is false, it means the parent just wants ONE specific card. 
      We dynamically style it using 'singleColorClass' and 'singleLetter'. 
    -->
    <article v-else class="metric-card" :class="singleColorClass">
        <div class="metric-card-header">
            <div class="metric-card-icon">{{ singleLetter }}</div>
            <p class="metric-card-title">{{ label }}</p>
        </div>
        <div class="metric-value">{{ count }}</div>
        <p class="metric-subtext">{{ description }}</p>
    </article>
</template>

<script setup>
import { computed } from 'vue'

// Inputs given by the parent component (like QueueDashboardView)
const props = defineProps({
    // Props for the 3-card Aggregate view
    waiting: { type: Number, default: null },
    serving: { type: Number, default: null },
    completed: { type: Number, default: null },

    // Props for a Single-card view
    label: { type: String, default: '' },
    count: { type: Number, default: 0 },
    description: { type: String, default: '' },
    color: { type: String, default: 'blue' },
})

/**
 * Automatically determines if we should show the 3-card view.
 * If the parent provided ANY of the aggregate counters (waiting/serving/completed),
 * this returns true!
 */
const isAggregate = computed(() =>
    props.waiting !== null || props.serving !== null || props.completed !== null
)

/**
 * Determines the CSS class dynamically (e.g. "metric-blue", "metric-red")
 * for styling the Single-card view based on the 'color' prop.
 */
const singleColorClass = computed(() => `metric-${props.color}`)

/**
 * Extracts the very first uppercase letter of the given 'label' to use as the icon.
 * E.g., label "Total" -> "T". If empty, defaults to "I".
 */
const singleLetter = computed(() => (props.label || 'I').slice(0, 1).toUpperCase())
</script>

<style scoped>
.metric-card {
    margin-bottom: 0;
}

.metric-card-title,
.metric-subtext {
    margin: 0;
}
</style>
