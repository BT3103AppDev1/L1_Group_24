<template>
  <label
    class="app-checkbox"
    :class="{ 'app-checkbox--disabled': disabled, 'app-checkbox--checked': isChecked }"
  >
    <input
      type="checkbox"
      class="app-checkbox__native"
      :checked="isChecked"
      :disabled="disabled"
      :value="value"
      v-bind="$attrs"
      @change="handleChange"
    />
    <span class="app-checkbox__box" aria-hidden="true">
      <span v-if="isChecked">x</span>
    </span>
    <span v-if="label" class="app-checkbox__label">{{ label }}</span>
  </label>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: [Boolean, Array],
    default: false,
  },
  value: {
    default: undefined,
  },
  label: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const isChecked = computed(() => {
  if (Array.isArray(props.modelValue)) {
    return props.modelValue.includes(props.value)
  }
  return Boolean(props.modelValue)
})

function handleChange(event) {
  if (props.disabled) return
  if (Array.isArray(props.modelValue)) {
    const newArr = [...props.modelValue]
    if (event.target.checked) {
      if (!newArr.includes(props.value)) newArr.push(props.value)
    } else {
      const idx = newArr.indexOf(props.value)
      if (idx !== -1) newArr.splice(idx, 1)
    }
    emit('update:modelValue', newArr)
  } else {
    emit('update:modelValue', event.target.checked)
  }
}
</script>

<style scoped>
.app-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  line-height: 1.4;
}

.app-checkbox--disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.app-checkbox__native {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}

.app-checkbox__box {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border: 1px solid rgba(59, 130, 246, 0.18);
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.92);
  box-shadow: inset 0 2px 4px rgba(15, 23, 42, 0.02), var(--shadow-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
  color: white;
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
}

.app-checkbox:not(.app-checkbox--disabled):hover .app-checkbox__box {
  border-color: var(--color-primary);
}

.app-checkbox--checked .app-checkbox__box {
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  border-color: transparent;
  box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.26);
}

.app-checkbox__label {
  font-size: 0.95rem;
  color: var(--color-text-main);
  font-weight: 600;
}

.app-checkbox--checked .app-checkbox__label {
  color: var(--color-primary-dark);
}
</style>
