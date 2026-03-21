<template>
    <!-- 
        Card container for displaying content
        - hoverable: adds interactivity
        - flat: applies a softer, subtle visual style 
    -->
    <div :class="['card', { clickable: hoverable, 'app-card--flat': flat }]">
        <slot></slot>
    </div>
</template>

<script setup>
defineProps({
    hoverable: {
        type: Boolean,
        default: false, // prevent hover/click effect unless explicitly set
    },

    flat: {
        type: Boolean,
        default: false, // use pre-defined card style
    },
})
</script>

<style scoped>
.card {
    margin-bottom: 0;
}

/* 
    Interactivity of card 
    - cursor: cursor changes to pointer on hover
*/
.clickable {
    cursor: pointer;
}

/* Pre-defined card style */
.app-card--flat {
    background: rgba(255, 255, 255, 0.82); 
    border-color: rgba(226, 232, 240, 0.9);
    box-shadow: var(--shadow-md);
}
</style>