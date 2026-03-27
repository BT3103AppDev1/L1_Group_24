<template>
  <span :class="['badge', variantClass, `badge-size-${size}`]">
    <slot />
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'default',
  },
  size: {
    type: String,
    default: 'md',
  },
})

const variantMap = {
  default: 'badge-neutral',
  gray: 'badge-neutral',
  neutral: 'badge-neutral',
  blue: 'badge-info',
  info: 'badge-info',
  green: 'badge-success',
  success: 'badge-success',
  yellow: 'badge-warning',
  orange: 'badge-warning',
  waiting: 'badge-warning',
  purple: 'badge-purple',
  serving: 'badge-purple',
  red: 'badge-danger',
  danger: 'badge-danger',
  closed: 'badge-danger',
  'no-show': 'badge-danger',
  completed: 'badge-success',
  open: 'badge-success',
  cancelled: 'badge-neutral',
}

const variantClass = computed(() => variantMap[props.variant] || 'badge-neutral')
</script>

<style scoped>
.badge-size-sm {
  padding: 4px 10px;
  font-size: 0.72rem;
}

.badge-size-md {
  padding: 6px 14px;
  font-size: 0.8rem;
}
</style>
