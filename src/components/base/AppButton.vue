<template>
  <!-- 
      The main button element.
      - :type -> Supports 'submit' for forms, or 'button' for general clicks
      - :disabled -> Prevents clicking if manually disabled OR if currently loading
      - :class -> Dynamically applies styles based on props (color variant, size, full-width)
      - @click -> Only fires the click event if it's NOT disabled AND NOT loading
    -->
  <button :type="type" :disabled="disabled || loading" :class="[
    'btn',
    variantClass,
    sizeClass,
    { 'btn-block': block, disabled: disabled || loading, 'btn-loading': loading }
  ]" @click="!disabled && !loading && emit('click', $event)">
    <!-- Shows the spinning circle animation if the button is in a loading state -->
    <span v-if="loading" class="spinner" aria-hidden="true"></span>

    <!-- The actual text of the button (e.g., 'Log In'). Hidden while loading to prevent overlap with the spinner. -->
    <span class="btn-label" :class="{ 'btn-label--hidden': loading }">
      <slot />
    </span>
  </button>
</template>

<script setup>
import { computed } from 'vue'

// ---------- PROPS (Settings you can pass to the button) ----------
const props = defineProps({
  // The color theme of the button (e.g., 'primary' = blue, 'success' = green, 'danger' = red)
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'outline', 'danger', 'ghost', 'success'].includes(v),
  },
  // The physical size of the button (sm = small, md = medium, lg = large)
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v),
  },
  // If true, the button cannot be clicked (turns grey)
  disabled: {
    type: Boolean,
    default: false,
  },
  // If true, shows a spinner and prevents double-clicking (useful during Firebase API calls)
  loading: {
    type: Boolean,
    default: false,
  },
  // If true, the button stretches to fill 100% of the screen/container width
  block: {
    type: Boolean,
    default: false,
  },
  // Native HTML button type (use 'submit' if placing inside a <form>)
  type: {
    type: String,
    default: 'button',
    validator: (v) => ['button', 'submit'].includes(v),
  },
})

// ---------- EVENTS ----------
// Defines that this component can emit a 'click' event to its parent
const emit = defineEmits(['click'])

// ---------- COMPUTED CLASSES ----------
// These dictionaries map the prop strings (like 'primary') to actual CSS classes (like 'btn-primary')
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
  md: '', // Medium is the default size, so no extra class needed
  lg: 'size-large',
}

// Automatically calculates which CSS classes to apply based on the props passed in
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
