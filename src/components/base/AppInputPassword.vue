<template>
  <div
    class="form-group app-input-pw"
    :class="{ 'app-input-pw--error': error, 'app-input-pw--disabled': disabled }"
  >
    <!-- Render the label if provided -->
    <label v-if="label" :for="inputId" class="form-label">
      {{ label }}
      <span v-if="required" class="app-input-pw__required" aria-hidden="true">*</span>
    </label>

    <div class="app-input-pw__wrapper">
      <!-- Password field that toggles between text and password type conditionally based on 'visible' state -->
      <input
        :id="inputId"
        :type="visible ? 'text' : 'password'"
        :value="modelValue"
        :placeholder="placeholder || '********'"
        :required="required"
        :disabled="disabled"
        class="form-control app-input-pw__field"
        :class="{ 'form-control--error': error }"
        v-bind="$attrs"
        @input="emit('update:modelValue', $event.target.value)"
      />
      <!-- Button to toggle password visibility state -->
      <button
        type="button"
        class="app-input-pw__toggle"
        :disabled="disabled"
        :aria-label="visible ? 'Hide password' : 'Show password'"
        @click="visible = !visible"
      >
        {{ visible ? 'hide' : 'show' }}
      </button>
    </div>

    <!-- Display validation error message if present -->
    <p v-if="error" class="form-error" role="alert">{{ error }}</p>
  </div>
</template>

<script setup>
/**
 * AppInputPassword.vue
 * A specialized password input component with built-in functionality
 * to toggle the visibility of the entered password.
 */
import { computed, ref } from 'vue'

const props = defineProps({
  // Two-way binding value for the password input
  modelValue: {
    type: String,
    default: '',
  },
  // Text to display for the input label
  label: {
    type: String,
    default: '',
  },
  // Optional custom placeholder text, defaults to '********' if empty
  placeholder: {
    type: String,
    default: '',
  },
  // Error message text to display below the password input
  error: {
    type: String,
    default: '',
  },
  // Marks the field as mandatory and adds a visual indicator
  required: {
    type: Boolean,
    default: false,
  },
  // Disables the input interaction and the toggle button
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

// State to track whether the password should be displayed as plain text
const visible = ref(false)

// Generate a random unique ID for accessibility linking (label `for` attribute)
const inputId = computed(() => props.id || `app-input-pw-${Math.random().toString(36).slice(2, 9)}`)
</script>

<style scoped>
.app-input-pw {
  width: 100%;
}

.app-input-pw__required {
  color: var(--color-danger);
  margin-left: 4px;
}

.app-input-pw__wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.app-input-pw__field {
  min-height: 56px;
  padding-right: 72px;
}

.app-input-pw--disabled .app-input-pw__field {
  background-color: rgba(255, 255, 255, 0.55);
  color: #94a3b8;
}

.app-input-pw__toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  border-radius: var(--radius-full);
  background: rgba(239, 246, 255, 0.94);
  box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.12);
  padding: 6px 10px;
  color: var(--color-primary-dark);
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: pointer;
}

.app-input-pw__toggle:hover:not(:disabled) {
  background: white;
}

.app-input-pw__toggle:focus-visible {
  box-shadow: 0 0 0 4px var(--ring-primary);
}

.app-input-pw__toggle:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}
</style>
