<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isVisible" class="modal-overlay" @click.self="!persistent && close()">
        <div class="modal-content" :class="`modal-content--${size}`" role="dialog" aria-modal="true">
          <div v-if="title" class="modal-header">
            <h3>{{ title }}</h3>
            <button class="modal-close" type="button" @click="close" aria-label="Close">x</button>
          </div>
          <div class="modal-body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, onUnmounted, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: null },
  title:      { type: String,  default: '' },
  size:       { type: String,  default: 'md' },
  persistent: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'close'])

const isVisible = computed(() => (props.modelValue === null ? true : props.modelValue))

// Emits close event and sets modelValue to false to hide the modal
function close() {
  emit('close')
  emit('update:modelValue', false)
}

// Prevent background scrolling while the modal is open
watch(isVisible, (visible) => {
  document.body.style.overflow = visible ? 'hidden' : ''
}, { immediate: true })

// Restore scrolling if the component is destroyed while the modal is still open
onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<style scoped>
.modal-content--sm {
  max-width: 420px;
}

.modal-content--md {
  max-width: 560px;
}

.modal-content--lg {
  max-width: 760px;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.22s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>