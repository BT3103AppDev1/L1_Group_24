<!--
  This component provides the outer structural wrapper (layout) for dashboard pages.
  It standardizes the padding, maximum width.
-->
<template>
    <div class="dashboard-layout">

        <div class="dl-header" v-if="title">
            <h1 class="dl-title">{{ title }}</h1>
        </div>

        <div class="dl-body">
            <slot />
        </div>

    </div>
</template>

<script setup>
// --- Props ---
// Inputs allowed to be passed into this layout component
defineProps({
    title: { type: String, default: '' }, // The large text title displayed at the top of the dashboard
})
</script>

<style scoped>
.dashboard-layout {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 var(--space-md) var(--space-2xl);
}

.dl-header {
    position: relative;
    overflow: hidden;
    margin-bottom: var(--space-lg);
    padding: var(--space-xl);
    border-radius: var(--radius-lg);

    background: linear-gradient(135deg, rgba(255, 255, 255, 0.88), rgba(239, 246, 255, 0.82));
    border: 1px solid rgba(255, 255, 255, 0.72);
    box-shadow: var(--shadow-lg);

    backdrop-filter: blur(16px);
}

.dl-header::after {
    content: '';
    position: absolute;
    top: -36px;
    right: -24px;
    width: 180px;
    height: 180px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(191, 219, 254, 0.7) 0%, rgba(191, 219, 254, 0) 70%);
}

.dl-title {
    position: relative;
    z-index: 1;
    margin: 0;
    font-size: clamp(1.7rem, 2vw, 2.4rem);
    font-weight: 800;
    color: var(--color-primary-dark);
    letter-spacing: -0.04em;
}

.dl-body {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
}

@media (max-width: 768px) {
    .dashboard-layout {
        padding: 0 var(--space-sm) var(--space-xl);
    }

    .dl-header {
        padding: var(--space-lg);
    }
}
</style>
