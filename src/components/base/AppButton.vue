<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'btn',
      variantClass,
      sizeClass,
      { 'btn-block': block, disabled: disabled || loading, 'btn-loading': loading },
    ]"
    @click="!disabled && !loading && emit('click', $event)"
  >
    <span v-if="loading" class="spinner" aria-hidden="true"></span>
    <span class="btn-label" :class="{ 'btn-label--hidden': loading }">
      <slot />
    </span>
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'outline', 'danger', 'ghost', 'success'].includes(v),
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  block: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: 'button',
    validator: (v) => ['button', 'submit'].includes(v),
  },
})

const emit = defineEmits(['click'])

const variantMap = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  outline: 'btn-outline',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
  success: 'btn-success',
}

const sizeMap = {
  sm: 'size-small',
  md: '',
  lg: 'size-large',
}

const variantClass = computed(() => variantMap[props.variant] || 'btn-primary')
const sizeClass = computed(() => sizeMap[props.size] || '')
</script>

<style scoped>
.btn {
  position: relative;
  min-height: 52px;
  line-height: 1.15;
  outline: none;
}

.btn:focus-visible {
  box-shadow: 0 0 0 4px var(--ring-primary);
}

.size-large {
  padding: 16px 32px;
  font-size: 1.05rem;
}

.btn-ghost {
  background: rgba(255, 255, 255, 0.68);
  border: 2px solid rgba(255, 255, 255, 0.56);
  color: var(--color-primary-dark);
  box-shadow: var(--shadow-sm);
}

.btn-ghost:hover:not(:disabled) {
  color: var(--color-primary-dark);
  background: white;
  border-color: rgba(59, 130, 246, 0.18);
}

.btn-success {
  background: linear-gradient(135deg, #34d399, #10b981);
  color: white;
  box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3);
}

.btn-success:hover:not(:disabled) {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.btn-loading {
  cursor: wait;
}

.spinner {
  position: absolute;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-radius: 50%;
  border-top-color: currentColor;
  animation: btn-spin 0.8s linear infinite;
}

.btn-outline .spinner,
.btn-secondary .spinner,
.btn-ghost .spinner {
  border-color: rgba(59, 130, 246, 0.18);
  border-top-color: var(--color-primary);
}

.btn-label--hidden {
  visibility: hidden;
}

@keyframes btn-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
