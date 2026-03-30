<template>
  <!-- Modal wrapper that closes on backdrop click -->
  <AppModal :modelValue="modelValue" :title="title" :persistent="false" @update:modelValue="cancel">
    <p class="confirm-message">{{ message }}</p>
    <!-- Cancel and confirm action buttons -->
    <template #footer>
      <AppButton variant="outline" @click="cancel">{{ cancelText }}</AppButton>
      <AppButton :variant="variant === 'danger' ? 'danger' : 'primary'" @click="confirm">{{ confirmText }}</AppButton>
    </template>
  </AppModal>
</template>

<script setup>
import AppModal  from '@/components/base/AppModal.vue'
import AppButton from '@/components/base/AppButton.vue'

const props = defineProps({
  modelValue:  { type: Boolean, default: false },
  title:       { type: String,  default: 'Confirm' },
  message:     { type: String,  default: 'Are you sure?' },
  confirmText: { type: String,  default: 'Confirm' },
  cancelText:  { type: String,  default: 'Cancel' },
  variant:     { type: String,  default: 'primary' },
})
const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])
// Emits confirm/cancel and closes the dialog
function confirm() { emit('confirm'); emit('update:modelValue', false) }
function cancel()  { emit('cancel');  emit('update:modelValue', false) }
</script>

<style scoped>
.confirm-message { color: #374151; line-height: 1.6; }
</style>