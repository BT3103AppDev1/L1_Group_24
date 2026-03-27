<template>
    <div class="empty-state">
        <div class="empty-icon">{{ icon }}</div>
        <h3 class="empty-title">{{ title }}</h3>
        <p v-if="description" class="empty-desc">{{ description }}</p>
        <slot />
    </div>
</template>

<script setup>

// A reusable component to display friendly fallback content when lists, searches, or menus have no data to show.
defineProps({
    // The icon to display at the top (can be an emoji or text)
    icon: { type: String, default: '[]' },
    // The primary bold message telling the user what is missing
    title: { type: String, default: 'Nothing here yet' },
    // Additional helpful text explaining why it's empty or what to do next
    description: { type: String, default: '' },
})
</script>

<style scoped>
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1.5rem;
    text-align: center;
    background: rgba(255, 255, 255, 0.6);
    border: 1px dashed rgba(59, 130, 246, 0.2);
    border-radius: var(--radius-lg);
    backdrop-filter: blur(10px);
}

.empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.empty-title {
    font-family: var(--font-display);
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--color-primary-dark);
    margin-bottom: 0.5rem;
}

.empty-desc {
    font-size: .95rem;
    color: var(--color-text-muted);
    max-width: 360px;
}
</style>