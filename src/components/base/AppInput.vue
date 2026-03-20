<template>
  <div class="form-group app-input" :class="{ 'app-input--disabled': disabled }">
    <!-- Render the label if provided -->
    <label v-if="label" :for="inputId" class="form-label">
      {{ label }}
      <span v-if="required" class="app-input__required" aria-hidden="true">*</span>
    </label>

    <!-- Main input field component -->
    <input
      :id="inputId"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      class="form-control"
      :class="{ 'form-control--error': error }"
      v-bind="$attrs"
      @input="emit('update:modelValue', $event.target.value)"
    />

    <!-- Display validation error message if present -->
    <p v-if="error" class="form-error" role="alert">{{ error }}</p>
  </div>
</template>

<script setup>
/**
 * AppInput.vue
 * A reusable input component with built-in label, error handling,
 * and support for various input types.
 */
import { computed } from 'vue'

const props = defineProps({
  // Two-way binding value for the input
  modelValue: {
    type: [String, Number],
    default: '',
  },
  // Text to display for the input label
  label: {
    type: String,
    default: '',
  },
  // HTML input type attribute (e.g. text, email, number)
  type: {
    type: String,
    default: 'text',
  },
  // Placeholder text for empty state
  placeholder: {
    type: String,
    default: '',
  },
  // Error message text to display below the input
  error: {
    type: String,
    default: '',
  },
  // Marks the field as mandatory and adds a visual indicator
  required: {
    type: Boolean,
    default: false,
  },
  // Disables the input interaction
  disabled: {
    type: Boolean,
    default: false,
  },
  // Optional custom ID, otherwise an auto-generated one is used
  id: {
    type: String,
    default: '',
  },
})

// Emits an event to update the model value
const emit = defineEmits(['update:modelValue'])

// Generate a random unique ID for accessibility linking (label `for` attribute)
const inputId = computed(() => props.id || `app-input-${Math.random().toString(36).slice(2, 9)}`)
</script>

<style scoped>
.app-input {
  width: 100%;
}

.app-input__required {
  color: var(--color-danger);
  margin-left: 4px;
}

.form-control {
  min-height: 56px;
}

.form-control--error {
  border-color: var(--color-danger);
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.12);
}

.app-input--disabled .form-control {
  background: rgba(255, 255, 255, 0.55);
  color: #94a3b8;
}
</style>
