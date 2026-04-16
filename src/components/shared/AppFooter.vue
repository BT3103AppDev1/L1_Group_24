<template>
  <footer class="app-footer">
    <div class="app-footer__inner">
      <span class="app-footer__copy">&copy; {{ currentYear }} Clinic Queue. All rights reserved.</span>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'

// Current year for the copyright line
const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped>
.app-footer {
  width: 100%;
  background: transparent;
}

.app-footer__inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted, #6b7280);
}

.app-footer__copy {
  font-size: 0.875rem;
}
</style>
