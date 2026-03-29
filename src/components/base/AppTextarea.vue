<template>
  <!-- Multi-line typing box that allows users to input information that may require more than one line -->
  <div
    class="form-group app-textarea"
    :class="{ 'app-textarea--disabled': disabled }"
  >
    <div class="app-textarea__header">
      <!-- Label of typing box (if provided) -->
      <label v-if="label" :for="textareaId" class="form-label">
        {{ label }}

        <!-- * on label (if mandatory for users to fill it in) -->
        <span v-if="required" class="app-textarea__required" aria-hidden="true">*</span>
      </label>

      <!-- Character count of typing box (if maximum length is provided) -->
      <span
        v-if="maxlength"
        class="app-textarea__counter"
        :class="{
          'app-textarea__counter--warn': isNearLimit,
          'app-textarea__counter--over': isOverLimit
        }"
      >
        {{ currentLength }} / {{ maxlength }}
      </span>
    </div>

    <!-- Input field -->
    <textarea
      :id="textareaId"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :rows="rows"
      :maxlength="maxlength || undefined"
      class="form-control app-textarea__field"
      :class="{ 'form-control--error': error }"
      v-bind="$attrs"
      @input="emit('update:modelValue', $event.target.value)"
    />

    <!-- Validation error message (if provided) -->
    <p v-if="error" class="form-error" role="alert">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  error: {
    type: String,
    default: '',
  },
  required: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  rows: {
    type: Number,
    default: 4,
  },
  maxlength: {
    type: Number,
    default: null,
  },
  id: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const textareaId = computed(() =>
  props.id || `app-textarea-${Math.random().toString(36).slice(2, 9)}`
)

const currentLength = computed(() => (props.modelValue || '').length)
const isNearLimit = computed(
  () => props.maxlength && currentLength.value >= props.maxlength * 0.85
)
const isOverLimit = computed(
  () => props.maxlength && currentLength.value >= props.maxlength
)
</script>

<style scoped>
.app-textarea {
  width: 100%;
}

.app-textarea__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.app-textarea__required {
  color: var(--color-danger);
  margin-left: 4px;
}

.app-textarea__counter {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-weight: 700;
}

.app-textarea__counter--warn {
  color: var(--color-warning);
}

.app-textarea__counter--over {
  color: var(--color-danger);
}

.app-textarea__field {
  min-height: 116px;
  resize: vertical;
  line-height: 1.6;
}

.app-textarea--disabled .app-textarea__field {
  background-color: rgba(255, 255, 255, 0.55);
  color: #94a3b8;
}
</style>