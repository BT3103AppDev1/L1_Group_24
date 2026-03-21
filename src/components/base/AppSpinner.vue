<template>
    <span :class="['app-spinner', `app-spinner--${size}`, `app-spinner--${color}`]" role="status" aria-label="Loading">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-linecap="round"
                stroke-dasharray="40 20" />
        </svg>
    </span>
</template>

<script setup>

// A simple animated loading widget to show users that something is happening in the background (like saving data or loading clinics).
defineProps({
    // Controls how large the spinner is. Accepted values: 'sm', 'md', 'lg'
    size: {
        type: String,
        default: 'md',
    },
    // Controls the color of the spinner.
    color: {
        type: String,
        default: 'blue',
    },
})
</script>

<style scoped>
.app-spinner {
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.app-spinner svg {
    animation: spinner-rotate 0.75s linear infinite;
}

.app-spinner--sm svg {
    width: 1rem;
    height: 1rem;
}

.app-spinner--md svg {
    width: 1.5rem;
    height: 1.5rem;
}

.app-spinner--lg svg {
    width: 2.25rem;
    height: 2.25rem;
}

.app-spinner--blue {
    color: #3b82f6;
}

.app-spinner--white {
    color: #ffffff;
}

.app-spinner--gray {
    color: #94a3b8;
}

@keyframes spinner-rotate {
    to {
        transform: rotate(360deg);
    }
}
</style>