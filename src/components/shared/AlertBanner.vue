<template>
  <div class="alert-banner" :class="`alert-${type}`" role="alert">
    <span class="alert-icon">{{ icons[type] }}</span>
    <span class="alert-message">{{ message }}</span>
    <button v-if="dismissible" class="alert-close" type="button" @click="$emit('dismiss')" aria-label="Dismiss">x</button>
  </div>
</template>

<script setup>
defineProps({
  type:        { type: String,  default: 'info' },
  message:     { type: String,  required: true },
  dismissible: { type: Boolean, default: false },
})

defineEmits(['dismiss'])

const icons = { info: 'i', success: 'ok', warning: '!', error: 'x' }
</script>

<style scoped>
.alert-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 0.95rem 1.1rem;
  border-radius: var(--radius-md);
  font-size: 0.92rem;
  border: 1px solid rgba(255, 255, 255, 0.66);
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(12px);
}

.alert-info    { background: rgba(224, 242, 254, 0.82); color: var(--color-text-cyan); }
.alert-success { background: rgba(209, 250, 229, 0.82); color: var(--color-text-green); }
.alert-warning { background: rgba(254, 243, 199, 0.86); color: var(--color-text-orange); }
.alert-error   { background: rgba(254, 226, 226, 0.86); color: #b91c1c; }

.alert-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
}

.alert-message {
  flex: 1;
  line-height: 1.5;
}

.alert-close {
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.42);
  border: none;
  cursor: pointer;
  color: inherit;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  font-size: 0.72rem;
  padding: 0;
}

.alert-close:hover {
  background: rgba(255, 255, 255, 0.62);
}
</style>
