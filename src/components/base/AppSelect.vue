<template>
  <div
    class="form-group app-select"
    :class="{ 'app-select--error': error, 'app-select--disabled': disabled }"
  >
    <!-- Optional label for the select input, marked with an asterisk if required -->
    <label v-if="label" :for="selectId" class="form-label">
      {{ label }}
      <span v-if="required" class="app-select__required" aria-hidden="true">*</span>
    </label>
    <!-- Wrapper to position the custom chevron icon over the native select -->
    <div class="app-select__wrapper">
      <select
        :id="selectId"
        :value="modelValue"
        :required="required"
        :disabled="disabled"
        class="form-control app-select__field"
        :class="{ 'form-control--error': error }"
        v-bind="$attrs"
        @change="emit('update:modelValue', $event.target.value)"
      >
        <!-- Placeholder option if provided, shown when no value is selected -->
        <option v-if="placeholder" value="" disabled :selected="!modelValue">
          {{ placeholder }}
        </option>
        <!-- Render the normalized list of options -->
        <option
          v-for="opt in normalizedOptions"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>
      <span class="app-select__chevron" aria-hidden="true">v</span>
    </div>
    <!-- Error message display if the error prop is provided -->
    <p v-if="error" class="form-error" role="alert">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Define the properties accepted by this component
const props = defineProps({
  // The current value of the select input, supports v-model binding
  modelValue: {
    type: [String, Number],
    default: '',
  },
  // Text to display in the label element
  label: {
    type: String,
    default: '',
  },
  // Array of options to display in the select. Can be an array of strings,
  // or array of objects with 'value' and 'label' properties.
  options: {
    type: Array,
    default: () => [],
  },
  // Error message to display, also applies error styling if present
  error: {
    type: String,
    default: '',
  },
  // Whether this input is required for form validation
  required: {
    type: Boolean,
    default: false,
  },
  // Whether the input is disabled and unclickable
  disabled: {
    type: Boolean,
    default: false,
  },
  // Placeholder text shown when no valid option is selected
  placeholder: {
    type: String,
    default: '',
  },
  // Optional custom ID for the select element, auto-generated if not provided
  id: {
    type: String,
    default: '',
  },
})

// Define events emitted by this component
const emit = defineEmits(['update:modelValue'])

// Generate a unique ID if one isn't provided, to link the label and select element for accessibility
const selectId = computed(() =>
  props.id || `app-select-${Math.random().toString(36).slice(2, 9)}`
)

// Normalize the options array so that it always contains objects with value and label,
// even if a simple array of strings was passed via props.
const normalizedOptions = computed(() =>
  props.options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  )
)
</script>

<style scoped>
.app-select {
  width: 100%;
}

.app-select__required {
  color: var(--color-danger);
  margin-left: 4px;
}

.app-select__wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.app-select__field {
  min-height: 56px;
  padding-right: 48px;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
}

.app-select--disabled .app-select__field {
  background-color: rgba(255, 255, 255, 0.55);
  color: #94a3b8;
}

.app-select__chevron {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--color-primary-dark);
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
}
</style>
